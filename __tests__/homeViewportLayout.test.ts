import { getHomeViewportLayout } from '@/domain/home/homeViewportLayout';
it('counts measured regions and safe areas exactly once', () => expect(getHomeViewportLayout({ width: 390, height: 844, topInset: 47, bottomInset: 34, headerHeight: 56, footerHeight: 188 })).toEqual({ contentTop: 153.15, contentHeight: 444.85, cardWidth: 374 }));
it('fits compact Home cards above the dock', () => { const layout = getHomeViewportLayout({ width: 320, height: 568, topInset: 20, bottomInset: 0, headerHeight: 90, footerHeight: 240 }); expect(layout.cardWidth).toBe(182); expect(layout.contentTop).toBeGreaterThanOrEqual(122); });
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

it('centers a draft between header and floating toolbar', () => {
  const input = { presentation: 'draft' as const, width: 390, height: 844, topInset: 47, bottomInset: 34, headerHeight: 56, footerHeight: 112 };
  const layout = getHomeViewportLayout(input);
  expect(layout.cardWidth).toBe(374);
  expect(layout.contentTop - 115).toBe(844 - 34 - 24 - 112 - layout.contentTop - layout.cardWidth);
});
it('fits a compact draft above the measured toolbar', () => {
  const layout = getHomeViewportLayout({ presentation: 'draft', width: 320, height: 568, topInset: 20, bottomInset: 10, headerHeight: 56, footerHeight: 180 });
  expect(layout.contentTop).toBe(88);
  expect(layout.cardWidth).toBe(266);
  expect(layout.contentTop + layout.cardWidth).toBe(568 - 10 - 24 - 180);
});
it('reduces the draft for expanded accessible toolbar text', () => {
  const base = { presentation: 'draft' as const, width: 390, height: 568, topInset: 20, bottomInset: 0, headerHeight: 56 };
  expect(getHomeViewportLayout({ ...base, footerHeight: 240 }).cardWidth).toBe(getHomeViewportLayout({ ...base, footerHeight: 120 }).cardWidth - 120);
});

const devices = [
  { name: 'compact iPhone', width: 320, height: 568, topInset: 20, bottomInset: 0 },
  { name: 'iPhone SE', width: 375, height: 667, topInset: 20, bottomInset: 0 },
  { name: 'notched iPhone', width: 390, height: 844, topInset: 47, bottomInset: 34 },
  { name: 'large iPhone', width: 430, height: 932, topInset: 59, bottomInset: 34 },
  { name: 'Android', width: 360, height: 640, topInset: 24, bottomInset: 24 },
  { name: 'tablet', width: 768, height: 1024, topInset: 24, bottomInset: 20 },
];
describe.each(devices)('$name responsive layout', device => {
  it.each(['camera', 'feed'] as const)('%s fits between header and measured dock', presentation => {
    for (const headerHeight of [56, 84]) for (const footerHeight of [188, 260]) {
      const layout = getHomeViewportLayout({ ...device, presentation, headerHeight, footerHeight });
      expect(layout.contentTop).toBeGreaterThanOrEqual(device.topInset + headerHeight + 12);
      expect(layout.cardWidth).toBeLessThanOrEqual(layout.contentHeight);
      expect(layout.contentTop + layout.cardWidth).toBeLessThanOrEqual(device.height - device.bottomInset - footerHeight - 24);
      expect(layout.cardWidth).toBeLessThanOrEqual(600);
    }
  });
  it('draft fits and centers above its fixed controls', () => {
    const layout = getHomeViewportLayout({ ...device, presentation: 'draft', headerHeight: 84, footerHeight: 112 });
    expect(layout.cardWidth).toBeLessThanOrEqual(Math.min(device.width - 16, 600));
    expect(layout.cardWidth).toBeLessThanOrEqual(layout.contentHeight);
    expect(layout.contentTop + layout.contentHeight).toBe(device.height - device.bottomInset - 24 - 112);
  });
});
