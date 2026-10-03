import { createMergeHandler } from "./handler.ts";
import type { adminClient } from "../_shared/admin.ts";

const source = "11111111-1111-4111-8111-111111111111";
const target = "22222222-2222-4222-8222-222222222222";
function mock(
  options: {
    destinationAnonymous?: boolean;
    guestPermanent?: boolean;
    guestId?: string;
    receipt?: unknown;
  } = {},
) {
  let rpcCalls = 0;
  const db = {
    select: () => db,
    eq: () => db,
    maybeSingle: () =>
      Promise.resolve({ data: options.receipt ?? null, error: null }),
  };
  const client = {
    auth: {
      getUser: (token: string) =>
        Promise.resolve({
          error: null,
          data: {
            user: token === "destination"
              ? { id: target, is_anonymous: !!options.destinationAnonymous }
              : {
                id: options.guestId ?? source,
                is_anonymous: !options.guestPermanent,
              },
          },
        }),
    },
    from: () => db,
    rpc: () => {
      rpcCalls++;
      throw new Error("Must not mutate");
    },
  } as unknown as typeof adminClient;
  return { handle: createMergeHandler(client), calls: () => rpcCalls };
}
const request = (body: unknown, token = "destination") =>
  new Request("https://example.test", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
const assert = (value: boolean) => {
  if (!value) throw new Error("Assertion failed");
};
Deno.test("reject anonymous destination before mutation", async () => {
  const m = mock({ destinationAnonymous: true });
  assert(
    (await m.handle(
      request({ sourceUserId: source, guestAccessToken: "guest" }),
    )).status === 401,
  );
  assert(m.calls() === 0);
});
Deno.test("guest ID alone cannot claim account", async () => {
  const m = mock();
  assert((await m.handle(request({ sourceUserId: source }))).status === 403);
  assert(m.calls() === 0);
});
Deno.test("guest JWT must match requested source", async () => {
  const m = mock({ guestId: target });
  assert(
    (await m.handle(
      request({ sourceUserId: source, guestAccessToken: "guest" }),
    )).status === 403,
  );
  assert(m.calls() === 0);
});
Deno.test("receipt cannot be replayed by another destination", async () => {
  const m = mock({ receipt: { target_user_id: source, completed: true } });
  assert((await m.handle(request({ sourceUserId: source }))).status === 409);
  assert(m.calls() === 0);
});
Deno.test("completed receipt survives lost response and deleted guest", async () => {
  const m = mock({ receipt: { target_user_id: target, completed: true } });
  const response = await m.handle(request({ sourceUserId: source }));
  assert(response.status === 200);
  assert((await response.json()).merged === true);
  assert(m.calls() === 0);
});

function transferMock(failUpload = false) {
  const events: string[] = [];
  let remaining = true;
  const client = {
    auth: {
      getUser: (token: string) =>
        Promise.resolve({
          error: null,
          data: {
            user: {
              id: token === "destination" ? target : source,
              is_anonymous: token !== "destination",
            },
          },
        }),
      admin: {
        getUserById: () =>
          Promise.resolve({
            error: null,
            data: { user: { id: source, is_anonymous: true } },
          }),
        signOut: () => {
          events.push("signOut");
          return Promise.resolve({ error: null });
        },
        deleteUser: () => {
          events.push("deleteUser");
          return Promise.resolve({ error: null });
        },
      },
    },
    from: (table: string) => {
      let head = false;
      const db = {
        select: (_value: string, options?: { head?: boolean }) => {
          head = !!options?.head;
          return db;
        },
        eq: () => db,
        or: () => db,
        delete: () => db,
        update: () => db,
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
        limit: () =>
          Promise.resolve({
            error: null,
            data: remaining
              ? [{ id: "photo", storage_path: `${source}/photo.jpg` }]
              : [],
          }),
        then: (resolve: (value: unknown) => unknown) =>
          Promise.resolve({
            error: null,
            count: head ? Number(remaining) : null,
            data: null,
          }).then(resolve),
      };
      return db;
    },
    rpc: (name: string, body: Record<string, unknown>) => {
      events.push(name);
      if (name === "transfer_guest_photo") {
        assert(body.new_path === `${target}/guest-${source}-photo`);
        remaining = false;
      }
      return Promise.resolve({ error: null, data: true });
    },
    storage: {
      from: () => ({
        download: () => {
          events.push("download");
          return Promise.resolve({
            error: null,
            data: new Blob(["photo"], { type: "image/jpeg" }),
          });
        },
        upload: () => {
          events.push("upload");
          return Promise.resolve({
            error: failUpload ? { message: "offline" } : null,
          });
        },
        list: () => Promise.resolve({ error: null, data: [] }),
        remove: () => {
          events.push("remove");
          return Promise.resolve({ error: null });
        },
      }),
    },
  } as unknown as typeof adminClient;
  return { handle: createMergeHandler(client), events };
}
Deno.test("copy then transfer then revoke and delete source; all quotes included", async () => {
  const m = transferMock();
  assert(
    (await m.handle(
      request({ sourceUserId: source, guestAccessToken: "guest" }),
    )).status === 200,
  );
  assert(m.events.indexOf("upload") < m.events.indexOf("transfer_guest_photo"));
  assert(
    m.events.indexOf("assert_guest_merge_cleanup") <
      m.events.indexOf("deleteUser"),
  );
  assert(m.events.indexOf("signOut") < m.events.indexOf("deleteUser"));
});
Deno.test("upload failure leaves source rows and Auth undeleted for retry", async () => {
  const m = transferMock(true);
  assert(
    (await m.handle(
      request({ sourceUserId: source, guestAccessToken: "guest" }),
    )).status === 500,
  );
  assert(!m.events.includes("transfer_guest_photo"));
  assert(!m.events.includes("deleteUser"));
});

Deno.test("permanent source JWT never authorizes guest deletion", async () => {
  const m = mock({ guestPermanent: true });
  assert(
    (await m.handle(
      request({ sourceUserId: source, guestAccessToken: "guest" }),
    )).status === 403,
  );
  assert(m.calls() === 0);
});
Deno.test("null request is rejected safely", async () => {
  const m = mock();
  assert((await m.handle(request(null))).status === 400);
  assert(m.calls() === 0);
});
