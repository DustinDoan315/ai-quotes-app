import {
  listQuotePhotoCards,
  quotePhotoCardToMemory,
} from "@/services/media/userPhotosApi";
import type { QuoteMemory } from "@/types/memory";

export type MemoriesOwner = { userId: string | null; guestId: string | null };

/** Fetch every page before exposing a result, so a failed page cannot erase cache. */
export async function loadOwnMemories(owner: MemoriesOwner): Promise<QuoteMemory[]> {
  if (!owner.userId && !owner.guestId) return [];
  const memories: QuoteMemory[] = [];
  const limit = 100;
  for (let offset = 0; ; offset += limit) {
    const page = await listQuotePhotoCards({
      userId: owner.userId,
      guestId: owner.userId ? null : owner.guestId,
      limit,
      offset,
      signPhotoUrls: false,
    });
    memories.push(...page.filter((card) => card.quote.trim().length > 0).map(quotePhotoCardToMemory));
    if (page.length < limit) return memories;
  }
}
