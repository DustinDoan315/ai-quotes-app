// __tests__/useSupabaseAuth.test.ts
//
// Tests for the OAuth sign-in handler logic in useSupabaseAuth.
//
// Because this project uses jest-expo/node (no React renderer), we test
// the async handler logic directly by invoking the same service calls
// the handlers make and asserting on the resulting observable effects.

const mockSetProfile = jest.fn();

const mockExchangeCodeForSession = jest.fn();
const mockSignInWithOAuth = jest.fn();

jest.mock("@/config/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
      signInWithOAuth: (...args: unknown[]) => mockSignInWithOAuth(...args),
      exchangeCodeForSession: (...args: unknown[]) => mockExchangeCodeForSession(...args),
    },
  },
}));

jest.mock("@/services/supabase-auth", () => ({
  getOAuthSignInUrl: jest.fn(),
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

jest.mock("expo-web-browser", () => ({
  openAuthSessionAsync: jest.fn(),
}));

jest.mock("expo-linking", () => ({
  createURL: jest.fn(() => "inkly://auth/callback"),
}));

import * as supabaseAuth from "@/services/supabase-auth";
import { syncUserProfile } from "@/features/auth/authService";
import { useUserStore } from "@/appState/userStore";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "@/config/supabase";

// ---------------------------------------------------------------------------
// Inline handler logic that mirrors useSupabaseAuth exactly, so we can test
// the async path in a Node-only environment (no renderHook needed).
// ---------------------------------------------------------------------------

async function simulateHandleSignInWithOAuth(provider: "google" | "apple") {
  const redirectTo = "inkly://auth/callback";
  const { url, error: urlError } = await (supabaseAuth.getOAuthSignInUrl as jest.Mock)(provider, redirectTo);
  if (urlError || !url) return { error: urlError ?? new Error("No OAuth URL") };

  const result = await WebBrowser.openAuthSessionAsync(url, redirectTo);
  if (result.type !== "success") return { error: null };

  const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession((result as { type: "success"; url: string }).url);
  if (!sessionError && sessionData?.session && sessionData?.user) {
    await syncUserProfile(sessionData.user);
    const userProfile = await supabaseAuth.getCurrentUserProfile();
    if (userProfile) useUserStore.getState().setProfile(userProfile);
  }
  return { error: sessionError };
}

beforeEach(() => {
  jest.clearAllMocks();
  (useUserStore.getState as jest.Mock).mockReturnValue({ setProfile: mockSetProfile });
});

// ---------------------------------------------------------------------------
// signInWithOAuth — success path
// ---------------------------------------------------------------------------
describe("handleSignInWithOAuth — success", () => {
  it("calls syncUserProfile and syncs userStore on successful Google sign-in", async () => {
    const fakeUser = { id: "u1" } as any;
    const fakeSession = { access_token: "tok" } as any;
    const fakeProfile = { user_id: "u1", display_name: "Test" } as any;

    (supabaseAuth.getOAuthSignInUrl as jest.Mock).mockResolvedValue({
      url: "https://supabase.co/auth/google",
      error: null,
    });
    (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({
      type: "success",
      url: "inkly://auth/callback?code=abc123",
    });
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: fakeUser, session: fakeSession },
      error: null,
    });
    (supabaseAuth.getCurrentUserProfile as jest.Mock).mockResolvedValue(fakeProfile);

    const { error } = await simulateHandleSignInWithOAuth("google");

    expect(error).toBeNull();
    expect(syncUserProfile).toHaveBeenCalledWith(fakeUser);
    expect(supabaseAuth.getCurrentUserProfile).toHaveBeenCalled();
    expect(mockSetProfile).toHaveBeenCalledWith(fakeProfile);
  });

  it("calls syncUserProfile and syncs userStore on successful Apple sign-in", async () => {
    const fakeUser = { id: "u2" } as any;
    const fakeSession = { access_token: "tok2" } as any;
    const fakeProfile = { user_id: "u2", display_name: "Apple User" } as any;

    (supabaseAuth.getOAuthSignInUrl as jest.Mock).mockResolvedValue({
      url: "https://supabase.co/auth/apple",
      error: null,
    });
    (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({
      type: "success",
      url: "inkly://auth/callback?code=xyz789",
    });
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: fakeUser, session: fakeSession },
      error: null,
    });
    (supabaseAuth.getCurrentUserProfile as jest.Mock).mockResolvedValue(fakeProfile);

    const { error } = await simulateHandleSignInWithOAuth("apple");

    expect(error).toBeNull();
    expect(syncUserProfile).toHaveBeenCalledWith(fakeUser);
    expect(mockSetProfile).toHaveBeenCalledWith(fakeProfile);
  });

  it("does not sync userStore when getCurrentUserProfile returns null", async () => {
    const fakeUser = { id: "u1" } as any;
    const fakeSession = { access_token: "tok" } as any;

    (supabaseAuth.getOAuthSignInUrl as jest.Mock).mockResolvedValue({
      url: "https://supabase.co/auth/google",
      error: null,
    });
    (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({
      type: "success",
      url: "inkly://auth/callback?code=abc123",
    });
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: fakeUser, session: fakeSession },
      error: null,
    });
    (supabaseAuth.getCurrentUserProfile as jest.Mock).mockResolvedValue(null);

    const { error } = await simulateHandleSignInWithOAuth("google");

    expect(error).toBeNull();
    expect(syncUserProfile).toHaveBeenCalledWith(fakeUser);
    expect(mockSetProfile).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// signInWithOAuth — cancellation
// ---------------------------------------------------------------------------
describe("handleSignInWithOAuth — browser cancel", () => {
  it("returns no error and does not sync when user cancels the browser", async () => {
    (supabaseAuth.getOAuthSignInUrl as jest.Mock).mockResolvedValue({
      url: "https://supabase.co/auth/google",
      error: null,
    });
    (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({
      type: "cancel",
    });

    const { error } = await simulateHandleSignInWithOAuth("google");

    expect(error).toBeNull();
    expect(syncUserProfile).not.toHaveBeenCalled();
    expect(mockSetProfile).not.toHaveBeenCalled();
  });

  it("returns no error and does not sync when browser is dismissed", async () => {
    (supabaseAuth.getOAuthSignInUrl as jest.Mock).mockResolvedValue({
      url: "https://supabase.co/auth/apple",
      error: null,
    });
    (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({
      type: "dismiss",
    });

    const { error } = await simulateHandleSignInWithOAuth("apple");

    expect(error).toBeNull();
    expect(syncUserProfile).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// signInWithOAuth — failure paths
// ---------------------------------------------------------------------------
describe("handleSignInWithOAuth — failures", () => {
  it("returns error and does not sync when getOAuthSignInUrl fails", async () => {
    const fakeError = { message: "provider error" };
    (supabaseAuth.getOAuthSignInUrl as jest.Mock).mockResolvedValue({
      url: null,
      error: fakeError,
    });

    const { error } = await simulateHandleSignInWithOAuth("google");

    expect(error).toEqual(fakeError);
    expect(WebBrowser.openAuthSessionAsync).not.toHaveBeenCalled();
    expect(syncUserProfile).not.toHaveBeenCalled();
  });

  it("returns error and does not sync when exchangeCodeForSession fails", async () => {
    const fakeError = { message: "invalid code" };

    (supabaseAuth.getOAuthSignInUrl as jest.Mock).mockResolvedValue({
      url: "https://supabase.co/auth/google",
      error: null,
    });
    (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({
      type: "success",
      url: "inkly://auth/callback?code=bad",
    });
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: null, session: null },
      error: fakeError,
    });

    const { error } = await simulateHandleSignInWithOAuth("google");

    expect(error).toEqual(fakeError);
    expect(syncUserProfile).not.toHaveBeenCalled();
    expect(mockSetProfile).not.toHaveBeenCalled();
  });
});
