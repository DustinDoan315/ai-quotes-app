import { getHomeViewportLayout } from '@/domain/home/homeViewportLayout';
it('counts measured regions and safe areas exactly once', () => expect(getHomeViewportLayout({ width: 390, height: 844, topInset: 47, bottomInset: 34, headerHeight: 56, footerHeight: 188 })).toEqual({ contentTop: 153.15, contentHeight: 444.85, cardWidth: 374 }));
it('keeps compact cards near the screen edges', () => { const layout = getHomeViewportLayout({ width: 320, height: 568, topInset: 20, bottomInset: 0, headerHeight: 90, footerHeight: 240 }); expect(layout.cardWidth).toBe(304); expect(layout.contentTop).toBeGreaterThanOrEqual(122); });
it('does not return negative geometry', () => expect(getHomeViewportLayout({ width: -1, height: 10, topInset: 100, bottomInset: 10, headerHeight: 200, footerHeight: 200 }).cardWidth).toBe(0));

it('raises the camera within the usable area and leaves more breathing room below', () => {
  const layout = getHomeViewportLayout({ width: 390, height: 844, topInset: 47, bottomInset: 34, headerHeight: 56, footerHeight: 140 });
  expect(layout.contentTop).toBeCloseTo(115 + (646 - 115 - 374) * 0.35);
  expect(layout.contentTop - 115).toBeLessThan(646 - layout.contentTop - layout.cardWidth);
  expect(layout.cardWidth).toBe(374);
});

it('balances feed spacing while the camera sits slightly higher', () => {
  const input = { width: 390, height: 844, topInset: 47, bottomInset: 34, headerHeight: 56, footerHeight: 188 };
  const feed = getHomeViewportLayout({ ...input, presentation: 'feed' });
  expect(feed.contentTop - 115).toBe(598 - feed.contentTop - feed.cardWidth);
  expect(feed.contentTop).toBeGreaterThan(getHomeViewportLayout(input).contentTop);
});
