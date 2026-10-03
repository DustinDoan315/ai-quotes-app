import { useQuoteMomentShare } from '@/features/quotes/useQuoteMomentShare';
const mockRefs: any[] = [];
const mockCapture = jest.fn();
const mockFrames = jest.fn().mockResolvedValue(undefined);
const mockShare = jest.fn().mockResolvedValue({ ok: true });
const mockIncrement = jest.fn();
let mockAllowed = true;
const mockToast = jest.fn();
const mockWatermark = jest.fn();
let mockStateIndex = 0;
jest.mock('react', () => ({ useRef: (v: any) => { const r = { current: v }; mockRefs.push(r); return r; }, useState: (v: any) => [v, mockStateIndex++ === 1 ? mockWatermark : jest.fn()], useMemo: (fn: any) => fn(), useCallback: (fn: any) => fn }));
jest.mock('react-native-web/dist/exports/Platform', () => ({ __esModule: true, default: { OS: 'ios' } }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (s: string) => s }) }));
jest.mock('react-native-view-shot', () => ({ captureRef: (...args: any[]) => mockCapture(...args) }));
jest.mock('@/utils/waitTwoFrames', () => ({ waitTwoFrames: () => mockFrames() }));
jest.mock('@/utils/sharing', () => ({ shareImageFile: (...args: any[]) => mockShare(...args) }));
jest.mock('@/appState/subscriptionStore', () => ({ useSubscriptionStore: (fn: any) => fn({ customerInfo: null, plan: 'free' }) }));
jest.mock('@/appState/subscriptionConfigStore', () => ({ useSubscriptionConfigStore: (fn: any) => fn({ planLimits: {} }) }));
jest.mock('@/appState/usageStore', () => ({ useUsageStore: (fn: any) => fn({ resetIfNewDay: jest.fn(), dailyExportCount: 0, incrementExportUsage: mockIncrement }) }));
jest.mock('@/domain/subscription/subscriptionGuards', () => ({ createSubscriptionGuards: () => ({ canExportQuote: () => ({ allowed: mockAllowed }) }) }));
jest.mock('@/domain/subscription/subscriptionCapabilities', () => ({ getCapabilitiesForPlan: () => ({ hasWatermark: true }) }));
jest.mock('@/appState/uiStore', () => ({ useUIStore: { getState: () => ({ showToast: mockToast }) } }));
jest.mock('@/features/paywall/openPaywall', () => ({ openPaywall: jest.fn() }));
jest.mock('@/services/analytics/events', () => ({ analyticsEvents: { quoteMomentShared: jest.fn() } }));
beforeEach(() => { jest.clearAllMocks(); mockAllowed = true; mockStateIndex = 0; mockShare.mockResolvedValue({ ok: true }); mockCapture.mockResolvedValue('file.png'); mockFrames.mockResolvedValue(undefined); });
it('synchronously prevents duplicate exports and unlocks after completion', async () => {
  let finish!: (value: string) => void;
  mockCapture.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const change = jest.fn(); const hook = useQuoteMomentShare(change); hook.captureRefView.current = {} as any;
  const first = hook.shareMoment('friend'); await Promise.resolve();
  await hook.shareMoment('friend'); expect(mockCapture).toHaveBeenCalledTimes(1);
  finish('file.png'); await first;
  expect(mockIncrement).toHaveBeenCalledTimes(1); expect(change.mock.calls).toEqual([[true], [false]]);
});
it('clears watermark and interaction lock when frame preparation fails', async () => {
  mockFrames.mockRejectedValueOnce(new Error('frames failed'));
  const change = jest.fn(); const hook = useQuoteMomentShare(change); hook.captureRefView.current = {} as any;
  await hook.shareMoment('friend'); expect(mockWatermark).toHaveBeenLastCalledWith(false); expect(change).toHaveBeenLastCalledWith(false);
  await hook.shareMoment('friend'); expect(mockCapture).toHaveBeenCalledTimes(1);
});

it('denied export and missing capture ref do not capture or consume allowance', async () => {
  const hook = useQuoteMomentShare();
  await hook.shareMoment('one'); expect(mockCapture).not.toHaveBeenCalled();
  hook.captureRefView.current = {} as any; mockAllowed = false;
  await hook.shareMoment('one'); expect(mockCapture).not.toHaveBeenCalled(); expect(mockIncrement).not.toHaveBeenCalled();
});
it('reports capture errors while releasing watermark and export lock', async () => {
  mockCapture.mockRejectedValueOnce(new Error('capture failed'));
  const hook = useQuoteMomentShare(); hook.captureRefView.current = {} as any;
  await hook.shareMoment('one'); expect(mockToast).toHaveBeenCalledWith('home.ambient.shareError', 'error');
  expect(mockWatermark).toHaveBeenLastCalledWith(false);
  await hook.shareMoment('one'); expect(mockIncrement).toHaveBeenCalledTimes(1);
});
