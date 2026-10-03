import { createHomeFriendFixture, HOME_DEMO_FRIEND_ID } from '@/features/home/homeFriendFixture';
import type { QuotePhotoCard } from '@/services/media/userPhotosApi';
const seed = { id: 'real', imageUrl: 'file:///photo.jpg', userId: 'me', isFavorite: true } as QuotePhotoCard;
it('never inserts fixture cards in release builds or while disabled', () => {
  expect(createHomeFriendFixture(seed, true, false)).toEqual([]);
  expect(createHomeFriendFixture(seed, false, true)).toEqual([]);
  expect(createHomeFriendFixture(undefined, true, true)).toEqual([]);
});
it('creates an independent friend stack using an available photo without mutating it', () => {
  const cards = createHomeFriendFixture(seed, true, true);
  expect(cards).toHaveLength(2);
  expect(cards[0].userId).toBe(HOME_DEMO_FRIEND_ID);
  expect(cards[0].visibility).toBe('friends');
  expect(cards[0].photoStackId).toBe(cards[1].photoStackId);
  expect(cards[0].id).not.toBe(cards[1].id);
  expect(cards[0].imageUrl).toBe(seed.imageUrl);
  expect(cards[0].isFavorite).toBe(false);
  expect(seed.userId).toBe('me');
});
