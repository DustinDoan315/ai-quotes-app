import { Animated } from 'react-native';
import { HomeAmbientBackground } from '@/features/home/HomeAmbientBackground';
import type { HomeBackgroundPalette } from '@/types/homeBackground';

const mockHooks: any[] = [];
let mockCursor = 0;
let mockDirty = false;
let mockEffects: (() => void)[] = [];
let mockLayouts: (() => void)[] = [];
const mockAnimations: any[] = [];
jest.mock('react', () => {
  const actual = jest.requireActual('react');
  const effect = (queue: (() => void)[], fn: () => void, deps: unknown[]) => {
    const index = mockCursor++;
    if (!mockHooks[index] || deps.some((value, i) => value !== mockHooks[index][i])) {
      mockHooks[index] = deps;
      queue.push(fn);
    }
  };
  return { ...actual,
    useRef: (initial: unknown) => {
      const index = mockCursor++;
      return mockHooks[index] ?? (mockHooks[index] = { current: initial });
    },
    useState: (initial: () => unknown) => {
      const index = mockCursor++;
      if (!(index in mockHooks)) mockHooks[index] = initial();
      return [mockHooks[index], (update: any) => {
        const next = update(mockHooks[index]);
        mockDirty ||= next !== mockHooks[index];
        mockHooks[index] = next;
      }];
    },
    useEffect: (fn: () => void, deps: unknown[]) => effect(mockEffects, fn, deps),
    useLayoutEffect: (fn: () => void, deps: unknown[]) => effect(mockLayouts, fn, deps),
  };
});
jest.mock('react-native-svg', () => ({ __esModule: true, default: 'Svg', Defs: 'Defs', RadialGradient: 'Gradient', Rect: 'Rect', Stop: 'Stop' }));
const palette = (vibeKey: HomeBackgroundPalette['vibeKey']): HomeBackgroundPalette => ({ vibeKey, rarity: 'common', colors: ['#111111', '#222222'], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } });
const a = palette('dawn'), b = palette('forest'), c = palette('mist'), d = palette('ember');
function render(color: HomeBackgroundPalette, reduceMotion = false) {
  let tree: any;
  do {
    mockDirty = false; mockCursor = 0;
    tree = HomeAmbientBackground({ palette: color, reduceMotion });
    const layouts = mockLayouts; mockLayouts = []; layouts.forEach(fn => fn());
    const effects = mockEffects; mockEffects = []; effects.forEach(fn => fn());
  } while (mockDirty);
  return tree;
}
beforeEach(() => { mockHooks.length = 0; mockAnimations.length = 0; mockLayouts = []; mockEffects = []; mockDirty = false;
  jest.spyOn(Animated.Value.prototype, 'setValue');
  jest.spyOn(Animated, 'timing').mockImplementation((value, config) => {
    const animation: any = { value, config, start: (callback: any) => { animation.callback = callback; }, stop: jest.fn(), reset: jest.fn() };
    mockAnimations.push(animation); return animation;
  });
});
it('finishes the visible blend and coalesces rapid requests without resetting its opacity', () => {
  render(a); render(b);
  const first = mockAnimations[0];
  first.value.setValue.mockClear();
  render(c); render(d);
  expect(first.stop).not.toHaveBeenCalled();
  expect(first.value.setValue).not.toHaveBeenCalled();
  expect(mockAnimations).toHaveLength(1);
  first.callback({ finished: true });
  const tree = render(d);
  expect(mockAnimations).toHaveLength(2);
  const colors = tree.props.children.map((slot: any) => slot.props.children.props.palette);
  expect(colors).toEqual([d, b]);
  expect(mockAnimations[1].config).toEqual(expect.objectContaining({ useNativeDriver: true }));
  mockAnimations[1].callback({ finished: true }); render(d);
  expect(mockAnimations).toHaveLength(2);
});
it('switches immediately and stops the in-flight blend when reduced motion is enabled', () => {
  render(a); render(b);
  const tree = render(c, true);
  expect(mockAnimations[0].stop).toHaveBeenCalled();
  expect(mockAnimations).toHaveLength(1);
  expect(tree.props.children.map((slot: any) => slot.props.children.props.palette)).toEqual([c, c]);
});
