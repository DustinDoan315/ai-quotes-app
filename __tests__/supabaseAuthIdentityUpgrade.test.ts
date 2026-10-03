/* eslint-disable import/first */

const mockGetSession = jest.fn();
const mockLinkIdentity = jest.fn();
const mockSignInWithIdToken = jest.fn();
const mockSignOut = jest.fn();

const mockRememberGuest = jest.fn();
const mockBindGuestTarget = jest.fn();
const mockResumeGuestMerge = jest.fn();
jest.mock("@/services/guestAccountMerge", () => ({
  finishGuestIdentityUpgrade: jest.fn(),
  rememberGuestMerge: (...args: unknown[]) => mockRememberGuest(...args),
  bindGuestMergeTarget: (...args: unknown[]) => mockBindGuestTarget(...args),
  resumeGuestMerge: (...args: unknown[]) => mockResumeGuestMerge(...args),
}));

jest.mock("@/config/supabase", () => ({
  supabase: {
    auth: {
      signOut: (...args: unknown[]) => mockSignOut(...args),
      getSession: (...args: unknown[]) => mockGetSession(...args),
      linkIdentity: (...args: unknown[]) => mockLinkIdentity(...args),
      signInWithIdToken: (...args: unknown[]) => mockSignInWithIdToken(...args),
    },
  },
}));

import { IdentityLinkingError, signInWithApple, signInWithGoogle } from "@/services/supabase-auth";

describe("social identity upgrade", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("links Google to the active anonymous user without changing the user ID", async () => {
    const anonymousUser = { id: "anon-user", is_anonymous: true };
    const upgradedSession = { user: { id: "anon-user", is_anonymous: false } };
    mockGetSession.mockResolvedValue({ data: { session: { user: anonymousUser } } });
    mockLinkIdentity.mockResolvedValue({
      data: { user: upgradedSession.user, session: upgradedSession },
      error: null,
    });

    const result = await signInWithGoogle("id-token", "nonce", "access-token");

    expect(mockLinkIdentity).toHaveBeenCalledWith({
      provider: "google",
      token: "id-token",
      nonce: "nonce",
      access_token: "access-token",
    });
    expect(mockSignInWithIdToken).not.toHaveBeenCalled();
    expect(result.upgradedAnonymousUser).toBe(true);
    expect(result.user?.id).toBe("anon-user");
  });

  it("uses standard sign-in when there is no anonymous session to preserve", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockSignInWithIdToken.mockResolvedValue({
      data: { user: { id: "existing-user" }, session: { user: { id: "existing-user" } } },
      error: null,
    });

    const result = await signInWithGoogle("id-token");

    expect(mockLinkIdentity).not.toHaveBeenCalled();
    expect(mockSignInWithIdToken).toHaveBeenCalledWith({
      provider: "google",
      token: "id-token",
      nonce: undefined,
      access_token: undefined,
    });
    expect(result.upgradedAnonymousUser).toBe(false);
    expect(result.user?.id).toBe("existing-user");
  });

  it("returns an actionable error when manual identity linking is disabled", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "anon-user", is_anonymous: true } } },
    });
    mockLinkIdentity.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Manual linking is disabled" },
    });

    const result = await signInWithGoogle("id-token");

    expect(result.error).toBeInstanceOf(IdentityLinkingError);
    expect((result.error as IdentityLinkingError).code).toBe(
      "manual_identity_linking_disabled",
    );
    expect(result.upgradedAnonymousUser).toBe(false);
    expect(mockSignInWithIdToken).not.toHaveBeenCalled();
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  describe.each(["apple", "google"] as const)("returning %s account", (provider) => {
    const credentials = provider === "apple"
      ? { provider, token: "id-token", nonce: "nonce" }
      : { provider, token: "id-token", nonce: "nonce", access_token: "access-token" };
    const signIn = () => provider === "apple"
      ? signInWithApple("id-token", "nonce")
      : signInWithGoogle("id-token", "nonce", "access-token");

    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: "anon-user", is_anonymous: true } } },
        error: null,
      });
    });

    it("upgrades a new provider identity while preserving the guest user ID", async () => {
      const user = { id: "anon-user", is_anonymous: false };
      const session = { user };
      mockLinkIdentity.mockResolvedValue({ data: { user, session }, error: null });

      const result = await signIn();

      expect(mockLinkIdentity).toHaveBeenCalledWith(credentials);
      expect(result).toEqual({ user, session, error: null, upgradedAnonymousUser: true });
      expect(mockSignInWithIdToken).not.toHaveBeenCalled();
      expect(mockSignOut).not.toHaveBeenCalled();
    });

    it.each([
      { code: "identity_already_exists", message: "Cette identité appartient à un autre compte" },
      { message: "Identity is already linked to another user" },
      { message: "Identity is already associated with another user" },
      { message: "Identity already exists" },
    ])("signs into the original account for conflict %j", async (conflict) => {
      const user = { id: "existing-user", is_anonymous: false };
      const session = { user };
      mockLinkIdentity.mockResolvedValue({ data: { user: null, session: null }, error: conflict });
      mockSignInWithIdToken.mockResolvedValue({ data: { user, session }, error: null });

      const result = await signIn();

      expect(mockLinkIdentity).toHaveBeenCalledTimes(1);
      expect(mockLinkIdentity).toHaveBeenCalledWith(credentials);
      expect(mockSignInWithIdToken).toHaveBeenCalledTimes(1);
      expect(mockSignInWithIdToken).toHaveBeenCalledWith(credentials);
      expect(mockSignOut).not.toHaveBeenCalled();
      expect(result).toEqual({ user, session, error: null, upgradedAnonymousUser: false });
    });

    it("returns the fallback provider error without signing out the guest", async () => {
      const error = { code: "invalid_credentials", message: "Token expired" };
      mockLinkIdentity.mockResolvedValue({
        data: { user: null, session: null },
        error: { code: "identity_already_exists", message: "Identity already exists" },
      });
      mockSignInWithIdToken.mockResolvedValue({ data: { user: null, session: null }, error });

      const result = await signIn();

      expect(result.error).toBe(error);
      expect(result.upgradedAnonymousUser).toBe(false);
      expect(mockSignInWithIdToken).toHaveBeenCalledTimes(1);
      expect(mockSignOut).not.toHaveBeenCalled();
    });

    it.each([
      { code: "request_timeout", message: "Network request failed" },
      { code: "bad_jwt", message: "Invalid identity token" },
      { code: "bad_jwt", message: "Identity already exists" },
    ])("does not switch accounts for a non-conflict linking error %j", async (error) => {
      mockLinkIdentity.mockResolvedValue({ data: { user: null, session: null }, error });

      const result = await signIn();

      expect(result.error).toBe(error);
      expect(result.upgradedAnonymousUser).toBe(false);
      expect(mockSignInWithIdToken).not.toHaveBeenCalled();
      expect(mockSignOut).not.toHaveBeenCalled();
    });

    it("classifies a localized manual-linking-disabled code without falling back", async () => {
      mockLinkIdentity.mockResolvedValue({
        data: { user: null, session: null },
        error: { code: "manual_linking_disabled", message: "La liaison est désactivée" },
      });

      const result = await signIn();

      expect(result.error).toBeInstanceOf(IdentityLinkingError);
      expect((result.error as IdentityLinkingError).code).toBe("manual_identity_linking_disabled");
      expect(result.upgradedAnonymousUser).toBe(false);
      expect(mockSignInWithIdToken).not.toHaveBeenCalled();
      expect(mockSignOut).not.toHaveBeenCalled();
    });

    it("surfaces a session lookup failure without attempting authentication", async () => {
      const error = { code: "request_timeout", message: "Session storage unavailable" };
      mockGetSession.mockResolvedValue({ data: { session: null }, error });

      const result = await signIn();

      expect(result.error).toBe(error);
      expect(result.user).toBeNull();
      expect(result.session).toBeNull();
      expect(result.upgradedAnonymousUser).toBe(false);
      expect(mockLinkIdentity).not.toHaveBeenCalled();
      expect(mockSignInWithIdToken).not.toHaveBeenCalled();
      expect(mockSignOut).not.toHaveBeenCalled();
    });
  });
});

it("does not replace the guest session when saving its merge proof fails", async () => {
  jest.resetAllMocks();
  mockGetSession.mockResolvedValue({ data: { session: { user: { id: "guest", is_anonymous: true } } } });
  mockLinkIdentity.mockResolvedValue({ data: {}, error: { code: "identity_already_exists", message: "conflict" } });
  mockRememberGuest.mockRejectedValue(new Error("secure storage unavailable"));
  const result = await signInWithApple("token");
  expect(result.error).toBeInstanceOf(Error);
  expect(mockSignInWithIdToken).not.toHaveBeenCalled();
});
