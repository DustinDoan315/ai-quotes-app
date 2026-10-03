export type HomeViewportLayoutInput = {
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
  const contentHeight = Math.max(0, contentBottom - availableTop);
  const cardWidth = Math.max(0, Math.min(clean(input.width) - 24, contentHeight));
  // Aim at the device midpoint, constrained by the measured header and controls.
  const contentTop = Math.max(availableTop, Math.min((clean(input.height) - cardWidth) / 2, contentBottom - cardWidth));
  return { contentTop, contentHeight: Math.max(0, contentBottom - contentTop), cardWidth };
}
