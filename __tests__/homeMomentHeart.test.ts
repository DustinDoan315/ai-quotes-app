/* eslint-disable import/first */
const mockRefs: {
  current: unknown;
}[] = [];
let mockCursor = 0;
jest.mock('react', () => ({ useRef: (value: unknown) => mockRefs[mockCursor++] ?? (mockRefs[mockCursor - 1] = { current: value }), useState: () => [false, jest.fn()], useEffect: jest.fn() }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
const mockToast = jest.fn();
jest.mock('@/appState/uiStore', () => ({ useUIStore: { getState: () => ({ showToast: mockToast }) } }));
jest.mock('@/services/media/userPhotosApi', () => ({ updateUserPhotoFavorite: jest.fn() }));
jest.mock('@/services/media/userPhotoReactions', () => ({ sendUserPhotoReaction: jest.fn() }));
import { useHomeMomentHeart, getHomeMomentHeartMode, type HomeMomentHeartOptions } from '@/hooks/useHomeMomentHeart';
import { updateUserPhotoFavorite, type QuotePhotoCard } from '@/services/media/userPhotosApi';
import { sendUserPhotoReaction } from '@/services/media/userPhotoReactions';
const card = (userId: string | null, visibility = 'friends') => ({ id: 'a', userId, visibility, isFavorite: true }) as QuotePhotoCard;
const options = (photo = card('me')): HomeMomentHeartOptions => ({ card: photo, authUserId: 'me', signedInUserId: 'me', identityEpoch: 0, patchFavorite: jest.fn(), onSignIn: jest.fn() });
function useRender(input: HomeMomentHeartOptions) { mockCursor = 0; return useHomeMomentHeart(input); }
beforeEach(() => { mockRefs.length = 0; jest.clearAllMocks(); (updateUserPhotoFavorite as jest.Mock).mockResolvedValue(true); (sendUserPhotoReaction as jest.Mock).mockResolvedValue(true); });
it('anonymous-auth owned rows can favorite, legacy guests sign in', () => { expect(getHomeMomentHeartMode(card('anon'), 'anon', null)).toBe('favorite'); expect(getHomeMomentHeartMode(card(null), null, null)).toBe('signin'); });
it('private friends have no reaction', () => expect(getHomeMomentHeartMode(card('friend', 'private'), 'me', 'me')).toBe('hidden'));
it('a friends favorite bit cannot invoke owner favorite API', async () => { const input = options(card('friend')); const hook = useRender(input); expect(hook.isFavorite).toBe(false); await hook.press(); expect(updateUserPhotoFavorite).not.toHaveBeenCalled(); expect(sendUserPhotoReaction).toHaveBeenCalledWith({ photoId: 'a', userId: 'me', type: 'love' }); });
it('rolls back failed favorite', async () => { (updateUserPhotoFavorite as jest.Mock).mockResolvedValue(false); const input = options(); await useRender(input).press(); expect(input.patchFavorite).toHaveBeenNthCalledWith(1, 'a', false); expect(input.patchFavorite).toHaveBeenLastCalledWith('a', true); expect(mockToast).toHaveBeenCalled(); });
it('locks repeated taps and patches original photo after navigation', async () => { let resolve!: (value: boolean) => void; (updateUserPhotoFavorite as jest.Mock).mockImplementation(() => new Promise(r => { resolve = r; })); const input = options(); const hook = useRender(input); const pending = hook.press(); await hook.press(); useRender({ ...input, card: { ...card('me'), id: 'b' } }); resolve(true); await pending; expect(updateUserPhotoFavorite).toHaveBeenCalledTimes(1); expect(input.patchFavorite).toHaveBeenLastCalledWith('a', false); });
it('does not patch or toast after account identity changes', async () => { let resolve!: (value: boolean) => void; (updateUserPhotoFavorite as jest.Mock).mockImplementation(() => new Promise(r => { resolve = r; })); const input = options(); const pending = useRender(input).press(); useRender({ ...input, authUserId: 'other', identityEpoch: 1 }); resolve(false); await pending; expect(input.patchFavorite).toHaveBeenCalledTimes(1); expect(mockToast).not.toHaveBeenCalled(); });
it('reports reaction failures', async () => { (sendUserPhotoReaction as jest.Mock).mockResolvedValue(false); await useRender(options(card('friend'))).press(); expect(mockToast).toHaveBeenCalledWith('home.ambient.reactionError', 'error'); });
it('does not expose a reaction or sign-in heart for another owners private card', () => {
  expect(getHomeMomentHeartMode(card('friend', 'private'), 'anon', null)).toBe('hidden');
});
