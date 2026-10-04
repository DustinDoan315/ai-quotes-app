# Inkly unused-code and app-size cleanup plan

Audit date: 2026-10-04. Baseline: main `f08a627`. Status: implemented confirmed source/helper/dependency cleanup and EAS upload exclusions; native asset consolidation deferred for visual verification. No native build.

## Findings and limits

The TypeScript-resolved import graph starts from every Expo Router file under `app/`, follows imports, re-exports, literal dynamic imports, and literal `require` calls, and checks test reachability separately. Repository text searches cross-check candidate names. Expo routes remain entry points even when no other module imports them. Computed runtime imports and native configuration need explicit review before deletion.

Found **36 app-unreachable source files**, totaling **127,846 bytes (124.8 KiB) of source**. None are reachable from the test roots either. This is source cleanup, not a measured production bundle saving: Metro generally does not include unreachable source.

## Phase 1 — remove unreachable source

Remove the files below as groups so old modules do not leave dangling imports. Active replacements must remain: current onboarding route/steps, `RevenueCatPaywallScreen`, `InklyShareWatermark`, inline rewrite review, and the unified profile language section.

| Candidate | Source bytes | Importers within the dead group |
|---|---:|---|
| `src/features/paywall/usePaywallOfferings.ts` | 974 | `src/features/paywall/PaywallScreen.tsx` |
| `src/features/share/shareQuote.ts` | 460 | `src/features/share/ShareQuoteButton.tsx` |
| `src/services/api/client.ts` | 3,403 | `src/services/api/routes.ts` |
| `src/services/api/errors.ts` | 852 | `src/services/api/client.ts` |
| `src/services/api/routes.ts` | 1,221 | None |
| `src/services/api/types.ts` | 486 | `src/services/api/routes.ts` |
| `src/services/media/userPhotoMessages.ts` | 1,596 | None |
| `src/theme/homeVibeRarity.ts` | 474 | `src/features/home/HomeVibeWatermark.tsx` |
| `src/theme/typography.ts` | 545 | None |
| `src/types/index.ts` | 498 | None |
| `src/components/QuoteCard.tsx` | 343 | None |
| `src/features/dev/RevenueCatTestScreen.tsx` | 6,119 | None |
| `src/features/home/HomeBackground.tsx` | 1,701 | `src/features/onboarding/steps/GoalStep.tsx`, `src/features/onboarding/steps/GoalsStep.tsx`, `src/features/onboarding/steps/HowItWorksComposeStep.tsx`, `src/features/onboarding/steps/NotificationStep.tsx`, `src/features/onboarding/steps/PersonaStep.tsx`, `src/features/onboarding/steps/TraitsStep.tsx` |
| `src/features/home/HomeVibeWatermark.tsx` | 2,488 | None |
| `src/features/home/RewriteQuoteReviewModal.tsx` | 5,593 | None |
| `src/features/onboarding/OnboardingProgressBar.tsx` | 1,052 | None |
| `src/features/onboarding/steps/CameraStep.tsx` | 8,182 | None |
| `src/features/onboarding/steps/GoalStep.tsx` | 5,441 | None |
| `src/features/onboarding/steps/GoalsStep.tsx` | 8,400 | None |
| `src/features/onboarding/steps/HowItWorksComposeStep.tsx` | 5,527 | None |
| `src/features/onboarding/steps/NotificationStep.tsx` | 11,839 | None |
| `src/features/onboarding/steps/PersonaStep.tsx` | 8,039 | None |
| `src/features/onboarding/steps/ProTeaserStep.tsx` | 4,625 | None |
| `src/features/onboarding/steps/TraitsStep.tsx` | 6,065 | None |
| `src/features/paywall/PaywallAmbientBackground.tsx` | 1,531 | `src/features/paywall/PaywallScreen.tsx` |
| `src/features/paywall/PaywallFeatureComparison.tsx` | 3,618 | `src/features/paywall/PaywallScrollContent.tsx` |
| `src/features/paywall/PaywallInfoStrip.tsx` | 2,704 | `src/features/paywall/PaywallScreen.tsx` |
| `src/features/paywall/PaywallPackageList.tsx` | 9,931 | `src/features/paywall/PaywallScrollContent.tsx` |
| `src/features/paywall/PaywallPlansSkeleton.tsx` | 1,981 | `src/features/paywall/PaywallScrollContent.tsx` |
| `src/features/paywall/PaywallScreen.tsx` | 8,791 | None |
| `src/features/paywall/PaywallScrollContent.tsx` | 3,907 | `src/features/paywall/PaywallScreen.tsx` |
| `src/features/paywall/PaywallStickyFooter.tsx` | 3,703 | `src/features/paywall/PaywallScreen.tsx` |
| `src/features/paywall/PaywallValueBullets.tsx` | 1,345 | `src/features/paywall/PaywallScrollContent.tsx` |
| `src/features/profile/ProfileQuoteLanguageSection.tsx` | 1,738 | None |
| `src/features/profile/ProfileUiLanguageSection.tsx` | 1,703 | None |
| `src/features/share/ShareQuoteButton.tsx` | 971 | None |

Delete `src/services/api/` and `src/features/share/` only when all their listed files are removed and the folders are empty. Delete `src/features/dev/` if the RevenueCat test screen is its only remaining file. Keep the active paywall/onboarding/profile folders.

## Phase 2 — remove unused functions inside live modules

Candidates to remove after a final caller check:

- `useExplainQuote` and `useFutureQuote` in `src/features/ai/useQuoteAIExtras.ts`; keep the active rewrite hook. Their client API helpers can be reviewed after removing these hooks. Do not delete deployed AI functions as part of this mobile cleanup.
- `signUp`, `signIn`, and `getSession` in `src/services/supabase-auth.ts`: no external callers found. `getUserProfile` is retained as a private helper because `getCurrentUserProfile` calls it. Verify Apple/Google, session restoration, guest merge, and sign-out paths before changing this authentication file.
- `identifyUser` and `resetUser` in `src/services/analytics/posthog.ts`: no callers found. Decide whether to wire these into the intended analytics identity lifecycle or delete the wrappers; keep active analytics initialization/event capture.
- `centerCropToAspect` in `src/utils/imageCrop.ts`: no references found. Remove only this helper, preserving used image utilities.
- Unused constants `APPLE_STANDARD_EULA_URL`, `PRO_DAILY_AI_LIMIT`, and `PRO_DAILY_EXPORT_LIMIT`: review compatibility/business intent before removing. Keep active legal URLs and subscription rules.
- Unused `aiToolsLoadingLabel` prop/destructure in `HomeCameraSection` and its route wiring; unused callback parameter `state` in `memoryStore`.

Do **not** delete `createStarterPersona`, `buildInviteUrl`, `resolveInviteCode`, `addFriend`, `hexToRgba`, or `STREAK_MILESTONES`: these are used inside their own modules. No external references does not mean unused. Their exports could be made private separately if useful.

`src/bootstrap/useAppBootstrap.ts` already has unrelated local edits. Exclude it from this cleanup; its externally unused constant is not an authorized reason to alter that work.

## Phase 3 — dependencies

| Dependency | Evidence | Expected benefit |
|---|---|---|
| `expo-symbols` | No app/config/script references or installed reverse dependency; `ExpoSymbols` is present in the CocoaPods lockfile. | Removes an unused native module on the next native build. Binary saving not yet measured. |
| `expo-status-bar` | No app/config references or installed reverse dependencies. | Dependency/install cleanup; likely little production JS benefit. |
| `fs-extra` | No app/script usage. Only the unused patch-package tool needs its separate version. | Install/tooling cleanup. |
| `patch-package` (dev) | Never invoked; postinstall uses shell patch plus the Google nonce script. | Install/tooling cleanup, not production binary savings. |

Remove declarations with Bun, update the authoritative `bun.lock`, validate a clean install, and preserve both existing postinstall patches. Check the resulting dependency graph and Expo/native autolinking configuration. Do not hand-edit generated CocoaPods output as a substitute for dependency regeneration.

Keep `expo-system-ui` (automatic UI style configuration), `expo-font` (icons/Expo), `expo-linking`, `react-native-screens`, `react-dom`, `react-native-web`, `expo-dev-client`, splash/updates packages, RevenueCat, and active animation packages. Router/navigation peers can be required indirectly. Removing direct `@react-navigation/bottom-tabs`/`elements` declarations would not remove their transitive runtime packages, so it is low priority.

Remove the broken `reset-project` package script: its target `scripts/reset-project.js` does not exist.

## Phase 4 — assets and folder hygiene

All seven runtime images are referenced; **no runtime image is confirmed unused**. Their total logical size is 3,384,504 bytes.

- `icon.png`, `splash-icon.png`, and `android-icon-foreground.png` are byte-identical at 1,029,033 bytes each. Consider pointing appropriate configuration/component references at a shared source and updating `scripts/sync-app-icons.sh`. This could eliminate 2,058,066 bytes of duplicate repository input; native build systems may still generate separate required outputs, so installed savings are unproven. Validate splash and adaptive-icon appearance before consolidating.
- Legacy `ios/Assets.xcassets` has 38 files totaling 1,954,316 bytes and no Xcode project references; the project uses `ios/InklyDailyVibes/Images.xcassets`. Retire the legacy script target before considering deletion. Keep active native resources.
- Keep `store-assets/`, `public/`, design-reference assets, migrations, and deployment history: they serve release, web/deep-link, or maintenance workflows.
- `build/` and `videos/` are empty: cosmetic cleanup only.
- Keep the authoritative `bun.lock`; the ignored legacy `bun.lockb` can be removed locally once the package-manager convention is confirmed.
- Consider an `.easignore` copied from existing exclusions plus tool/release-only folders such as `.claude/`. Preserve required tracked build/native files and patches. This reduces upload size, not installed app size.

Local regenerable folders are not unused runtime files:

| Folder | Logical bytes | Benefit if cleared |
|---|---:|---|
| `dist/` | 15,611,278 | Workspace only |
| `.expo/` | 5,298,353 | Workspace only; regenerates local Expo state |
| `ios/build/` | 700,489 | Workspace only |
| `ios/Pods/` | 274,935,971 | Workspace only; requires dependency reinstall |
| `node_modules/` | 1,363,317,773 | Workspace only; requires dependency reinstall |

Do not delete dependencies/native folders for an app-size cleanup. `.claude/` includes a tracked nested tooling repository; exclude unnecessary upload content rather than deleting it as app code.

## Verification and acceptance

1. Re-run the import/reference audit after each source group; confirm active routes, dynamic loading, and configuration references remain intact.
2. Run TypeScript, scoped lint, and the complete Jest suite. Run `--noUnusedLocals --noUnusedParameters` to track remaining dead locals separately from ordinary compilation.
3. Check onboarding, Home/draft generation and rewrite, photo save/share, language selection, Apple/Google auth and guest merge, paywall purchases/restore, and deep links on the next available native runtime.
4. For dependency removal, verify clean Bun install/postinstall and native dependency resolution. Source tests alone do not prove native compatibility.
5. Later, with a native build authorized, compare the same production build profile/architecture before and after: JS bundle/assets, IPA/AAB size, and platform download/install estimates. Report each independently.

Recommended order: unreachable source → isolated unused helpers/props → four dependency removals → optional asset consolidation. Keep these in reviewable commits. No iOS build is included in this plan.

## Implementation record

Removed the 36 unreachable files (127,846 source bytes) and their now-empty API/share/dev folders; removed confirmed unused hooks/helpers/constants and the draft loading-label plumbing. Removed four package declarations and updated Bun's authoritative lockfile. Removed the broken reset-project script. Added EAS upload exclusions while preserving the existing ignore rules.

Kept internal auth profile lookup, backend endpoints, user-owned bootstrap edits, active icons/native assets, release assets, caches, and native directories. Duplicate-icon consolidation and legacy native catalog removal remain deferred until native visual/resource verification. No app download-size reduction is claimed without a comparable production artifact.

Verification after cleanup: 313 Jest tests / 58 suites passed; TypeScript with unused locals/parameters checks passed; repository lint completed with no errors (three pre-existing import-order warnings in auth tests). Bun normal/frozen installs and Apple/Android Expo autolinking checks passed. Metro production exports for iOS and Android completed successfully to a temporary directory. These exports verify JavaScript bundling; no native binary was built and no before/after app-size claim is made.
