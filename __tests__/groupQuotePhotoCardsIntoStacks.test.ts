import { groupQuotePhotoCardsIntoStacks } from "@/features/quotes/quoteStack/groupQuotePhotoCardsIntoStacks";
import type { QuotePhotoCard } from "@/services/media/userPhotosApi";

const createCard = (
  id: string,
  photoStackId: string | null,
  userId: string = "user-1",
): QuotePhotoCard => ({
  id,
  storagePath: `user-1/${id}.jpg`,
  imageUrl: `https://example.com/${id}.jpg`,
  quote: "A small, personal thought for today.",
  createdAt: "2026-08-22T10:00:00.000Z",
  userId,
  guestId: null,
  authorDisplayName: "Inkly",
  authorAvatarUrl: null,
  styleFontId: "medium",
  styleColorSchemeId: "light",
  homeVibeKey: null,
  photoStackId,
  visibility: "private",
  isFavorite: false,
});

describe("groupQuotePhotoCardsIntoStacks", () => {
  it("keeps free uploads as individual feed cards", () => {
    const stacks = groupQuotePhotoCardsIntoStacks([
      createCard("free-1", null),
      createCard("free-2", null),
    ]);

    expect(stacks).toHaveLength(2);
    expect(stacks.map((stack) => stack.quotes)).toEqual([
      [expect.objectContaining({ id: "free-1" })],
      [expect.objectContaining({ id: "free-2" })],
    ]);
  });

  it("groups only photos explicitly saved in the same Pro stack", () => {
    const stacks = groupQuotePhotoCardsIntoStacks([
      createCard("pro-1", "d72d8190-5678-4b86-a706-7e11bced6d01"),
      createCard("other-user", null, "user-2"),
      createCard("pro-2", "d72d8190-5678-4b86-a706-7e11bced6d01"),
    ]);

    expect(stacks).toHaveLength(2);
    expect(stacks[0]?.quotes.map((card) => card.id)).toEqual(["pro-1", "pro-2"]);
  });
});
