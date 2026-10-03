/* eslint-disable import/first */
const mockSlots: unknown[] = [];
let mockCursor = 0;
const mockGenerate = jest.fn().mockResolvedValue(null);
let mockPro = false;
const mockSave = jest.fn().mockResolvedValue(null);
const mockPick = jest.fn();
const mockClearQuote = jest.fn();
const mockQuoteState = { dailyQuote: { text: 'A moment to remember' }, clearDailyQuote: mockClearQuote, setDailyQuote: jest.fn() };
const mockGesture: any = {};
for (const key of ['enabled', 'onStart', 'onUpdate']) mockGesture[key] = jest.fn(() => mockGesture);
jest.mock('react', () => ({
  useState: (initial: any) => { const i = mockCursor++; if (!(i in mockSlots)) mockSlots[i] = typeof initial === 'function' ? initial() : initial; return [mockSlots[i], (v: any) => { mockSlots[i] = typeof v === 'function' ? v(mockSlots[i]) : v; }]; },
  useRef: (initial: any) => { const i = mockCursor++; if (!(i in mockSlots)) mockSlots[i] = { current: initial }; return mockSlots[i]; },
  useMemo: (fn: any) => fn(), useCallback: (fn: any) => fn(), useEffect: jest.fn(),
}));
jest.mock('react-native', () => ({ Alert: { alert: jest.fn() } }));
jest.mock('expo-camera', () => ({ CameraView: {} }));
jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' } }));
jest.mock('expo-image-picker', () => ({ requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }) }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'stack' }));
jest.mock('@react-navigation/native', () => ({ useFocusEffect: jest.fn() }));
jest.mock('react-native-gesture-handler', () => ({ Gesture: { Pinch: () => mockGesture } }));
jest.mock('react-native-worklets', () => ({ scheduleOnRN: jest.fn() }));
jest.mock('@/hooks/useCameraPermission', () => ({ useCameraPermission: () => ({ isLoading: false, isGranted: true, requestPermission: jest.fn() }) }));
jest.mock('@/features/ai/aiStore', () => ({ useAIStore: () => ({ isGenerating: false }) }));
jest.mock('@/features/ai/useGenerateQuote', () => ({ useGenerateQuote: () => ({ generate: mockGenerate, cancelGeneration: jest.fn() }) }));
jest.mock('@/appState/quoteStore', () => ({ useQuoteStore: Object.assign(() => mockQuoteState, { getState: () => mockQuoteState }) }));
jest.mock('@/appState/userStore', () => ({ useUserStore: () => ({ profile: { user_id: 'me' }, authUserId: 'me', persona: null, ensureGuestId: () => 'guest' }) }));
jest.mock('@/appState/uiStore', () => ({ useUIStore: () => ({ showToast: jest.fn() }) }));
jest.mock('@/appState', () => ({ useMemoryStore: (fn: any) => fn({ addMemory: jest.fn() }) }));
jest.mock('@/appState/subscriptionStore', () => ({ useSubscriptionStore: (fn: any) => fn({ customerInfo: mockPro ? { activeEntitlementIds: ['pro_access'] } : null }) }));
jest.mock('@/appState/streakStore', () => ({ useStreakStore: { getState: () => ({ incrementStreak: () => false, currentStreak: 0 }) } }));
jest.mock('@/appState/reminderStore', () => ({ useReminderStore: { getState: () => ({ reminderEnabled: true }) } }));
jest.mock('@/services/analytics/events', () => ({ analyticsEvents: { streakIncremented: jest.fn() } }));
jest.mock('@/services/media/saveUserPhoto', () => ({ saveUserPhoto: (...args: any[]) => mockSave(...args) }));
jest.mock('@/utils/imageProcessor', () => ({ compressImageForUpload: jest.fn() }));
jest.mock('@/utils/pickPhotoForQuote', () => ({ pickPhotoForQuote: () => mockPick() }));
jest.mock('@/i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));
import { useHomeCamera } from '@/features/home/useHomeCamera';
function useRenderCamera(vibe: string) { mockCursor = 0; return useHomeCamera({ homeVibeKey: vibe }); }
beforeEach(() => { mockSlots.length = 0; mockPro = false; jest.clearAllMocks(); mockSave.mockResolvedValue(null); });
it('freezes gallery palette at initiation and saves it after a live palette change', async () => {
  let finish!: (image: any) => void;
  mockPick.mockReturnValue(new Promise(resolve => { finish = resolve; }));
  const initial = useRenderCamera('dawn');
  const pending = initial.handleOpenGallery();
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  useRenderCamera('sage');
  finish({ uri: 'photo', width: 100, height: 100 });
  await pending;
  const draft = useRenderCamera('sage');
  expect(draft.draftVibeKey).toBe('dawn');
  await draft.handleSavePhoto();
  expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ homeVibeKey: 'dawn' }));
  expect(useRenderCamera('prism').draftVibeKey).toBe('dawn'); // failed save retains draft
});
it('canceled replacement preserves image, quote and frozen palette; clear releases palette', async () => {
  mockPick.mockResolvedValueOnce({ uri: 'original', width: 100, height: 100 }).mockResolvedValueOnce(null);
  await useRenderCamera('dawn').handleOpenGallery();
  await useRenderCamera('sage').handleOpenGallery();
  expect(useRenderCamera('sage').selectedImageUri).toBe('original');
  expect(useRenderCamera('sage').draftVibeKey).toBe('dawn');
  useRenderCamera('sage').clearSelectedImage();
  expect(useRenderCamera('sage').draftVibeKey).toBeNull();
});

it('freezes delayed camera capture and permits a new palette only after clearing', async () => {
  let finish!: (image: any) => void;
  const first = useRenderCamera('dawn');
  first.handleCameraReady();
  first.cameraRef.current = { takePictureAsync: () => new Promise(resolve => { finish = resolve; }) } as any;
  const pending = useRenderCamera('dawn').handleCapture();
  await Promise.resolve(); await Promise.resolve();
  useRenderCamera('sage'); finish({ uri: 'camera-photo' }); await pending;
  expect(useRenderCamera('sage').draftVibeKey).toBe('dawn');
  useRenderCamera('sage').clearSelectedImage();
  mockPick.mockResolvedValue({ uri: 'next-photo' });
  await useRenderCamera('sage').handleOpenGallery();
  expect(useRenderCamera('sage').draftVibeKey).toBe('sage');
});
it('successful save clears the draft and palette; failed generation retains a retryable image', async () => {
  mockGenerate.mockResolvedValue(null);
  mockPick.mockResolvedValue({ uri: 'retry-photo' });
  await useRenderCamera('dawn').handleOpenGallery();
  expect(useRenderCamera('sage').selectedImageUri).toBe('retry-photo');
  await useRenderCamera('sage').handleRetryGeneration();
  expect(useRenderCamera('sage').draftVibeKey).toBe('dawn');
  mockSave.mockResolvedValue({ photoId: 'saved', publicUrl: 'url', storagePath: 'path', orientation: 'portrait' });
  await useRenderCamera('sage').handleSavePhoto();
  expect(useRenderCamera('sage').selectedImageUri).toBeNull();
  expect(useRenderCamera('sage').draftVibeKey).toBeNull();
});

it('keeps a Pro stack through saves and releases it only on Finish', async () => {
  mockPro = true;
  mockPick.mockResolvedValue({ uri: 'stack-photo' });
  mockSave.mockResolvedValue({ photoId: 'saved', publicUrl: 'url', storagePath: 'path', orientation: 'portrait' });
  await useRenderCamera('dawn').handleOpenGallery();
  await useRenderCamera('sage').handleSavePhoto();
  expect(useRenderCamera('sage').photoStackCount).toBe(1);
  await useRenderCamera('sage').handleOpenGallery();
  await useRenderCamera('sage').handleSavePhoto();
  expect(mockSave.mock.calls.map(([input]) => input.photoStackId)).toEqual(['stack', 'stack']);
  expect(useRenderCamera('sage').photoStackCount).toBe(2);
  useRenderCamera('sage').finishPhotoStack();
  expect(useRenderCamera('sage').photoStackCount).toBe(0);
});
