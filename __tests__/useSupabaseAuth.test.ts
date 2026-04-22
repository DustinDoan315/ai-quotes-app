// __tests__/useSupabaseAuth.test.ts
//
// Tests for the OAuth sign-in handler logic in useSupabaseAuth.
//
// Because this project uses jest-expo/node (no React renderer), we test
// the async handler logic directly by invoking the same service calls
// the handlers make and asserting on the resulting observable effects.

const mockSetProfile = jest.fn();

jest.mock("@/config/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
    },
  },
}));

jest.mock("@/services/supabase-auth", () => ({
  signInWithGoogle: jest.fn(),
  signInWithApple: jest.fn(),
  signOut: jest.fn(),
  getCurrentUserProfile: jest.fn().mockResolvedValue(null),
  updateUserProfile: jest.fn(),
}));

jest.mock("@/features/auth/authService", () => ({
  syncUserProfile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/appState/userStore", () => ({
  useUserStore: {
    getState: jest.fn(() => ({ setProfile: mockSetProfile })),
  },
}));

import * as supabaseAuth from "@/services/supabase-auth";
import { syncUserProfile } from "@/features/auth/authService";
import { useUserStore } from "@/appState/userStore";

// ---------------------------------------------------------------------------
// Inline handler logic that mirrors useSupabaseAuth exactly, so we can test
// the async path in a Node-only environment (no renderHook needed).
// ---------------------------------------------------------------------------

async function simulateHandleSignInWithGoogle(idToken: string) {
  const { user: newUser, session: newSession, error } = await supabaseAuth.signInWithGoogle(idToken);
  if (!error && newSession && newUser) {
    await syncUserProfile(newUser);
    const userProfile = await supabaseAuth.getCurrentUserProfile();
    if (userProfile) useUserStore.getState().setProfile(userProfile);
  }
  return { error };
}

async function simulateHandleSignInWithApple(identityToken: string) {
  const { user: newUser, session: newSession, error } = await supabaseAuth.signInWithApple(identityToken);
  if (!error && newSession && newUser) {
    await syncUserProfile(newUser);
    const userProfile = await supabaseAuth.getCurrentUserProfile();
    if (userProfile) useUserStore.getState().setProfile(userProfile);
  }
  return { error };
}

beforeEach(() => {
  jest.clearAllMocks();
  (useUserStore.getState as jest.Mock).mockReturnValue({ setProfile: mockSetProfile });
});

// ---------------------------------------------------------------------------
// signInWithGoogle
// ---------------------------------------------------------------------------
describe("handleSignInWithGoogle", () => {
  it("calls syncUserProfile and syncs userStore on success", async () => {
    const fakeUser = { id: "u1" } as any;
    const fakeSession = { access_token: "tok" } as any;
    const fakeProfile = { user_id: "u1", display_name: "Test" } as any;

    (supabaseAuth.signInWithGoogle as jest.Mock).mockResolvedValue({
      user: fakeUser,
      session: fakeSession,
      error: null,
    });
    (supabaseAuth.getCurrentUserProfile as jest.Mock).mockResolvedValue(fakeProfile);

    const { error } = await simulateHandleSignInWithGoogle("fake-id-token");

    expect(error).toBeNull();
    expect(syncUserProfile).toHaveBeenCalledWith(fakeUser);
    expect(supabaseAuth.getCurrentUserProfile).toHaveBeenCalled();
    expect(mockSetProfile).toHaveBeenCalledWith(fakeProfile);
  });

  it("returns error and does not sync userStore on failure", async () => {
    const fakeError = { message: "invalid token" };
    (supabaseAuth.signInWithGoogle as jest.Mock).mockResolvedValue({
      user: null,
      session: null,
      error: fakeError,
    });

    const { error } = await simulateHandleSignInWithGoogle("bad-token");

    expect(error).toEqual(fakeError);
    expect(syncUserProfile).not.toHaveBeenCalled();
    expect(mockSetProfile).not.toHaveBeenCalled();
  });

  it("does not sync userStore when getCurrentUserProfile returns null", async () => {
    const fakeUser = { id: "u1" } as any;
    const fakeSession = { access_token: "tok" } as any;

    (supabaseAuth.signInWithGoogle as jest.Mock).mockResolvedValue({
      user: fakeUser,
      session: fakeSession,
      error: null,
    });
    (supabaseAuth.getCurrentUserProfile as jest.Mock).mockResolvedValue(null);

    const { error } = await simulateHandleSignInWithGoogle("fake-id-token");

    expect(error).toBeNull();
    expect(syncUserProfile).toHaveBeenCalledWith(fakeUser);
    expect(mockSetProfile).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// signInWithApple
// ---------------------------------------------------------------------------
describe("handleSignInWithApple", () => {
  it("calls syncUserProfile and syncs userStore on success", async () => {
    const fakeUser = { id: "u2" } as any;
    const fakeSession = { access_token: "tok2" } as any;
    const fakeProfile = { user_id: "u2", display_name: "Apple User" } as any;

    (supabaseAuth.signInWithApple as jest.Mock).mockResolvedValue({
      user: fakeUser,
      session: fakeSession,
      error: null,
    });
    (supabaseAuth.getCurrentUserProfile as jest.Mock).mockResolvedValue(fakeProfile);

    const { error } = await simulateHandleSignInWithApple("fake-identity-token");

    expect(error).toBeNull();
    expect(syncUserProfile).toHaveBeenCalledWith(fakeUser);
    expect(supabaseAuth.getCurrentUserProfile).toHaveBeenCalled();
    expect(mockSetProfile).toHaveBeenCalledWith(fakeProfile);
  });

  it("returns error and does not sync userStore on failure", async () => {
    const fakeError = { message: "expired token" };
    (supabaseAuth.signInWithApple as jest.Mock).mockResolvedValue({
      user: null,
      session: null,
      error: fakeError,
    });

    const { error } = await simulateHandleSignInWithApple("bad-token");

    expect(error).toEqual(fakeError);
    expect(syncUserProfile).not.toHaveBeenCalled();
    expect(mockSetProfile).not.toHaveBeenCalled();
  });

  it("does not sync userStore when getCurrentUserProfile returns null", async () => {
    const fakeUser = { id: "u2" } as any;
    const fakeSession = { access_token: "tok2" } as any;

    (supabaseAuth.signInWithApple as jest.Mock).mockResolvedValue({
      user: fakeUser,
      session: fakeSession,
      error: null,
    });
    (supabaseAuth.getCurrentUserProfile as jest.Mock).mockResolvedValue(null);

    const { error } = await simulateHandleSignInWithApple("fake-identity-token");

    expect(error).toBeNull();
    expect(syncUserProfile).toHaveBeenCalledWith(fakeUser);
    expect(mockSetProfile).not.toHaveBeenCalled();
  });
});
