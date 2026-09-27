import {
  getFeedCardWidth,
  getQuoteFrameSize,
} from "@/features/quotes/feedCardSizing";

describe("getFeedCardWidth", () => {
  it("keeps the phone card cap", () => {
    expect(getFeedCardWidth(430)).toBe(406);
    expect(getFeedCardWidth(500)).toBe(448);
  });

  it("uses a larger card on tablet displays", () => {
    expect(getFeedCardWidth(768)).toBe(620);
    expect(getFeedCardWidth(1032)).toBe(620);
  });
});

describe("getQuoteFrameSize", () => {
  it("usesTheLargerPhoneFrame", () => {
    expect(getQuoteFrameSize(390, 796)).toEqual({ width: 366, height: 610 });
  });

  it("clampsToShortViewportHeight", () => {
    const frame = getQuoteFrameSize(844, 342);

    expect(frame.height).toBeLessThanOrEqual(342);
    expect(frame.width).toBeCloseTo(205.2);
  });

  it("keepsTheTabletWidthCap", () => {
    expect(getQuoteFrameSize(1024, 1100).width).toBe(620);
  });
});
