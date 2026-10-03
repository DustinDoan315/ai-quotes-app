import type { QuoteMemory } from '@/types/memory';

/** Cloud records come first; local-only saves remain available while syncing. */
export function mergeMemories(cloud: QuoteMemory[], local: QuoteMemory[] = []): QuoteMemory[] {
  const byPhoto = new Map<string, QuoteMemory>();
  for (const memory of [...cloud, ...local]) {
    const owner = memory.ownerUserId ? `user:${memory.ownerUserId}` : `guest:${memory.ownerGuestId ?? ''}`;
    const key = `${owner}:${memory.photoId ? `photo:${memory.photoId}` : `memory:${memory.id}`}`;
    if (!byPhoto.has(key)) byPhoto.set(key, memory);
  }
  return [...byPhoto.values()];
}
