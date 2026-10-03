import { resizeQuoteScale } from '@/features/quotes/quotePosition';
const box = { width: 100, height: 50 };
it('grows and shrinks along the fixed-center diagonal handle', () => {
  expect(resizeQuoteScale(0.7, 5, 2.5, box)).toBeCloseTo(0.8);
  expect(resizeQuoteScale(0.8, -5, -2.5, box)).toBeCloseTo(0.7);
});
it('ignores motion perpendicular to the handle diagonal', () => {
  expect(resizeQuoteScale(0.7, -5, 10, box)).toBeCloseTo(0.7);
});
it('projects motion through the rotated handle', () => {
  expect(resizeQuoteScale(0.7, -2.5, 5, box, Math.PI / 2)).toBeCloseTo(0.8);
  expect(resizeQuoteScale(0.8, 2.5, -5, box, Math.PI / 2)).toBeCloseTo(0.7);
});
it('clamps both ends of the allowed scale range', () => {
  expect(resizeQuoteScale(0.8, 1000, 1000, box)).toBe(1);
  expect(resizeQuoteScale(0.8, -1000, -1000, box)).toBe(0.55);
});
it.each([
  [NaN, 1, 1, box, 0, 1],
  [0.7, NaN, 1, box, 0, 0.7],
  [0.7, 1, Infinity, box, 0, 0.7],
  [0.7, 1, 1, { width: 0, height: 0 }, 0, 0.7],
  [0.7, 1, 1, { width: -10, height: 50 }, 0, 0.7],
  [0.7, 1, 1, box, NaN, 0.7],
  [2, 1, 1, { width: Infinity, height: 1 }, 0, 1],
])('returns a bounded start for invalid inputs %#', (start, dx, dy, size, rotation, expected) => {
  expect(resizeQuoteScale(start as number, dx as number, dy as number, size as typeof box, rotation as number)).toBe(expected);
});
