import { createClient, type Session } from "@supabase/supabase-js";
const mockValues = new Map<string, string>();
const mockInvoke = jest.fn();
const mockLoadOwnMemories = jest.fn();
const mockPersist = jest.fn();
const mockGetOptions = () => ({ name: "store", storage: { setItem: mockPersist }, partialize: (state: unknown) => state });
const mockGetSession = jest.fn();
const mockRefreshSession = jest.fn();
const mockReplaceMemories = jest.fn();
const mockSetUserState = jest.fn();
const mockMemoryState = { _hasHydrated: true, memories: [] as Record<string, unknown>[], replaceMemories: mockReplaceMemories };
const mockUserState = { guestId: "local-guest" as string | null };
jest.mock("@/config/secureStorage", () => ({ ExpoSecureStorageAdapter: {
  getItem: jest.fn(async (key: string) => mockValues.get(key) ?? null),
  setItem: jest.fn(async (key: string, value: string) => { mockValues.set(key, value); }),
  removeItem: jest.fn(async (key: string) => { mockValues.delete(key); }),
} }));
jest.mock("@/domain/memories/loadOwnMemories", () => ({ loadOwnMemories: mockLoadOwnMemories }));
jest.mock("@/config/supabase", () => ({ supabase: { functions: { invoke: mockInvoke }, auth: { getSession: mockGetSession } } }));
jest.mock("@supabase/supabase-js", () => ({ createClient: jest.fn(() => ({ auth: { refreshSession: mockRefreshSession } })) }));
jest.mock("@/appState/memoryStore", () => ({ useMemoryStore: { getState: () => mockMemoryState, subscribe: jest.fn(), persist: { getOptions: mockGetOptions } } }));
jest.mock("@/appState/userStore", () => ({ useUserStore: { getState: () => mockUserState, setState: mockSetUserState, persist: { getOptions: mockGetOptions } } }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { rememberGuestMerge, bindGuestMergeTarget, resumeGuestMerge, finishGuestIdentityUpgrade } = require("@/services/guestAccountMerge") as typeof import("@/services/guestAccountMerge");
const guest = { user: { id: "guest-user", is_anonymous: true }, access_token: "guest-proof", refresh_token: "guest-refresh" } as Session;
const success = { data: { merged: true, sourceUserId: "guest-user", targetUserId: "apple-user" }, error: null };
async function prepare() { await rememberGuestMerge(guest); await bindGuestMergeTarget("apple-user"); }
beforeEach(() => {
  jest.clearAllMocks(); mockValues.clear(); mockUserState.guestId = "local-guest"; mockMemoryState.memories = [];
  mockGetSession.mockResolvedValue({ data: { session: { user: { id: "apple-user", is_anonymous: false } } }, error: null });
  mockInvoke.mockResolvedValue(success); mockLoadOwnMemories.mockResolvedValue([]); mockPersist.mockResolvedValue(undefined);
});
test("records guest proof before the destination session replaces it", async () => {
  await rememberGuestMerge(guest);
  expect(JSON.parse([...mockValues.values()][0])).toEqual({ sourceUserId: "guest-user", sourceAccessToken: "guest-proof", sourceRefreshToken: "guest-refresh", guestId: "local-guest", targetUserId: null });
  expect(mockInvoke).not.toHaveBeenCalled();
});
test("successful backend deletion remaps only source memories and removes pending proof", async () => {
  await prepare();
  mockMemoryState.memories = [ { id: "cloud", ownerUserId: "guest-user" }, { id: "local", ownerUserId: null, ownerGuestId: "local-guest" }, { id: "other", ownerUserId: "other-user", ownerGuestId: "local-guest" } ];
  expect(await resumeGuestMerge("apple-user")).toBe(true);
  expect(mockReplaceMemories).toHaveBeenCalledWith([
    { id: "cloud", ownerUserId: "apple-user", ownerGuestId: null },
    { id: "local", ownerUserId: "apple-user", ownerGuestId: null },
    { id: "other", ownerUserId: "other-user", ownerGuestId: "local-guest" },
  ]);
  expect(mockValues.size).toBe(0); expect(mockSetUserState).toHaveBeenCalledWith({ guestId: null });
});
test("failed transfer retains proof and never exposes guest memories", async () => {
  await prepare(); mockInvoke.mockResolvedValue({ data: null, error: new Error("offline") });
  await expect(resumeGuestMerge("apple-user")).rejects.toThrow("retry");
  expect(mockValues.size).toBe(1); expect(mockReplaceMemories).not.toHaveBeenCalled(); expect(mockSetUserState).not.toHaveBeenCalled();
});
test("rejects a different destination and replacing a pending source", async () => {
  await prepare();
  await expect(bindGuestMergeTarget("other-user")).rejects.toThrow("different account");
  await expect(resumeGuestMerge("other-user")).rejects.toThrow("different account");
  await expect(rememberGuestMerge({ ...guest, user: { ...guest.user, id: "another-guest" } })).rejects.toThrow("pending guest merge");
  expect(mockInvoke).not.toHaveBeenCalled();
});
test("coalesces concurrent resumes into a single transfer", async () => {
  await prepare(); await Promise.all([resumeGuestMerge("apple-user"), resumeGuestMerge("apple-user")]);
  expect(mockInvoke).toHaveBeenCalledTimes(1);
});
test("rejects mismatched backend receipts", async () => {
  await prepare(); mockInvoke.mockResolvedValue({ data: { ...success.data, targetUserId: "other" }, error: null });
  await expect(resumeGuestMerge("apple-user")).rejects.toThrow("retry");
  expect(mockReplaceMemories).not.toHaveBeenCalled(); expect(mockValues.size).toBe(1);
});
test("refreshes expired guest proof using an isolated nonpersistent auth client", async () => {
  await prepare();
  mockInvoke.mockResolvedValueOnce({ data: { code: "guest_proof_expired" }, error: new Error("expired") }).mockResolvedValueOnce(success);
  mockRefreshSession.mockResolvedValue({ data: { session: { ...guest, access_token: "new-proof", refresh_token: "new-refresh" } }, error: null });
  await resumeGuestMerge("apple-user");
  expect(createClient).toHaveBeenCalledWith(expect.any(String), expect.any(String), { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  expect(mockInvoke).toHaveBeenLastCalledWith("merge-guest-account", { body: { sourceUserId: "guest-user", guestAccessToken: "new-proof" } });
});
test("no pending merge is a harmless no-op", async () => { expect(await resumeGuestMerge("apple-user")).toBe(false); expect(mockInvoke).not.toHaveBeenCalled(); });
test("retains pending proof when refreshed guest identity differs", async () => {
  await prepare();
  mockInvoke.mockResolvedValueOnce({ data: { code: "guest_proof_invalid" }, error: new Error("expired") });
  mockRefreshSession.mockResolvedValue({ data: { session: { ...guest, user: { id: "other-guest", is_anonymous: true } } }, error: null });
  await expect(resumeGuestMerge("apple-user")).rejects.toThrow("renew");
  expect(mockValues.size).toBe(1); expect(mockReplaceMemories).not.toHaveBeenCalled();
});
test("an account change during transfer cannot remap local content", async () => {
  await prepare();
  mockGetSession.mockResolvedValueOnce({ data: { session: { user: { id: "apple-user", is_anonymous: false } } }, error: null })
    .mockResolvedValueOnce({ data: { session: { user: { id: "other-user" } } }, error: null });
  await expect(resumeGuestMerge("apple-user")).rejects.toThrow("destination account");
  expect(mockReplaceMemories).not.toHaveBeenCalled(); expect(mockValues.size).toBe(1);
});
test("does not invoke a transfer from an unrelated current auth session", async () => {
  await prepare(); mockGetSession.mockResolvedValue({ data: { session: { user: { id: "other-user" } } }, error: null });
  await expect(resumeGuestMerge("apple-user")).rejects.toThrow("destination account");
  expect(mockInvoke).not.toHaveBeenCalled();
});
test("unbound saved proof remains pending without running a transfer", async () => {
  await rememberGuestMerge(guest);
  expect(await resumeGuestMerge("apple-user")).toBe(false);
  expect(mockValues.size).toBe(1); expect(mockInvoke).not.toHaveBeenCalled();
});
test("refetches moved cloud storage paths before exposing merged memories", async () => {
  await prepare();
  mockMemoryState.memories = [{ id: "saved", photoId: "photo", ownerUserId: "guest-user", photoStoragePath: "guest/old.jpg" }];
  mockLoadOwnMemories.mockResolvedValue([{ id: "saved", photoId: "photo", ownerUserId: "apple-user", photoStoragePath: "apple/new.jpg" }]);
  await resumeGuestMerge("apple-user");
  expect(mockLoadOwnMemories).toHaveBeenCalledWith({ userId: "apple-user", guestId: null });
  expect(mockReplaceMemories).toHaveBeenCalledWith([{ id: "saved", photoId: "photo", ownerUserId: "apple-user", photoStoragePath: "apple/new.jpg" }]);
  expect(mockPersist).toHaveBeenCalledTimes(2);
});
test("failed cloud refresh leaves merge proof saved for receipt retry", async () => {
  await prepare(); mockLoadOwnMemories.mockRejectedValue(new Error("offline"));
  await expect(resumeGuestMerge("apple-user")).rejects.toThrow("offline");
  expect(mockReplaceMemories).not.toHaveBeenCalled(); expect(mockValues.size).toBe(1);
});
test("failed durable local write retains merge proof", async () => {
  await prepare(); mockPersist.mockRejectedValue(new Error("storage unavailable"));
  await expect(resumeGuestMerge("apple-user")).rejects.toThrow("storage unavailable");
  expect(mockValues.size).toBe(1);
});

test("successful same-UUID identity upgrade clears only its own unbound proof", async () => {
  await rememberGuestMerge(guest);
  await finishGuestIdentityUpgrade("guest-user");
  expect(mockValues.size).toBe(0);
  expect(mockInvoke).not.toHaveBeenCalled(); expect(mockReplaceMemories).not.toHaveBeenCalled();
});
test("identity upgrade preserves a bound transfer or another guest proof", async () => {
  await prepare(); await finishGuestIdentityUpgrade("guest-user");
  expect(mockValues.size).toBe(1);
  mockValues.clear(); await rememberGuestMerge(guest); await finishGuestIdentityUpgrade("other-guest");
  expect(mockValues.size).toBe(1);
});
