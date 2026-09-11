import {
  selectBootstrapReady,
  useBootstrapStore,
} from "@/appState/bootstrapStore";

describe("bootstrap store", () => {
  beforeEach(() => {
    useBootstrapStore.setState({
      authReady: true,
      configReady: true,
      authError: "service unavailable",
      authRetrying: false,
      authRetryCount: 0,
    });
  });

  it("keeps the app blocked until both bootstrap tasks are ready", () => {
    expect(selectBootstrapReady(useBootstrapStore.getState())).toBe(true);

    useBootstrapStore.getState().setAuthReady(false);
    expect(selectBootstrapReady(useBootstrapStore.getState())).toBe(false);

    useBootstrapStore.getState().setAuthReady(true);
    useBootstrapStore.getState().setConfigReady(false);
    expect(selectBootstrapReady(useBootstrapStore.getState())).toBe(false);
  });

  it("starts a retryable auth attempt and clears the previous error", () => {
    useBootstrapStore.getState().retryAuth();

    expect(useBootstrapStore.getState()).toMatchObject({
      authReady: false,
      authError: null,
      authRetrying: true,
      authRetryCount: 1,
    });
  });
});
