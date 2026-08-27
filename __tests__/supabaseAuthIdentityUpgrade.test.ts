/* eslint-disable import/first */

const mockGetSession = jest.fn();
const mockLinkIdentity = jest.fn();
const mockSignInWithIdToken = jest.fn();

jest.mock("@/config/supabase", () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      linkIdentity: (...args: unknown[]) => mockLinkIdentity(...args),
      signInWithIdToken: (...args: unknown[]) => mockSignInWithIdToken(...args),
    },
  },
}));

import { IdentityLinkingError, signInWithGoogle } from "@/services/supabase-auth";

describe("social identity upgrade", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
  });

  it("returns an actionable error when the provider identity belongs to another user", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "anon-user", is_anonymous: true } } },
    });
    mockLinkIdentity.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Identity is already linked to another user" },
    });

    const result = await signInWithGoogle("id-token");

    expect(result.error).toBeInstanceOf(IdentityLinkingError);
    expect((result.error as IdentityLinkingError).code).toBe("identity_already_linked");
  });
});
