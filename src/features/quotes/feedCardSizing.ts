import { QUOTE_DISPLAY_ASPECT } from "@/constants/quoteImageSize";

const PHONE_CARD_HORIZONTAL_MARGIN = 24;
const PHONE_CARD_MAX_WIDTH = 448;
const TABLET_BREAKPOINT = 768;
const TABLET_CARD_HORIZONTAL_MARGIN = 96;
const TABLET_CARD_MAX_WIDTH = 620;
const FEED_CARD_MIN_WIDTH = 280;

/**
 * Chrome that must fit above/below the card on the tightest surface (Home).
 * It covers the camera action bar, the Home header, and the camera section
 * padding. The camera's zoom/flip controls are overlaid on the preview, so
 * they do not consume this budget.
 *
 * This is the single tuning knob for the shared frame: raise it if the card
 * clips on a device, lower it if the card looks too small.
 */
export const QUOTE_CARD_RESERVED_HEIGHT = 190;

export function getFeedCardWidth(windowWidth: number) {
  const isTablet = windowWidth >= TABLET_BREAKPOINT;
  const horizontalMargin = isTablet
    ? TABLET_CARD_HORIZONTAL_MARGIN
    : PHONE_CARD_HORIZONTAL_MARGIN;
  const maxWidth = isTablet ? TABLET_CARD_MAX_WIDTH : PHONE_CARD_MAX_WIDTH;
  const ideal = windowWidth - horizontalMargin;
  const capped = Math.min(maxWidth, ideal);
  return Math.max(FEED_CARD_MIN_WIDTH, capped);
}

/**
 * The one canonical moment-card frame. It is a pure function of the window
 * size and the safe-area insets, so every surface that renders a card gets
 * exactly the same width and height on the same device.
 */
export function getQuoteCardFrame(
  windowWidth: number,
  windowHeight: number,
  insetTop = 0,
  insetBottom = 0,
) {
  const maxWidth = getFeedCardWidth(windowWidth);
  const availableHeight = Math.max(
    0,
    windowHeight -
      Math.max(0, insetTop) -
      Math.max(0, insetBottom) -
      QUOTE_CARD_RESERVED_HEIGHT,
  );
  const width = Math.min(maxWidth, availableHeight * QUOTE_DISPLAY_ASPECT);

  return { width, height: width / QUOTE_DISPLAY_ASPECT };
}
