# Onboarding UI and Behavior Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Inkly's onboarding a two-screen, animated introduction that guides new users into the existing Home photo-to-quote flow.

**Architecture:** Keep real photo selection, quote generation, quota handling, save, and share on Home. The onboarding screens only demonstrate the experience with local illustrative UI; they do not call AI or touch quote state.

**Tech Stack:** Expo SDK 54, Expo Router, React Native, Moti, i18next.

**Spec:** `docs/superpowers/specs/2026-09-28-onboarding-first-quote-design.md`

## Global Constraints

- Use exactly two onboarding screens.
- Preserve the existing sign-in destination and use the existing `completeOnboarding` action for completion and Skip.
- The final CTA and Skip complete onboarding and route to `/(tabs)`.
- No onboarding-time photo permission, upload, AI request, or quote-store mutation.
- Keep Home as the single source for camera/library selection, generation, retry, save, and share.
- Reuse Moti and `useReducedMotionPreference`; add no packages, native targets, or analytics events.
- Keep all onboarding copy in English and Vietnamese.

## Review Focus

- The demo reads as illustrative and has no fake tappable controls or saved quote.
- Continue, Back, Skip, and Sign in reach their intended routes.
- Skipping or finishing onboarding persists completion and opens Home.
- Reduce Motion shows the completed illustration without animated transitions.
- The app requests no camera/photo permission and makes no AI request until the user acts on Home.
- Home's existing quote flow is unchanged.

## File Map

| File | Responsibility | Planned change |
|---|---|---|
| `app/(onboarding)/index.tsx` | Onboarding progression | Change to two steps and wire completion, Back, and Skip handlers. |
| `src/features/onboarding/steps/WelcomeStep.tsx` | First impression | Animate the illustrative photo-to-quote reveal; preserve sign-in. |
| `src/features/onboarding/steps/HowItWorksSaveStep.tsx` | Second screen | Combine personalization/save/share messaging; add Back and Skip. |
| `src/features/onboarding/components/OnboardingQuotePreview.tsx` | Shared illustration | Show the sample quote in the current 3:5 photo-card style, with a noninteractive translucent quote overlay. |
| `src/features/onboarding/steps/HowItWorksToneStep.tsx` | Former middle screen | Delete after removing its only route reference. |
| `src/i18n/locales/en.json` | English localization | Update two-screen progress and copy; remove strings used only by the deleted screen. |
| `src/i18n/locales/vi.json` | Vietnamese localization | Mirror the English updates. |

## Tasks

### Task 1: Make the flow two screens and wire navigation

**Files:**
- Modify: `app/(onboarding)/index.tsx`
- Modify: `src/features/onboarding/steps/WelcomeStep.tsx`
- Modify: `src/features/onboarding/steps/HowItWorksSaveStep.tsx`
- Delete: `src/features/onboarding/steps/HowItWorksToneStep.tsx`

**Interfaces:**
- `WelcomeStep` receives `onContinue` and `onSkip`; retain its current sign-in route.
- `HowItWorksSaveStep` receives `onBack`, `onSkip`, and `onComplete`.
- Keep `completeOnboarding` and `router.replace("/(tabs)")` centralized in the route.

- [ ] Change the route step state from `0 | 1 | 2` to `0 | 1`; render `WelcomeStep` first and `HowItWorksSaveStep` second.
- [ ] Wire Welcome Continue to step 2 and Welcome Skip to the existing completion handler.
- [ ] Wire the second screen's Back to step 1; wire its Skip and primary CTA to the completion handler.
- [ ] Remove the `HowItWorksToneStep` import/reference and delete the component, whose only caller is this route.
- [ ] Manually verify Continue, Back, Skip from each screen, final CTA, and Sign in retain the destinations specified in the design.

### Task 2: Add the illustrative motion

**Files:**
- Modify: `src/features/onboarding/steps/WelcomeStep.tsx`
- Modify: `src/features/onboarding/steps/HowItWorksSaveStep.tsx`
- Create: `src/features/onboarding/components/OnboardingQuotePreview.tsx`

- [ ] Replace the static quote preview with a brief Moti sequence that visually moves from a moment/photo card to a sample quote reveal.
- [ ] Match the current 3:5 portrait photo card and its translucent, repositioned quote overlay in both screens.
- [ ] Combine the second screen's explanation into one short illustrative quote-card interaction for editing, saving, and sharing.
- [ ] Keep the illustration non-interactive and clearly sample content; do not write it to quote or memory state.
- [ ] Use `useReducedMotionPreference` on both screens; render the completed visual state immediately when reduced motion is enabled.
- [ ] Manually check the sequence plays once, leaves controls usable, and does not trigger camera/photo permissions or AI work.

### Task 3: Update localized onboarding copy

**Files:**
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/vi.json`

- [ ] Update the welcome progress label from step 1 of 3 to step 1 of 2.
- [ ] Set the second screen label to step 2 of 2 and use the approved **Create your first quote** meaning for its primary action.
- [ ] Add localized Back and Skip labels and concise copy explaining photo → quote → personalize/save/share.
- [ ] Remove only locale keys referenced solely by `HowItWorksToneStep`; retain copy used by any other screens.
- [ ] Manually verify the complete flow in English and Vietnamese, including progress labels and CTA text.

### Task 4: Verify first-run and reduced-motion behavior

**Files:**
- No additional files unless verification reveals a defect.

- [ ] Start from a fresh onboarding state and verify both screens, Skip paths, final CTA, and sign-in path.
- [ ] Confirm completion routes to Home and no sample quote appears in the quote or memory store.
- [ ] Confirm Home still requests permission only after the user chooses Camera and that the existing quote generation/retry/save/share flow remains available.
- [ ] Enable Reduce Motion and verify the same instructional content is visible without animated transitions.
- [ ] Inspect both locales and a small-screen layout for clipping, legibility, and reachable controls.
