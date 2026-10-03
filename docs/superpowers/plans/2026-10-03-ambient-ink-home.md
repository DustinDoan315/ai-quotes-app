<!-- Execution authorized 2026-10-03. Implementation and automated checks completed; native build/device checks delegated to user. See docs/qa/ambient-ink-home-test-cases.md. -->
# Ambient Ink Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Implement the selected Ambient Ink Home with card-driven atmosphere and synchronized header, index, heart, share, and dock controls.

**Architecture:** Derive one active Home moment from existing stack/card state; pass it to Home-specific chrome. Keep capture refs with their cards and register only the visible card's share action. Introduce opt-in Home card presentation so shared screens and exports keep their contracts.

**Tech Stack:** Expo 54, React Native 0.81, TypeScript, react-native-svg, Reanimated, existing Zustand stores and i18next.

**Spec:** [Ambient Ink Home design](../specs/2026-10-03-ambient-ink-home-design.md).

**Status:** Draft for review. User selected the visual direction and requested planning. No app code changes. Confirm the provisional heart behavior before its dependent task starts.

**Audit:** Reviewed against current code on 2026-10-03. Added API normalization, stable selected IDs, export lifecycle locks, authenticated favorite persistence, exact layout accounting, draft cancellation/save outcomes, and reference-based acceptance. The UI/logic work can begin once this plan is approved; only the provisional heart branch depends on the unanswered product preference. Live database state and device rendering have not been verified by this planning review.

## Global constraints

- Home's background follows the actual active card's saved vibe, including horizontal navigation within a stack.
- Missing/unknown saved vibes use a neutral Mist palette.
- Crossfade settled palettes over 300 ms; reduced motion changes immediately.
- No new dependency or database migration. English and Vietnamese strings are required.
- Preserve saved quote transforms, subscription/export guards, watermark behavior, reaction eligibility, and existing capture/save/AI review flows.
- Keep the existing square display ratio. New chrome stays outside export captures.
- Friends' cards in Home receive the same Ambient Ink presentation as owned cards; atmosphere follows each saved card's vibe and author attribution remains that card's owner. Header avatar and export entitlements belong to the viewer.
- Preserve unrelated local changes, including the existing bootstrap edit.

## Review focus

1. Horizontal swipe followed by vertical paging or feed refresh: controls must target the visible card, never its mounted neighbor.
2. Palette/profile/date changes while editing: the draft and saved palette must remain identical.
3. Guest, private, and non-owned cards: favorite/reaction actions must follow identity and visibility rules.
4. Export guard failure or share dismissal: existing watermark and usage accounting must remain correct, and controls recover.
5. Compact screens and large text: header, square card, metadata row, and dock remain reachable without overlap.

## Task 1: Active moment contract — Logic worker

**Files:** Logic worker creates `src/domain/home/activeHomeMoment.ts`, `src/domain/home/homeVibeKey.ts`, and modifies `src/services/media/userPhotosApi.ts` for both list mappers only. Test worker owns `__tests__/activeHomeMoment.test.ts`, `__tests__/homeVibeKey.test.ts`, `__tests__/userPhotosApi.test.ts`, and `__tests__/homeActiveSelection.test.ts`. Codex modifies `src/features/home/useHomeFeedState.ts` during integration.

**Interfaces:** Export `resolveActiveHomeMoment(stacks: readonly QuoteStack[], stackIndex: number, activeQuoteId: string | null): ActiveHomeMoment | null`. Result: `{ card: QuotePhotoCard; stackId: string; index: number; count: number; palette: HomeBackgroundPalette }`. Export `getHomeMomentIndexWindow(index: number, count: number): { indices: number[]; label: string | null }` with at most five indices.

Export `parseHomeVibeKey(raw: string | null | undefined): HomeVibeKey | null` using known registry keys, preserving valid keys and mapping blank/unknown keys to null. Keep selected stack/card IDs as the controller's authoritative state; `stackIndex` passed to the resolver is derived from those IDs. Define `HomeActiveSelection = { stackId: string; quoteId: string } | null`; `null` means capture. Index window is centered where possible, clamped at ends; with seven cards, index 6 returns `[2,3,4,5,6]` and label `7 / 7`. Localized spoken labels belong in UI.

- [ ] Add regression tests for a second horizontal card, an ID belonging to another stack, deletion after refresh, empty feed, unknown/null vibe, and a seven-card index window with the last card selected. Expect stale IDs to fall back to the current stack's first card; null/unknown vibes resolve to Mist; one-card indicator has no label.
- [ ] Run `npm test -- --runInBand __tests__/activeHomeMoment.test.ts`; verify the new contract initially fails.
- [ ] Implement these pure resolvers using the existing palette registry and stack types.
- [ ] Normalize vibes through `parseHomeVibeKey` in both `listQuotePhotoCards` and `listQuotePhotoCardsForDay`. Test raw database rows for both list paths; a made-up key must stay null until Home resolves Mist. Preserve the general registry's existing fallback and all valid premium keys.
- [ ] Add selection integration tests in `__tests__/homeActiveSelection.test.ts`: null-index capture entries, canceled vertical drag, refresh insertion ahead of the active stack, same-stack horizontal reorder, removal, and account change. Require stable IDs, selection/render agreement, and no active feed actions while dragging.
- [ ] Add mixed-owner fixtures: own Dawn → friend's Sage → friend's second Aurora card, plus identical stack IDs belonging to distinct owners. Resolve the exact visible card palette (not `primaryVibeKey`/`displayVibeKey`), retain owner-separated groups, and render saved premium palettes for free viewers.
- [ ] Run the same targeted tests and existing `groupQuotePhotoCardsIntoStacks` tests; require all pass.

## Task 2: Atmosphere and geometry — Theme worker

**Files:** Theme worker creates `src/theme/homeAmbient.ts`; Logic worker creates `src/domain/home/homeViewportLayout.ts`; Test worker owns `__tests__/homeViewportLayout.test.ts` and `__tests__/homeAmbientTransition.test.ts`; UI worker creates `src/features/home/HomeAmbientBackground.tsx` after theme tokens are complete. Existing shared frame helpers remain unchanged.

**Interfaces:** Export `HOME_AMBIENT_LAYOUT` tokens: horizontal gutter 20, header min-height 56, dock min-height 112, dock clearance 12, action row min-height 64, region gap 12, radius 24, shutter size 72, hit area 48, crossfade duration 300. Export `getHomeAmbientColors(palette: HomeBackgroundPalette): { base: string; primaryWash: string; secondaryWash: string; scrim: string; edge: string }`. Background props: `{ palette: HomeBackgroundPalette; reduceMotion: boolean }`.

- [ ] Add geometry tests for narrow/tall and short screens, nonzero safe areas, and increased measured header/footer heights. `getHomeViewportLayout({ width, height, topInset, bottomInset, headerHeight, footerHeight })` returns `{ cardWidth, contentTop, contentHeight }`; square width must not exceed `width - 40` or `contentHeight`, and dimensions must be nonnegative.
- [ ] Define layout inputs as measured root width/height, nonnegative insets, header height excluding safe area, and combined toolbar/dock footer height excluding safe area. Use `contentTop = topInset + headerHeight + 12`, `contentBottom = height - bottomInset - 12 - footerHeight - 12`, `contentHeight = max(0, contentBottom - contentTop)`, and `cardWidth = max(0, min(width - 40, contentHeight))`. With width 390, height 844, insets 47/34, header 56, footer 188: expect contentTop 115, contentHeight 483, and cardWidth 350. Empty toolbar retains height 64; footer includes its 12-unit gap to dock. Each page interval is root height, never content height.
- [ ] Add compact/large-text fallback tests and device checks; reserve space for caption-edit/AI controls within capture content, using internal vertical scrolling when needed. On rotation/root resize, reposition to the committed page using the new full-root interval. Pass the Home frame explicitly to capture, feed, and skeleton instead of mutating global sizing.
- [ ] Implement geometry and theme tokens; use two SVG radial washes on a tinted base with a central dark scrim. No animated SVG stop mutation or continuous drift.
- [ ] Implement the two-layer 300 ms background crossfade with bounded layer count, cancellation on rapid changes, and instant reduced-motion updates.
- [ ] Test rapid palette changes/unmount and reduced-motion toggling in `__tests__/homeAmbientTransition.test.ts`; ensure no stale completion replaces the current palette and at most two background layers remain mounted.
- [ ] Run `npm test -- --runInBand __tests__/homeViewportLayout.test.ts`; manually preview Dawn, Sage, Aurora, and Prism with readable white controls.

## Task 3: Header and dock presentation — Cursor UI worker

**Files:** Create `src/features/home/HomeAmbientHeader.tsx`, `src/features/home/HomeMomentToolbar.tsx`, `src/features/home/HomeAmbientDock.tsx`; modify `src/features/home/HomeActionBar.tsx`. Codex owns localization edits in `src/i18n/locales/en.json` and `vi.json`.

**Interfaces:** Header consumes `{ palette: HomeBackgroundPalette; avatarUrl: string | null; onProfile: () => void; onMenu: () => void }`. Toolbar consumes `{ context: "mine" | "friends" | "draft"; index: number; count: number; heartMode: "favorite" | "reaction" | "signin" | "hidden"; isFavorite: boolean; isHeartBusy: boolean; canShare: boolean; isSharing: boolean; canPrevious: boolean; canNext: boolean; onHeart: () => void; onShare: () => void; onPrevious: () => void; onNext: () => void }`. Dock consumes `{ mode: "capture" | "feed" | "draft" | "busy"; canCapture: boolean; canSave: boolean; busyLabel: string | null; onGallery: () => void; onPrimary: () => void; onMemories: () => void }`.

- [ ] Implement screenshot structure using Task 2 tokens: avatar left, centered Inkly, palette pill right; label/segments left and heart/share right; rounded Gallery/primary/Memories dock below.
- [ ] Give controls localized labels, 48-unit hit areas, busy/disabled semantics, and accessible previous/next actions. Pill remains informational. Wordmark/menu has a visible chevron.
- [ ] Define `home.ambient` locale keys for Gallery, Memories, Home menu, Friends' moments, Your moments, New moment, Moment N of M, Previous/Next, favorite/unfavorite, send love, sign-in, unavailable photo, and discard/cancel. Reuse existing Save/error/busy strings where semantics match. Keep large-text title/pill collision and menu focus/dismiss behavior in component verification.
- [ ] Provide Save in draft mode and a spinner with descriptive label during busy mode. Avoid fixed total button widths that overflow smaller devices.
- [ ] Verify the components using fixture props for each mode; no new tests for purely decorative styling. Run lint on edited files.

## Task 4: Active card rendering and sharing — Codex integration

**Files:** Codex modifies `src/features/quotes/QuoteMomentCard.tsx`, `QuoteMomentCardMedia.tsx`, `QuoteCardSkeleton.tsx`, `quoteStack/QuoteStackEntry.tsx`, `src/features/home/HomeFeedFlow.tsx`, and `src/features/quotes/useQuoteMomentShare.ts`. Logic worker creates `src/hooks/useHomeActiveShare.ts`; Test worker owns `__tests__/homeActiveShare.test.ts`, `__tests__/quoteMomentShare.test.ts`, and `__tests__/homeFriendCard.test.ts`.

**Interfaces:** Add optional `presentation?: "home" | "default"` and `frameWidth?: number` to card rendering. `QuoteStackEntry` emits `onActiveMomentChange({ quoteId, stackId, index, count })`. Active share registration: `register(quoteId: string, share: () => Promise<void>): () => void`; `share(quoteId: string): Promise<void>` refuses missing/mismatched targets and serializes requests. Scope registration to visible cards and clear it on unmount/deactivation.

Make stack selection controlled with `activeQuoteId: string | null` and `interactionLocked: boolean`. Expose `onSelectQuote(quoteId: string): void` so toolbar Previous/Next and gestures commit the same controller selection rather than maintaining a competing local index. Add `isSharing: boolean` to the export hook result and a synchronous ref guard to `shareMoment`. Registry has one active registration plus a unique registration token; cleanup must match the token, not only quote ID. While locked, defer feed replacement/rotation changes and disable gestures, Gallery/Memories, edit, and additional exports until `finally` releases it.

- [ ] Add tests that register A then B, unregister A without clearing B, request stale A, issue repeated B requests, and unregister B after feed removal. Expect no neighbor export and no overlapping share operations.
- [ ] Also test old/new registrations for the same quote ID, capture failure, a guard-denied export, missing images/refs, and attempted swipe/refresh/resize while sharing. Lock synchronously; keep the captured card mounted until completion; always restore watermark and pending state. Verify existing native sheet-completion accounting, not a nonexistent delivery/cancellation signal.
- [ ] Apply Home-only fine rim/glow; remove Home-only top stripe/brackets, over-image share/counter/dots. Leave default card presentation intact and preserve saved photo/quote transforms.
- [ ] Apply Home quote scrim and opaque-panel fallback from the spec to both capture and feed. Preserve existing font size/color and transformed text bounds. Do not hard-code a bottom quote position or silently migrate style IDs. Compare the exported Home card with the visible Home preview.
- [ ] Correct Home friend attribution: current `item.authorDisplayName ?? authorName` and `item.authorAvatarUrl ?? authorAvatarUrl` can substitute the viewer's identity. Use viewer fallbacks only for owned cards; friend fallbacks are localized “Friend” and neutral initials/avatar. Test missing name/avatar, correct friend attribution in export, and date/time formatting with the active app locale. Reuse existing translation keys or add `home.ambient.friendAuthorFallback` in the Codex-owned locale files.
- [ ] Keep each card's existing export hook/ref. Register the current card's share callback with its ID; clear on deactivation. Forward pending state without replacing guards, watermark, or usage logic.
- [ ] Expose stack previous/next operations to the toolbar using the same bounds and commit path as gestures. Remove duplicated active-ID updates that can reset the horizontally selected card during unrelated feed updates.
- [ ] Verify share from the second card in a stack, blocked export, canceled share, and rapid navigation; run targeted tests plus existing `quotePosition` and `quoteCardFrame` tests.

## Task 5: Assemble Home and wire actions — Codex lead + Logic worker

**Files:** Codex modifies `app/(tabs)/index.tsx`, `src/features/home/HomeCaptureFlow.tsx`, `useHomeFeedState.ts`, `useHomeCamera.ts`, `HomeCameraSection.tsx`, `src/features/quotes/useQuotePhotoFeed.ts`, and `src/appState/memoryStore.ts` if an explicit ID-scoped favorite setter is required. Codex creates `src/features/home/useHomeAmbientController.ts`. Logic worker creates `src/hooks/useHomeMomentHeart.ts` and modifies `src/services/media/userPhotosApi.ts` for favorite-write confirmation only, after Task 1 releases that file. Test worker owns `__tests__/homeMomentHeart.test.ts`, `__tests__/homeAmbientFlow.test.ts`, and extends `__tests__/userPhotosApi.test.ts`. No worker overlaps Codex-owned files.

**Interfaces:** Heart hook consumes active card, existing ownership identity, existing reaction eligibility, and cache callbacks; produces `{ mode, isFavorite, isBusy, press }`. Controller composes the Task 1 result, frozen draft palette, action mode, and share registry. Feed hook exposes an ID-scoped favorite cache patch if needed; Codex owns edits to `src/features/quotes/useQuotePhotoFeed.ts`.

Heart inputs: `{ card: QuotePhotoCard | null; authUserId: string | null; signedInUserId: string | null; identityEpoch: number; patchFavorite: (photoId: string, value: boolean) => void; onSignIn: () => void }`. `authUserId` establishes persisted ownership, including anonymous auth; `signedInUserId` comes from the existing account/reaction path. `press(): Promise<void>` captures ID/identity and reports failures through the existing toast store. Extend `updateUserPhotoFavorite(photoId, value): Promise<boolean>` with `.select("id,is_favorite")` and confirm exactly the requested returned ID/value; no returned row is failure. Cache updates apply to both feed and matching memory photo ID. Protect pending IDs from stale refresh overwrite, then reconcile after write settles.

Keep the frozen palette as local state/ref within the existing camera hook; no extra draft-session abstraction is needed. Test the actual camera/gallery-to-save flow so the regression cannot pass while saves still read the live palette prop. When replacing a draft, keep it until picker success; cancellation does not commit the new palette snapshot.

- [ ] Resolve the user's heart preference before implementing that branch. Recommended behavior: owned cards use `updateUserPhotoFavorite`; eligible friends use existing love reaction; no unlike API or fabricated persistent reaction state.
- [ ] Add tests for owned guest/auth cards, private friends, reaction failures, favorite rollback, repeated taps, and completion after switching cards. Ensure completion patches the original ID, never the new active card.
- [ ] Test a friend's card with `isFavorite: true`: its heart must still be a reaction action and must never call `updateUserPhotoFavorite`. Test friend-reaction success/failure, private/ineligible card restrictions, and stale registration removal after a post disappears. Changing Gallery/shutter to create a draft must restore the viewer's identity and eligible personal palette rather than inheriting the friend's owner/palette.
- [ ] Distinguish anonymous-auth owned rows from legacy guest-ID-only cards. Test zero-row updates and identity changes while pending. Confirm cloud persistence by updating then reading back an owned test card using the existing session in the verification environment; restore its original value. Do not weaken RLS or add a migration to make a UI control work.
- [ ] Freeze capture palette at capture/import initiation and keep it through generation/save. Add a regression test showing a profile/date palette change cannot alter that draft's save key; clearing the draft allows a new selection.
- [ ] Freeze at capture/import initiation, not after the async result arrives. `useHomeCamera` exposes `draftVibeKey: HomeVibeKey | null` and saves from that snapshot. Verify delayed capture/import, canceled picker with an existing draft, Retry, save failure, successful save to capture, and Pro stack continuation/Finish. Busy mode includes capturing, picker, saving, generation, export, and AI review; Save is disabled when the quote is absent/invalid.
- [ ] Mount background/header/toolbar/dock inside Home only. Measure header/footer regions; apply consistent card geometry and page reserves. Use one active result for all chrome.
- [ ] Route feed shutter taps to camera return only. Keep draft Save wired to the current edited quote; preserve retry, photo stacks, AI review, and discard handling. Move Friends/streak and secondary emoji access into accessible Home menu actions.
- [ ] Move On This Day into the menu, removing its capture-page banner; remove the old `HomeHeader` from `HomeCaptureFlow` to avoid duplicate header/safe-area padding. Add menu focus, dismiss/back, and draft discard/cancel checks. Pause the camera on saved feed and resume on settled capture, respecting app focus and modal/export locks. Keep existing Ink Bloom generation behavior; progress-meter redesign is outside this release.
- [ ] Ensure toolbar share invokes the active feed registry or the current draft ref as appropriate. Suppress actions for stale/removed cards and while busy.
- [ ] Run targeted heart/identity/draft tests and existing `reactionVisibility`, `userPhotoReactions`, `generationStage`, and subscription/export guard tests.

## Task 6: Verify visual match and behavior — Test worker and Codex

**Files:** Test worker owns `__tests__/**` only. Codex fixes integration boundaries and updates this checklist.

- [ ] Run `npx tsc --noEmit`, `npm run lint`, and `npm test -- --runInBand`. Distinguish pre-existing failures from introduced failures; resolve introduced failures before completion.
- [ ] Check compact and larger iOS/Android screens, long Vietnamese labels, enlarged text, all ten palettes, bright/busy photos, offline/error/empty feed, safe-area placement, and reduced motion.
- [ ] Preserve screenshot evidence beside the selected reference for 390 × 844 and 320 × 568 viewports. Exercise a missing image and network failure without exposing enabled card actions; show Retry for failed feed loads. Check safe areas only counted once and full-root snap offsets after resize.
- [ ] Verify vertical navigation and horizontal stack navigation separately, including first/last boundaries and refresh/deletion. Confirm background/pill/index/heart/share agree.
- [ ] Compare header, toolbar, and dock with the supplied screenshots; verify card readability and lack of overlap, including loading and draft modes.
- [ ] Compare BOTH owned and friends' Home cards with the selected reference. Verify viewer avatar in header, friend author inside card/export, Friends' moments label, friend-stack index, per-card palette changes, no edit/delete/save/rewrite on friends' saved posts, and viewer-owned export guard/accounting. Standalone Friends/Memories layouts remain outside this visual update.
- [ ] Export owned and friends' active cards: no header/dock/heart/index in image; expected watermark/guard behavior; correct quote/photo/transform.
- [ ] Check guest sign-in, profile, Friends, streak, Memories, camera permission denial, generation retry, save, and draft discard/cancel routes. Confirm other screens retain their existing backgrounds and default card styles.
- [ ] Review diff against ownership boundaries; do not include unrelated bootstrap changes. Commit reviewed implementation slices with explicit file lists.

## Worker handoff and execution

Use `tasks/codex-to-cursor-handoff-template.md`. Each handoff must include Goal, Why this task exists, Files allowed to edit, Files forbidden to edit, Inputs/contracts, Acceptance criteria, and Notes on risks. Theme and pure active-moment logic can run independently. UI starts after token/prop contracts are fixed. Card sharing and final Home wiring remain sequential integration work. Tests follow the completed contract boundaries.

Tests listed under implementation tasks are authored by the Test worker, paired with the owning implementer, before their corresponding risky behavior changes; their presence in a task is not permission for UI/Theme/Logic workers to write outside their AGENTS.md ownership. Logic worker releases `userPhotosApi.ts` after Task 1 before acquiring it again in Task 5. No changes to `app/_layout.tsx`, `GlobalHomeBackground`, shared default frame sizing, or database policies are necessary.

Recommended execution: the repository's lead-and-workers workflow, with Codex handling active-card/share integration and a scoped UI worker implementing the three chrome components. This plan does not dispatch workers or start implementation.
