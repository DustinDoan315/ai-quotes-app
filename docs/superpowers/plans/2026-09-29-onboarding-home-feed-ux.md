# Onboarding, Home, and Feed UX Review Plan

**Revision:** v2 — reviewed against the working tree at commit `dd49603` (branch `main`), 2026-09-29.
**For agentic workers:** Use the approved onboarding spec and this plan. Keep each slice independently reviewable. Do not begin implementation until the user approves the review gate below. This revision only updates the plan; no product code has been changed.

**Goal:** Improve the first-run path from onboarding to creating, saving, and finding a quote, while preserving Inkly's short onboarding and camera-first Home.

**Architecture:** UI and existing local state only. No API, AI prompt, auth, subscription, or database contract changes are proposed.

**Tech Stack:** Expo SDK 54 (`expo ~54.0.33`), React Native 0.81, Expo Router ~6, TypeScript ~5.9, Moti, react-i18next, Jest. Package manager is Bun (`bun.lock`); all verification commands use `bun run`. Do not run `expo prebuild`, EAS Build, or store-release commands for these slices.

**Spec:** [Onboarding first-quote design](../specs/2026-09-28-onboarding-first-quote-design.md); [home actions and invite sharing](../specs/2026-09-25-home-actions-and-invite-sharing.md); [UX research and sources](../../research/onboarding-home-feed-ux.md).

---

## Revision summary — what v2 changes

1. **Grounds every finding in the current source.** Each finding below cites the file and line range verified in this revision.
2. **Corrects the empty-feed finding.** `HomeFeedFlow`'s empty-state branch renders `QuoteMomentsFeed` with `items={[]}`, which returns `null`; the list header is a full-viewport camera. The empty state is therefore **not reachable by the user today**. The real gap is that a newly saved moment lands one full screen *below* the camera-first header, with no cue that the feed is there. Slice C is re-scoped accordingly.
3. **Adds the second gallery-permission preflight.** The same media-library request exists in the profile avatar picker, which also uses `allowsEditing: true`; Slice B now covers both call sites and their differences.
4. **Adds onboarding stale-artifact cleanup.** Eight onboarding step files are unreferenced, and the `onboarding.howItWorks.compose.*` strings still say "2 OF 3". Slice A absorbs the stale-string cleanup; a separate low-risk slice removes the dead files.
5. **Splits contrast out of the accessibility slice** so visual measurement is reviewed independently from semantics and hit areas.
6. **Adds explicit test, ownership, sequencing, risk, and device-verification detail**, and fixes the package-manager assumption (`bun run`, not `npm`).

---

## Evidence snapshot (verified in source this revision)

| Claim | Verified evidence |
| --- | --- |
| The two-screen onboarding is already implemented. | `app/(onboarding)/index.tsx:15,35-49` uses a two-value step state; `HowItWorksToneStep.tsx` no longer exists. |
| The second onboarding screen reuses the first screen's exact sample. | `WelcomeStep.tsx:111-118` and `HowItWorksSaveStep.tsx:102-109` both pass `onboarding.welcome.previewQuote` and `onboarding.welcome.previewAttribution`. Only width and vertical position differ. |
| Screen 2's distinct copy and unused sample strings already exist. | `en.json` / `vi.json` define `onboarding.howItWorks.save.title/subtitle/line1-3`, but **line1-3 have no renderer** (grep: only the JSON definitions). |
| A legacy third screen and stale "2 OF 3" copy remain. | `src/features/onboarding/steps/HowItWorksComposeStep.tsx` is not imported anywhere; `en.json` `onboarding.howItWorks.compose.sectionLabel` = "HOW IT WORKS · 2 OF 3". |
| Seven more onboarding steps are dead code. | `CameraStep`, `GoalStep`, `GoalsStep`, `NotificationStep`, `PersonaStep`, `ProTeaserStep`, `TraitsStep` have no importers anywhere outside their own files. |
| Gallery selection requests media-library permission before the system picker. | `useHomeCamera.ts:557-570`: `requestMediaLibraryPermissionsAsync()` then `pickPhotoForQuote()`; `pickPhotoForQuote.ts:4-7` calls `launchImageLibraryAsync({ mediaTypes: "images" })`. |
| A second, untracked picker preflight exists in Profile. | `ProfileAuthedView.tsx:120-133` requests the same permission, then calls `launchImageLibraryAsync` with `allowsEditing: true`, `aspect: [1,1]`. |
| The feed empty state is currently unreachable. | `HomeFeedFlow.tsx:88-103` renders `QuoteMomentsFeed items={[]}`; `QuoteMomentsFeed.tsx:24` returns `null` when empty. |
| Saved moments land below the camera header. | `app/(tabs)/index.tsx:328-410` passes the full-viewport `HomeCaptureFlow` as `ListHeaderComponent`; `index.tsx:211-218` offsets item 0 by `viewportHeight`; `userPhotosApi.ts:91-92` orders newest first. |
| The left action-bar button opens Memories but is an unlabeled calendar icon. | `app/(tabs)/index.tsx:267-269,416` wires `onOpenMemories`; `HomeActionBar.tsx:136-138` passes it as `onGenerate`; `CameraActionsBar.tsx:40-48` renders `calendar-outline` with no label. |
| The stack is gesture-only and has no accessibility actions. | `QuoteStackEntry.tsx:144-185` defines a Pan gesture; no `accessibilityActions`, `accessibilityRole`, or equivalent control exists. |
| Several controls lack labels or are under 44/48. | `CameraActionsBar.tsx:40-108` (generate/gallery/share: no role or label; share is about 37pt tall); `QuoteMomentCard.tsx:122-131` (label but no role, `p-2.5`); `HomeHeader.tsx:33-49,62-88` (avatar `h-10 w-10` = 40, friends `h-10`, streak `py-1.5`); `HomeCameraSection.tsx:364-377` (trash `h-9 w-9` = 36, no label), `872-880` (finish: `py-1`), `886-895` (edit/style toggle), `946-963` (zoom presets, about 36pt tall). |
| The first-save reminder fires immediately after the success toast. | `useHomeCamera.ts:515` shows `camera.success.photoSaved`; `useHomeCamera.ts:518-547` immediately shows the reminder `Alert`. |
| There is no automated coverage for the picker, feed state, or Home accessibility. | `__tests__/` contains `onboardingIntroFlow`, `onboardingQuotePreview`, and `onboardingGate`, but nothing for `useHomeCamera`, `HomeFeedFlow`, `CameraActionsBar`, `QuoteStackEntry`, or `HomeHeader`. |

> Limitation: this review was source inspection only. No iOS or Android build was run, so permission behavior, rendered contrast, and screen-reader output remain device-verification items. Do not record a pass for those without a device check.

---

## Global Constraints

- Maintain (do not redesign) the two-screen onboarding. Preserve Skip, Back, the final **Create your first quote** action, and its `router.replace("/(tabs)")` destination.
- Do not request camera or photo-library access, call AI, or mutate saved quote state from onboarding.
- Keep Home camera-first. Do not seed the feed with fake or sample saved moments.
- Preserve the icon-only visual direction; add accessible names and hit areas without persistent text labels unless review shows they are needed.
- Reuse installed Expo and existing UI patterns. Add no dependency, analytics event, backend change, or new abstraction.
- Treat picker permission behavior and rendered contrast as device-verification questions until confirmed on fresh iOS and Android installs.
- Use Bun for all checks (`bun run lint`, `bun run test`). Do not modify `bun.lock`, native projects, or Supabase files.
- Keep English (`en.json`) and Vietnamese (`vi.json`) copy in lockstep for every string added or changed.

---

## Review Gate — User to Confirm Before Implementation

Recommended answers are shown first.

- [ ] **Keep the approved two-screen onboarding and camera-first Home direction.** (Recommended: yes; the two-screen flow is already live.)
- [ ] **Approve making the onboarding examples tell two distinct parts of the story:** screen 1 photo-to-quote, screen 2 personalize/save/share. (Recommended: yes.)
- [ ] **Approve the re-scoped discovery work (see Slice C):** label the Memories action accurately and add a non-blocking first-run/save cue that points to where moments appear, rather than adding an unreachable empty-state block inside the full-viewport camera header.
- [ ] **Approve an accessible alternative to horizontal swipe** for moving through stacked photos, while retaining swipe. (Recommended: yes.)
- [ ] **Approve checking the image-library preflight in both picker call sites** and removing it only where the platform picker works without broad library access. (Recommended: verify then remove for the Home images-only path; verify the Profile `allowsEditing` path separately.)
- [ ] **Decide whether to remove the dead onboarding step files** (Slice G). (Recommended: yes, as a separate zero-behavior commit.)
- [ ] **Decide whether the first-save reminder alert should remain immediate or wait** until the saved moment is visible. (Recommended: defer; not a blocker for the other slices.)

---

## Findings and Priority (corrected)

| Priority | Finding | Evidence | Proposed response |
| --- | --- | --- | --- |
| P1 | The second onboarding screen repeats the first sample instead of showing the "make it yours" save/share story. | `WelcomeStep.tsx:111-118`; `HowItWorksSaveStep.tsx:102-109` | Give screen 2 a distinct sample and a save/share-flavored illustration; keep flow and CTA unchanged. |
| P1 | A newly saved moment appears one full screen below the camera-first header, with no cue that the feed exists, and the Memories control is an unlabeled calendar icon. | `app/(tabs)/index.tsx:211-218,328-410`; `CameraActionsBar.tsx:40-48` | Label the Memories action accurately; add a lightweight first-run/save cue that does not block the camera. |
| P1, verify first | Gallery selection requests media-library permission before an images-only system picker in two call sites. | `useHomeCamera.ts:562-568`; `ProfileAuthedView.tsx:120-133`; `pickPhotoForQuote.ts:4-7` | Verify on fresh iOS/Android builds; remove only the redundant preflight. |
| P2 | Stacked quote photos are advanced only by gesture; several icon-only Home controls lack accessible names, roles, or adequate hit areas. | `QuoteStackEntry.tsx:144-185`; `CameraActionsBar.tsx:40-108`; `HomeHeader.tsx:33-88`; `HomeCameraSection.tsx:364-377,872-963` | Preserve gestures/visuals; add semantics, an equivalent photo-change path, and adequate hit regions. |
| P2 | Some Home controls may fall below platform touch-target sizes. | Same evidence as above (`h-9 w-9`, `h-10 w-10`, `py-1`, `p-2.5`) | Measure on device; expand hit regions without enlarging visible icons. |
| P2, decide | The first-save reminder can appear immediately after the success toast, before the user sees the saved moment. | `useHomeCamera.ts:515-547` | Review timing; change only with user approval. |
| Verify, no failure claimed | Quote text overlays variable photos and gradients, and onboarding secondary text uses low opacities. | `QuoteMomentCardMedia.tsx` color logic; `OnboardingQuotePreview.tsx:55-125`; `WelcomeStep.tsx:162-168,217-226` | Measure representative rendered states; adjust only measured failures. |
| Cleanup | Eight unreferenced onboarding step files and stale "2 OF 3" compose strings remain. | `src/features/onboarding/steps/`; `en.json`/`vi.json` compose keys | Remove in a separate, behavior-free slice. |

The previous ratings are directional judgments from source inspection, not usability-study results: onboarding flow 7.5/10, onboarding UI 8/10, Home UI 7/10, creation path 6.5/10, feed discovery 6/10. No conversion baseline or device-render audit is available, so this plan sets no invented conversion target.

---

## Thresholds and Evidence to Check

- **Touch targets:** at least 44 x 44 pt on iOS and 48 x 48 dp on Android for interactive controls; `hitSlop` may expand a small visual icon. Measure the actual control list in Slice D.
- **Contrast:** if applying WCAG AA, verify 4.5:1 for normal text and 3:1 for large text against the actual composited image/gradient. Do not infer a failure from a low opacity value alone.
- **Permissions:** verify the actual Expo SDK 54 image-picker behavior on supported OS versions before changing the request flow. Test grant, denial, cancellation, and return from system settings.
- **Motion:** preserve the existing reduced-motion behavior and confirm both onboarding pages remain understandable without animation.
- **Evidence scope:** test a fresh install and an account with saved moments; include small screens and English/Vietnamese copy. No numeric funnel target is proposed without a measured baseline.

---

## Candidate File Map

| Slice | Likely files | Boundary |
| --- | --- | --- |
| A — Onboarding story | `src/features/onboarding/steps/WelcomeStep.tsx`, `src/features/onboarding/steps/HowItWorksSaveStep.tsx`, `src/features/onboarding/components/OnboardingQuotePreview.tsx`, `src/i18n/locales/en.json`, `src/i18n/locales/vi.json`, `src/features/onboarding/steps/HowItWorksComposeStep.tsx` (delete) | Keep route/state transitions and approved CTA unchanged. |
| B — Picker gate | `src/features/home/useHomeCamera.ts`, `src/utils/pickPhotoForQuote.ts`, `src/features/profile/ProfileAuthedView.tsx`, `app.json` (only if permission strings change) | Existing picker behavior only; no onboarding permissions or new native dependency. |
| C — Feed discovery | `app/(tabs)/index.tsx`, `src/features/home/HomeFeedFlow.tsx`, `src/components/HomeHeader.tsx`, relevant locale strings | Explain where saved moments appear; no fake content or feed data changes. |
| D — Accessibility and touch targets | `src/components/CameraActionsBar.tsx`, `src/features/quotes/quoteStack/QuoteStackEntry.tsx`, `src/features/quotes/QuoteMomentCard.tsx`, `src/components/HomeHeader.tsx`, `src/features/home/HomeCameraSection.tsx` | Preserve icon-only styling and gesture behavior; add semantics and hit areas. |
| E — Contrast audit | `src/features/quotes/QuoteMomentCardMedia.tsx`, `src/features/onboarding/components/OnboardingQuotePreview.tsx`, `src/features/onboarding/steps/*` | Measurement only; change only measured failures. |
| F — Reminder timing | `src/features/home/useHomeCamera.ts` (first-save handler) | Separate, optional decision; leave out unless approved. |
| G — Dead onboarding steps | `src/features/onboarding/steps/{CameraStep,GoalStep,GoalsStep,NotificationStep,PersonaStep,ProTeaserStep,TraitsStep}.tsx` | Delete only; no behavior change. |

Paths reflect the current source tree. Confirm each component's callers and ownership before implementation; keep UI, state, and service boundaries intact.

---

## Proposed Work Slices — Not Started

Each slice should be approved and reviewed independently. Implement only the slices the user selects.

### Slice A — Make the onboarding story progress

**Intent:** Screen 1 teaches photo-to-quote. Screen 2 teaches personalize/save/share with a visibly different sample, so the two screens no longer show identical content.

**Verified starting point:** Both screens render the same quote and attribution through `OnboardingQuotePreview`; screen 2's `save.line1-3` strings are unused; `HowItWorksComposeStep.tsx` and its "2 OF 3" strings are stale.

- [ ] Give screen 2 a distinct sample quote/attribution (for example, a dedicated `onboarding.howItWorks.save.previewQuote`, or the existing unused `compose.previewQuote` moved to a save-appropriate key). Do not reuse `onboarding.welcome.previewQuote`.
- [ ] Make the screen-2 illustration read as "personalize / save / share": keep it clearly illustrative and noninteractive (`pointerEvents: "none"`, no `onPress`), and do not render a tappable-looking control.
- [ ] Keep Skip, Back, the final CTA, the two-screen length, `completeOnboarding`, and `router.replace("/(tabs)")` unchanged.
- [ ] Preserve reduced-motion behavior: the completed visual state renders immediately when the preference is on.
- [ ] Update English and Vietnamese copy together; remove the stale `onboarding.howItWorks.compose.*` keys and delete `HowItWorksComposeStep.tsx` if it is still unreferenced.
- [ ] Add no permission prompt, AI request, or quote-state mutation.
- [ ] Tests: extend `__tests__/onboardingQuotePreview.test.ts` (or add a small sibling test) to assert the two screens pass **different** sample quotes/attributions, and that the preview has no `onPress` handlers and uses `pointerEvents: "none"`. Keep `__tests__/onboardingIntroFlow.test.ts` green.

**Acceptance criteria:** Both screens remain understandable without motion; the second screen is visibly and textually distinct; no state or routing behavior changes.

### Slice B — Verify and remove the image-picker permission preflight

**Intent:** A user choosing an existing photo should not be gated on broad library access when the system picker provides the needed selection.

**Verified starting point:** `useHomeCamera.handleOpenGallery` requests media-library permission before calling `pickPhotoForQuote`, which launches an images-only picker. The profile avatar picker repeats the same pattern with `allowsEditing: true`.

- [ ] On fresh iOS and Android builds, record whether the images-only system picker opens and returns an asset **without** broad photo-library permission. Capture OS version, device/emulator, and the permission dialog (if any).
- [ ] If supported, remove only the redundant preflight from the Home path (`useHomeCamera.ts:562-568`) and keep the picker call and its error handling intact.
- [ ] Verify the Profile avatar path separately: `allowsEditing: true` may use a different iOS flow. Either remove its preflight with the same evidence or leave it and document why.
- [ ] Confirm cancellation, denial, and return-from-Settings leave the user able to retry camera or gallery.
- [ ] Confirm camera permission is still requested only after the user taps the camera action.
- [ ] Confirm `NSPhotoLibraryUsageDescription` and the `expo-image-picker` plugin `photosPermission` in `app.json` remain accurate; change the copy only if the behavior change makes it misleading, and note any implication for App Store privacy review.
- [ ] Tests: add a focused hook/helper test (mock `expo-image-picker`) proving `handleOpenGallery` no longer calls `requestMediaLibraryPermissionsAsync` but still calls `pickPhotoForQuote` and starts generation on a returned asset. If the hook is too heavy to test directly, extract nothing new; test the behavior at the smallest existing seam.

**Acceptance criteria:** On the verified OS versions, gallery selection opens the system picker without a prior broad-library prompt, and denial/cancellation recovery is unchanged. If a platform still requires the permission, keep the preflight there and record the evidence.

### Slice C — Explain where saved moments appear (re-scoped)

**Intent:** The camera-first Home is correct. The gap is discovery: a newly saved moment lands in the feed one full screen below the camera, and the entry point to older moments (the left action-bar icon) is an unlabeled calendar.

**Verified starting point:** The list empty-state branch renders `null` and is unreachable because the header is a full viewport. The newest item is offset by one viewport and ordered first. The Memories action opens `/memories` but has no label and uses a calendar icon.

- [ ] Do **not** add an empty-state block inside the full-viewport camera header; it would not be visible and would fight camera-first. If a feed empty state is still desired, first reduce or restructure the header height, and treat that as a separate design decision.
- [ ] Give the Memories action an accurate accessible name ("Memories" / localized) in both locales; Slice D owns the code-level accessibility wiring, so coordinate the string keys.
- [ ] Provide a non-blocking cue that saved moments appear in the scrollable feed (for example, a brief first-run hint, or a "Saved to your moments" hint with the existing success toast). Do not block the camera or add a modal.
- [ ] Optionally scroll the feed to the newly saved stack after a successful save so the user sees where it landed. If proposed, keep it behind the same slice and verify it does not fight the swipe/snap behavior.
- [ ] Keep the existing feed source and order (`created_at` descending) and insert no placeholder quote.
- [ ] Tests: add a small test for any new pure helper or rendered hint; assert no sample/placeholder item is injected into `feedItems`.

**Acceptance criteria:** A first-run user can tell that saved moments exist in a feed and how to reach older ones, without a modal and without changing the camera-first default.

### Slice D — Make Home controls accessible and adequately sized

**Intent:** Every icon-only action is understandable to a screen reader, the stacked photo can be changed without a swipe, and all interactive controls meet platform target sizes.

**Verified starting point:** The list in the evidence table above.

- [ ] Add accurate `accessibilityRole="button"` and localized `accessibilityLabel` to the generate/Memories, gallery, and share controls in `CameraActionsBar.tsx`; expose disabled state with `accessibilityState`.
- [ ] Add `accessibilityRole="button"` to the `QuoteMomentCard` share control and keep its label.
- [ ] Add labels/roles/states to the `HomeHeader` profile, sign-in, invite, and streak controls.
- [ ] Add a label and role to the `HomeCameraSection` delete-image control, and to the photo-stack finish, edit/style toggle, and zoom-preset controls.
- [ ] Provide an equivalent, screen-reader-accessible way to change the stacked photo while keeping swipe. Recommended: make the existing pager dots the accessible adjustable control, or add `accessibilityActions` with increment/decrement names on a single accessible element and handle them with `onAccessibilityAction`. Verify VoiceOver/TalkBack focus order so the card's share button remains reachable and is not swallowed by a parent `accessible` view.
- [ ] Measure every interactive control on device; expand hit regions with `hitSlop` or minimum sizes so iOS reaches 44 x 44 pt and Android reaches 48 x 48 dp, without enlarging the visible icons.
- [ ] Localize any new accessibility labels in `en.json` and `vi.json`.
- [ ] Optional adjacent fix: the hardcoded string "Me" in `QuoteMomentCard.tsx:46` should be localized; include only if it fits the slice.
- [ ] Tests: add render-tree assertions (in the style of `onboardingQuotePreview.test.ts`) for the new labels/roles where the component can be rendered without native modules. For `QuoteStackEntry`, prefer testing an extracted pure index helper if one is added; do not introduce a new abstraction solely for the test.

**Acceptance criteria:** A screen-reader user can identify each control and change the stack photo without a gesture; measured touch targets meet platform thresholds; visible styling is unchanged.

### Slice E — Contrast and legibility audit

**Intent:** Verify the actual rendered contrast of quote text and secondary copy; change only what measurement shows failing.

**Verified starting point:** `QuoteMomentCard` uses amber (#FBBF24), pink (#F9A8D4), or white text over variable photo/gradient backgrounds; `OnboardingQuotePreview` overlays white text on a translucent panel; onboarding secondary text uses low-opacity whites (for example `rgba(255,255,255,0.35)` at 14pt).

- [ ] Build a representative matrix: each text size (small/medium/large), each color scheme, and light/dark/variable photo backgrounds. Include the onboarding sample card and onboarding secondary copy.
- [ ] Measure the composited foreground/background ratio. Use a contrast checker on exported/actual pixels (the existing `captureRefView`/view-shot path can produce representative PNGs); do not compute from opacity alone.
- [ ] Record failures with the exact state, ratio, and target (4.5:1 normal, 3:1 large). Consider raising the quote panel's backing opacity or adding a text shadow only where measured failures occur.
- [ ] Change only failing combinations; do not restyle passing states.
- [ ] If onboarding secondary text fails, propose a higher-opacity color as a minimal change and localize nothing new.

**Acceptance criteria:** Every measured text/background combination either passes its applicable threshold or has a documented, approved exception.

### Slice F — Optional reminder timing

**Intent:** Decide whether the first-save reminder should interrupt the save moment.

- [ ] After the user decides, keep the reminder immediate or move it to a less interruptive point (for example, after the saved moment is visible or on the next app foreground).
- [ ] The save success state remains clear and the reminder remains dismissible.
- [ ] If changed, verify the reminder is still shown at most once and the `markReminderPromptShown` state is preserved.

**Recommendation:** Defer. This is not a blocker for Slice C, and the timing change is independent.

### Slice G — Remove dead onboarding steps (zero behavior change)

**Intent:** Remove unreferenced onboarding code and stale copy that could mislead future work.

- [ ] Confirm each file is still unreferenced (`CameraStep`, `GoalStep`, `GoalsStep`, `NotificationStep`, `PersonaStep`, `ProTeaserStep`, `TraitsStep`).
- [ ] Delete the files and any locale keys referenced only by them.
- [ ] Run `bun run lint` and `bun run test -- --runInBand`; confirm the app routes are unchanged.
- [ ] Keep this as a separate commit with no other edits, so it can be reverted independently.

**Acceptance criteria:** No remaining import or locale reference points at a deleted step; all checks pass.

---

## Verification and Test Strategy

Static and unit checks (run after each slice, and full before integration review):

- `bun run lint`
- `bun run test -- --runInBand`
- Optional: `bunx tsc --noEmit` (no typecheck script exists).

Tests to add or extend:

- Onboarding: distinct screen-2 sample, noninteractive preview, reduced-motion fallback.
- Picker: no preflight call on Home, picker still invoked, generation still starts after selection.
- Feed discovery: no placeholder item; any new hint/helper behaves as specified.
- Accessibility: labels/roles present on the Home controls that can be rendered in Jest.

Device verification (cannot be replaced by tests):

- Fresh iOS and fresh Android install: onboarding → Home → camera/gallery → generate → save → find the saved moment.
- Permission grant/denial/cancellation and return from Settings for camera and gallery.
- VoiceOver and TalkBack pass over Home controls and the photo stack.
- Measured touch targets and measured contrast states.
- Reduce Motion on both onboarding screens.
- English and Vietnamese, plus a small screen.

---

## Ownership and Sequencing

Per `docs/workflow.md`, use the lead-and-workers pattern with fixed file ownership; return to the plan for integration review before completion. Suggested order and safe parallelization:

1. **Slice A** and **Slice G** first: A is self-contained to onboarding; G is deletion-only. G can run in parallel with A only if A does not edit the same dead files (A deletes `HowItWorksComposeStep`, G deletes the other seven).
2. **Slice C** and **Slice D** coordinate through `HomeHeader`/locale keys; give one worker the locale files or assign disjoint key namespaces to avoid merge conflicts. `CameraActionsBar`/`HomeHeader` are UI-only.
3. **Slice B** is device-gated; start the device matrix early because it can change the code scope.
4. **Slice E** is measurement-first; it may end with no code change.
5. **Slice F** stays deferred until the user decides.

Every handoff should list goal, allowed files, forbidden files, contracts to preserve, and acceptance criteria (the repository template is `tasks/codex-to-cursor-handoff-template.md`). Forbidden for all slices: `supabase/`, `ios/`, `android/`, `bun.lock`, native config, and analytics.

---

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Removing the picker preflight breaks selection on an older OS or the `allowsEditing` avatar path. | Verify per call site on fresh builds; keep the preflight where the platform still needs it; never remove it globally. |
| A parent `accessible` view on the photo card hides the card's share button from screen readers. | Attach stack actions carefully; verify VoiceOver/TalkBack focus order on device before and after. |
| Changing the header height to expose an empty state erodes camera-first. | Keep the header full viewport; put the cue elsewhere or drop the empty-state idea. |
| Newly saved-item auto-scroll fights snap/swipe behavior. | Treat as optional within Slice C and verify against `snapOffsets`/`getItemLayout`. |
| Deleting dead steps removes something loaded dynamically. | Confirm no importer and no string-based route reference before deleting; keep it a separate commit. |
| Contrast "fixes" over-correct passing states. | Measure first; change only documented failures. |

---

## Open Questions / Deferred

- Should the first-save reminder stay immediate or move? (Slice F; recommended defer.)
- Should saving auto-scroll the feed to the new moment, or is a hint enough? (Slice C.)
- Is the feed empty-state idea dropped entirely, or paired with a header-height redesign later? (Recommended: drop for now; revisit separately.)
- Should the Memories icon change from a calendar to something that reads as a saved-moments entry point? (Product/visual decision; coordinate with Slice C.)

---

## Review Checklist

- [ ] Does this preserve the product direction in the existing specs?
- [ ] Which slices should move forward, and should any be dropped or reordered?
- [ ] Is the first-save reminder timing decision in scope now or deferred?
- [ ] Is the re-scoped Slice C (label + cue, no unreachable empty state) approved?
- [ ] Is removing the dead onboarding steps approved as a separate commit?
- [ ] After approval, use the repository's lead-and-workers workflow with fixed file ownership; return here for integration review before implementation is considered complete.
