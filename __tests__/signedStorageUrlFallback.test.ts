import { useSignedStorageUrl } from '@/hooks/useSignedStorageUrl';
const mockSign = jest.fn();
const mockSetUrl = jest.fn();
let mockEffect: (() => (() => void)) | undefined;
jest.mock('@/config/supabase', () => ({ supabase: { storage: { from: () => ({ createSignedUrl: mockSign }) } } }));
jest.mock('react', () => ({
  useState: (initial: unknown) => [initial, mockSetUrl],
  useEffect: (callback: () => (() => void)) => { mockEffect = callback; },
}));
beforeEach(() => { jest.clearAllMocks(); });
it('keeps a local photo visible while signing and after a failed signing response', async () => {
  mockSign.mockResolvedValue({ data: null, error: new Error('offline') });
  expect(useSignedStorageUrl('user-photos', 'owner/photo.jpg', 'file:///photo.jpg')).toBe('file:///photo.jpg');
  mockEffect?.();
  await Promise.resolve();
  expect(mockSetUrl).toHaveBeenLastCalledWith('file:///photo.jpg');
});
it('uses the signed URL when available', async () => {
  mockSign.mockResolvedValue({ data: { signedUrl: 'https://signed.example/photo' }, error: null });
  useSignedStorageUrl('user-photos', 'owner/photo.jpg', 'file:///photo.jpg');
  mockEffect?.();
  await Promise.resolve();
  expect(mockSetUrl).toHaveBeenLastCalledWith('https://signed.example/photo');
});
it('handles rejected signing promises without losing the local photo', async () => {
  mockSign.mockRejectedValue(new Error('network'));
  useSignedStorageUrl('user-photos', 'owner/photo.jpg', 'file:///photo.jpg');
  mockEffect?.();
  await Promise.resolve(); await Promise.resolve();
  expect(mockSetUrl).toHaveBeenLastCalledWith('file:///photo.jpg');
});
