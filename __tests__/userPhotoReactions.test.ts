/* eslint-disable import/first */

const mockFrom = jest.fn();
const mockUpsert = jest.fn();
let consoleErrorSpy: jest.SpyInstance;

jest.mock("@/config/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import { sendUserPhotoReaction } from "@/services/media/userPhotoReactions";

describe("sendUserPhotoReaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockFrom.mockReturnValue({ upsert: mockUpsert });
    mockUpsert.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("requiresPhotoAndAccountUser", async () => {
    await expect(
      sendUserPhotoReaction({ photoId: "", userId: "user-1", type: "love" }),
    ).resolves.toBe(false);
    await expect(
      sendUserPhotoReaction({ photoId: "photo-1", userId: null, type: "love" }),
    ).resolves.toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("writesOnlyReactionColumns", async () => {
    await expect(
      sendUserPhotoReaction({ photoId: "photo-1", userId: "user-1", type: "love" }),
    ).resolves.toBe(true);

    expect(mockFrom).toHaveBeenCalledWith("user_photo_reactions");
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        photo_id: "photo-1",
        reactor_user_id: "user-1",
        reactor_guest_id: null,
        type: "love",
      },
      {
        onConflict: "photo_id,reactor_user_id,reactor_guest_id,type",
        ignoreDuplicates: true,
      },
    );
  });

  it("ignoresDuplicateRows", async () => {
    mockUpsert.mockResolvedValue({ error: null, data: null });

    await expect(
      sendUserPhotoReaction({ photoId: "photo-1", userId: "user-1", type: "love" }),
    ).resolves.toBe(true);
    expect(mockUpsert.mock.calls[0][1]).toMatchObject({ ignoreDuplicates: true });
  });

  it("returnsFalseOnDatabaseError", async () => {
    mockUpsert.mockResolvedValue({ error: new Error("write denied") });

    await expect(
      sendUserPhotoReaction({ photoId: "photo-1", userId: "user-1", type: "love" }),
    ).resolves.toBe(false);
  });
});
