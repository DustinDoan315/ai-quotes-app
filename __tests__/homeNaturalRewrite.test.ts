/* eslint-disable import/first */
const mockSlots: unknown[] = [];
let mockCursor = 0;
const mockEffects: { effect: () => void | (() => void); deps: unknown[]; index: number }[] = [];
const mockCleanup: (() => void)[] = [];
const mockPreview = jest.fn();
const mockApply = jest.fn();
jest.mock('react', () => ({
  useState: (initial: unknown) => {
    const index = mockCursor++;
    if (!(index in mockSlots)) mockSlots[index] = initial;
    return [mockSlots[index], (value: unknown) => { mockSlots[index] = value; }];
  },
  useRef: (initial: unknown) => {
    const index = mockCursor++;
    if (!(index in mockSlots)) mockSlots[index] = { current: initial };
    return mockSlots[index];
  },
  useEffect: (effect: () => void | (() => void), deps: unknown[]) => {
    const index = mockCursor++;
    const previous = mockSlots[index] as unknown[] | undefined;
    if (!previous || deps.some((value, i) => value !== previous[i])) {
      mockSlots[index] = deps;
      mockEffects.push({ effect, deps, index });
    }
  },
}));
jest.mock('@/features/ai/useQuoteAIExtras', () => ({
  useRewriteQuote: () => ({ loading: false, previewRewrite: mockPreview, applyRewrittenQuote: mockApply }),
}));
jest.mock('@/i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));
import { useHomeAiReview } from '@/features/home/useHomeAiReview';
function useRenderReview(text: string | null) {
  mockCursor = 0;
  const result = useHomeAiReview(text);
  mockEffects.splice(0).forEach(({ effect, index }) => {
    mockCleanup[index]?.();
    const cleanup = effect();
    mockCleanup[index] = typeof cleanup === 'function' ? cleanup : () => {};
  });
  return result;
}
beforeEach(() => {
  mockSlots.length = 0; mockEffects.length = 0; mockCleanup.length = 0;
  jest.clearAllMocks(); mockPreview.mockResolvedValue('A softer moment.');
});
it('previews natural text and applies only after explicit approval', async () => {
  await useRenderReview('Original moment.').handleRewriteQuote();
  expect(mockPreview).toHaveBeenCalledWith('natural');
  expect(mockApply).not.toHaveBeenCalled();
  const review = useRenderReview('Original moment.');
  expect(review.rewriteReviewText).toBe('A softer moment.');
  review.handleApproveRewrite('Edited softer moment.');
  expect(mockApply).toHaveBeenCalledWith('Edited softer moment.');
  expect(useRenderReview('Original moment.').rewriteReviewText).toBeNull();
});
it('locks overlapping taps synchronously', async () => {
  let finish!: (text: string) => void;
  mockPreview.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const hook = useRenderReview('Original');
  const pending = hook.handleRewriteQuote();
  await hook.handleRewriteQuote();
  expect(mockPreview).toHaveBeenCalledTimes(1);
  expect(useRenderReview('Original').pendingAiTool).toBe('rewrite');
  finish('New'); await pending;
  expect(useRenderReview('Original').pendingAiTool).toBeNull();
});
it('rejects stale response when original text changes even if it returns to the same text', async () => {
  let finish!: (text: string) => void;
  mockPreview.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const pending = useRenderReview('Original').handleRewriteQuote();
  useRenderReview('Replacement'); useRenderReview('Original');
  finish('Stale'); await pending;
  const current = useRenderReview('Original');
  expect(current.rewriteReviewText).toBeNull();
  current.handleApproveRewrite('Stale'); expect(mockApply).not.toHaveBeenCalled();
});
it('clears an existing review and prevents stale approval on input change', async () => {
  await useRenderReview('Original').handleRewriteQuote();
  const review = useRenderReview('Original');
  useRenderReview('Replacement');
  review.handleApproveRewrite('Old review');
  expect(mockApply).not.toHaveBeenCalled();
  expect(useRenderReview('Replacement').rewriteReviewText).toBeNull();
});
it('cancel keeps the original quote and invalidates a pending request', async () => {
  let finish!: (text: string) => void;
  mockPreview.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const hook = useRenderReview('Original');
  const pending = hook.handleRewriteQuote(); hook.handleCancelRewrite();
  finish('Canceled'); await pending;
  expect(useRenderReview('Original').rewriteReviewText).toBeNull();
  expect(mockApply).not.toHaveBeenCalled();
});
it('releases loading on an error and permits retry', async () => {
  mockPreview.mockRejectedValueOnce(new Error('offline'));
  await useRenderReview('Original').handleRewriteQuote();
  expect(useRenderReview('Original').isAiToolLoading).toBe(false);
  await useRenderReview('Original').handleRewriteQuote();
  expect(mockPreview).toHaveBeenCalledTimes(2);
});
it('never accepts a result after unmount', async () => {
  let finish!: (text: string) => void;
  mockPreview.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const pending = useRenderReview('Original').handleRewriteQuote();
  mockCleanup.forEach(cleanup => cleanup?.());
  finish('Late'); await pending;
  expect(mockApply).not.toHaveBeenCalled();
});
it('does not request a rewrite without a quote', async () => {
  await useRenderReview(null).handleRewriteQuote();
  expect(mockPreview).not.toHaveBeenCalled();
});
