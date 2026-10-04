/* eslint-disable import/first */
const mockSlots: unknown[] = [];
let mockCursor = 0;
const mockGenerate = jest.fn().mockResolvedValue(null);
const mockCompress = jest.fn();
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
jest.mock('@/utils/imageProcessor', () => ({ compressImageForUpload: (...args: unknown[]) => mockCompress(...args) }));
jest.mock('@/utils/pickPhotoForQuote', () => ({ pickPhotoForQuote: () => mockPick() }));
jest.mock('@/i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));
import {
  getGenerationResultStage,
  getGenerationStageLabelKey,
} from "@/features/home/generationStage";

describe("generation stages", () => {
  it("maps active stages to visible labels and leaves idle unlabeled", () => {
    expect(getGenerationStageLabelKey("idle")).toBeNull();
    expect(getGenerationStageLabelKey("matching")).toBe(
      "home.generating.matching",
    );
    expect(getGenerationStageLabelKey("revealing")).toBe(
      "home.generating.revealing",
    );
  });

  it("returns to idle when generation fails", () => {
    expect(getGenerationResultStage(false)).toBe("idle");
    expect(getGenerationResultStage(true)).toBe("revealing");
  });
});

import { useHomeCamera } from '@/features/home/useHomeCamera';
function useRenderGeneration() { mockCursor = 0; return useHomeCamera({ homeVibeKey: 'dawn' }); }
async function flushMicrotasks() { for (let i = 0; i < 12; i += 1) await Promise.resolve(); }
beforeEach(() => {
  mockSlots.length = 0; jest.clearAllMocks(); jest.useFakeTimers();
  mockPick.mockResolvedValue({ uri: 'photo', width: 100, height: 100 });
});
afterEach(() => { jest.useRealTimers(); });
it('shows actual preparation and request stages without elapsed-time progress', async () => {
  let completeCompression!: (value: string) => void;
  let completeRequest!: (value: unknown) => void;
  mockCompress.mockImplementation(() => new Promise(resolve => { completeCompression = resolve; }));
  mockGenerate.mockImplementation(() => new Promise(resolve => { completeRequest = resolve; }));
  const pending = useRenderGeneration().handleOpenGallery();
  await flushMicrotasks();
  expect(useRenderGeneration().generationStage).toBe('preparing');
  jest.advanceTimersByTime(5000);
  expect(useRenderGeneration().generationProgress).toBe(0);
  completeCompression('encoded'); await flushMicrotasks();
  expect(useRenderGeneration().generationStage).toBe('writing');
  jest.advanceTimersByTime(10000);
  expect(useRenderGeneration().generationStage).toBe('writing');
  expect(useRenderGeneration().generationProgress).toBe(0);
  completeRequest({ text: 'Ready caption' }); await flushMicrotasks();
  expect(useRenderGeneration().generationStage).toBe('revealing');
  expect(useRenderGeneration().generationProgress).toBe(1);
  jest.advanceTimersByTime(250); await pending;
  expect(useRenderGeneration().generationStage).toBe('idle');
  expect(useRenderGeneration().generationProgress).toBe(0);
});
it('ignores canceled request completion and returns failed requests to idle', async () => {
  mockCompress.mockResolvedValue('encoded');
  let completeRequest!: (value: unknown) => void;
  mockGenerate.mockImplementationOnce(() => new Promise(resolve => { completeRequest = resolve; }));
  const pending = useRenderGeneration().handleOpenGallery();
  await flushMicrotasks();
  useRenderGeneration().clearSelectedImage();
  completeRequest({ text: 'Stale' }); await pending;
  expect(useRenderGeneration().generationStage).toBe('idle');
  expect(useRenderGeneration().generationProgress).toBe(0);
  mockGenerate.mockResolvedValueOnce(null);
  await useRenderGeneration().handleRetryGeneration();
  expect(useRenderGeneration().generationStage).toBe('idle');
});
