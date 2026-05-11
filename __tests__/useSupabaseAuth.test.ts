import {
  signInWithApple,
  signInWithGoogle,
} from "@/services/supabase-auth";

const mockSignInWithIdToken = jest.fn();

jest.mock("@/config/supabase", () => ({
  supabase: {
    auth: {
      signInWithIdToken: (...args: unknown[]) => mockSignInWithIdToken(...args),
    },
  },
}));

describe("Supabase native provider sign-in", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("signs in with a Google ID token and nonce", async () => {
    const user = { id: "google-user" };
    const session = { access_token: "google-session" };
    mockSignInWithIdToken.mockResolvedValue({
      data: { user, session },
      error: null,
    });

    const result = await signInWithGoogle("google-id-token", "raw-nonce");

    expect(mockSignInWithIdToken).toHaveBeenCalledWith({
      provider: "google",
      token: "google-id-token",
      nonce: "raw-nonce",
    });
    expect(result).toEqual({ user, session, error: null });
  });

  it("signs in with an Apple identity token", async () => {
    const user = { id: "apple-user" };
    const session = { access_token: "apple-session" };
    mockSignInWithIdToken.mockResolvedValue({
      data: { user, session },
      error: null,
    });

    const result = await signInWithApple("apple-identity-token");

    expect(mockSignInWithIdToken).toHaveBeenCalledWith({
      provider: "apple",
      token: "apple-identity-token",
    });
    expect(result).toEqual({ user, session, error: null });
  });

  it("normalizes missing auth data to nulls", async () => {
    const error = { message: "invalid token" };
    mockSignInWithIdToken.mockResolvedValue({
      data: { user: null, session: null },
      error,
    });

    const result = await signInWithApple("bad-token");

    expect(result).toEqual({ user: null, session: null, error });
  });
});
