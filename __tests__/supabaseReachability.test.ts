jest.mock('@supabase/supabase-js', () => ({ createClient: () => ({}) }));
jest.mock('@/config/secureStorage', () => ({ ExpoSecureStorageAdapter: {} }));
const mockFetch = jest.fn();
let check: () => Promise<void>;
let warn: jest.SpyInstance;
let error: jest.SpyInstance;
const oldFetch = global.fetch;
const oldUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const oldKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
beforeAll(() => {
  process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
  // Load after configuring the environment; Jest's Node preset does not enable ESM imports.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  check = require('@/config/supabase').checkSupabaseReachable;
});
beforeEach(() => {
  mockFetch.mockReset(); global.fetch = mockFetch;
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  error = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { warn.mockRestore(); error.mockRestore(); });
afterAll(() => {
  global.fetch = oldFetch;
  if (oldUrl === undefined) delete process.env.EXPO_PUBLIC_SUPABASE_URL; else process.env.EXPO_PUBLIC_SUPABASE_URL = oldUrl;
  if (oldKey === undefined) delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY; else process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = oldKey;
});
it('uses Auth health rather than the REST schema endpoint', async () => {
  mockFetch.mockResolvedValue({ ok: true, status: 200 }); await check();
  expect(mockFetch).toHaveBeenCalledWith('https://example.supabase.co/auth/v1/health', expect.objectContaining({ method: 'GET' }));
  expect(warn).not.toHaveBeenCalled();
});
it('does not turn a transient network failure into a blocking development error', async () => {
  mockFetch.mockRejectedValue(new TypeError('Network request failed')); await expect(check()).resolves.toBeUndefined();
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('may be temporary'));
  expect(error).not.toHaveBeenCalled();
});
it('reports HTTP failure without claiming the project is paused', async () => {
  mockFetch.mockResolvedValue({ ok: false, status: 503 }); await check();
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('HTTP 503'));
  expect(error).not.toHaveBeenCalled();
});
