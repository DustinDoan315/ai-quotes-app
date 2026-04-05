const mockLogIn = jest.fn();
const mockLogOut = jest.fn();
const mockIsRevenueCatInitialized = jest.fn();
const mockGetCurrentUserProfile = jest.fn();
const mockEnsureUserProfile = jest.fn();
const mockUpdateUserProfile = jest.fn();

const mockSetProfile = jest.fn();
const mockSetAuthState = jest.fn();
const mockSetGuestDisplayName = jest.fn();

jest.mock("@/services/paywall/nativeRevenueCat", () => ({
  isRevenueCatInitialized: () => mockIsRevenueCatInitialized(),
}));

jest.mock("@/services/paywall/revenuecatClient", () => ({
  revenuecatClient: {
    logIn: (...args: unknown[]) => mockLogIn(...args),
    logOut: (...args: unknown[]) => mockLogOut(...args),
  },
}));

jest.mock("@/services/supabase-auth", () => ({
  getCurrentUserProfile: (...args: unknown[]) => mockGetCurrentUserProfile(...args),
  ensureUserProfile: (...args: unknown[]) => mockEnsureUserProfile(...args),
  updateUserProfile: (...args: unknown[]) => mockUpdateUserProfile(...args),
}));

jest.mock("@/appState/userStore", () => ({
  useUserStore: {
    getState: () => ({
      setProfile: mockSetProfile,
      setAuthState: mockSetAuthState,
      setGuestDisplayName: mockSetGuestDisplayName,
      guestDisplayName: null,
    }),
    setState: jest.fn(),
  },
}));

import { syncUserProfile } from "@/features/auth/authService";

describe("syncUserProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsRevenueCatInitialized.mockReturnValue(true);
    mockGetCurrentUserProfile.mockResolvedValue(null);
    mockEnsureUserProfile.mockResolvedValue(null);
    mockUpdateUserProfile.mockResolvedValue({ data: null });
  });

  it("logs in RevenueCat for authenticated users", async () => {
    await syncUserProfile({
      id: "user-123",
      is_anonymous: false,
    } as never);

    expect(mockLogIn).toHaveBeenCalledWith("user-123");
    expect(mockLogOut).not.toHaveBeenCalled();
  });

  it("logs out RevenueCat when there is no user session", async () => {
    await syncUserProfile(null);

    expect(mockLogOut).toHaveBeenCalledTimes(1);
    expect(mockLogIn).not.toHaveBeenCalled();
  });

  it("does not log out RevenueCat for anonymous users", async () => {
    await syncUserProfile({
      id: "anon-123",
      is_anonymous: true,
    } as never);

    expect(mockLogIn).not.toHaveBeenCalled();
    expect(mockLogOut).not.toHaveBeenCalled();
    expect(mockSetProfile).toHaveBeenCalledWith(null);
    expect(mockSetAuthState).toHaveBeenCalledWith("guest");
  });
});
