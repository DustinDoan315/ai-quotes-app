import { QUOTE_DISPLAY_ASPECT } from "@/constants/quoteImageSize";
import {
  QUOTE_CARD_RESERVED_HEIGHT,
  getFeedCardWidth,
  getQuoteCardFrame,
} from "@/features/quotes/feedCardSizing";

const PHONE = { width: 390, height: 844, insetTop: 47, insetBottom: 34 };

describe("getQuoteCardFrame", () => {
  it("is deterministic, so every surface computes the same frame", () => {
    // The camera, feed, memories, skeleton, and onboarding all call this pure
    // function with the same device values, so identical inputs must produce
    // an identical frame.
    const camera = getQuoteCardFrame(PHONE.width, PHONE.height, PHONE.insetTop, PHONE.insetBottom);
    const feed = getQuoteCardFrame(PHONE.width, PHONE.height, PHONE.insetTop, PHONE.insetBottom);

    expect(camera).toEqual(feed);
  });

  it("never exceeds the feed width cap", () => {
    for (const width of [320, 375, 390, 430, 500, 768, 1032]) {
      const frame = getQuoteCardFrame(width, 844, 0, 0);

      expect(frame.width).toBeLessThanOrEqual(getFeedCardWidth(width));
    }
  });

  it("never exceeds the available height", () => {
    const frame = getQuoteCardFrame(PHONE.width, PHONE.height, PHONE.insetTop, PHONE.insetBottom);
    const availableHeight =
      PHONE.height - PHONE.insetTop - PHONE.insetBottom - QUOTE_CARD_RESERVED_HEIGHT;

    expect(frame.height).toBeLessThanOrEqual(availableHeight + 1e-6);
  });

  it("uses the shared display aspect", () => {
    const frame = getQuoteCardFrame(375, 667, 20, 0);

    expect(frame.width / frame.height).toBeCloseTo(QUOTE_DISPLAY_ASPECT, 6);
    expect(frame.width).toBe(frame.height);
    expect(QUOTE_DISPLAY_ASPECT).toBe(1);
  });

  it("collapses instead of returning a negative frame", () => {
    const frame = getQuoteCardFrame(390, 100, 20, 20);

    expect(frame.width).toBe(0);
    expect(frame.height).toBe(0);
  });

  it("ignores negative insets", () => {
    expect(getQuoteCardFrame(390, 844, -10, -10)).toEqual(
      getQuoteCardFrame(390, 844, 0, 0),
    );
  });
});
