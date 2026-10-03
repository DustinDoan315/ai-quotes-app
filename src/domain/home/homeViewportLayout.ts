export type HomeViewportLayoutInput = {
  presentation?: "camera" | "feed";
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
  const cardWidth = Math.max(0, clean(input.width) - 16);
  // Aim at the device midpoint, constrained by the measured header and controls.
  const preferredTop = input.presentation === 'feed'
    ? availableTop + Math.max(0, contentBottom - availableTop - cardWidth) / 2
    : (clean(input.height) - cardWidth) / 2;
  const contentTop = Math.max(availableTop, Math.min(preferredTop, contentBottom - cardWidth));
  return { contentTop, contentHeight: Math.max(0, contentBottom - contentTop), cardWidth };
}
