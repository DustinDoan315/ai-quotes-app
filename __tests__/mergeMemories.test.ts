import { mergeMemories } from '@/domain/memories/mergeMemories';
import type { QuoteMemory } from '@/types/memory';
const memory = (patch: Partial<QuoteMemory>) => ({ id: 'local', photoId: 'photo', ownerUserId: 'me', ownerGuestId: null, visibility: 'private', isFavorite: false, ...patch } as QuoteMemory);
it('collapses local/cloud IDs for the same photo and prefers cloud metadata', () => {
  const cloud = memory({ id: 'photo', visibility: 'friends', isFavorite: true });
  expect(mergeMemories([cloud], [memory({})])).toEqual([cloud]);
});
it('keeps separate photos even with identical image or quote content', () => {
  expect(mergeMemories([memory({}), memory({ id: 'other', photoId: 'other' })])).toHaveLength(2);
});
it('keeps distinct owners and local memories without photo IDs', () => {
  expect(mergeMemories([memory({}), memory({ ownerUserId: 'friend' }), memory({ photoId: null, id: 'draft1' }), memory({ photoId: null, id: 'draft2' })])).toHaveLength(4);
});
