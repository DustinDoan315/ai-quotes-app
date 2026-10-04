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

it('starts a draft immediately below the header instead of centering it', () => {
  const layout = getHomeViewportLayout({ presentation: 'draft', width: 390, height: 844, topInset: 47, bottomInset: 34, headerHeight: 56, footerHeight: 100 });
  expect(layout.contentTop).toBe(115);
  expect(layout.cardWidth).toBe(374);
  expect(layout.contentHeight).toBe(571);
});
it('keeps a compact draft full width in its scrollable area', () => {
  const layout = getHomeViewportLayout({ presentation: 'draft', width: 320, height: 568, topInset: 20, bottomInset: 10, headerHeight: 56, footerHeight: 180 });
  expect(layout.contentTop).toBe(88);
  expect(layout.contentHeight).toBe(266);
  expect(layout.cardWidth).toBe(304);
  expect(layout.cardWidth).toBeGreaterThan(layout.contentHeight);
});
it('accounts for expanded draft controls without hiding them behind the card', () => {
  const base = { presentation: 'draft' as const, width: 390, height: 568, topInset: 20, bottomInset: 0, headerHeight: 56 };
  const smallerFooter = getHomeViewportLayout({ ...base, footerHeight: 120 });
  const expandedFooter = getHomeViewportLayout({ ...base, footerHeight: 240 });
  expect(expandedFooter.contentTop).toBe(smallerFooter.contentTop);
  expect(expandedFooter.cardWidth).toBe(smallerFooter.cardWidth);
  expect(expandedFooter.contentHeight).toBe(smallerFooter.contentHeight - 120);
});
