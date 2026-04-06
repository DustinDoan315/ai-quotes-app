import {
  completeSupabaseAuthRedirectFromUrl,
  getSupabaseAuthRedirectParams,
  getSupabaseEmailRedirectUrl,
} from "@/services/supabaseAuthRedirect";

const mockSetSession = jest.fn();
const mockExchangeCodeForSession = jest.fn();
const mockVerifyOtp = jest.fn();

jest.mock("expo-linking", () => ({
  createURL: jest.fn(() => "inkly://auth/callback"),
  getInitialURL: jest.fn(async () => null),
}));

jest.mock("@/config/supabase", () => ({
  supabase: {
    auth: {
      setSession: (...args: unknown[]) => mockSetSession(...args),
      exchangeCodeForSession: (...args: unknown[]) => mockExchangeCodeForSession(...args),
      verifyOtp: (...args: unknown[]) => mockVerifyOtp(...args),
    },
  },
}));

describe("supabase auth redirects", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds the app auth callback redirect URL", () => {
    expect(getSupabaseEmailRedirectUrl()).toBe("inkly://auth/callback");
  });

  it("parses auth params from query and fragment values", () => {
    expect(
      getSupabaseAuthRedirectParams(
        "inkly://auth/callback?code=auth-code#error_code=bad_code&error_description=Link%20expired",
      ),
    ).toEqual({
      accessToken: undefined,
      refreshToken: undefined,
      code: "auth-code",
      tokenHash: undefined,
      type: undefined,
      errorCode: "bad_code",
      errorDescription: "Link expired",
    });
  });

  it("creates a session from access and refresh tokens in the redirect URL", async () => {
    mockSetSession.mockResolvedValue({
      data: { session: { access_token: "access-token" } },
      error: null,
    });

    const result = await completeSupabaseAuthRedirectFromUrl(
      "inkly://auth/callback#access_token=access-token&refresh_token=refresh-token",
    );

    expect(mockSetSession).toHaveBeenCalledWith({
      access_token: "access-token",
      refresh_token: "refresh-token",
    });
    expect(result).toEqual({ access_token: "access-token" });
  });

  it("exchanges a PKCE code from the redirect URL", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { session: { access_token: "code-session" } },
      error: null,
    });

    const result = await completeSupabaseAuthRedirectFromUrl(
      "inkly://auth/callback?code=pkce-code",
    );

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("pkce-code");
    expect(result).toEqual({ access_token: "code-session" });
  });

  it("verifies token-hash email redirects", async () => {
    mockVerifyOtp.mockResolvedValue({
      data: { session: { access_token: "verified-session" } },
      error: null,
    });

    const result = await completeSupabaseAuthRedirectFromUrl(
      "inkly://auth/callback?token_hash=hash-123&type=email",
    );

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      token_hash: "hash-123",
      type: "email",
    });
    expect(result).toEqual({ access_token: "verified-session" });
  });
});
