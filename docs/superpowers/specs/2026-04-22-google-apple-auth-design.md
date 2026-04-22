# Auth Replacement: Google + Apple OAuth via Supabase

**Date:** 2026-04-22  
**Status:** Approved

## Context

The app currently uses Supabase phone OTP login. The OTP flow is incomplete (SMS sending not fully set up) and not suitable for production. The goal is to replace it with Google and Apple social sign-in — the lowest-friction auth for new users, and required by App Store guidelines when any social login is offered.

Firebase was considered but rejected: it would require two auth systems (Firebase for auth, Supabase for database), native SDK heavy setup, and custom JWT bridging for Supabase RLS. Staying with Supabase Auth is the minimum-config path.

## Approach

Keep Supabase as the single auth + database system. Add Google and Apple as OAuth identity providers. The user taps a social button → native SDK returns an identity token → `supabase.auth.signInWithIdToken()` creates or finds the user → existing `syncUserProfile()` runs unchanged.

## Files Changed

| File | Change |
|---|---|
| `src/services/supabase-auth.ts` | Add `googleSignIn()`, `appleSignIn()`. Remove phone OTP functions. |
| `src/hooks/useSupabaseAuth.ts` | Expose `signInWithGoogle()`, `signInWithApple()`. Remove `sendCode()`, `verifyCode()`. |
| `app/login.tsx` | Replace phone/OTP UI with two OAuth buttons. |
| `src/features/auth/usePhoneOtpLogin.ts` | Delete. |
| `src/features/auth/OtpCodeInput.tsx` | Delete. |
| `src/features/auth/PhoneNumberRow.tsx` | Delete. |
| `src/utils/phoneOtp.ts` | Delete. |
| `src/utils/otpErrorMessages.ts` | Delete. |
| `src/features/profile/ProfilePhoneCard.tsx` | Hide or replace with auth provider badge. |
| `src/features/profile/useProfileAuthedPhone.ts` | Remove or repurpose. |

## Files Unchanged

- `src/features/auth/authService.ts` — `syncUserProfile()` works with any Supabase user
- `src/appState/userStore.ts` — auth state interface unchanged
- `src/bootstrap/useAppBootstrap.ts` — anonymous session + session listener unchanged
- `app/index.tsx`, `app/_layout.tsx` — navigation guards unchanged
- `supabase/migrations/` — no schema changes needed
- All subscription, usage, AI, and onboarding code

## New Packages

```
expo-apple-authentication      # Apple Sign In (Expo managed)
@react-native-google-signin/google-signin  # Google Sign In
```

## External Config (one-time setup)

### Supabase Dashboard
- Enable **Google** provider → paste Web Client ID + Secret from Google Cloud Console
- Enable **Apple** provider → paste Service ID, Team ID, Key ID, Private Key from Apple Developer

### Google Cloud Console
- Create OAuth 2.0 client IDs: Web (for Supabase), iOS, Android
- Add iOS bundle ID and Android package name

### Apple Developer
- Enable "Sign In with Apple" capability on the App ID
- Create a Service ID (for Supabase redirect)
- Create a Sign In with Apple key (p8 file)

## Auth Flow

```
User taps "Sign in with Google"
  → @react-native-google-signin gets idToken
  → supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })
  → Supabase creates/finds user in auth.users
  → syncUserProfile(user) runs → user_profiles row created/fetched
  → authState set to "authenticated"
  → navigate to /(tabs)

User taps "Sign in with Apple"
  → expo-apple-authentication gets identityToken
  → supabase.auth.signInWithIdToken({ provider: 'apple', token: identityToken })
  → same flow as Google above
```

## Profile Card Side Effect

`ProfileAuthedView` currently shows a phone number card. After this change users have no phone. The card should be hidden (or replaced with a read-only "Signed in with Google/Apple" badge derived from `user.app_metadata.provider`).

## Verification

1. Fresh install → tap "Sign in with Google" → lands on home tab, `authState === "authenticated"`
2. Fresh install → tap "Sign in with Apple" → same result
3. Sign out → sign back in with same provider → same user profile returned (no duplicate)
4. Guest user taps "Sign in" → completes OAuth → guest data migrated (display name preserved)
5. Profile tab shows no phone card (or shows provider badge)
6. Existing anonymous session bootstrap still works for non-logged-in users
