import { HomeFavoriteCache } from '@/domain/home/homeFavoriteCache';
const card = (isFavorite: boolean) => ({ id: 'one', isFavorite });
it('protects a pending or completed write against an older refresh', () => {
  const cache = new HomeFavoriteCache();
  const stale = cache.snapshot();
  cache.pending('one', true); cache.patch('one', true);
  expect(cache.merge([card(false)], stale)[0].isFavorite).toBe(true);
  const duringWrite = cache.snapshot();
  cache.pending('one', null);
  expect(cache.merge([card(false)], duringWrite)[0].isFavorite).toBe(true);
});
it('accepts fresh server state after completion, including a later Memories change', () => {
  const cache = new HomeFavoriteCache();
  cache.pending('one', true); cache.patch('one', true); cache.pending('one', null);
  expect(cache.merge([card(true)], cache.snapshot())[0].isFavorite).toBe(true);
  expect(cache.merge([card(false)], cache.snapshot())[0].isFavorite).toBe(false);
});
it('retains rollback until older pending refreshes finish', () => {
  const cache = new HomeFavoriteCache(); cache.pending('one', true);
  const stale = cache.snapshot(); cache.patch('one', false); cache.pending('one', null);
  expect(cache.merge([card(true)], stale)[0].isFavorite).toBe(false);
});
