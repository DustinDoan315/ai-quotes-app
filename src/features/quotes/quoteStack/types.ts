import type { QuotePhotoCard } from "@/services/media/userPhotosApi";
import type { HomeVibeKey } from "@/types/homeBackground";

export type QuoteStack = {
  id: string;
  quotes: QuotePhotoCard[];
  ownerKey: string;
  primaryVibeKey: HomeVibeKey | null;
  displayVibeKey: HomeVibeKey | null;
  createdAtMs: number;
};

