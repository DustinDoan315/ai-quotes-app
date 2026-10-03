import { loadOwnMemories } from "@/domain/memories/loadOwnMemories";
import { listQuotePhotoCards, quotePhotoCardToMemory } from "@/services/media/userPhotosApi";
import type { QuotePhotoCard } from "@/services/media/userPhotosApi";
import type { QuoteMemory } from "@/types/memory";
import { useOwnMemoriesSync } from "@/features/memories/useOwnMemoriesSync";

const mockUser = { profile: { user_id: "me" }, authUserId: "me", guestId: "guest" };
const mockMemory = { _hasHydrated: true, memories: [] as QuoteMemory[], replaceMemories: jest.fn() };
let mockCleanup: (() => void) | undefined;
jest.mock("@/appState", () => ({
  useUserStore: (select: (state: typeof mockUser) => unknown) => select(mockUser),
  useMemoryStore: Object.assign(
    (select: (state: typeof mockMemory) => unknown) => select(mockMemory),
    { getState: () => mockMemory },
  ),
}));
jest.mock("react", () => ({
  useCallback: (callback: unknown) => callback,
  useState: (initial: unknown) => [initial, jest.fn()],
  useRef: (initial: unknown) => ({ current: initial }),
  // Run the mounting effect and retain its cleanup for cancellation assertions.
  useEffect: (effect: () => (() => void)) => {
    mockCleanup = effect();
  },
}));

jest.mock("@/services/media/userPhotosApi", () => ({
  listQuotePhotoCards: jest.fn(),
  quotePhotoCardToMemory: jest.fn((card) => ({ id: card.id, ownerUserId: card.userId })),
}));

const list = jest.mocked(listQuotePhotoCards);
const card = (id: string, quote = "A saved quote") => ({ id, quote, userId: "me" } as QuotePhotoCard);

beforeEach(() => {
  jest.clearAllMocks();
  list.mockReset();
  mockMemory._hasHydrated = true;
  mockMemory.memories = [];
  mockCleanup = undefined;
});

it("paginates using raw page length even when a whole page has empty quotes", async () => {
  list.mockResolvedValueOnce(Array.from({ length: 100 }, (_, i) => card(String(i), " ")))
    .mockResolvedValueOnce([card("saved")]);
  expect(await loadOwnMemories({ userId: "me", guestId: "guest" })).toEqual([
    { id: "saved", ownerUserId: "me" },
  ]);
  expect(list).toHaveBeenNthCalledWith(1, {
    userId: "me", guestId: null, limit: 100, offset: 0, signPhotoUrls: false,
  });
  expect(list).toHaveBeenNthCalledWith(2, {
    userId: "me", guestId: null, limit: 100, offset: 100, signPhotoUrls: false,
  });
  expect(quotePhotoCardToMemory).toHaveBeenCalledTimes(1);
});

it("loads guest-owned records without changing ownership", async () => {
  list.mockResolvedValueOnce([]);
  expect(await loadOwnMemories({ userId: null, guestId: "guest" })).toEqual([]);
  expect(list).toHaveBeenCalledWith({
    userId: null, guestId: "guest", limit: 100, offset: 0, signPhotoUrls: false,
  });
});

it("does not issue an unfiltered request without an owner", async () => {
  expect(await loadOwnMemories({ userId: null, guestId: null })).toEqual([]);
  expect(list).not.toHaveBeenCalled();
});

it("rejects a failed later page rather than exposing partial results to the cache", async () => {
  list.mockResolvedValueOnce(Array.from({ length: 100 }, (_, i) => card(String(i))))
    .mockRejectedValueOnce(new Error("offline"));
  await expect(loadOwnMemories({ userId: "me", guestId: null })).rejects.toThrow("offline");
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => { resolve = complete; });
  return { promise, resolve };
}

it("waits for local hydration before requesting cloud records", async () => {
  mockMemory._hasHydrated = false;
  await useOwnMemoriesSync().refresh();
  expect(list).not.toHaveBeenCalled();
  expect(mockMemory.replaceMemories).not.toHaveBeenCalled();
});

it("merges records against the latest cache, preserving other owners and saves made during loading", async () => {
  const response = deferred<QuotePhotoCard[]>();
  list.mockReturnValue(response.promise);
  const sync = useOwnMemoriesSync();
  const pending = sync.refresh();
  mockMemory.memories = [
    { id: "other", ownerUserId: "another-user" } as QuoteMemory,
    { id: "new-local", ownerUserId: "me" } as QuoteMemory,
  ];
  response.resolve([card("cloud")]);
  await pending;
  expect(mockMemory.replaceMemories).toHaveBeenLastCalledWith([
    { id: "cloud", ownerUserId: "me" }, ...mockMemory.memories,
  ]);
});

it("ignores older refreshes and requests completing after unmount", async () => {
  const old = deferred<QuotePhotoCard[]>();
  const latest = deferred<QuotePhotoCard[]>();
  const initial = deferred<QuotePhotoCard[]>();
  list.mockReturnValueOnce(initial.promise).mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise);
  const sync = useOwnMemoriesSync();
  const first = sync.refresh();
  const second = sync.refresh();
  latest.resolve([card("latest")]);
  await second;
  old.resolve([card("old")]);
  await first;
  expect(mockMemory.replaceMemories).toHaveBeenCalledTimes(1);
  expect(mockMemory.replaceMemories).toHaveBeenCalledWith([{ id: "latest", ownerUserId: "me" }]);
  mockCleanup?.();
  initial.resolve([card("unmounted")]);
  await Promise.resolve();
  await Promise.resolve();
  expect(mockMemory.replaceMemories).toHaveBeenCalledTimes(1);
});

it("keeps local cache unchanged when a cloud request fails", async () => {
  list.mockRejectedValue(new Error("offline"));
  mockMemory.memories = [{ id: "cached", ownerUserId: "me" } as QuoteMemory];
  await useOwnMemoriesSync().refresh();
  expect(mockMemory.replaceMemories).not.toHaveBeenCalled();
  expect(mockMemory.memories[0].id).toBe("cached");
});
