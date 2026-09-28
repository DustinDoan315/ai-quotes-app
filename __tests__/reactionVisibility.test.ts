/* eslint-disable import/first */

jest.mock("@/services/media/userPhotoReactions", () => ({
  sendUserPhotoReaction: jest.fn(),
}));

import { canReactToQuotePhoto } from "@/features/home/useHomeFeedState";

describe("canReactToQuotePhoto", () => {
  it("allowsFriendPhotoForAccount", () => {
    expect(canReactToQuotePhoto("user-1", "user-2")).toBe(true);
  });

  it("hidesOwnPhoto", () => {
    expect(canReactToQuotePhoto("user-1", "user-1")).toBe(false);
  });

  it("hidesGuestPhotos", () => {
    expect(canReactToQuotePhoto(null, "user-2")).toBe(false);
    expect(canReactToQuotePhoto("user-1", null)).toBe(false);
  });
});
