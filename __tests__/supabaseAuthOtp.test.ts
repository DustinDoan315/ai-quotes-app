import { sendEmailOtp, verifyEmailOtp } from "@/services/supabase-auth";

const mockSignInWithOtp = jest.fn();
const mockVerifyOtp = jest.fn();

jest.mock("expo-linking", () => ({
  createURL: jest.fn(() => "inkly://auth/callback"),
  getInitialURL: jest.fn(async () => null),
}));

jest.mock("@/config/supabase", () => ({
  supabase: {
    auth: {
      signInWithOtp: (...args: unknown[]) => mockSignInWithOtp(...args),
      verifyOtp: (...args: unknown[]) => mockVerifyOtp(...args),
      setSession: jest.fn(),
      exchangeCodeForSession: jest.fn(),
    },
  },
}));

describe("supabase auth email otp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sends an email otp with user creation enabled", async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });

    const result = await sendEmailOtp("user@example.com");

    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      email: "user@example.com",
      options: {
        shouldCreateUser: true,
        emailRedirectTo: "inkly://auth/callback",
      },
    });
    expect(result).toEqual({ error: null });
  });

  it("verifies the email otp with the email type", async () => {
    mockVerifyOtp.mockResolvedValue({
      data: {
        session: { access_token: "token" },
        user: { id: "user-1" },
      },
      error: null,
    });

    const result = await verifyEmailOtp("user@example.com", "123456");

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      email: "user@example.com",
      token: "123456",
      type: "email",
    });
    expect(result).toEqual({
      session: { access_token: "token" },
      user: { id: "user-1" },
      error: null,
    });
  });
});
