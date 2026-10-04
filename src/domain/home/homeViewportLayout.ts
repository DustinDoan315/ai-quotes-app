export type HomeViewportLayoutInput = {
  presentation?: "camera" | "feed" | "draft";
  width: number;
  height: number;
  topInset: number;
  bottomInset: number;
  headerHeight: number;
  footerHeight: number;
};
export function getHomeViewportLayout(input: HomeViewportLayoutInput) {
  const clean = (value: number) => Number.isFinite(value) ? Math.max(0, value) : 0;
  const availableTop = clean(input.topInset) + clean(input.headerHeight) + 12;
  const contentBottom = clean(input.height) - clean(input.bottomInset) - 12 - clean(input.footerHeight) - 12;
  const availableHeight = Math.max(0, contentBottom - availableTop);
  const edgeWidth = Math.min(600, Math.max(0, clean(input.width) - 16));
  if (input.presentation === 'draft') {
    return {
      contentTop: availableTop,
      contentHeight: availableHeight,
      cardWidth: edgeWidth,
    };
  }
  const cardWidth = Math.min(edgeWidth, availableHeight);
  // Position within the usable area; the camera sits slightly above its center.
  const freeSpace = Math.max(0, contentBottom - availableTop - cardWidth);
  const preferredTop = availableTop + freeSpace * (input.presentation === 'feed' ? 0.5 : 0.35);
  const contentTop = Math.max(availableTop, Math.min(preferredTop, contentBottom - cardWidth));
  return { contentTop, contentHeight: Math.max(0, contentBottom - contentTop), cardWidth };
}
