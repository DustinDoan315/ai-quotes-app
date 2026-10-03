/* eslint-disable import/first */

jest.mock("@/services/media/userPhotoReactions", () => ({
  sendUserPhotoReaction: jest.fn(),
}));

import { canReactToQuotePhoto } from "@/features/home/useHomeReactions";

describe("canReactToQuotePhoto", () => {
  it("allowsFriendPhotoForAccount", () => {
    expect(canReactToQuotePhoto("user-1", "user-2", "friends")).toBe(true);
  });

  it("allowsPublicPhotoForAccount", () => {
    expect(canReactToQuotePhoto("user-1", "user-2", "public")).toBe(true);
  });

  it("hidesPrivatePhoto", () => {
    expect(canReactToQuotePhoto("user-1", "user-2", "private")).toBe(false);
  });

  it("hidesOwnPhoto", () => {
    expect(canReactToQuotePhoto("user-1", "user-1", "friends")).toBe(false);
  });

  it("hidesGuestPhotos", () => {
    expect(canReactToQuotePhoto(null, "user-2", "friends")).toBe(false);
    expect(canReactToQuotePhoto("user-1", null, "friends")).toBe(false);
  });
});
