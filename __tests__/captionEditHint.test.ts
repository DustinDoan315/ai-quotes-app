/* eslint-disable import/first */
const mockSlots: unknown[] = [];
let mockCursor = 0;
const mockEffects: { effect: () => void | (() => void); index: number }[] = [];
const mockCleanup: (() => void)[] = [];
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
  useCallback: (callback: unknown) => callback,
  useEffect: (effect: () => void | (() => void), deps: unknown[]) => {
    const index = mockCursor++;
    const previous = mockSlots[index] as unknown[] | undefined;
    if (!previous || deps.some((value, i) => value !== previous[i])) {
      mockSlots[index] = deps;
      mockEffects.push({ effect, index });
    }
  },
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true, default: { getItem: jest.fn(), setItem: jest.fn() },
}));
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCaptionEditHint } from '@/hooks/useCaptionEditHint';
const getItem = AsyncStorage.getItem as jest.Mock;
const setItem = AsyncStorage.setItem as jest.Mock;
function useRenderHint(identity = 'photo-a', eligible = true) {
  mockCursor = 0;
  const result = useCaptionEditHint(eligible, identity);
  mockEffects.splice(0).forEach(({ effect, index }) => {
    mockCleanup[index]?.();
    const cleanup = effect();
    mockCleanup[index] = typeof cleanup === 'function' ? cleanup : () => {};
  });
  return result;
}
beforeEach(() => {
  mockSlots.length = 0; mockEffects.length = 0; mockCleanup.length = 0;
  jest.clearAllMocks(); getItem.mockResolvedValue(null); setItem.mockResolvedValue(undefined);
});
it('keeps discovery visible until interaction and only then persists dismissal', async () => {
  useRenderHint(); await Promise.resolve();
  expect(useRenderHint().controlsVisible).toBe(true);
  expect(setItem).not.toHaveBeenCalled();
  useRenderHint().activateControls();
  expect(useRenderHint().controlsVisible).toBe(false);
  expect(setItem).toHaveBeenCalledWith('inkly.caption-edit-hint-seen.v2', '1');
});
it('does not show remembered guidance but permits explicit replay', async () => {
  getItem.mockResolvedValue('1'); useRenderHint(); await Promise.resolve();
  expect(useRenderHint().controlsVisible).toBe(false);
  useRenderHint().showHint();
  expect(useRenderHint().controlsVisible).toBe(true);
});
it('first touch wins over a pending storage read', async () => {
  let resolve!: (value: null) => void;
  getItem.mockReturnValue(new Promise(done => { resolve = done; }));
  useRenderHint().dismissControls(); resolve(null); await Promise.resolve();
  expect(useRenderHint().controlsVisible).toBe(false);
});
it('rejects storage results for a replaced photo', async () => {
  let resolve!: (value: null) => void;
  getItem.mockReturnValueOnce(new Promise(done => { resolve = done; })).mockResolvedValue('1');
  useRenderHint('photo-a'); useRenderHint('photo-b'); resolve(null); await Promise.resolve();
  expect(useRenderHint('photo-b').controlsVisible).toBe(false);
});
