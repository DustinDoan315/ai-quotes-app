import type { adminClient as AdminClient } from "../_shared/admin.ts";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
const fail = (status: number, code: string, message: string) =>
  json(status, { error: { code, message } });
const check = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};
const ownedPath = (path: string, id: string) =>
  path.startsWith(`${id}/`) &&
  path.split("/").every((part) => part && part !== "." && part !== "..");

async function removeFolder(
  adminClient: typeof AdminClient,
  bucket: string,
  folder: string,
): Promise<void> {
  // Enumerate first: deleting while offset-paginating would skip files.
  const paths: string[] = [];
  for (let offset = 0;; offset += 100) {
    const { data, error } = await adminClient.storage.from(bucket).list(
      folder,
      { limit: 100, offset },
    );
    check(error);
    for (const object of data ?? []) {
      if (object.id === null) {
        await removeFolder(adminClient, bucket, `${folder}/${object.name}`);
      } else paths.push(`${folder}/${object.name}`);
    }
    if ((data ?? []).length < 100) break;
  }
  for (let offset = 0; offset < paths.length; offset += 100) {
    const { error } = await adminClient.storage.from(bucket).remove(
      paths.slice(offset, offset + 100),
    );
    check(error);
  }
}

export const createMergeHandler =
  (adminClient: typeof AdminClient) =>
  async (req: Request): Promise<Response> => {
    if (req.method !== "POST") {
      return fail(405, "method_not_allowed", "Use POST.");
    }
    const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "")
      .trim();
    if (!token) {
      return fail(
        401,
        "unauthenticated",
        "Sign in to keep your guest memories.",
      );
    }
    const { data: destination, error: destinationError } = await adminClient
      .auth.getUser(token);
    if (
      destinationError || !destination.user || destination.user.is_anonymous
    ) {
      return fail(401, "unauthenticated", "A signed-in account is required.");
    }
    let body: { sourceUserId?: string; guestAccessToken?: string };
    try {
      body = await req.json();
    } catch {
      return fail(400, "invalid_request", "Invalid request.");
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return fail(400, "invalid_request", "Invalid request.");
    }
    const source = body.sourceUserId;
    const target = destination.user.id;
    if (typeof source !== "string" || !uuid.test(source) || source === target) {
      return fail(400, "invalid_source", "Invalid guest account.");
    }
    const worker = crypto.randomUUID();
    let claimed = false;
    try {
      const { data: receipt, error: receiptError } = await adminClient.from(
        "guest_account_merges",
      )
        .select("target_user_id,completed").eq("source_user_id", source)
        .maybeSingle();
      check(receiptError);
      if (receipt && receipt.target_user_id !== target) {
        return fail(
          409,
          "merge_conflict",
          "This guest account is already being kept by another account.",
        );
      }
      if (receipt?.completed) {
        return json(200, {
          merged: true,
          sourceUserId: source,
          targetUserId: target,
        });
      }
      let proven = false;
      if (!receipt) {
        if (typeof body.guestAccessToken !== "string") {
          return fail(
            403,
            "guest_proof_required",
            "Guest session proof is required.",
          );
        }
        const { data, error } = await adminClient.auth.getUser(
          body.guestAccessToken,
        );
        if (error || !data.user?.is_anonymous || data.user.id !== source) {
          return fail(
            403,
            "guest_proof_invalid",
            "The guest session is no longer valid.",
          );
        }
        proven = true;
      }
      const { data: lease, error: leaseError } = await adminClient.rpc(
        "claim_guest_merge",
        {
          source_id: source,
          target_id: target,
          worker_id: worker,
          proven,
        },
      );
      check(leaseError);
      if (!lease) {
        return fail(
          409,
          "merge_busy",
          "Memories are being kept. Please retry shortly.",
        );
      }
      claimed = true;
      const renew = async () => {
        const { data, error } = await adminClient.rpc("claim_guest_merge", {
          source_id: source,
          target_id: target,
          worker_id: worker,
          proven: false,
        });
        check(error);
        if (!data) throw new Error("Merge lease expired");
      };
      const { data: guest, error: guestError } = await adminClient.auth.admin
        .getUserById(source);
      if (guestError && guestError.status !== 404) check(guestError);
      if (guest.user && !guest.user.is_anonymous) {
        throw new Error("Source is no longer anonymous");
      }
      while (true) {
        const { data: photos, error: photosError } = await adminClient.from(
          "user_photos",
        )
          .select("id,storage_path").eq("user_id", source).limit(100);
        check(photosError);
        if (!photos?.length) break;
        for (const photo of photos ?? []) {
          if (!ownedPath(photo.storage_path, source)) {
            throw new Error("Unexpected guest storage path");
          }
          await renew();
          const path = `${target}/guest-${source}-${photo.id}`;
          const { data: file, error: downloadError } = await adminClient.storage
            .from("user-photos").download(photo.storage_path);
          check(downloadError);
          if (!file) throw new Error("Guest photo is unavailable");
          const { error: uploadError } = await adminClient.storage.from(
            "user-photos",
          ).upload(path, file, {
            upsert: true,
            contentType: file.type || "image/jpeg",
          });
          check(uploadError);
          const { error: transferError } = await adminClient.rpc(
            "transfer_guest_photo",
            {
              source_id: source,
              target_id: target,
              worker_id: worker,
              photo_id: photo.id,
              new_path: path,
              new_url: `${
                Deno.env.get("SUPABASE_URL")
              }/storage/v1/object/user-photos/${encodeURIComponent(path)}`,
            },
          );
          check(transferError);
        }
      }
      await renew();
      const { count, error: remainingError } = await adminClient.from(
        "user_photos",
      )
        .select("id", { count: "exact", head: true }).eq("user_id", source);
      check(remainingError);
      if (count !== 0) throw new Error("Guest photos remain");
      await removeFolder(adminClient, "user-photos", source);
      await removeFolder(adminClient, "user-avatars", source);
      await renew();
      // These guest-only records must not keep dangling identities after transfer.
      for (
        const table of [
          "invite_links",
          "ai_usage_daily",
          "user_subscriptions",
          "user_profiles",
        ]
      ) {
        const { error } = await adminClient.from(table).delete().eq(
          "user_id",
          source,
        );
        check(error);
      }
      const { error: friendsError } = await adminClient.from("friends").delete()
        .or(`user_id.eq.${source},friend_id.eq.${source}`);
      check(friendsError);
      const { error: reactionsError } = await adminClient.from(
        "user_photo_reactions",
      ).delete().eq("reactor_user_id", source);
      check(reactionsError);
      const { error: messagesError } = await adminClient.from(
        "user_photo_messages",
      ).delete().eq("sender_user_id", source);
      check(messagesError);
      const { error: cleanupError } = await adminClient.rpc(
        "assert_guest_merge_cleanup",
        {
          source_id: source,
          target_id: target,
          worker_id: worker,
        },
      );
      check(cleanupError);
      // Check again immediately before Auth removal; never delete an upgraded account.
      const { data: latest, error: latestError } = await adminClient.auth.admin
        .getUserById(source);
      if (latestError && latestError.status !== 404) check(latestError);
      if (latest.user) {
        if (!latest.user.is_anonymous) {
          throw new Error("Guest account was upgraded");
        }
        if (body.guestAccessToken) {
          const { error } = await adminClient.auth.admin.signOut(
            body.guestAccessToken,
            "global",
          );
          if (error && error.status !== 404 && error.status !== 401) {
            check(error);
          }
        }
        const { error } = await adminClient.auth.admin.deleteUser(
          source,
          false,
        );
        check(error);
      }
      const { error: completeError } = await adminClient.from(
        "guest_account_merges",
      ).update({ completed: true })
        .eq("source_user_id", source).eq("target_user_id", target).eq(
          "lease_id",
          worker,
        );
      check(completeError);
      return json(200, {
        merged: true,
        sourceUserId: source,
        targetUserId: target,
      });
    } catch (error) {
      console.error(
        "[merge-guest-account] merge incomplete",
        error instanceof Error ? error.message : "Unknown error",
      );
      return fail(
        500,
        "merge_incomplete",
        "Your memories are safe. Please retry keeping them.",
      );
    } finally {
      if (claimed) {
        await adminClient.from("guest_account_merges").update({
          lease_id: null,
          lease_until: null,
        })
          .eq("source_user_id", source).eq("lease_id", worker);
      }
    }
  };
