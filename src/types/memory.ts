export type QuoteVisibility = "private" | "friends" | "public";

export type QuoteMemory = {
  id: string;
  ownerUserId: string | null;
  ownerGuestId: string | null;
  date: string;
  quoteText: string;
  author: string | null;
  personaId: string | null;
  photoBackgroundUri: string | null;
  styleFontId: string;
  styleColorSchemeId: string;
  createdAt: string;
  visibility: QuoteVisibility;
  isFavorite: boolean;
};

