import { HomeFeedFlow } from '@/features/home/HomeFeedFlow';
import { FlatList, View } from 'react-native';
import { QuoteStackEntry } from '@/features/quotes/quoteStack/QuoteStackEntry';
import type { QuoteStack } from '@/features/quotes/quoteStack/types';
import type { QuotePhotoCard } from '@/services/media/userPhotosApi';

const mockRefs: { current: unknown }[] = [];
const mockShared: { value: number | boolean }[] = [];
let mockRefIndex = 0;
let mockSharedIndex = 0;
let mockLayouts: (() => void)[] = [];
let mockCompletion: ((finished: boolean) => void) | undefined;
const mockGesture = {
  enabled: jest.fn().mockReturnThis(), activeOffsetX: jest.fn().mockReturnThis(),
  failOffsetY: jest.fn().mockReturnThis(), onUpdate: jest.fn().mockReturnThis(),
  onEnd: jest.fn().mockReturnThis(),
};
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useRef: (value: unknown) => mockRefs[mockRefIndex++] ?? (mockRefs[mockRefIndex - 1] = { current: value }),
  useMemo: (callback: () => unknown) => callback(),
  useCallback: (callback: unknown) => callback,
  useEffect: jest.fn(),
  useLayoutEffect: (callback: () => void) => mockLayouts.push(callback),
}));
jest.mock('react-native-reanimated', () => ({
  __esModule: true, default: { View: 'AnimatedView' },
  useSharedValue: (value: number | boolean) => mockShared[mockSharedIndex++] ?? (mockShared[mockSharedIndex - 1] = { value }),
  useAnimatedStyle: (callback: () => unknown) => callback(),
  cancelAnimation: jest.fn(), runOnJS: (callback: unknown) => callback,
  withTiming: (value: number, _config: unknown, callback: (finished: boolean) => void) => { mockCompletion = callback; return value; },
  withSpring: (value: number) => value,
}));
jest.mock('react-native-gesture-handler', () => ({ Gesture: { Pan: () => mockGesture }, GestureDetector: 'GestureDetector' }));
jest.mock('expo-image', () => ({ Image: { prefetch: jest.fn().mockResolvedValue(true) } }));
jest.mock('@/features/quotes/QuoteMomentCard', () => ({ QuoteMomentCard: 'QuoteMomentCard' }));
jest.mock('@/features/quotes/useQuoteCardFrame', () => ({ useQuoteCardFrame: () => ({ width: 320 }) }));

const stack: QuoteStack = {
  id: 'stack', ownerKey: 'friend', primaryVibeKey: null, displayVibeKey: null, createdAtMs: 0,
  quotes: ['a', 'b', 'c'].map(id => ({ id, imageUrl: `${id}.jpg` } as QuotePhotoCard)),
};
const select = jest.fn();
const register = jest.fn();
function render(activeQuoteId: string | null, isActive = true) {
  mockRefIndex = 0; mockSharedIndex = 0; mockLayouts = [];
  return QuoteStackEntry({ stack, screenHeight: 700, authorName: 'Friend', authorAvatarUrl: null,
    isActive, activeQuoteId, onSelectQuote: select, onRegisterShare: register, presentation: 'home' });
}
function cards(tree: ReturnType<typeof render>) { return tree.props.children.props.children; }
beforeEach(() => {
  mockRefs.length = 0; mockShared.length = 0; mockCompletion = undefined;
  jest.clearAllMocks();
});

it('preserves a neighbor image key when it becomes active and only registers the top card for sharing', () => {
  const before = cards(render('a'));
  const incoming = before.find((card: { key: string }) => card.key === 'b');
  expect(incoming.props.children.props.onRegisterShare).toBeUndefined();
  const after = cards(render('b'));
  expect(after.map((card: { key: string }) => card.key)).toEqual(['a', 'b', 'c']);
  const active = after.find((card: { key: string }) => card.key === incoming.key);
  expect(active.type).toBe(incoming.type);
  expect(active.props.children.props.isActive).toBe(true);
  expect(active.props.children.props.onRegisterShare).toBe(register);
  expect(after.filter((card: typeof active) => card.props.children.props.onRegisterShare)).toHaveLength(1);
});

it('retains the visible quote when its vertical feed page becomes inactive', () => {
  render('c');
  const inactive = cards(render(null, false));
  const retained = inactive.find((card: { key: string }) => card.key === 'c');
  expect(retained.props.pointerEvents).toBe('auto');
  expect(retained.props.children.props.isActive).toBe(false);
  expect(inactive.map((card: { key: string }) => card.key)).toEqual(['b', 'c']);
});

it('holds the completed swipe until the selected card is committed, then resets in layout', () => {
  render('a'); mockLayouts.forEach(callback => callback());
  const end = mockGesture.onEnd.mock.calls[0][0];
  end({ translationX: -150, velocityX: 0 });
  expect(mockShared[2].value).toBe(-320);
  mockCompletion?.(true);
  expect(select).toHaveBeenCalledWith('b');
  expect(mockShared[2].value).toBe(-320);
  render('b');
  expect(mockShared[2].value).toBe(-320);
  mockLayouts.forEach(callback => callback());
  expect(mockShared[2].value).toBe(0);
});

it('keeps vertical feed images mounted and renders pages without a fade-in wrapper', () => {
  const tree = HomeFeedFlow({
    quoteStacks: [stack], listRef: { current: null }, viewportHeight: 700,
    frameWidth: 320, contentTop: 100, contentHeight: 400,
    isCaptureFlowActive: false, interactionLocked: false, horizontalLocked: false,
    isFeedRefreshing: false, flatListExtraData: 'b', snapOffsets: [0, 700],
    currentFeedIndex: 0, isOnFeed: true, activeQuoteId: 'b',
    authorName: 'Friend', authorAvatarUrl: null, viewerUserId: 'viewer', viewerGuestId: null,
    onBeginDrag: jest.fn(), onCommitPage: jest.fn(), onSelectQuote: select,
    onRegisterShare: register, refreshFeed: jest.fn(), header: null as unknown as React.ReactElement,
    getItemLayout: (_data, index) => ({ length: 700, offset: index * 700, index }),
  });
  expect(tree.type).toBe(FlatList);
  expect(tree.props.removeClippedSubviews).toBe(false);
  const page = tree.props.renderItem({ item: stack, index: 0 });
  expect(page.type).toBe(View);
  expect(page.props.style.opacity).toBeUndefined();
});

it('yields vertical intent before activating a horizontal card swipe', () => {
  render('a');
  expect(mockGesture.activeOffsetX).toHaveBeenCalledWith([-20, 20]);
  expect(mockGesture.failOffsetY).toHaveBeenCalledWith([-12, 12]);
});

it('does not capture horizontal gestures for a single-card feed stack', () => {
  QuoteStackEntry({ stack: { ...stack, quotes: [stack.quotes[0]] }, screenHeight: 700,
    authorName: 'Friend', authorAvatarUrl: null, isActive: true,
    activeQuoteId: 'a', onSelectQuote: select, presentation: 'home' });
  expect(mockGesture.enabled).toHaveBeenCalledWith(false);
});
