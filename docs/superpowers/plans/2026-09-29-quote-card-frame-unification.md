# Quote Card Frame Unification Plan

**Status:** Slices A–D implemented on 2026-09-29; Slice E (device verification) outstanding.

**Decisions taken at the review gate:** single-frame architecture approved; display aspect set to **`2/3`**; camera-fit **Option 1** — the canonical frame fits the tightest surface and the camera's zoom/flip controls are overlaid on the preview so they no longer consume the card's height; one portrait frame for every post (landscape display remains deferred); the aspect migration check must still be eyeballed on device.
**Reviewed against:** working tree at commit `dd49603` (branch `main`), 2026-09-29.
**Related:** [Onboarding, Home, and Feed UX Review Plan](./2026-09-29-onboarding-home-feed-ux.md); [Onboarding first-quote design spec](../specs/2026-09-28-onboarding-first-quote-design.md).

**Goal:** One quote-card frame — same width, height, and aspect — on every surface that renders a moment: the Home camera/compose viewport, the generation (Ink Bloom) overlay, the Home feed card, a friend's post, the Memories feed (mine and Friend tab), the feed skeleton, the onboarding preview, and the share/export capture.

**Architecture:** UI and local layout math only. No API, AI prompt, auth, subscription, database, or data-shape changes. No new dependency. The card frame becomes a single pure calculation plus one hook; each surface consumes it instead of recomputing its own size.

**Tech Stack:** Expo SDK 54 (`expo ~54.0.33`), React Native 0.81, Expo Router ~6, TypeScript ~5.9, Moti, react-i18next, Jest. Package manager is Bun (`bun run`).

---

## Problem Statement (verified)

The **aspect ratio is already the same everywhere** (`QUOTE_DISPLAY_ASPECT = 3/5`), but the **rendered size is not**, because every surface calls `getQuoteFrameSize` with a different `availableHeight`.

| Surface | File | Current input | iPhone 14 (modeled) | iPhone SE (modeled) |
| --- | --- | --- | --- | --- |
| Camera live | `HomeCameraSection.tsx:176-180,336` | measured flex area (minus header, `py-6`, zoom row) | ~310 x 517 | ~241 x 401 |
| Camera: photo selected | same | flex area (zoom row hidden) | ~346 x 577 | ~277 x 461 |
| Camera: quote + generate | same + `QuoteInkBloom` | flex area (toggle shown, header hidden) | ~340 x 567 | ~271 x 451 |
| Home feed card | `QuoteMomentCard.tsx:33,74` | `viewportHeight - 48` | 366 x 610 | 319 x 531 |
| Friend's post in Home feed | same component | same | 366 x 610 | 319 x 531 |
| Memories (mine and Friend tab) | `MemoryCard.tsx:55-57` | **`windowHeight`** (ignores chrome) | 366 x 610 | 351 x 585 |
| Feed skeleton | `QuoteCardSkeleton.tsx:16,34` | `screenHeight - 48` | 366 x 610 | 319 x 531 |
| Onboarding screen 1 | `WelcomeStep.tsx:31-34` | `(availableHeight - 360) x (3/5)` | 242 x 403 | 155 x 259 |
| Onboarding screen 2 | `HowItWorksSaveStep.tsx:29-32` | `(availableHeight - 290) x (3/5)` | 284 x 473 | 197 x 329 |

Feed/skeleton numbers are read directly from code; camera/Memories are modeled from layout because the flex area cannot be measured without running the app.

**Root causes**

1. No single source of truth: `getQuoteFrameSize` is called by 6+ surfaces with different heights.
2. The camera card is height-constrained by header + `py-6` + controls, so at a tall aspect the width is squeezed below the feed's width cap.
3. `MemoryCard` passes the full `windowHeight`, making it the widest card on small screens.
4. The camera card **resizes mid-flow** (live -> photo -> quote) because the measured flex area changes as controls mount/unmount.
5. Onboarding hardcodes `3/5` and its own width formulas.
6. `QUOTE_ASPECT` and `getQuoteAspectRatio` are dead; `photoOrientation` / `QUOTE_OUTPUT_SIZE.landscape` exist but are never used to choose a display frame. Every stored landscape photo is cover-cropped into a portrait frame.

**Impact:** purely visual consistency. Because every surface shares one aspect, cover-crop and frame-relative quote positions still map correctly; only physical size and export resolution differ. Changing the aspect (Slice C) does change the crop, which is a migration concern.

---

## Review Gate — Confirm Before Implementation

- [ ] **Approve the single-frame architecture:** one pure `getQuoteCardFrame(...)` + `useQuoteCardFrame()` hook, consumed by every card surface, replacing all local `getQuoteFrameSize` calls.
- [ ] **Choose the display aspect.** Proposed: **`QUOTE_DISPLAY_ASPECT = 2/3`** (height = 1.5 x width). It sits between the "too small" 3/4 (1.333 x) and the "too large" 3/5 (1.667 x), and cuts the cover-crop of a 3:4 photo from ~20% to ~11%. Alternatives: `0.65` (taller), `0.7` (shorter, less crop). This is the single lever; the rest of the plan is aspect-agnostic.
- [ ] **Approve the camera-fit strategy.** Proposed: Option 1 — the canonical frame fits the tightest surface (the camera), and the camera chrome is reduced so the card reaches the phone width cap on common devices. Alternative: Option 2 — frame at the feed size and let the camera area scroll or scale on small screens (breaks visual parity). Recommendation: Option 1.
- [ ] **Decide orientation policy.** Recommended: keep one portrait frame for every post (uniform feed, matches current behavior) and delete the dead landscape aspect helpers. Alternative: render landscape posts in a landscape frame (breaks the single-frame guarantee and needs per-item frame plumbing) — treat as a separate project.
- [ ] **Approve the migration check** for already-saved moments before flipping the aspect (Slice C).

---

## Design

### One frame calculation

Add to `src/features/quotes/feedCardSizing.ts` (or a new `quoteCardFrame.ts`):

```ts
// Chrome that must fit above/below the card on the TIGHTEST surface
// (Home header + action bar + camera section padding/controls).
export const QUOTE_CARD_RESERVED_HEIGHT = 190;

export function getQuoteCardFrame(
  windowWidth: number,
  windowHeight: number,
  insetTop: number,
  insetBottom: number,
) {
  const maxWidth = getFeedCardWidth(windowWidth);
  const availableHeight = Math.max(
    0,
    windowHeight - insetTop - insetBottom - QUOTE_CARD_RESERVED_HEIGHT,
  );
  const width = Math.min(maxWidth, availableHeight * QUOTE_DISPLAY_ASPECT);
  return { width, height: width / QUOTE_DISPLAY_ASPECT };
}
```

And a hook:

```ts
export function useQuoteCardFrame() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return useMemo(
    () => getQuoteCardFrame(width, height, insets.top, insets.bottom),
    [width, height, insets.top, insets.bottom],
  );
}
```

Because the frame derives only from window dimensions and safe-area insets, every surface that calls the hook computes the same value on the same device. The app is portrait-locked (`app.json: orientation: "portrait"`), so the value is stable for a session.

### Fitting the camera

The camera is the tightest surface. `HomeCameraSection` must:

1. Drop the measured `availableCardHeight` state and the `onLayout` that sets it.
2. Reserve a **fixed** card region sized to the canonical frame, so the card does not resize when the zoom row or the Edit & style toggle mounts.
3. Reduce non-card chrome (padding, controls placement) so the frame reaches the width cap on common phones and stays height-capped on small screens.

Expected results at `2/3` with `QUOTE_CARD_RESERVED_HEIGHT = 190` (modeled): iPhone 14 -> 366 x 549 (width-capped); iPhone SE -> ~305 x 457 (height-capped); Pixel 7 -> 388 x 582. Tune the reserved constant during device verification; it is the one knob.

### Retire the old path

`getQuoteFrameSize` is removed after all callers migrate (or kept as a thin wrapper only if a caller needs a different frame, which none should). `QUOTE_ASPECT` and `getQuoteAspectRatio` are deleted. `MemoryCard`'s unused `photoOrientation` prop is removed (or wired, per the orientation decision).

---

## Candidate File Map

| File | Change |
| --- | --- |
| `src/constants/quoteImageSize.ts` | Set `QUOTE_DISPLAY_ASPECT` to the approved value; delete `QUOTE_ASPECT` and `getQuoteAspectRatio`. |
| `src/features/quotes/feedCardSizing.ts` | Add `QUOTE_CARD_RESERVED_HEIGHT`, `getQuoteCardFrame`; remove/replace `getQuoteFrameSize`. |
| `src/features/quotes/useQuoteCardFrame.ts` (new) | Hook wrapping `useWindowDimensions` + `useSafeAreaInsets` + `getQuoteCardFrame`. |
| `src/features/quotes/QuoteMomentCard.tsx` | Use the shared frame instead of `getQuoteFrameSize(windowWidth, screenHeight - 48)`; keep `screenHeight` only for vertical centering. |
| `src/features/quotes/quoteStack/QuoteStackEntry.tsx` | Use `frame.width` for `itemWidth` and gesture travel. |
| `src/features/quotes/QuoteCardSkeleton.tsx` | Use the shared frame. |
| `src/components/MemoryCard.tsx` | Use the shared frame instead of `windowHeight`; remove the unused `photoOrientation` prop. |
| `src/features/home/HomeCameraSection.tsx` | Remove `availableCardHeight`; use the shared frame; reserve a fixed card region; reduce chrome. |
| `src/features/onboarding/components/OnboardingQuotePreview.tsx` | Use `QUOTE_DISPLAY_ASPECT` instead of the hardcoded `3/5`. |
| `src/features/onboarding/steps/WelcomeStep.tsx` | Replace the hardcoded `3/5` with the constant (illustration may stay smaller; aspect must match). |
| `src/features/onboarding/steps/HowItWorksSaveStep.tsx` | Same. |
| `__tests__/feedCardSizing.test.ts` | Replace `getQuoteFrameSize` expectations with `getQuoteCardFrame` cases for the new aspect. |
| `__tests__/quoteCardFrame.test.ts` (new) | Parity + clamping coverage. |

No locale changes are expected (no user-facing copy changes).

---

## Work Slices

Implement in order; each slice should be independently reviewable and committable.

### Slice A — One canonical frame (structural, aspect unchanged)

Introduce the shared calculation and migrate every surface, keeping `QUOTE_DISPLAY_ASPECT` at `3/5` so there is **no visual change from the aspect** — only size parity.

- [ ] Add `QUOTE_CARD_RESERVED_HEIGHT` and `getQuoteCardFrame` to `feedCardSizing.ts`.
- [ ] Add `useQuoteCardFrame` hook.
- [ ] Migrate `QuoteMomentCard`, `QuoteStackEntry`, `QuoteCardSkeleton`, `MemoryCard`, and `HomeCameraSection` to the hook/frame. Remove their local `getQuoteFrameSize` calls.
- [ ] Replace `getQuoteFrameSize` (remove it once no caller remains).
- [ ] Replace the hardcoded `3/5` in onboarding with `QUOTE_DISPLAY_ASPECT` (aspect only; illustration size may remain smaller).
- [ ] Update `__tests__/feedCardSizing.test.ts` and add `__tests__/quoteCardFrame.test.ts`:
  - same inputs -> same frame (determinism),
  - width never exceeds `getFeedCardWidth`,
  - height never exceeds `availableHeight`,
  - phone width cap and tablet cap preserved,
  - the camera frame and the feed frame are equal for the same window.
- [ ] Run `bun run lint` and `bun run test -- --runInBand`.

**Acceptance:** Every card surface renders the same width and height on the same device; no aspect change yet; tests pass.

### Slice B — Camera layout stabilization

Make the camera host the canonical frame without resizing and without clipping.

- [ ] Remove the `availableCardHeight` state and its `onLayout` in `HomeCameraSection`.
- [ ] Wrap the card in a fixed-height region of `frame.height` (or flex-centered with the frame applied directly), so the card size is constant across camera -> photo -> quote states.
- [ ] Reduce camera chrome: move the zoom row and the Edit & style toggle so they do not change the card's available height (e.g., compact single-row layout or overlay), keeping controls reachable and above the action bar.
- [ ] Verify on iPhone SE-class heights that the frame is height-capped, and on 390x844-class heights that it reaches the width cap.
- [ ] Confirm no layout jump when a photo is selected, when a quote arrives, or when Edit & style expands.

**Acceptance:** The camera card width/height is identical to the feed card's on every tested device, and it never changes mid-flow.

### Slice C — Flip the display aspect

Apply the approved value (proposed `2/3`) in one place.

- [ ] Set `QUOTE_DISPLAY_ASPECT` to the approved value.
- [ ] Update the aspect-dependent test expectations.
- [ ] Run the migration check: open representative already-saved moments (portrait and landscape, short and long quotes, all three color schemes) and confirm the quote overlay is still acceptably placed over the photo after the crop changes. Because quote positions are frame-relative (`QuotePositionLayer.tsx:78-94`, `quotePosition.ts`), a changed crop moves what is behind the quote; this is expected but must be eyeballed.
- [ ] Confirm the share/export output: capture a moment from the camera and from the feed, and check the exported image matches the on-screen frame and that the watermark/chrome still fit.
- [ ] If the migration looks bad, either revert to the prior aspect or choose a value closer to the photo's 3:4 (less crop).

**Acceptance:** One aspect everywhere; saved moments remain acceptable; export matches the screen.

### Slice D — Retire dead aspect/orientation code

- [ ] Delete `QUOTE_ASPECT` and `getQuoteAspectRatio` (grep-confirmed dead).
- [ ] Remove `MemoryCard`'s unused `photoOrientation` prop, or wire it per the approved orientation policy.
- [ ] Decide and document the fate of `QUOTE_OUTPUT_SIZE.landscape` and `photoOrientation` display: either keep them storage-only (recommended) or open a separate landscape-frame project.
- [ ] Confirm no import references a deleted symbol.

**Acceptance:** No dead aspect code remains; the orientation policy is documented in this plan or a follow-up.

### Slice E — Verification

- [ ] Device matrix: iPhone SE/13 mini/14 and a large Android; fresh install and an account with saved moments.
- [ ] Screen-by-screen parity: camera live, camera with photo, generation, Home feed own post, Home feed friend post, Memories mine, Memories Friend tab, skeleton, onboarding preview, share/export.
- [ ] Small-screen check: no clipping, no overlap with the action bar, controls reachable.
- [ ] Reduced motion and English/Vietnamese are unaffected (no copy changed).
- [ ] `bun run lint` and `bun run test -- --runInBand`.

---

## Verification Commands

```bash
bun run lint
bun run test -- --runInBand
# optional, no typecheck script exists:
bunx tsc --noEmit
```

---

## Ownership and Sequencing

Per `docs/workflow.md`, use the lead-and-workers pattern with fixed file ownership; return here for integration review before completion.

1. **Slice A** is the foundation — do it first and merge before anything else, since it touches the shared frame module and every card.
2. **Slice B** depends on A and edits only `HomeCameraSection.tsx` plus its layout.
3. **Slice C** is a one-line constant plus test expectations; it depends on A/B being stable so the migration check is meaningful.
4. **Slice D** is cleanup and can run in parallel with C once A has merged.
5. **Slice E** is the gate; do not mark the work complete without the device pass.

Forbidden for all slices: `supabase/`, `ios/`, `android/`, `bun.lock`, API/AI contracts, analytics, subscriptions, and locale copy.

---

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Shrinking the feed card to the camera's constraint makes it too small on short screens. | Reduce camera chrome (Slice B) first; treat `QUOTE_CARD_RESERVED_HEIGHT` as the tunable knob and verify on SE-class devices. |
| Changing the aspect shifts existing quotes relative to the photo. | Migration check in Slice C; if unacceptable, keep the aspect or move closer to 3:4. |
| A single shared hook hides per-surface needs (e.g., a future sheet). | Keep `getQuoteCardFrame` pure and callable with explicit inputs; surfaces needing a different frame must justify it and be excluded from the parity test. |
| Export resolution changes with the frame. | Verify the exported PNG still meets share quality and watermark fit in Slice C. |
| Camera chrome reduction harms ergonomics/hit targets. | Cross-check with the accessibility/touch-target slice in the companion UX plan. |
| Removing `getQuoteFrameSize` breaks an untracked caller. | Grep all callers before removal; keep a thin deprecated wrapper for one release only if needed. |

---

## Implementation Notes (2026-09-29)

- Added `getQuoteCardFrame(windowWidth, windowHeight, insetTop, insetBottom)` and `QUOTE_CARD_RESERVED_HEIGHT = 190` to `src/features/quotes/feedCardSizing.ts`; removed `getQuoteFrameSize`.
- Added `src/features/quotes/useQuoteCardFrame.ts` and migrated `QuoteMomentCard`, `QuoteStackEntry`, `QuoteCardSkeleton`, `MemoryCard`, and `HomeCameraSection` to it.
- `HomeCameraSection` dropped the measured `availableCardHeight`; the card region is now a fixed `frame.height`, and the zoom/flip controls plus the photo-stack badge are overlaid at the bottom of the preview (with `box-none` so they do not swallow pinch). The Edit and style panel lives in a scrollable region below the card, so expanding it cannot resize the card.
- Added a graceful fit clamp in `HomeCameraSection`: the canonical frame is the cap, but if the Home header plus the "this day in memories" banner leave less room, the card scales down to the measured camera content area (preserving aspect) instead of overflowing. The measured value is parent-driven, so mounting controls cannot move it, and it is a no-op whenever there is enough room. While the Edit and style controls are reachable, 64 px is reserved for them.
- `QUOTE_DISPLAY_ASPECT` is now `2/3`; the onboarding preview and both onboarding step width formulas consume the constant instead of a hardcoded `3/5`.
- Deleted dead `QUOTE_ASPECT` / `getQuoteAspectRatio`; removed `MemoryCard`'s unused `photoOrientation` prop and its three call sites in `app/memories/day.tsx`. Storage-side `photoOrientation` / `QUOTE_OUTPUT_SIZE` are unchanged.
- Tests: rewrote `__tests__/feedCardSizing.test.ts`, added `__tests__/quoteCardFrame.test.ts` (determinism/parity, width cap, height clamp, aspect, negative-input collapse), and updated `__tests__/onboardingQuotePreview.test.ts`.
- Verified: `bun run lint` 0 errors, `bunx tsc --noEmit` clean, `bun run test -- --runInBand` 103/103 passing.
- Resulting shared frame: iPhone SE 305 x 457 (height-capped); iPhone 13 mini 351 x 527; iPhone 14 366 x 549; iPhone 14 Pro Max 406 x 609; Pixel 7 388 x 582; iPad 620 x 930 (all width-capped except the SE).
- Outstanding (Slice E): device pass for clipping, the expanded Edit and style panel on small screens, the export PNG, and the aspect migration over already-saved moments.

---

## Open Questions / Deferred

- Final aspect value: `2/3` proposed; confirm or choose `0.65`/`0.7`.
- Should landscape posts get a landscape frame? Recommended: no (separate project).
- Should the onboarding illustration match the full card size or only the aspect? Recommended: aspect only (it is an illustration, not the live card).
- Should the feed card auto-scroll to a newly saved moment so the user sees the now-consistent card? Tracked in the companion UX plan (Slice C), not here.

---

## Review Checklist

- [ ] Is the single-frame architecture approved?
- [ ] Is `2/3` approved, or is another aspect chosen?
- [ ] Is Option 1 (fit the tightest surface) approved over Option 2 (scroll/scale)?
- [ ] Is the orientation policy (single portrait frame) approved?
- [ ] Is the migration check sufficient for already-saved moments?
- [ ] After approval, implement Slice A first and merge before B/C.
