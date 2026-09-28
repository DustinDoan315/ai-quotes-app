# Onboarding First-Quote Design

**Date:** 2026-09-28
**Status:** Approved

## User Goal

Improve Inkly's onboarding UI and behavior so new users quickly understand the photo-to-quote experience and feel motivated to create their first quote. The user specifically asked for animated instructions or similar motion in the onboarding screens.

## Current Experience

- `app/(onboarding)/index.tsx` shows three screens: `WelcomeStep`, `HowItWorksToneStep`, and `HowItWorksSaveStep`.
- The screens use sample copy and illustrations; they do not run quote generation or ask for a photo.
- Completing the final screen marks onboarding complete and routes to `/(tabs)`.
- The real photo selection, generation progress, retry, editing, saving, and sharing flow already exists on Home.
- Camera permission is requested when the user chooses to capture a photo, not in the onboarding explainer.
- Moti and `useReducedMotionPreference` are already used in onboarding.

## Approved Design

1. Reduce the onboarding intro from three screens to two.
2. Screen 1 demonstrates the core value with a short animated sequence: a photo/moment leads to a personalized quote reveal.
3. Screen 2 combines the remaining explanation: the user can personalize, save, and share the quote. Its primary CTA is **Create your first quote**.
4. The CTA completes onboarding and routes to Home. The actual photo and quote flow remains on Home, using its existing camera/library controls, generation, retry, save, and share behavior.
5. Add Back and Skip navigation. Skip completes onboarding and routes to Home without creating a quote.
6. Keep the existing sign-in path on the welcome screen.
7. Use brief, illustrative motion that does not look like a live, tappable control. Reuse Moti and the existing reduced-motion hook; when Reduce Motion is enabled, show the completed visual state without animation.
8. Keep the demo local and illustrative. It does not request camera/photo permission, upload an image, call AI, or add a fake quote to app state.
9. Update English and Vietnamese onboarding copy and progress labels for a two-screen flow.

## Interaction Details

### Screen 1: Welcome and photo-to-quote

- Retain the brand, welcome copy, and sign-in route.
- Replace the static quote preview with a simple motion sequence that communicates photo/moment → quote.
- Continue advances to Screen 2.
- Skip completes onboarding and opens Home.

### Screen 2: Personalize and keep

- Combine the current tone and save/share explanations into one concise screen.
- Show a short illustrative card interaction for personalizing and saving/sharing the quote.
- Back returns to Screen 1.
- **Create your first quote** completes onboarding and opens Home, where the user can choose Camera or Photo Library.
- Skip completes onboarding and opens Home.

### After onboarding

- Home remains the single source of truth for photo capture, image selection, generation progress, AI quota handling, retry, quote edits, save, and share.
- The existing permission prompts and error states remain in the Home flow.
- The demo animation never pretends to have generated or saved user content.

## Motion and Accessibility

- Use existing motion dependencies and patterns; add no animation package or new native target.
- Keep essential instructions in text so motion is never the only way to understand the flow.
- Respect the existing reduced-motion preference hook and use the final visual state as the fallback.
- Preserve safe-area layout, readable contrast, and clear tap targets for Back, Skip, Continue, and Sign in.
- Localize all user-facing copy and progress indicators in English and Vietnamese.

## Scope Boundaries

- No onboarding-time AI generation, image upload, or new quote-generation code.
- No camera or photo-library permission request before the user chooses the corresponding Home action.
- No new login, subscription, paywall, widget, or analytics behavior.
- No dependency changes.

## Acceptance Criteria

- New users see two onboarding screens with progress labels that match the two-screen flow.
- The first screen's motion explains the photo-to-quote result; the second explains personalization and keeping/sharing it.
- Reduce Motion displays the same information without animated transitions.
- Continue, Back, Skip, and Sign in preserve their intended destinations.
- Finishing or skipping marks onboarding complete and opens Home.
- Skipping does not create or persist a sample quote.
- Home continues to own all real photo, quote-generation, retry, save, and share interactions.
- Onboarding does not trigger camera/photo permission prompts or AI requests.
- English and Vietnamese copy remain consistent.

## Implementation File Map

| File | Responsibility | Intended change |
|---|---|---|
| `app/(onboarding)/index.tsx` | Onboarding progression | Switch to two screens, wire Back/Skip, and keep completion routing centralized. |
| `src/features/onboarding/steps/WelcomeStep.tsx` | First impression | Add the illustrative photo-to-quote motion while preserving sign-in and Continue. |
| `src/features/onboarding/steps/HowItWorksSaveStep.tsx` | Second onboarding screen | Combine personalization/save/share content and add Back, Skip, and the Home CTA. |
| `src/features/onboarding/steps/HowItWorksToneStep.tsx` | Former middle screen | Remove from the flow and delete; the onboarding route is its only caller. |
| `src/i18n/locales/en.json` | English copy | Update onboarding text and progress labels. |
| `src/i18n/locales/vi.json` | Vietnamese copy | Mirror the English onboarding updates. |

## Motion Implementation

- Use a small Moti-only reveal for onboarding. Do not reuse `QuoteInkBloom`: it is tied to generation progress and contains a continuously pulsing glow that does not fit a short instructional demo.
- If a proposed control in the instructional animation looks tappable, redesign it as a clearly illustrative sequence rather than adding a no-op interaction.
