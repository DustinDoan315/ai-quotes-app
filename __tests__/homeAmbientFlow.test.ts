import { HomeCaptureFlow } from '@/features/home/HomeCaptureFlow';
import { HomeFeedFlow } from '@/features/home/HomeFeedFlow';
import { FlatList, Pressable } from 'react-native';
import { QuoteStackEntry } from '@/features/quotes/quoteStack/QuoteStackEntry';
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('@/hooks/useReducedMotionPreference', () => ({ useReducedMotionPreference: () => true }));
jest.mock('@/features/quotes/quoteStack/QuoteStackEntry', () => ({ QuoteStackEntry: 'Stack' }));
jest.mock('@/features/home/HomeCameraSection', () => ({ HomeCameraSection: 'Camera' }));
jest.mock('moti', () => ({ MotiView: 'Motion' }));
function feed(overrides: Record<string, unknown> = {}) {
  return HomeFeedFlow({
    listRef: { current: null }, quoteStacks: [], isCaptureFlowActive: false, flatListExtraData: '', snapOffsets: [0,844], getItemLayout: undefined,
    isFeedRefreshing: false, refreshFeed: async () => {},
    header: null as any, viewportHeight: 844, authorName: 'Viewer', authorAvatarUrl: null, currentFeedIndex: 0, isOnFeed: true,
    frameWidth: 350, contentTop: 115, contentHeight: 483, viewerUserId: 'viewer', viewerGuestId: null, activeQuoteId: 'second', interactionLocked: false,
    horizontalLocked: false, onBeginDrag: jest.fn(), onCommitPage: jest.fn(), onSelectQuote: jest.fn(), onRegisterShare: jest.fn(), ...overrides,
  });
}
it('allows vertical drag to finish while disabling horizontal gestures', () => {
  const tree = feed({ horizontalLocked: true });
  expect(tree.type).toBe(FlatList);
  expect(tree.props.scrollEnabled).toBe(true);
  const item = tree.props.renderItem({ item: { id: 'friend', quotes: [{ id: 'second' }] }, index: 0 });
  expect(item.props.children.type).toBe(QuoteStackEntry);
  expect(item.props.children.props.interactionLocked).toBe(true);
});
it('locks paging and refresh while exporting; commits the settled full-root page', () => {
  expect(feed({ interactionLocked: true }).props.scrollEnabled).toBe(false);
  const commit = jest.fn(); const drag = jest.fn();
  const tree = feed({ onCommitPage: commit, onBeginDrag: drag });
  tree.props.onScrollBeginDrag();
  tree.props.onScrollEndDrag({ nativeEvent: { contentOffset: { y: 300 } } });
  expect(commit).not.toHaveBeenCalled();
  tree.props.onMomentumScrollEnd({ nativeEvent: { contentOffset: { y: 1688 } } });
  expect(commit).toHaveBeenCalledWith(2);
  expect(drag).toHaveBeenCalledTimes(1);
});

it('makes Retry reachable inside the capture page when the feed has no stacks', () => {
  const retry = jest.fn();
  const tree = HomeCaptureFlow({ viewportHeight: 844, contentTop: 115, contentHeight: 483, feedError: true, onRetryFeed: retry, cameraSectionProps: {} as any });
  const banner = tree.props.children.props.children[0];
  const button = banner.props.children.find((child: any) => child.type === Pressable);
  expect(button).toBeDefined(); button.props.onPress(); expect(retry).toHaveBeenCalledTimes(1);
});
