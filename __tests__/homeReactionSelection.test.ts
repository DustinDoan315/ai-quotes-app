import { useHomeReactions } from '@/features/home/useHomeReactions';
import { sendUserPhotoReaction } from '@/services/media/userPhotoReactions';
jest.mock('react', () => ({ useState: (value: unknown) => [value, jest.fn()], useRef: (value: unknown) => ({ current: value }), useEffect: jest.fn() }));
jest.mock('@/services/media/userPhotoReactions', () => ({ PHOTO_REACTION_EMOJIS: { love: '❤️' }, getPhotoReactionEmoji: (type: string) => type.startsWith('emoji:') ? type.slice(6) : '❤️', sendUserPhotoReaction: jest.fn().mockResolvedValue(true) }));
beforeEach(() => { jest.clearAllMocks(); jest.useFakeTimers(); });
afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });
it('secondary emoji actions use the committed card', async () => {
  const active = { id: 'second', userId: 'friend', visibility: 'friends' as const };
  const hook = useHomeReactions({ userId: 'viewer', activeQuote: active });
  await hook.handleReact('love');
  expect(sendUserPhotoReaction).toHaveBeenCalledWith({ photoId: 'second', userId: 'viewer', type: 'love' });
});
it('capture with no committed card cannot send a reaction', async () => {
  const hook = useHomeReactions({ userId: 'viewer', activeQuote: null });
  await hook.handleReact('love'); expect(sendUserPhotoReaction).not.toHaveBeenCalled();
});

it('development preview plays locally without a friend or network request', () => {
  (globalThis as any).__DEV__ = true;
  const hook = useHomeReactions({ userId: null, activeQuote: null });
  hook.previewReaction('love');
  expect(jest.getTimerCount()).toBe(1);
  expect(sendUserPhotoReaction).not.toHaveBeenCalled();
});
it('release builds cannot run reaction previews', () => {
  (globalThis as any).__DEV__ = false;
  const hook = useHomeReactions({ userId: null, activeQuote: null });
  hook.previewReaction('love');
  expect(jest.getTimerCount()).toBe(0);
  expect(sendUserPhotoReaction).not.toHaveBeenCalled();
});
