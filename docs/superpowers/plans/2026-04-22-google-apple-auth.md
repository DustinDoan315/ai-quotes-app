# Google + Apple OAuth Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken phone OTP login with Google and Apple social sign-in, keeping Supabase as the single auth + database system.

**Architecture:** Native social SDKs (`expo-apple-authentication`, `@react-native-google-signin/google-signin`) obtain identity tokens from the OS. Those tokens are passed to `supabase.auth.signInWithIdToken()`, which creates or finds the user in Supabase. The existing `syncUserProfile()` downstream flow runs unchanged.

**Tech Stack:** Expo ~54, Supabase JS v2, `expo-apple-authentication`, `@react-native-google-signin/google-signin`

---

## Pre-requisites (manual config — do these before any code)

### A. Supabase Dashboard
1. Go to **Authentication → Providers → Google**: enable it, paste your Web Client ID and Client Secret (from step B below). Set "Authorized redirect URIs" to your Supabase project callback URL (shown in the dashboard).
2. Go to **Authentication → Providers → Apple**: enable it. Fill in:
   - Service ID (e.g. `com.dustindoan.inkly.signin`)
   - Apple Team ID (10-char string from developer.apple.com → Membership)
   - Key ID and paste the `.p8` private key content (from step C below)
   - Callback URL: as shown in Supabase dashboard

### B. Google Cloud Console
1. Create a project (or use existing).
2. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**.
3. Create three client IDs:
   - **Web**: Application type = Web. Note the Client ID and Secret — paste into Supabase.
   - **iOS**: Application type = iOS. Bundle ID = `com.dustindoan.inkly`. Note the iOS Client ID.
   - **Android**: Application type = Android. Package = `com.dustindoan.inkly`. Add your SHA-1 fingerprint.
4. Note the iOS Client ID for use in Task 2.

### C. Apple Developer
1. Go to **Identifiers → App IDs → com.dustindoan.inkly**. Enable "Sign In with Apple" capability.
2. Go to **Identifiers → Services IDs**. Create a new Service ID: `com.dustindoan.inkly.signin`. Enable "Sign In with Apple", add your Supabase callback URL as a redirect.
3. Go to **Keys**. Create a key with "Sign In with Apple" enabled. Download the `.p8` file and note the Key ID.
4. Paste Team ID, Key ID, and `.p8` content into Supabase dashboard (step A above).

---

## File Map

| File | Action |
|---|---|
| `src/services/supabase-auth.ts` | Modify — add `signInWithGoogle()`, `signInWithApple()`; remove `signInWithPhoneOtp`, `verifyPhoneOtp` |
| `src/hooks/useSupabaseAuth.ts` | Modify — expose new functions, remove phone OTP handlers |
| `app/login.tsx` | Replace — new OAuth button UI |
| `src/features/auth/usePhoneOtpLogin.ts` | Delete |
| `src/features/auth/OtpCodeInput.tsx` | Delete |
| `src/features/auth/PhoneNumberRow.tsx` | Delete |
| `src/utils/phoneOtp.ts` | Delete |
| `src/utils/otpErrorMessages.ts` | Delete |
| `src/features/profile/ProfilePhoneCard.tsx` | Modify — accept optional provider badge instead |
| `src/features/profile/useProfileAuthedPhone.ts` | Replace — return auth provider instead of phone |
| `src/features/profile/ProfileAuthedView.tsx` | Modify — use provider badge, remove phone hook |

---

## Task 1: Install packages

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install the two auth packages**

```bash
npx expo install expo-apple-authentication @react-native-google-signin/google-signin
```

Expected output: packages added to `node_modules` and `package.json` dependencies.

- [ ] **Step 2: Rebuild the dev client**

Since `@react-native-google-signin/google-signin` contains native code, the dev client must be rebuilt before these packages work on device/simulator.

```bash
npx expo run:ios
# or for Android:
npx expo run:android
```

Wait for the build to complete before continuing.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install expo-apple-authentication and google-signin packages"
```

---

## Task 2: Add OAuth functions to the auth service

**Files:**
- Modify: `src/services/supabase-auth.ts`

- [ ] **Step 1: Replace the file content**

Open `src/services/supabase-auth.ts`. Replace the `signInWithPhoneOtp` and `verifyPhoneOtp` functions with these two new functions. Keep everything else unchanged.

Remove these two functions (lines 46–57):
```typescript
export async function signInWithPhoneOtp(phone: string): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signInWithOtp({ phone });
  return { error };
}

export async function verifyPhoneOtp(
  phone: string,
  token: string,
): Promise<{ session: Session | null; user: User | null; error: AuthError | null }> {
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
  return { session: data.session ?? null, user: data.user ?? null, error };
}
```

Add these two functions in their place:
```typescript
export async function signInWithGoogle(idToken: string): Promise<{
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}> {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
  });
  return { user: data.user ?? null, session: data.session ?? null, error };
}

export async function signInWithApple(identityToken: string): Promise<{
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}> {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: identityToken,
  });
  return { user: data.user ?? null, session: data.session ?? null, error };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors related to `supabase-auth.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/services/supabase-auth.ts
git commit -m "feat: add signInWithGoogle and signInWithApple to auth service"
```

---

## Task 3: Update the useAuth hook

**Files:**
- Modify: `src/hooks/useSupabaseAuth.ts`

- [ ] **Step 1: Replace the hook with the updated version**

Replace the entire content of `src/hooks/useSupabaseAuth.ts` with:

```typescript
import { useUserStore } from "@/appState/userStore";
import { syncUserProfile } from "@/features/auth/authService";
import { supabase } from "@/config/supabase";
import {
  getCurrentUserProfile,
  signInWithGoogle as signInWithGoogleApi,
  signInWithApple as signInWithAppleApi,
  signOut,
  updateUserProfile,
  type UserProfile,
} from "@/services/supabase-auth";
import type { Session, User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

export interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: (idToken: string) => Promise<{ error: unknown }>;
  signInWithApple: (identityToken: string) => Promise<{ error: unknown }>;
  signOut: () => Promise<{ error: unknown }>;
  updateProfile: (updates: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
    bio?: string;
  }) => Promise<{ error: unknown }>;
  refreshProfile: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const userProfile = await getCurrentUserProfile();
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && !profile) {
      getCurrentUserProfile().then(setProfile);
    }
  }, [user, profile]);

  const handleSignInWithGoogle = async (idToken: string) => {
    const { user: newUser, session: newSession, error } = await signInWithGoogleApi(idToken);
    if (!error && newSession && newUser) {
      await syncUserProfile(newUser);
      const userProfile = await getCurrentUserProfile();
      setProfile(userProfile);
      setUser(newUser);
      setSession(newSession);
    }
    return { error };
  };

  const handleSignInWithApple = async (identityToken: string) => {
    const { user: newUser, session: newSession, error } = await signInWithAppleApi(identityToken);
    if (!error && newSession && newUser) {
      await syncUserProfile(newUser);
      const userProfile = await getCurrentUserProfile();
      setProfile(userProfile);
      setUser(newUser);
      setSession(newSession);
    }
    return { error };
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    setProfile(null);
    if (!error) {
      await syncUserProfile(null);
    }
    return { error };
  };

  const handleUpdateProfile = async (updates: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
    bio?: string;
  }) => {
    if (!user) {
      return { error: { message: "No user logged in" } };
    }
    const { error } = await updateUserProfile(user.id, updates);
    if (!error) {
      const updatedProfile = await getCurrentUserProfile();
      setProfile(updatedProfile);
      if (updatedProfile) useUserStore.getState().setProfile(updatedProfile);
    }
    return { error };
  };

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await getCurrentUserProfile();
      setProfile(userProfile);
      if (userProfile) useUserStore.getState().setProfile(userProfile);
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    signInWithGoogle: handleSignInWithGoogle,
    signInWithApple: handleSignInWithApple,
    signOut: handleSignOut,
    updateProfile: handleUpdateProfile,
    refreshProfile,
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors. If there are errors about `signInWithPhoneOtp` or `verifyPhoneOtp` being missing from `UseAuthReturn`, that means a consumer still imports them — fix those imports in the next tasks.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useSupabaseAuth.ts
git commit -m "feat: replace phone OTP handlers with signInWithGoogle and signInWithApple in useAuth"
```

---

## Task 4: Replace the login screen UI

**Files:**
- Modify: `app/login.tsx`

- [ ] **Step 1: Replace the login screen**

Replace the entire content of `app/login.tsx` with:

```typescript
import { useAuth } from "@/hooks/useSupabaseAuth";
import { syncUserProfile } from "@/features/auth/authService";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { goBackOrReplace } from "@/utils/goBackOrReplace";

// Replace with your iOS client ID from Google Cloud Console
const IOS_CLIENT_ID = "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com";
// Replace with your Web client ID from Google Cloud Console (same one pasted in Supabase)
const WEB_CLIENT_ID = "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com";

GoogleSignin.configure({
  iosClientId: IOS_CLIENT_ID,
  webClientId: WEB_CLIENT_ID,
  scopes: ["profile", "email"],
});

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const returnTo = params.returnTo ?? "/(tabs)";
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoadingGoogle(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      const idToken = tokens.idToken;
      if (!idToken) {
        setError("Google sign-in failed. Please try again.");
        return;
      }
      const { error: authError } = await signInWithGoogle(idToken);
      if (authError) {
        setError("Sign-in failed. Please try again.");
        return;
      }
      router.replace(returnTo as never);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled — no error shown
      } else if (e?.code === statusCodes.IN_PROGRESS) {
        // already signing in — ignore
      } else {
        setError("Google sign-in failed. Please try again.");
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError(null);
    setLoadingApple(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const identityToken = credential.identityToken;
      if (!identityToken) {
        setError("Apple sign-in failed. Please try again.");
        return;
      }
      const { error: authError } = await signInWithApple(identityToken);
      if (authError) {
        setError("Sign-in failed. Please try again.");
        return;
      }
      router.replace(returnTo as never);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === "ERR_REQUEST_CANCELED") {
        // user cancelled — no error shown
      } else {
        setError("Apple sign-in failed. Please try again.");
      }
    } finally {
      setLoadingApple(false);
    }
  };

  const isBusy = loadingGoogle || loadingApple;

  return (
    <View
      className="flex-1 bg-transparent px-6"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="mt-4">
        <Pressable
          onPress={() => goBackOrReplace(router, returnTo as never)}
          className="self-start"
          disabled={isBusy}
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <Text className="text-base text-white/80">Back</Text>
        </Pressable>
      </View>

      <View className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <View className="h-28 bg-white/5" />
        <View className="px-6 pb-6 pt-5">
          <Text className="text-2xl font-semibold text-white">Welcome</Text>
          <Text className="mt-2 text-sm text-white/60">
            Get your daily personalized quotes.
          </Text>

          {/* Apple Sign In — only on iOS */}
          {Platform.OS === "ios" && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={16}
              style={{ width: "100%", height: 50, marginTop: 20 }}
              onPress={handleAppleSignIn}
            />
          )}

          {/* Google Sign In */}
          <Pressable
            onPress={handleGoogleSignIn}
            disabled={isBusy}
            className="mt-3 flex-row items-center justify-center rounded-2xl border border-white/20 bg-white/10 py-3.5"
            style={({ pressed }) => ({ opacity: isBusy ? 0.5 : pressed ? 0.8 : 1 })}>
            {loadingGoogle ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-semibold text-white">
                Sign in with Google
              </Text>
            )}
          </Pressable>

          {error ? (
            <Text className="mt-4 text-center text-sm text-red-400">{error}</Text>
          ) : null}

          <Pressable
            onPress={() => router.replace(returnTo as never)}
            disabled={isBusy}
            className="mt-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
            <Text className="text-center text-sm text-white/70">
              Continue as guest
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Fill in the client IDs**

In the file you just wrote, replace:
- `YOUR_IOS_CLIENT_ID` with the iOS OAuth client ID from Google Cloud Console
- `YOUR_WEB_CLIENT_ID` with the Web OAuth client ID from Google Cloud Console

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors in `app/login.tsx`.

- [ ] **Step 4: Commit**

```bash
git add app/login.tsx
git commit -m "feat: replace phone OTP login screen with Google and Apple OAuth buttons"
```

---

## Task 5: Delete phone OTP files

**Files:**
- Delete: `src/features/auth/usePhoneOtpLogin.ts`
- Delete: `src/features/auth/OtpCodeInput.tsx`
- Delete: `src/features/auth/PhoneNumberRow.tsx`
- Delete: `src/utils/phoneOtp.ts`
- Delete: `src/utils/otpErrorMessages.ts`

- [ ] **Step 1: Delete the files**

```bash
rm src/features/auth/usePhoneOtpLogin.ts \
   src/features/auth/OtpCodeInput.tsx \
   src/features/auth/PhoneNumberRow.tsx \
   src/utils/phoneOtp.ts \
   src/utils/otpErrorMessages.ts
```

- [ ] **Step 2: Check for any remaining imports of deleted files**

```bash
npx tsc --noEmit
```

If TypeScript reports "cannot find module" errors pointing to the deleted files, find and remove those import lines. `libphonenumber-js` is also now unused — check if it's imported anywhere else:

```bash
grep -r "libphonenumber-js" src/ app/
```

If no results, it can be uninstalled:
```bash
npm uninstall libphonenumber-js react-native-country-picker-modal
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove phone OTP auth files and unused dependencies"
```

---

## Task 6: Update profile view — remove phone card

**Files:**
- Modify: `src/features/profile/useProfileAuthedPhone.ts`
- Modify: `src/features/profile/ProfileAuthedView.tsx`

- [ ] **Step 1: Replace `useProfileAuthedPhone.ts` with an auth-provider hook**

Replace the entire content of `src/features/profile/useProfileAuthedPhone.ts`:

```typescript
import { getCurrentUser } from "@/services/supabase-auth";
import { useEffect, useState } from "react";

/** Returns a human-readable label for the social provider the user signed in with. */
export function useProfileAuthedPhone() {
  const [authProvider, setAuthProvider] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const user = await getCurrentUser();
      if (!user || cancelled) return;
      const provider = (user.app_metadata?.provider as string | undefined) ?? null;
      if (!provider || provider === "anonymous") {
        setAuthProvider(null);
        return;
      }
      const label =
        provider === "google" ? "Google" :
        provider === "apple" ? "Apple" :
        provider;
      setAuthProvider(label);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Keep the same return shape so ProfileAuthedView needs minimal change
  return { phoneDisplay: authProvider ? `Signed in with ${authProvider}` : null, phoneVerified: true };
}
```

- [ ] **Step 2: Verify `ProfileAuthedView.tsx` still works**

Open `src/features/profile/ProfileAuthedView.tsx`. The file already uses `useProfileAuthedPhone()` and renders `ProfilePhoneCard` only when `phoneDisplay` is truthy (line 200–205). No changes are needed — when the user has no phone, `phoneDisplay` will be `null` and the card won't render. When they signed in with Google/Apple, the card will show "Signed in with Google" / "Signed in with Apple".

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/profile/useProfileAuthedPhone.ts
git commit -m "feat: show auth provider in profile instead of phone number"
```

---

## Task 7: End-to-end verification

- [ ] **Step 1: Start the app**

```bash
npx expo run:ios
```

- [ ] **Step 2: Test Google sign-in**

1. On the login screen, tap "Sign in with Google"
2. Complete the Google account picker
3. App should navigate to `/(tabs)` (home)
4. Open Profile tab — should show "Signed in with Google" badge
5. Sign out — app returns to guest state

- [ ] **Step 3: Test Apple sign-in (iOS only)**

1. Tap "Sign in with Apple" button
2. Authenticate with Face ID / Touch ID
3. App should navigate to `/(tabs)`
4. Open Profile tab — should show "Signed in with Apple" badge
5. Sign out — app returns to guest state

- [ ] **Step 4: Test repeat sign-in (no duplicate user)**

1. Sign in with Google
2. Sign out
3. Sign in with Google again with the same account
4. Verify same user profile is returned (check display name is preserved)

- [ ] **Step 5: Test guest flow is intact**

1. On login screen, tap "Continue as guest"
2. App returns to home as guest — no crash
3. Profile tab shows guest view with "Sign In" button
