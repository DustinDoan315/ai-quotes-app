# Onboarding, Home, and Feed UX Review Plan

**For agentic workers:** The user authorized implementation on 2026-09-29. Use the approved onboarding spec and this plan. Implement Tasks 1–4 as independent slices. Defer optional Task 5.

**Goal:** Improve the first-run path from onboarding to creating, saving, and finding a quote, while preserving Inkly’s short onboarding and camera-first Home.

**Architecture:** UI and existing local state only. No API, AI prompt, auth, subscription, or database contract changes are proposed.

**Tech Stack:** Expo SDK 54, React Native, Expo Router, TypeScript.

**Spec:** [Onboarding first-quote design](../specs/2026-09-28-onboarding-first-quote-design.md); [home actions and invite sharing](../specs/2026-09-25-home-actions-and-invite-sharing.md); [UX research and sources](../../research/onboarding-home-feed-ux.md).

## Global Constraints

- Keep onboarding to two screens. Preserve Skip, Back, and the final “Create your first quote” action and its Home destination.
- Do not request camera or photo-library access, call AI, or mutate saved quote state from onboarding.
- Keep Home camera-first. Do not seed the feed with fake/sample saved moments.
- Preserve the existing icon-only visual direction; add accessible names and hit areas without adding persistent text labels unless review shows they are needed.
- Reuse installed Expo and existing UI patterns. Add no dependency, analytics event, backend change, or new abstraction for this work.
- Treat the picker permission behavior as a device-verification question until confirmed on fresh iOS and Android installs.

## Approved Scope

- [x] Keep the approved two-screen onboarding and camera-first Home direction.
- [x] Make the onboarding examples tell two distinct parts of the story: photo-to-quote, then personalize/save/share.
- [x] Add a clear empty-feed explanation and a first-run cue for where saved/shared moments appear, without sample content.
- [x] Add an accessible alternative to horizontal swipe for moving through stacked photos, while retaining swipe gestures.
- [x] Check the image-library permission preflight against the app’s pinned Expo version; remove it only where supported by the system picker behavior.
- [ ] Defer the first-save reminder timing decision; leave existing behavior unchanged.

## Findings and Priority

| Priority | Finding | Proposed response |
| --- | --- | --- |
| P1 | The second onboarding page repeats the first sample instead of demonstrating the “make it yours” save/share story called for by the approved spec. | Make the two illustrations/copy steps distinct; keep the flow and CTA unchanged. |
| P1 | An empty quote feed has no explanation or cue for where moments appear. | Add a small, useful empty state and first-run discovery cue that points to the existing camera/memories actions. |
| P1, verify first | Gallery selection requests media-library permission before opening an images-only system picker. This may be an unnecessary gate on current platforms. | Verify on fresh iOS and Android builds; remove the preflight only where the platform picker provides the needed access. |
| P2 | Stacked quote photos are advanced by gesture, with no accessible next/previous action. Some Home actions also rely on icons without accessible names. | Preserve gesture behavior and visuals; add accessible semantics and an equivalent way to change the stack photo. |
| P2 | Some Home controls may fall below platform-recommended touch-target sizes. | Measure interactive bounds and expand hit regions where needed, without enlarging the visible icons. |
| P2, decide | The first-save reminder can appear immediately after the success toast and interrupt the moment the user just saved. | Review timing; change only if the user approves a different point in the flow. |
| Verify, no failure claimed | Quote text overlays variable photos and gradients. Opacity alone does not prove a contrast failure. | Measure representative rendered states and adjust only failing combinations. |

The previous ratings are directional judgments from source inspection, not usability-study results: onboarding flow 7.5/10, onboarding UI 8/10, Home UI 7/10, creation path 6.5/10, feed discovery 6/10. No conversion baseline or device-render audit is available, so this plan sets no invented conversion target.

## Thresholds and Evidence to Check

- Touch targets: check at least 44 × 44 pt on iOS and 48 × 48 dp on Android for interactive controls; hit slop may expand a small visual icon.
- Contrast: if applying WCAG AA, verify 4.5:1 for normal text and 3:1 for large text against the actual composited image/gradient. Do not infer a failure from a low opacity value alone.
- Permissions: verify the actual Expo SDK 54 image-picker behavior on supported OS versions before changing the request flow. Test cancellation, denial, and returning from system settings.
- Motion: preserve the existing reduced-motion behavior and check that both onboarding pages remain understandable without animation.
- Scope of evidence: test a fresh install and an account with saved moments; include small screens and English/Vietnamese copy. No numeric funnel target is proposed without a measured baseline.

## Candidate File Map

| Slice | Likely files | Boundary |
| --- | --- | --- |
| Onboarding examples | `src/features/onboarding/steps/WelcomeStep.tsx`, `src/features/onboarding/steps/HowItWorksSaveStep.tsx`, `src/features/onboarding/components/OnboardingQuotePreview.tsx` | Keep route/state transitions and approved CTA unchanged. |
| Onboarding copy | `src/i18n/locales/en.json`, `src/i18n/locales/vi.json` | Keep English and Vietnamese meaning aligned. |
| Image picker gate | `src/features/home/useHomeCamera.ts`, `src/utils/pickPhotoForQuote.ts` | Existing picker behavior only; no onboarding permissions or new native dependency. |
| Empty-feed discovery | `app/(tabs)/index.tsx`, `src/features/home/HomeFeedFlow.tsx`, `src/features/quotes/QuoteMomentsFeed.tsx`, relevant locale strings | Make the empty page reachable in the snap list, explain saved/shared moments, and add a subtle first-page cue; no fake content or feed data changes. |
| Accessibility and touch targets | `src/components/CameraActionsBar.tsx`, `src/components/HomeHeader.tsx`, `src/features/home/HomeActionBar.tsx`, `src/features/quotes/quoteStack/QuoteStackEntry.tsx`, `src/features/quotes/QuoteMomentCard.tsx`, `src/i18n/locales/en.json`, `src/i18n/locales/vi.json` | Preserve icon-only styling and gesture behavior; add semantics, accessible stack controls, and adequate hit areas for primary and contextual Home actions. |
| Save reminder timing | Existing first-save handler (locate before editing) | Separate, optional decision; leave out unless approved. |

Paths above reflect the current source tree. Confirm each component’s callers and ownership before implementation; keep the UI, state, and service boundaries intact.

## Implementation Tasks

The user approved Tasks 1–4. Keep them independently reviewable.

### Task 1: Make the onboarding story progress

- [x] Screen 1 shows the photo-to-quote transformation.
- [x] Screen 2 explains personalization and shows the save/share outcome with a distinct example.
- [x] Skip, Back, final CTA destination, two-screen length, and reduced-motion behavior remain intact.
- [x] First-run Skip, Back, and account-entry targets meet the 48-unit Android logical target size.
- [x] No permission prompt, AI request, or quote-state mutation is introduced in onboarding.

### Task 2: Remove a redundant image-picker permission gate when supported

- [x] Confirm the behavior documented for the project’s pinned Expo SDK and image-picker versions.
- [x] Open the images-only system picker directly from the user’s gallery action when supported and remove only the redundant preflight.
- [x] Cancellation returns to Home without generation/state mutation; camera remains available.
- [x] Camera permission remains requested only after the user taps the camera action.
- [ ] Record fresh-install device verification as outstanding if it cannot be performed in this environment.

### Task 3: Explain the empty feed and discovery path

- [x] Empty state tells the user what appears in Moments and how to create the first one.
- [x] When there are no quote stacks, the empty state is a reachable snap page after the full-screen camera header; loading and populated-feed snapping remain correct.
- [x] A small, non-blocking first-page cue tells new users to swipe up to Moments while the feed is empty.
- [x] The empty-state copy points to existing camera and Memories actions without blocking the feed.
- [x] Saved and shared moments continue to use the existing feed source and order; no placeholder quote is inserted.

### Task 4: Make Home controls accessible

- [x] Icon-only actions expose accurate accessible labels, roles, and states where relevant.
- [x] A screen-reader-accessible next/previous action changes the stacked photo; swipe remains available.
- [x] Source touch-target dimensions meet the 48-unit Android guidance for primary and contextual Home controls while visible icon sizing stays consistent.
- [ ] Dynamic quote/photo combinations are checked for contrast; change only combinations that fail measurement.

### Task 5: Optional reminder timing — deferred

- [ ] After the user decides, keep the first-save reminder immediate or move it to a less interruptive point.
- [ ] The save success state remains clear and the reminder remains dismissible.

## Review Checklist

Implementation of Tasks 1–4 is complete on the review branch. Task 5 remains deferred. Before shipping, complete these device checks:

- [ ] Fresh iOS and Android install: open the image picker without a library-permission preflight; select and cancel; confirm camera access is still requested only on capture.
- [ ] Compact screen and English/Vietnamese: check onboarding examples, navigation targets, and empty-feed cue placement.
- [ ] Empty Moments page is reachable after the camera page; loading and populated-feed snapping remain correct.
- [ ] VoiceOver and TalkBack: verify Home labels/states, previous/next stack actions, share focus, and continued swipe navigation.
- [ ] Measure representative rendered quote/photo contrast; change colors only for combinations that fail the chosen contrast requirement.
