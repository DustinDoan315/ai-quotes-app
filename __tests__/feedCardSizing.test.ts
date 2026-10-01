import {
  getFeedCardWidth,
  getQuoteCardFrame,
} from "@/features/quotes/feedCardSizing";

describe("getFeedCardWidth", () => {
  it("uses the full phone width without gutters", () => {
    expect(getFeedCardWidth(430)).toBe(430);
    expect(getFeedCardWidth(500)).toBe(500);
  });

  it("uses a larger card on tablet displays", () => {
    expect(getFeedCardWidth(768)).toBe(768);
    expect(getFeedCardWidth(1032)).toBe(1032);
  });
});

describe("getQuoteCardFrame", () => {
  it("usesTheLargerPhoneFrame", () => {
    // Full-width square on iPhone 14.
    const frame = getQuoteCardFrame(390, 844, 47, 34);

    expect(frame).toEqual({ width: 390, height: 390 });
  });

  it("clampsToShortViewportHeight", () => {
    const frame = getQuoteCardFrame(375, 400, 20, 0);

    expect(frame).toEqual({ width: 238, height: 238 });
  });

  it("uses the full tablet width when height permits", () => {
    expect(getQuoteCardFrame(1024, 1366, 24, 20)).toEqual({ width: 1024, height: 1024 });
  });
});
