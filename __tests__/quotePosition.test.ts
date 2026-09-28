import {
  clampQuotePosition,
  DEFAULT_QUOTE_POSITION,
  parseQuotePosition,
} from "@/features/quotes/quotePosition";

describe("quote position", () => {
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
