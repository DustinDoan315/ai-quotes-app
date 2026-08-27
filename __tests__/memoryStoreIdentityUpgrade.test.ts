/* eslint-disable import/first */

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
  },
}));

import { useMemoryStore } from "@/appState/memoryStore";

describe("migrateGuestMemoriesToUser", () => {
  beforeEach(() => {
    useMemoryStore.setState({
      memories: [
        {
          id: "guest-memory",
          ownerUserId: null,
          ownerGuestId: "guest-1",
          date: "2026-08-22",
          quoteText: "Keep going",
          author: null,
          personaId: null,
          photoBackgroundUri: null,
          createdAt: "2026-08-22T00:00:00.000Z",
          visibility: "private",
          isFavorite: false,
          styleFontId: "medium",
          styleColorSchemeId: "light",
        },
        {
          id: "other-memory",
          ownerUserId: null,
          ownerGuestId: "guest-2",
          date: "2026-08-22",
          quoteText: "Keep exploring",
          author: null,
          personaId: null,
          photoBackgroundUri: null,
          createdAt: "2026-08-22T00:00:00.000Z",
          visibility: "private",
          isFavorite: false,
          styleFontId: "medium",
          styleColorSchemeId: "light",
        },
      ],
    });
  });

  it("moves only the current device's guest memories to the linked account", () => {
    useMemoryStore.getState().migrateGuestMemoriesToUser("guest-1", "user-1");

    expect(useMemoryStore.getState().memories).toEqual([
      expect.objectContaining({
        id: "guest-memory",
        ownerUserId: "user-1",
        ownerGuestId: null,
      }),
      expect.objectContaining({
        id: "other-memory",
        ownerUserId: null,
        ownerGuestId: "guest-2",
      }),
    ]);
  });
});
