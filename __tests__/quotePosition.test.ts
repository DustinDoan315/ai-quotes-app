import {
  clampQuotePosition,
  DEFAULT_QUOTE_POSITION,
  parseQuotePosition,
} from "@/features/quotes/quotePosition";

describe("quote position", () => {
  it("preservesRotationAndBoundsTheReadableScale", () => {
    expect(parseQuotePosition(0.5, 0.5, 0.1, Math.PI / 2)).toEqual({ x: 0.5, y: 0.5, scale: 0.875, rotation: Math.PI / 2 });
    expect(parseQuotePosition(0.5, 0.5, 3, Infinity)).toEqual({ x: 0.5, y: 0.5, scale: 1 });
    const bounded = clampQuotePosition(
      { x: 0, y: 1, scale: 1, rotation: Math.PI / 2 },
      { width: 200, height: 400 }, { width: 40, height: 80 },
    );
    expect(bounded.x).toBeCloseTo(0.2);
    expect(bounded.y).toBeCloseTo(0.95);
    expect(bounded.rotation).toBe(Math.PI / 2);
  });
  it("usesLegacyPositionForInvalidCoordinates", () => {
    expect(parseQuotePosition(null, Number.NaN)).toEqual(DEFAULT_QUOTE_POSITION);
    expect(parseQuotePosition(-0.1, 1.1)).toEqual(DEFAULT_QUOTE_POSITION);
  });

  it("clampsTheQuoteBoxToAllFourEdges", () => {
    expect(
      clampQuotePosition(
        { x: 0, y: 1 },
        { width: 200, height: 400 },
        { width: 40, height: 80 },
      ),
    ).toEqual({ x: 0.1, y: 0.9 });
    expect(
      clampQuotePosition(
        { x: 1, y: 0 },
        { width: 200, height: 400 },
        { width: 40, height: 80 },
      ),
    ).toEqual({ x: 0.9, y: 0.1 });
  });
});
