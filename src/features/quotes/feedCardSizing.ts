const PHONE_CARD_HORIZONTAL_MARGIN = 32;
const PHONE_CARD_MAX_WIDTH = 448;
const TABLET_BREAKPOINT = 768;
const TABLET_CARD_HORIZONTAL_MARGIN = 96;
const TABLET_CARD_MAX_WIDTH = 620;
const FEED_CARD_MIN_WIDTH = 280;

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
