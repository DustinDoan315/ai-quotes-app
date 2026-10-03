import type { QuotePhotoCard } from '@/services/media/userPhotosApi';

export const HOME_DEMO_FRIEND_ID = 'home-development-friend';
export function createHomeFriendFixture(seed: QuotePhotoCard | undefined, enabled: boolean, development: boolean): QuotePhotoCard[] {
  if (!development || !enabled || !seed) return [];
  return [0, 1].map(index => ({ ...seed,
    id: `${HOME_DEMO_FRIEND_ID}-${index}`, userId: HOME_DEMO_FRIEND_ID, guestId: null,
    photoStackId: HOME_DEMO_FRIEND_ID, authorDisplayName: 'Demo friend', authorAvatarUrl: null,
    quote: index === 0 ? 'A little kindness can change the whole day.' : 'Some moments are better when shared.',
    visibility: 'friends', isFavorite: false, homeVibeKey: index === 0 ? 'dawn' : 'mist',
    quotePosition: { x: 0.5, y: 0.7, scale: 1, rotation: 0 },
  }));
}
