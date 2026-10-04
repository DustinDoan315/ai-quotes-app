import { rememberGuestMerge, bindGuestMergeTarget, resumeGuestMerge, finishGuestIdentityUpgrade } from "@/services/guestAccountMerge";
import { supabase } from "@/config/supabase";
import type { AuthError, Session, User } from "@supabase/supabase-js";
import type { SignInWithIdTokenCredentials } from "@supabase/auth-js";

export type IdentityLinkingErrorCode =
  | "manual_identity_linking_disabled"
  | "identity_already_linked";

/**
 * An actionable authentication error returned when an anonymous account cannot
 * be upgraded without changing its Inkly user ID. Existing-identity conflicts
 * use normal provider sign-in; this error remains for unresolved linking failures.
 */
export class IdentityLinkingError extends Error {
  readonly code: IdentityLinkingErrorCode;

  constructor(code: IdentityLinkingErrorCode) {
    super(
      code === "manual_identity_linking_disabled"
        ? "Sign-in could not preserve your guest content because identity linking is unavailable. Please try again later or contact Inkly support."
        : "This Apple or Google account is already linked to another Inkly account. Sign in to that account instead.",
    );
    this.name = "IdentityLinkingError";
    this.code = code;
  }
}

export type SocialSignInError = AuthError | IdentityLinkingError | Error;

export type DeleteAccountErrorCode =
  | "no_authenticated_session"
  | "anonymous_session"
  | "request_failed"
  | "invalid_response";

export class DeleteAccountError extends Error {
  readonly code: DeleteAccountErrorCode;

  constructor(code: DeleteAccountErrorCode, message?: string) {
    super(
      message ??
        (code === "no_authenticated_session"
          ? "Sign in to delete your account."
          : code === "anonymous_session"
            ? "Guest accounts do not have an Inkly account to delete."
            : code === "invalid_response"
              ? "Inkly could not confirm that your account was deleted. Please contact support."
              : "Inkly could not delete your account. Please try again."),
    );
    this.name = "DeleteAccountError";
    this.code = code;
  }
}

export type DeleteCurrentAccountResult = {
  deleted: boolean;
  error: DeleteAccountError | null;
};

export type UserProfile = {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  home_vibe_key: string | null;
  created_at: string;
  updated_at: string;
};

export async function signInAnonymously(): Promise<{
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}> {
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    return { user: data?.user ?? null, session: data?.session ?? null, error };
  } catch (err) {
    return { user: null, session: null, error: err as AuthError };
  }
}

export async function signInWithGoogle(
  idToken: string,
  nonce?: string,
  accessToken?: string,
): Promise<{
  user: User | null;
  session: Session | null;
  error: SocialSignInError | null;
  upgradedAnonymousUser: boolean;
}> {
  return signInOrLinkIdentity({
    provider: "google",
    token: idToken,
    nonce,
    access_token: accessToken,
  });
}

export async function signInWithApple(identityToken: string, nonce?: string): Promise<{
  user: User | null;
  session: Session | null;
  error: SocialSignInError | null;
  upgradedAnonymousUser: boolean;
}> {
  return signInOrLinkIdentity({ provider: "apple", token: identityToken, nonce });
}

async function signInOrLinkIdentity(
  credentials: SignInWithIdTokenCredentials,
): Promise<{
  user: User | null;
  session: Session | null;
  error: SocialSignInError | null;
  upgradedAnonymousUser: boolean;
}> {
  const {
    data: { session: currentSession },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    return { user: null, session: null, error: sessionError, upgradedAnonymousUser: false };
  }

  if (currentSession?.user.is_anonymous) {
    const { data, error } = await supabase.auth.linkIdentity(credentials);
    const linkingError = error ? classifyIdentityLinkingError(error) : null;
    if (!(linkingError instanceof IdentityLinkingError && linkingError.code === "identity_already_linked")) {
      if (!error && data.user?.id === currentSession.user.id) {
        await finishGuestIdentityUpgrade(data.user.id);
      }
      return {
        user: data.user ?? null,
        session: data.session ?? null,
        error: linkingError,
        upgradedAnonymousUser: !error && data.user?.id === currentSession.user.id,
      };
    }
    try {
      // Persist proof before the provider replaces the anonymous session.
      await rememberGuestMerge(currentSession);
    } catch {
      return { user: null, session: currentSession, error: new Error("Could not preserve guest memories. Please try signing in again."), upgradedAnonymousUser: false };
    }
    // The provider belongs to an existing account. Authenticate that account
    // without clearing the guest session first or relabeling its memories.
  }

  const { data, error } = await supabase.auth.signInWithIdToken(credentials);
  if (!error && data.user && data.session && !data.user.is_anonymous) {
    try {
      await bindGuestMergeTarget(data.user.id);
      await resumeGuestMerge(data.user.id);
    } catch {
      // The destination login succeeded. Preserve pending proof for retry;
      // never delete or locally reassign photos before server confirmation.
      console.warn("[Auth] Guest memory transfer is pending; retry from Memories.");
    }
  }
  return {
    user: data.user ?? null,
    session: data.session ?? null,
    error,
    upgradedAnonymousUser: false,
  };
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/** Removes only the device's Supabase session after the server has deleted it. */
export async function signOutLocally(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut({ scope: "local" });
  return { error };
}

/**
 * Calls the authenticated deletion function. It deliberately does not sign out
 * or change local state: callers must only clear data after `deleted` is true.
 */
export async function deleteCurrentAccount(): Promise<DeleteCurrentAccountResult> {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return {
        deleted: false,
        error: new DeleteAccountError("no_authenticated_session"),
      };
    }

    if (session.user.is_anonymous) {
      return {
        deleted: false,
        error: new DeleteAccountError("anonymous_session"),
      };
    }

    const { data, error } = await supabase.functions.invoke<{ deleted?: boolean }>(
      "delete-account",
      { body: { confirmation: "DELETE" } },
    );

    if (error) {
      return {
        deleted: false,
        error: new DeleteAccountError("request_failed", error.message),
      };
    }

    if (!data?.deleted) {
      return {
        deleted: false,
        error: new DeleteAccountError("invalid_response"),
      };
    }

    return { deleted: true, error: null };
  } catch (error) {
    return {
      deleted: false,
      error: new DeleteAccountError(
        "request_failed",
        error instanceof Error ? error.message : undefined,
      ),
    };
  }
}

async function clearStoredSession(): Promise<void> {
  await signOutLocally();
}

function classifyIdentityLinkingError(error: AuthError): SocialSignInError {
  if (error.code === "identity_already_exists") {
    return new IdentityLinkingError("identity_already_linked");
  }
  if (error.code === "manual_linking_disabled") {
    return new IdentityLinkingError("manual_identity_linking_disabled");
  }
  // Structured codes take precedence; message matching is for older servers.
  if (error.code) return error;
  const message = error.message.toLowerCase();
  if (
    (message.includes("manual") && message.includes("link") && message.includes("disabled")) ||
    (message.includes("identity linking") && message.includes("disabled"))
  ) {
    return new IdentityLinkingError("manual_identity_linking_disabled");
  }

  if (
    message.includes("identity") &&
    (message.includes("already linked") ||
      message.includes("already associated") ||
      message.includes("already exists"))
  ) {
    return new IdentityLinkingError("identity_already_linked");
  }

  return error;
}

export async function getSessionSafely(): Promise<{
  session: Session | null;
  error: AuthError | null;
}> {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes("refresh token")) {
        try {
          await clearStoredSession();
        } catch {
          // Best effort cleanup for corrupt local auth state.
        }
      }
      return { session: null, error };
    }

    return { session, error: null };
  } catch (err) {
    return { session: null, error: err as AuthError };
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) return null;
  return data;
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return getUserProfile(user.id);
}

export async function ensureUserProfile(userId: string): Promise<UserProfile | null> {
  const { data: existing } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return existing;
  const { data: inserted, error } = await supabase
    .from("user_profiles")
    .insert({ user_id: userId })
    .select()
    .single();
  if (error) return null;
  return inserted;
}

export async function updateUserProfile(
  userId: string,
  updates: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
    bio?: string;
    home_vibe_key?: string | null;
  },
): Promise<{ data: UserProfile | null; error: unknown }> {
  const { data, error } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();
  return { data, error };
}

export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange((event, session) => callback(event, session));
}
