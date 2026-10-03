/* eslint-disable import/first */
let mockRows: unknown[] = [];
let mockUpdateRows: unknown[] = [];
const mockQuery: any = {};
for (const method of ['select', 'order', 'in', 'eq', 'gte', 'lt', 'limit', 'range'])
  mockQuery[method] = jest.fn(() => mockQuery);
mockQuery.then = (resolve: Function) => resolve({ data: mockRows, error: null });
const mockUpdateQuery: any = { eq: jest.fn(() => mockUpdateQuery), select: jest.fn(() => Promise.resolve({ data: mockUpdateRows, error: null })) };
jest.mock('@/config/supabase', () => ({ supabase: { from: () => ({ ...mockQuery, update: () => mockUpdateQuery }), storage: { from: () => ({ createSignedUrls: async (paths: string[]) => ({ data: paths.map(path => ({ path, signedUrl: 'https://example.com/signed.png' })), error: null }) }) } } }));
import { listQuotePhotoCards, listQuotePhotoCardsForDay, updateUserPhotoFavorite } from '@/services/media/userPhotosApi';
beforeEach(() => { mockRows = []; mockUpdateRows = []; });
it.each(['future', 'aurora', null])('normalizes %s in both list paths', async (vibe) => { mockRows = [{ id: 'a', image_url: 'https://example.com/a.png', storage_path: 'a', created_at: '2026-10-03T00:00:00Z', home_vibe_key: vibe }]; const normal = await listQuotePhotoCards({ signPhotoUrls: false }); const day = await listQuotePhotoCardsForDay({ dateKey: '2026-10-03' }); const expected = vibe === 'aurora' ? 'aurora' : null; expect(normal[0].homeVibeKey).toBe(expected); expect(day[0].homeVibeKey).toBe(expected); });
it('requires matching returned favorite row rather than accepting zero rows', async () => { expect(await updateUserPhotoFavorite('a', true)).toBe(false); mockUpdateRows = [{ id: 'wrong', is_favorite: true }]; expect(await updateUserPhotoFavorite('a', true)).toBe(false); mockUpdateRows = [{ id: 'a', is_favorite: false }]; expect(await updateUserPhotoFavorite('a', true)).toBe(false); mockUpdateRows = [{ id: 'a', is_favorite: true }]; expect(await updateUserPhotoFavorite('a', true)).toBe(true); });
