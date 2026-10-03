import { useHomeFeedState } from '@/features/home/useHomeFeedState';
import { sendUserPhotoReaction } from '@/services/media/userPhotoReactions';
jest.mock('react', () => ({ useState: (value: unknown) => [value, jest.fn()], useRef: (value: unknown) => ({ current: value }), useEffect: jest.fn() }));
jest.mock('@/services/media/userPhotoReactions', () => ({ PHOTO_REACTION_EMOJIS: { love: '❤️' }, sendUserPhotoReaction: jest.fn().mockResolvedValue(true) }));
beforeEach(() => { jest.clearAllMocks(); jest.useFakeTimers(); });
afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });
it('secondary emoji actions use committed card even when viewability sees a neighbor', async () => {
  const active = { id: 'second', userId: 'friend', visibility: 'friends' as const };
  const hook = useHomeFeedState({ userId: 'viewer', activeQuote: active, quoteStacks: [{ quotes: [{ ...active, id: 'first' }] }, { quotes: [{ ...active, id: 'neighbor' }] }] });
  hook.onViewableItemsChanged({ viewableItems: [{ index: 1 }] });
  await hook.handleReact('love');
  expect(sendUserPhotoReaction).toHaveBeenCalledWith({ photoId: 'second', userId: 'viewer', type: 'love' });
});
it('capture with no committed card cannot send a reaction', async () => {
  const hook = useHomeFeedState({ userId: 'viewer', activeQuote: null, quoteStacks: [] });
  await hook.handleReact('love'); expect(sendUserPhotoReaction).not.toHaveBeenCalled();
});
