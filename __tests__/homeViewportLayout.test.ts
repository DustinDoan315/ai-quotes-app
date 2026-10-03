import { getHomeViewportLayout } from '@/domain/home/homeViewportLayout';
it('counts measured regions and safe areas exactly once', () => expect(getHomeViewportLayout({ width: 390, height: 844, topInset: 47, bottomInset: 34, headerHeight: 56, footerHeight: 188 })).toEqual({ contentTop: 224, contentHeight: 374, cardWidth: 374 }));
it('keeps compact cards near the screen edges', () => { const layout = getHomeViewportLayout({ width: 320, height: 568, topInset: 20, bottomInset: 0, headerHeight: 90, footerHeight: 240 }); expect(layout.cardWidth).toBe(304); expect(layout.contentTop).toBeGreaterThanOrEqual(122); });
it('does not return negative geometry', () => expect(getHomeViewportLayout({ width: -1, height: 10, topInset: 100, bottomInset: 10, headerHeight: 200, footerHeight: 200 }).cardWidth).toBe(0));

it('centers the card on the device when chrome leaves enough space', () => {
  const layout = getHomeViewportLayout({ width: 390, height: 844, topInset: 47, bottomInset: 34, headerHeight: 56, footerHeight: 140 });
  expect(layout.contentTop + layout.cardWidth / 2).toBe(422);
  expect(layout.cardWidth).toBe(374);
});
