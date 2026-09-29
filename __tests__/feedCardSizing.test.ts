import {
  getFeedCardWidth,
  getQuoteCardFrame,
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

describe("getQuoteCardFrame", () => {
  it("usesTheLargerPhoneFrame", () => {
    // iPhone 14: the 366 phone width cap wins over the height budget.
    const frame = getQuoteCardFrame(390, 844, 47, 34);

    expect(frame.width).toBe(366);
    expect(frame.height).toBeCloseTo(549, 5);
  });

  it("clampsToShortViewportHeight", () => {
    const frame = getQuoteCardFrame(375, 667, 20, 0);

    expect(frame.height).toBeCloseTo(457, 5);
    expect(frame.width).toBeCloseTo(304.67, 1);
  });

  it("keepsTheTabletWidthCap", () => {
    expect(getQuoteCardFrame(1024, 1366, 24, 20).width).toBe(620);
  });
});
