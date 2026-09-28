# V2 Emoji Reactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore immediate emoji-only reactions on friends' quote photos, including a curated picker opened from `+`, without exposing text reply controls.

**Architecture:** Secure the existing `user_photo_reactions` table with a tracked migration, then reuse the existing write and burst flow with a curated emoji set. Gate the action bar to a permanent signed-in user viewing another user's photo in the friend feed; enforce the friend relationship and non-anonymous JWT in RLS.

**Tech Stack:** Expo/React Native, Supabase JS, PostgreSQL 17, Jest, Supabase CLI and pgTAP.

**Spec:** [2026-09-27 V2 design spec](../specs/2026-09-27-v2-emoji-reactions-and-3x5-quote-composition-design.md)

## Global Constraints

- Show ❤️, 🔥, 👏, and a `+` control on friends' quote photos; `+` opens a curated emoji picker and selecting an emoji sends immediately.
- Hide reactions on own photos, guest-only photos, and photos outside the friend feed. Supabase anonymous sign-ins use the `authenticated` database role, so check the `is_anonymous` JWT claim in RLS.
- Remove the text composer and message-send controls from this flow. Keep existing stored comments untouched.
- Keep one row per photo, actor, and emoji; repeated reactions are idempotent, including nullable legacy guest columns.
- No counts, notifications, or reaction inbox; no new dependency.

## Review Focus

- **Anonymous or guest actor:** cannot see or write reactions. Pin in Tasks 1 and 2 RLS/service tests.
- **Self photo:** cannot see reaction controls or insert directly. Pin in Task 1 RLS test and Task 3 visibility test.
- **Unrelated user photo:** direct write is rejected even if the caller crafts a request. Pin in Task 1 friend-policy test.
- **Repeated reaction with null guest id:** only one row exists and an existing comment is unchanged. Pin in Tasks 1 and 2 duplicate tests.
- **Legacy comment data:** migration and repeat reaction preserve it while the new UI exposes no composer. Pin in Tasks 1 and 2 tests and Task 3 UI check.

---

### Task 1: Tracked reaction schema and RLS

**Files:**
- Create: generated migration from `npx supabase migration new secure_user_photo_reactions`
- Create: `supabase/tests/database/user_photo_reactions.test.sql`

**Interfaces:**
- Produces: `public.user_photo_reactions` with existing columns (`id`, `photo_id`, `reactor_user_id`, `reactor_guest_id`, `type`, `comment`, `created_at`), and the accepted types `love`, `clap`, `fire`, `pleading`, `sparkles`, `heart_hands`, `laugh`, `party`, `white_heart`.
- RLS permits INSERT only for non-anonymous `authenticated` actors whose `reactor_user_id = auth.uid()`, whose `reactor_guest_id IS NULL`, and whose target is a non-own photo from a user connected by the existing directed friend row. Check `(auth.jwt()->>'is_anonymous')::boolean IS FALSE`; Supabase anonymous sign-ins use the `authenticated` role. Grant no table access to `anon`; grant only INSERT to `authenticated`.
- Enforce `UNIQUE NULLS NOT DISTINCT (photo_id, reactor_user_id, reactor_guest_id, type)` so the existing `onConflict` key also works when the actor's guest column is NULL. The live project is PostgreSQL 17 and the current duplicate-key query returned zero rows.

- [ ] **Step 1: Write failing pgTAP checks**

Add pgTAP assertions named `reactions_table_exists`, `reaction_types_are_checked`, `unique_key_treats_nulls_as_equal`, `anon_cannot_insert`, `anonymous_auth_user_cannot_insert`, `user_cannot_react_to_self`, `user_cannot_react_to_unrelated_photo`, `friend_can_insert`, and `duplicate_null_guest_keeps_legacy_comment`. For write cases, use fixture users, directed `friends` rows, and photos in the test transaction; roll back all fixtures. Assert that the unique index has `indnullsnotdistinct = true`; insert the same `(photo_id, reactor_user_id, NULL, type)` twice with `ON CONFLICT DO NOTHING` and verify one row remains with its original comment.

- [ ] **Step 2: Run the database test against the current local schema**

Run: `npx supabase start` then `npx supabase test db supabase/tests/database/user_photo_reactions.test.sql`
Expected: FAIL because the table and new policy contract are absent from local migration history.

- [ ] **Step 3: Create the migration using the Supabase CLI**

Check `npx supabase --version` and `npx supabase migration --help`, then create the migration with the command above. Add an idempotent table definition for clean environments; reconcile the existing live schema by replacing the type check and unique constraint, dropping `dev_all_access`, both permissive insert policies, and the old select policy, revoking all table privileges from `PUBLIC`, `anon`, and `authenticated`, granting only INSERT to `authenticated`, and enabling RLS with the INSERT-only policy above. The policy checks `(select (auth.jwt()->>'is_anonymous')::boolean) IS FALSE`, `reactor_user_id = (select auth.uid())`, `reactor_guest_id IS NULL`, a non-own `user_photos` row with `friends` or `public` visibility, and the actor's directed friend row. Preserve all existing `comment` values. Before adding the new unique constraint, assert there are no duplicate key groups; stop and inspect instead of deleting comment-bearing rows if the assertion fails.

- [ ] **Step 4: Run the local database test**

Run the migration and pgTAP tests in a disposable local Supabase database; do not reset an existing local database unless it is confirmed disposable. In an isolated local project, run `npx supabase db reset --local`, then `npx supabase test db supabase/tests/database/user_photo_reactions.test.sql`.
Expected: migrations apply locally and pgTAP passes friend allow, self/other/anon/Supabase-anonymous deny, idempotency, comment preservation, and constraint checks. Do not apply the migration to the linked production project.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations supabase/tests/database/user_photo_reactions.test.sql
git commit -m "fix: secure friend photo emoji reactions"
```

### Task 2: Idempotent emoji write service

**Files:**
- Modify: `src/services/media/userPhotoReactions.ts`
- Test: `__tests__/userPhotoReactions.test.ts`

**Interfaces:**
- Produces: `UserPhotoReactionType` with the nine database identifiers above, `PHOTO_REACTION_EMOJIS: Record<UserPhotoReactionType, string>`, and `sendUserPhotoReaction({ photoId, userId, type }): Promise<boolean>`.
- The service rejects missing `photoId` or `userId`, writes `reactor_guest_id: null`, omits `comment`, and uses `.upsert(row, { onConflict: "photo_id,reactor_user_id,reactor_guest_id,type", ignoreDuplicates: true })` without selecting rows.

- [ ] **Step 1: Write failing service tests**

Add named tests `requiresPhotoAndAccountUser`, `writesOnlyReactionColumns`, `ignoresDuplicateRows`, and `returnsFalseOnDatabaseError`. Assert `sendUserPhotoReaction({ photoId: "photo-1", userId: "user-1", type: "love" })` calls `upsert` with `reactor_guest_id: null`, no `comment` field, `onConflict: "photo_id,reactor_user_id,reactor_guest_id,type"`, and `ignoreDuplicates: true`; null `userId` makes no Supabase call.

- [ ] **Step 2: Run the service test**

Run: `npm test -- --runInBand __tests__/userPhotoReactions.test.ts`
Expected: FAIL because the service still accepts guest/comment parameters and the picker identifiers are not defined.

- [ ] **Step 3: Implement the authenticated idempotent write**

Update the service signature and payload exactly as above. Define the curated emoji map in this existing service module so UI and burst animation use the same identifiers.

- [ ] **Step 4: Run the service test**

Run: `npm test -- --runInBand __tests__/userPhotoReactions.test.ts`
Expected: PASS for guard, payload, duplicate, and error behavior.

- [ ] **Step 5: Commit**

```bash
git add src/services/media/userPhotoReactions.ts __tests__/userPhotoReactions.test.ts
git commit -m "feat: support curated idempotent quote reactions"
```

### Task 3: Friend-only reaction controls

**Files:**
- Modify: `src/features/home/useHomeFeedState.ts`
- Modify: `src/features/home/HomeActionBar.tsx`
- Modify: `app/(tabs)/index.tsx`
- Test: `__tests__/reactionVisibility.test.ts`

**Interfaces:**
- Consumes: `UserPhotoReactionType`, `PHOTO_REACTION_EMOJIS`, and `sendUserPhotoReaction` from Task 2.
- `canReactToQuotePhoto(actorUserId: string | null, quoteOwnerUserId: string | null): boolean` returns true only when both IDs are permanent account IDs and differ. Feed authorization supplies the friend list; RLS re-checks the relationship and Supabase's anonymous JWT claim.
- `HomeActionBar` renders only the fixed emoji buttons and `+` when the hook supplies `shouldShowReactions`; choosing any emoji calls `onReact(type)` and closes the picker.

- [ ] **Step 1: Write failing visibility tests**

Add named tests `allowsFriendPhotoForAccount`, `hidesOwnPhoto`, and `hidesGuestPhotos` with these assertions:

```ts
expect(canReactToQuotePhoto("user-1", "user-2")).toBe(true);
expect(canReactToQuotePhoto("user-1", "user-1")).toBe(false);
expect(canReactToQuotePhoto(null, "user-2")).toBe(false);
expect(canReactToQuotePhoto("user-1", null)).toBe(false);
```

- [ ] **Step 2: Run the visibility test**

Run: `npm test -- --runInBand __tests__/reactionVisibility.test.ts`
Expected: FAIL because the visibility function is not defined.

- [ ] **Step 3: Gate the existing burst handler by the active photo owner**

Pass the actual profile account ID (`profile?.user_id ?? null`) to `useHomeFeedState`; include `userId` in the quote shape; resolve the active quote owner and calculate `shouldShowReactions`. Remove guest IDs and all composer/message state and handlers. Keep the existing burst animation, sourcing each burst emoji from `PHOTO_REACTION_EMOJIS`.

- [ ] **Step 4: Replace message UI with emoji bar and `+` picker**

In `HomeActionBar`, render ❤️, 🔥, 👏 plus `+` for active friend photos. Show the curated choices from `PHOTO_REACTION_EMOJIS` when `+` is pressed, send immediately on selection, and add button roles/labels. Remove composer props, text input, send button, and sent-message label. Leave unused translation strings and database comments intact.

- [ ] **Step 5: Run focused and full verification**

Run: `npm test -- --runInBand __tests__/reactionVisibility.test.ts __tests__/userPhotoReactions.test.ts`
Run: `npm run lint`
Run: `npx tsc --noEmit`
Expected: all pass. In the app, verify a friend quote shows reactions, own/guest photos do not, `+` sends a selected emoji and bursts, repeated taps stay idempotent, and no message composer is present.

- [ ] **Step 6: Commit**

```bash
git add src/features/home/useHomeFeedState.ts src/features/home/HomeActionBar.tsx 'app/(tabs)/index.tsx' __tests__/reactionVisibility.test.ts
git commit -m "feat: restore emoji-only friend reactions"
```
