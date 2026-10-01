# Screenshot and Save Repairs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Track completion with the checkboxes below.

**Goal:** Make saves reliable, restore existing-account login, and repair the photographed feed/onboarding issues.

**Architecture:** Keep the existing services, hooks, routes, and card components. Separate persistence success from preview/local follow-up success; distinguish account sign-in from guest upgrade. Apply Locket's photo/caption/metadata hierarchy with the user's updated square, edge-to-edge card requirement.

**Tech Stack:** Expo / React Native, TypeScript, Supabase, Zustand, existing Jest tooling. No new dependencies.

**Spec:** `docs/research/2026-10-01-screenshot-ui-and-locket.md`

## Global Constraints

- Preserve the existing uncommitted bootstrap change; review its diff before integration.
- Keep private photos private; no public URL fallback, automatic account merge, or weakened RLS.
- Preserve camera, AI, paywall, photo stacks, quote positioning, and export capabilities.
- Updated user requirement: `QUOTE_DISPLAY_ASPECT = 1`, full available width with no horizontal card gutters. Clamp to available height only when a square cannot fit. Source upload dimensions remain unchanged.
- Apply this to ALL moment-card surfaces: live camera, selected-photo/AI preview, discovery/feed, friend posts, each photo-stack page, own/friends/past-year memories, onboarding samples, loading skeletons, and shared/exported moment captures. Keep internal quote/control padding and safe-area protection.
- Use existing theme tokens and English/Vietnamese localization; retain accessible labels and text scaling.
- Current working tree includes the square-card and feed-viewport corrections described below. Remaining planned fixes are pending; there is no deployment, database mutation, or release in this task.

## Review Focus

- A committed row with a lost response must not turn retry into a duplicate.
- A preview URL or local follow-up failure must not delete a committed memory.
- Existing-account sign-in must preserve guest ownership and prevent cache crossover.
- Visible feed actions must never export an offscreen camera draft.
- Short screens, long quotes, large text, and Vietnamese must retain reachable controls.

## Ownership and sequence

Codex owns contracts, reproduction, integration, and verification. Logic worker owns Task 1 services/hook; auth worker owns Task 2 auth service/hook/login; UI worker owns Tasks 3–5 presentation; theme worker owns shared chrome only. Test changes belong to the worker implementing each task or a separately assigned test worker, never both simultaneously. Workers may edit only their listed files; other files require lead reassignment.

Tasks 1 and 2 can run independently once contracts below are agreed. Tasks 3 and 4 run sequentially because both touch Home/card UI. Task 5 starts after Task 2 releases WelcomeStep. Use `tasks/codex-to-cursor-handoff-template.md` for each implementation handoff, including these file boundaries and acceptance criteria.

### Task 0: Reproduce the blank card

**Owner:** Codex. **Files reviewed/changed:** `src/features/quotes/QuoteMomentCard.tsx`, `src/features/quotes/QuoteMomentCardMedia.tsx`, `src/features/home/HomeFeedFlow.tsx`, `src/features/home/HomeActionBar.tsx`, `src/features/home/HomeCameraSection.tsx`, and `app/(tabs)/index.tsx`.

The current implementation adds explicit media width, centers the camera card in the area above the bottom controls, and overlays the action bar so reaction/action state changes cannot resize the feed while it scrolls. Native reproduction and confirmation are still pending.

**Confirmed live-device layout cause:** React Native debugger inspection found `viewportHeight` around `5.416e26` points. Measuring the FlatList and feeding its height back into its header/items allowed the layout to grow recursively. The viewport now measures the bounded Home parent; Home and FlatList use explicit native `flex: 1`. Live-device inspection after Fast Refresh reports a 896-point viewport, an 810-point camera region, and a 414-point square camera canvas. Reset the stale development scroll offset after applying the fix. TypeScript, targeted lint, and diff checks passed; visual confirmation and scroll regression verification remain pending.

- [x] Fix a separate URL recovery defect in `src/services/media/userPhotosApi.ts` and `src/features/quotes/useQuotePhotoFeed.ts`: batch signing requests, log incomplete signing without exposing URLs, and retry initially missing URLs after 60 seconds instead of 55 minutes. TypeScript and targeted lint passed. This does not establish the cause of the reported black screen or guarantee recovery for a missing storage object.

- [ ] Reproduce image 1 on iOS by scrolling from capture into discovery/feed, the user-confirmed trigger; also check after gallery selection and save. Record build/version and exact steps. Compare measured card/page bounds before assuming excessive height: static geometry fits ordinary phone viewports.
- [ ] Temporarily measure card/media width and height and inspect image load errors using a known local image and a cloud image. Log photo ID and dimensions, never tokens or signed URLs.
- [ ] If dimensions collapse, set an explicit width/stretch constraint at the failing container. If dimensions are correct, trace image, animation, and list visibility instead. Do not declare an image failure the cause of missing quote/author without evidence.
- [ ] Verify nonzero media bounds and visible photo, quote, and author on the same device. Remove temporary diagnostics; retain a focused regression check for the proven cause.

### Task 1: Make save success truthful and retries idempotent

**Files:** `src/services/media/saveUserPhoto.ts`, `src/features/home/useHomeCamera.ts`; test `__tests__/saveUserPhoto.test.ts` and `__tests__/homePhotoSave.test.ts`.

**Contract:** Add required `photoId: string` to save parameters. Generate it once with existing `Crypto.randomUUID()` for each selected photo; keep it across retries, reset on new photo/discard/account change. Use it as the existing UUID primary key and deterministic owner/file path. Return the existing result shape with `publicUrl: string | null`; a null preview URL means persisted successfully, preview unavailable. Existing memory `photoBackgroundUri` already accepts null.

- [ ] Add failing checks: insert succeeds then signing returns an error; signing throws; insert commits but response is lost; retry returns the same photo ID with one row; local streak/analytics/reminder throws after success.
- [ ] Run `npm test -- --runInBand __tests__/saveUserPhoto.test.ts __tests__/homePhotoSave.test.ts`; confirm the regression cases fail before changes.
- [ ] Before retry upload, look up the stable photo ID under the current authenticated owner. If present, reuse it and request a preview URL. Do not use an upsert that overwrites an existing memory.
- [ ] On uncertain insert failure, reconcile by that ID. If reconciliation also fails, retain the pending ID and draft for retry; do not delete its uploaded file while commit status is unknown. Handle an existing storage path by verifying/reusing the owned object rather than creating another random path.
- [ ] After confirmed persistence, signing errors return success with null URL. Remove deletion of committed rows/files merely for signing failure. Leave actual upload/insert failures as failures.
- [ ] Use returned photo ID for the local memory ID so local and cloud copies deduplicate. Mark/reset the saved draft once persistence succeeds, before nonessential follow-ups. Catch follow-up failures separately with useful stage logs; avoid a generic failed-save toast after commit.
- [ ] Verify private preview URL refresh can recover through the existing feed refresh path, and repeat save taps cannot create a second row. Run the new checks plus existing memory/streak tests.

No migration is planned: `user_photos.id` is already a UUID primary key. Check deployed schema/RLS and current Supabase docs before implementation. Any necessary migration requires a separate reviewed change. This retry identity covers the current draft/session; durable recovery after app termination is outside scope.

### Task 2: Restore account sign-in and guard auth taps

**Files:** `src/services/supabase-auth.ts`, `src/hooks/useSupabaseAuth.ts`, `app/login.tsx`, `src/features/onboarding/steps/WelcomeStep.tsx`, `src/i18n/locales/en.json`, `src/i18n/locales/vi.json`; tests `__tests__/supabaseAuthIdentityUpgrade.test.ts`, `__tests__/authService.test.ts`.

**Contract:** Define `SocialAuthIntent = "signIn" | "upgradeGuest"` in the existing auth service. Append an optional intent argument to existing Apple/Google wrappers and propagate it through the hook. Default to `upgradeGuest` to preserve current guest-upgrade callers. Login accepts route parameter `intent`; validate it against these two values. Existing-account entry passes `signIn`.

- [ ] Add failing checks: anonymous + signIn calls `signInWithIdToken`; anonymous + upgradeGuest calls `linkIdentity`; identity conflict leaves guest intact; canceled/failed sign-in leaves current session intact.
- [ ] Implement explicit intent without signing out first. On linking conflict, render a localized “Sign in to existing account” action that changes intent and requires another provider tap. Explain that guest memories remain with the guest account; never silently transfer them.
- [ ] Add a shared synchronous in-flight ref guard around both login handlers, released in `finally`; keep native Apple button appearance/API compliant.
- [ ] Trace all auth wrapper callers and owner-scoped caches. Verify success changes displayed owner data and RevenueCat identity through existing synchronization, with no guest data displayed as another account's data. Codex owns any additional cache fix after naming its file scope.
- [ ] Run `npm test -- --runInBand __tests__/supabaseAuthIdentityUpgrade.test.ts __tests__/authService.test.ts __tests__/onboardingIntroFlow.test.ts`. On device verify both providers, conflict recovery, cancel, repeated taps, and returning to the requested route.

### Task 3: Make actions follow the visible surface

**Files:** `app/(tabs)/index.tsx`, `src/features/home/HomeActionBar.tsx`, `src/components/CameraActionsBar.tsx`; test `__tests__/homeActionBar.test.tsx`.

**Contract:** Derive the displayed action mode from existing `isOnFeed` and draft state. Feed mode uses camera-return/gallery/memories actions plus existing reactions. Compose mode uses save/share only for a valid selected draft. Feed sharing continues through the existing per-card share control.

- [ ] Add a failing rendered behavior check: feed visible plus pending draft never renders Save memory or draft share; returning to compose restores draft actions. Preserve capture/generation/save disabled states.
- [ ] Pass visible-surface state into the action bar and gate compose callbacks as well as their buttons. Do not create a second feed export implementation.
- [ ] Run the focused test. On device navigate camera → feed → camera and share each surface; verify the exported image matches what the user selected.

### Task 4: Simplify card chrome and separate metadata

**Files:** `src/features/home/HomeCameraSection.tsx`, `src/features/quotes/QuoteMomentCard.tsx`, `src/features/quotes/QuoteMomentCardMedia.tsx`, `src/theme/homeVibeFeedFrame.ts`; test existing `__tests__/feedCardSizing.test.ts`, `__tests__/quoteCardFrame.test.ts`, `__tests__/quotePosition.test.ts`.

**Contract:** Retain one rounded photo boundary with a subtle vibe accent. Move author/time metadata below the photo in compose and feed so quote placement cannot collide with it. Keep normalized quote coordinates; use the new square photo canvas.

**Square sizing implementation completed; native visual verification pending:**

- [x] Set shared display aspect to 1 and remove phone/tablet width caps and horizontal margins in `feedCardSizing.ts`.
- [x] Remove external card padding in camera, feed, skeleton, and memory containers; onboarding samples use full screen width.
- [x] Give feed media an explicit full width, retaining square aspect.
- [x] Preserve rectangular source uploads; rendered moment share captures follow the square canvas.
- [x] Center the camera card in its measured space and keep the bottom action bar out of feed layout so state changes do not resize pages while scrolling.
- [x] Earlier square sizing passed 17 targeted tests, TypeScript, targeted lint, and diff checks. The viewport and centering follow-up received static review; native verification remains pending.
- [ ] Verify every listed surface on native iOS/Android, including stack swiping, large text, rotation, and exported output. Blank-feed resolution remains unconfirmed until the user's scroll reproduction passes.

**Review correction:** `useQuoteCardFrame` is the device-sized frame for camera/feed/memories; camera layout can shrink and center the square in the visible area above its fixed bottom controls, and onboarding uses full screen width with scrolling. Source upload dimensions remain governed by `QUOTE_OUTPUT_SIZE` and are not the displayed card canvas.

Camera zoom/flip and edit controls keep a small local inset; the photo card itself stays edge-to-edge. The recent centering and action-bar layout follow-up received static review; native scrolling and alignment checks remain pending.

**Sizing files already changed:** `src/constants/quoteImageSize.ts`, `src/features/quotes/feedCardSizing.ts`, `src/features/quotes/useQuoteCardFrame.ts`, `src/features/home/HomeCameraSection.tsx`, `src/features/home/HomeActionBar.tsx`, `app/(tabs)/index.tsx`, `src/features/quotes/QuoteMomentCard.tsx`, `src/features/quotes/QuoteMomentCardMedia.tsx`, `src/features/quotes/QuoteCardSkeleton.tsx`, `src/features/quotes/QuoteMomentsFeed.tsx`, `app/memories/day.tsx`, and both onboarding steps. `MemoryCard`, stack pages, Ink Bloom, and moment exports inherit the shared sizing. The unused text-only `src/components/QuoteCard.tsx` has no callers; do not revive it for this change. Profile/settings panels are not moment cards.

- [ ] Remove redundant inner outline, corner brackets, and thick top stripe; retain existing shared palette.
- [ ] Move metadata into a normal-flow footer and budget its measured height in the available card area. Ensure photo plus footer/edit control fits each feed page and does not alter paging offsets.
- [ ] Keep the export capture boundary explicit: include photo, reflection, intended metadata, and watermark; exclude trash, share, editing controls, and stack navigation. Check paywall/watermark behavior.
- [ ] Run the existing geometry/position checks. On iOS and Android verify long reflection, all font sizes, dragging to bottom, portrait/landscape source crops, stack cards, memories, and exported output.

### Task 5: Fix onboarding spacing across screen/text sizes

**Files:** `src/features/onboarding/steps/WelcomeStep.tsx`, `src/features/onboarding/steps/HowItWorksSaveStep.tsx`, `src/features/onboarding/components/OnboardingQuotePreview.tsx`; tests existing `__tests__/onboardingQuotePreview.test.ts`, `__tests__/onboardingIntroFlow.test.ts`.

- [x] Replace differing fixed 360/290-point content reserves with full-width square previews in both steps; preserve scrolling when content cannot fit.
- [ ] Give CTA/login controls their own normal-flow spacing and bottom safe-area padding. Keep login reachable and ensure the sample cannot cover it; do not shrink text to force a fit.
- [x] Run `onboardingQuotePreview` and `onboardingIntroFlow` as part of the targeted check.
- [ ] Verify 320/375/390-point phone widths, a short viewport, English/Vietnamese, default and large accessibility text, rotation, Skip, Back, and both account/create entry points.

### Task 6: Integration and release checks

**Owner:** Codex. No overlapping worker edits.

- [ ] Review every diff against the spec and file boundaries. Preserve the user's bootstrap work and remove temporary diagnostics.
- [ ] Run `npm test -- --runInBand`, `npx tsc --noEmit`, and `npm run lint`; document existing unrelated failures separately from new regressions.
- [ ] Verify a fresh guest's first save, signing failure, response loss/retry, offline retry, second save, and first-save reminder. Confirm one row per stable photo ID and matching storage object with read-only backend checks.
- [ ] Verify account conflict/recovery and repeated auth taps; verify guest data does not cross account boundaries.
- [ ] Capture before/after native screenshots for blank feed, compose, saved feed, and both onboarding steps. Compare iOS and Android and inspect an actual exported image.
- [ ] Update the research report with confirmed causes, checks, and remaining limitations. Prepare the reviewable patch/PR; deployment is a separate action.

## Completion criteria

No blank card in the reproduced path; no failed-save message after confirmed persistence; no retry duplicate; existing-account recovery works; action targets match their visible surface; one clear card boundary; quote never overlaps metadata; onboarding controls remain reachable with large text. Automated checks and native evidence must accompany completion claims.

### Caption gestures and photo visibility (October 1 update)

- [x] Reduce caption background opacity to 28–30% and reduce full-photo shading.
- [x] Compose caption drag, two-finger rotation, and pinch; scale range 87.5–100% keeps the smallest 16-point font at 14 points.
- [x] Clamp placement using rotated, scaled bounds; disable camera zoom gestures on selected photos.
- [x] Persist scale and rotation with additive `quote_caption_transform` migration, applied and columns verified on the configured Inkly database.
- [x] TypeScript, targeted lint, and focused position regression checks passed.
- [ ] Visually verify simultaneous rotation/pinch and saved-card rendering on the physical phone.
