import {
  clampQuotePosition,
  DEFAULT_QUOTE_POSITION,
  parseQuotePosition,
} from "@/features/quotes/quotePosition";

describe("quote position", () => {
  it("preserves rotation and permits captions to shrink to 55 percent", () => {
    expect(parseQuotePosition(0.5, 0.5, 0.1, Math.PI / 2)).toEqual({
      x: 0.5, y: 0.5, scale: 0.55, rotation: Math.PI / 2,
    });
    expect(parseQuotePosition(0.5, 0.5, 3, Infinity)).toEqual({
      x: 0.5, y: 0.5, scale: 1,
    });
  });

  it("retains smaller saved transforms when rehydrating database values", () => {
    const moved = clampQuotePosition(
      { x: 0.42, y: 0.87, scale: 0.55, rotation: Math.PI / 6 },
      { width: 390, height: 390 },
      { width: 260, height: 70 },
    );
    const savedRow = JSON.parse(JSON.stringify({
      quote_position_x: moved.x,
      quote_position_y: moved.y,
      quote_scale: moved.scale,
      quote_rotation: moved.rotation,
    }));
    expect(parseQuotePosition(
      savedRow.quote_position_x, savedRow.quote_position_y,
      savedRow.quote_scale, savedRow.quote_rotation,
    )).toEqual(moved);
    expect(moved.scale).toBe(0.55);
  });

  it("keeps existing saved positions instead of moving them to the new default", () => {
    expect(parseQuotePosition(0.4, 0.84, 0.9)).toEqual({
      x: 0.4, y: 0.84, scale: 0.9,
    });
    expect(DEFAULT_QUOTE_POSITION).toEqual({ x: 0.5, y: 0.87 });
    expect(parseQuotePosition(null, Number.NaN)).toEqual(DEFAULT_QUOTE_POSITION);
    expect(parseQuotePosition(-0.1, 1.1)).toEqual(DEFAULT_QUOTE_POSITION);
  });

  it("clamps the quote box to all four edges", () => {
    expect(clampQuotePosition(
      { x: 0, y: 1 }, { width: 200, height: 400 },
      { width: 40, height: 80 },
    )).toEqual({ x: 0.1, y: 0.9 });
    expect(clampQuotePosition(
      { x: 1, y: 0 }, { width: 200, height: 400 },
      { width: 40, height: 80 },
    )).toEqual({ x: 0.9, y: 0.1 });
  });

  it.each([0, Math.PI / 6, Math.PI / 2, Math.PI])(
    "keeps the reduced caption inside the frame at rotation %s", (rotation) => {
      const frame = { width: 200, height: 400 };
      const quote = { width: 160, height: 80 };
      const bounded = clampQuotePosition(
        { x: 0, y: 1, scale: 0.55, rotation }, frame, quote,
      );
      const halfWidth = 0.55 * (
        Math.abs(Math.cos(rotation)) * quote.width +
        Math.abs(Math.sin(rotation)) * quote.height
      ) / 2;
      const halfHeight = 0.55 * (
        Math.abs(Math.sin(rotation)) * quote.width +
        Math.abs(Math.cos(rotation)) * quote.height
      ) / 2;
      expect(bounded.x * frame.width).toBeCloseTo(halfWidth);
      expect(bounded.y * frame.height).toBeCloseTo(frame.height - halfHeight);
      expect(bounded.scale).toBe(0.55);
      expect(bounded.rotation).toBe(rotation);
    },
  );
});
