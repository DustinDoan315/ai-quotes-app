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
  const contentTop = clean(input.topInset) + clean(input.headerHeight) + 12;
  const contentBottom = clean(input.height) - clean(input.bottomInset) - 12 - clean(input.footerHeight) - 12;
  const contentHeight = Math.max(0, contentBottom - contentTop);
  return { contentTop, contentHeight, cardWidth: Math.max(0, Math.min(clean(input.width) - 40, contentHeight)) };
}
