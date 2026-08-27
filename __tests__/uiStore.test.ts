import { useUIStore } from "@/appState/uiStore";

describe("UI toast store", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-08-22T00:00:00.000Z"));
    useUIStore.setState({ toasts: [] });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("shows one toast for repeated active notifications", () => {
    const { showToast } = useUIStore.getState();

    showToast("Photo saved", "success");
    showToast("Photo saved", "success");

    expect(useUIStore.getState().toasts).toHaveLength(1);
  });

  it("keeps distinct simultaneous notifications and gives each an id", () => {
    const { showToast } = useUIStore.getState();

    showToast("Photo captured", "success");
    showToast("Quote generated", "success");

    const { toasts } = useUIStore.getState();
    expect(toasts).toHaveLength(2);
    expect(toasts[0].id).not.toBe(toasts[1].id);
  });
});
