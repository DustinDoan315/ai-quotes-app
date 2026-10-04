import { QuoteMomentCard } from '@/features/quotes/QuoteMomentCard';
import { DEFAULT_QUOTE_POSITION } from '@/features/quotes/quotePosition';
import type { QuotePhotoCard } from '@/services/media/userPhotosApi';
const mockEffects: (() => any)[] = [];
function mockMedia() { return null; }
jest.mock('react', () => ({ ...jest.requireActual('react'), useEffect: (fn: () => any) => mockEffects.push(fn), useCallback: (fn: any) => fn }));
jest.mock('@/features/quotes/QuoteMomentCardMedia', () => ({ QuoteMomentCardMedia: mockMedia }));
jest.mock('@/features/quotes/useQuoteMomentShare', () => ({ useQuoteMomentShare: () => ({ captureRefView: { current: {} }, watermarkForExport: false, shareMoment: jest.fn() }) }));
jest.mock('@/features/quotes/useQuoteCardFrame', () => ({ useQuoteCardFrame: () => ({ width: 390 }) }));
jest.mock('@/hooks/useReducedMotionPreference', () => ({ useReducedMotionPreference: () => true }));
jest.mock('@/appState', () => ({ useUserStore: (fn: any) => fn({ authUserId: 'viewer', guestId: null }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'vi' }, t: (key: string, options: any) => options?.defaultValue ?? (key === 'home.ambient.friendAuthorFallback' ? 'Friend' : 'Share') }) }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Icon' }));
const card = { id: 'friend-card', userId: 'friend', guestId: null, imageUrl: 'friend.jpg', homeVibeKey: 'sage', authorDisplayName: null, authorAvatarUrl: null, quote: 'A moment', quotePosition: DEFAULT_QUOTE_POSITION, createdAt: '2026-10-03T00:00:00Z' } as QuotePhotoCard;
function find(element: any, type: any): any { if (!element) return; if (element.type === type) return element; for (const child of [element.props?.children].flat(Infinity)) { const found = find(child, type); if (found) return found; } }
it('uses neutral friend attribution and keeps the saved quote geometry', () => {
  const tree = QuoteMomentCard({ item: card, screenHeight: 844, authorName: 'Viewer Name', authorAvatarUrl: 'viewer.jpg', presentation: 'home', frameWidth: 350 });
  const media = find(tree, mockMedia);
  expect(media.props.displayName).toBe('Friend'); expect(media.props.displayAvatar).toBeNull(); expect(media.props.item.quotePosition).toEqual(DEFAULT_QUOTE_POSITION);
});
it('only registers sharing for the active Home card with an image', () => {
  mockEffects.length = 0; const register = jest.fn(() => jest.fn());
  QuoteMomentCard({ item: card, screenHeight: 844, authorName: 'Viewer', authorAvatarUrl: null, presentation: 'home', isActive: false, onRegisterShare: register });
  mockEffects.forEach(fn => fn()); expect(register).not.toHaveBeenCalled();
  mockEffects.length = 0;
  QuoteMomentCard({ item: card, screenHeight: 844, authorName: 'Viewer', authorAvatarUrl: null, presentation: 'home', isActive: true, onRegisterShare: register });
  const cleanup = mockEffects[0](); expect(register).toHaveBeenCalledWith('friend-card', expect.any(Function)); expect(typeof cleanup).toBe('function');
});
