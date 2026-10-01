import { QUOTE_DISPLAY_ASPECT } from "@/constants/quoteImageSize";

/**
 * Chrome that must fit above/below the card on the tightest surface (Home).
 * It covers the camera action bar, the Home header, and the camera section
 * controls. The camera's zoom/flip controls are overlaid on the preview, so
 * they do not consume this budget.
 *
 * This is the single tuning knob for the shared frame: raise it if the card
 * clips on a device, lower it if the card looks too small.
 */
export const QUOTE_CARD_RESERVED_HEIGHT = 142;

export function getFeedCardWidth(windowWidth: number) {
  return Math.max(0, windowWidth);
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
