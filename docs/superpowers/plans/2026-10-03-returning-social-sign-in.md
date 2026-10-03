# Returning social sign-in from guest

## Problem and scope

A guest session currently always attempts identity linking. An Apple or Google identity already attached to a permanent account produces a conflict instead of signing into that account.

Implement a shared, bounded fallback in `src/services/supabase-auth.ts` for both providers. Keep new-identity upgrades and their existing memory migration unchanged. No database changes, account deletion, or automatic merging between different user IDs.

## Implementation

1. Check the current session and surface lookup failures.
2. With a guest session, attempt linking as today.
3. Recognize `identity_already_exists` by structured error code, retaining compatibility with older identity conflict messages.
4. Only for that conflict, call normal ID-token sign-in with the same provider credentials. Do not sign out beforehand. Return the authenticated account with `upgradedAnonymousUser: false`, so local guest memories retain their ownership.
5. Return other linking errors and fallback sign-in errors without masking them.

## Acceptance and verification

- Both Apple and Google support guest → existing account login.
- A new identity still upgrades the same guest UUID.
- Network/token/configuration failures never trigger fallback account creation.
- Failed fallback does not explicitly clear the guest session or reassign memories.
- Tests cover structured and legacy conflicts, exact credential forwarding, failures, and direct sign-in without a guest session.
- Run TypeScript, scoped lint, and the full Jest suite. Native Apple/Google credentials and live Supabase flows remain device checks; no iOS build.

## Device checks

For each provider: sign in, sign out, create a guest moment, sign in with the same provider account. Confirm the original account and memories return. Guest content is retained separately, not automatically merged. Repeat with a new provider identity to confirm same-UUID upgrade; test cancellation and airplane mode to confirm no unwanted account switch.
