const FEED_CARD_HORIZONTAL_MARGIN = 32;
const FEED_CARD_MAX_WIDTH = 448;
const FEED_CARD_MIN_WIDTH = 280;

export function getFeedCardWidth(windowWidth: number) {
  const ideal = windowWidth - FEED_CARD_HORIZONTAL_MARGIN;
  const capped = Math.min(FEED_CARD_MAX_WIDTH, ideal);
  return Math.max(FEED_CARD_MIN_WIDTH, capped);
}
