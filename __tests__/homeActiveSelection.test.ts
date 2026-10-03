/* eslint-disable import/first */
const mockStates: unknown[] = [];
const mockRefs: { current: unknown }[] = [];
let mockStateCursor = 0;
let mockRefCursor = 0;
const mockEffects: (() => void)[] = [];
jest.mock('react', () => ({
  useState: (initial: unknown) => {
    const index = mockStateCursor++;
    if (!(index in mockStates)) mockStates[index] = initial;
    return [mockStates[index], (value: unknown) => {
      mockStates[index] = typeof value === 'function' ? value(mockStates[index]) : value;
    }];
  },
  useRef: (initial: unknown) => mockRefs[mockRefCursor++] ?? (mockRefs[mockRefCursor - 1] = { current: initial }),
  useEffect: (effect: () => void) => mockEffects.push(effect),
  useCallback: (callback: unknown) => callback,
}));
import { useHomeAmbientController } from '@/features/home/useHomeAmbientController';
import { reconcileHomeActiveSelection } from '@/domain/home/activeHomeMoment';
import type { QuoteStack } from '@/features/quotes/quoteStack/types';
const stack = (id: string, quotes: string[]) => ({ id, quotes: quotes.map(id => ({ id })) }) as QuoteStack;
it('capture remains capture through refresh', () => expect(reconcileHomeActiveSelection([stack('a', ['q'])], null)).toBeNull());
it('preserves IDs through insertion and horizontal reorder', () => expect(reconcileHomeActiveSelection([stack('new', ['new']), stack('a', ['two', 'one'])], { stackId: 'a', quoteId: 'two' })).toEqual({ stackId: 'a', quoteId: 'two' }));
it('removed card selects first remaining card', () => expect(reconcileHomeActiveSelection([stack('a', ['one'])], { stackId: 'a', quoteId: 'two' })).toEqual({ stackId: 'a', quoteId: 'one' }));
it('removed stack selects nearest available stack', () => expect(reconcileHomeActiveSelection([stack('a', ['one']), stack('b', ['two'])], { stackId: 'removed', quoteId: 'gone' }, 2)).toEqual({ stackId: 'b', quoteId: 'two' }));
it('empty refresh returns capture', () => expect(reconcileHomeActiveSelection([], { stackId: 'gone', quoteId: 'gone' })).toBeNull());

function useRenderController(stacks: QuoteStack[], identity = 'me', locked = false) {
  mockStateCursor = 0;
  mockRefCursor = 0;
  const output = useHomeAmbientController(stacks, identity, locked);
  mockEffects.splice(0).forEach(effect => effect());
  return output;
}
beforeEach(() => { mockStates.length = 0; mockRefs.length = 0; mockEffects.length = 0; });
it('keeps the committed moment while dragging and restores a canceled page', () => {
  const stacks = [stack('a', ['one', 'two']), stack('b', ['three'])];
  let controller = useRenderController(stacks);
  controller.commitPage(1);
  controller = useRenderController(stacks);
  controller.selectQuote('two');
  controller = useRenderController(stacks);
  controller.beginDrag();
  controller = useRenderController(stacks);
  expect(controller.isDragging).toBe(true);
  expect(controller.active?.card.id).toBe('two');
  controller.selectQuote('one');
  controller.commitPage(1);
  controller = useRenderController(stacks);
  expect(controller.isDragging).toBe(false);
  expect(controller.active?.card.id).toBe('two');
});
it('holds feed replacement and paging during an export lock', () => {
  const original = [stack('a', ['one'])];
  useRenderController(original).commitPage(1);
  const controller = useRenderController([stack('b', ['two'])], 'me', true);
  controller.commitPage(0);
  expect(useRenderController([stack('b', ['two'])], 'me', true).active?.card.id).toBe('one');
});
it('clears committed selection when account identity changes', () => {
  const stacks = [stack('a', ['one'])];
  useRenderController(stacks).commitPage(1);
  expect(useRenderController(stacks).active?.card.id).toBe('one');
  expect(useRenderController(stacks, 'another').active).toBeNull();
});
