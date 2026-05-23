# Current Tasks

Last updated: 2026-05-11

This is the live v1 stabilization board. Use it with:

- `tasks/task-intake-template.md`
- `tasks/codex-to-cursor-handoff-template.md`
- `AGENTS.md`

## V1 Release Decision

First release should ship one clear loop:

1. Capture or pick a real-life photo.
2. Generate a personal quote that does not feel generic.
3. Save, share, and revisit quote memories.
4. Monetize extra usage without making the app feel blocked before users trust it.

Anything that expands social mechanics, discovery, advanced persona depth, or premium visual novelty is v2 unless it fixes a release blocker.

## Status Legend

- `planned`: defined but not started
- `ready`: scoped and ready for implementation
- `in_progress`: actively being worked
- `blocked`: waiting on decision, dependency, or fix
- `review`: implementation done, waiting for integration or verification
- `done`: completed and verified

## Task Queue

| Task | Owner | Priority | Status | Notes |
| --- | --- | --- | --- | --- |
| Quote quality hardening | Codex | P0 | in_progress | Backend prompts must avoid generic motivational output and preserve the mobile response contract. |
| Paywall v1 scope freeze | Codex | P0 | ready | Decide exact free/pro gates for v1 and remove or defer confusing gates. Recommended v1 gate: daily AI limit plus watermark/export value. |
| App identity and store asset cleanup | Theme Agent | P0 | review | Removed unused starter logos and wired the launcher icon through shared in-app brand surfaces. |
| Release smoke checklist | Codex | P0 | ready | Verify auth, quote generation, save/share, paywall purchase/restore, reminders, and production env. |
| AI edge function production readiness | Backend Agent | P1 | done | Deployed and smoke-verified `quote`, `quote-explain`, `quote-rewrite`, and `quote-future`. |
| V2 feature quarantine | Codex | P1 | planned | Keep `tasks/v2-plan.md` as backlog only; do not let engagement features block v1. |

## Active Task

### Summary

- Task: Quote quality hardening
- Goal: Stop the first-release quote experience from returning generic motivational lines.
- User-visible outcome: Generated quotes feel specific to the user's photo/persona context and less like stock advice.
- Status: in_progress
- Started: 2026-05-11
- Target finish: 2026-05-11

### Scope

- In scope:
  - strengthen `supabase/functions/quote/index.ts` prompt rules
  - reject obvious generic/cliche quote output before returning
  - remove temporary debug logging from first-release backend paths
  - preserve existing mobile request and response shapes
- Out of scope:
  - redesigning explain/rewrite/future quote tools
  - changing pricing, package IDs, or RevenueCat setup
  - adding new UI surfaces
  - changing database schema

### Impacted Areas

- Backend:
  - `supabase/functions/quote/index.ts`
  - `supabase/functions/_shared/ai.ts`
- Services:
  - no app-side API contract change expected
- Tests:
  - targeted checks if a local backend test harness exists; otherwise use lint/type-oriented validation and manual smoke checklist

### Risks

- Product risk: over-filtering generic phrases can turn weak AI output into a failed generation. This is acceptable short term if failures are rare, but should be monitored in production.
- Technical risk: Supabase edge functions are not covered by the Jest suite by default.
- Release risk: deployed function behavior must be smoke-tested after deployment with real photos.

### Contracts and Assumptions

- Existing contracts to preserve:
  - request body: `personaTraits`, optional `base64Image`, optional `language`, optional `visionLanguage`, optional `debugVision`
  - success response: `{ quote, language }`, plus `visionDebug` only when requested
  - error response: `{ error }`
- Assumptions:
  - v1 default quote language remains controlled by the mobile profile setting
  - quote length remains capped at 180 characters
  - generic output is worse for v1 trust than a retryable failed generation

## Parallel Split

Use ownership boundaries, not vague feature splits.

| Workstream | Agent | Allowed Files | Forbidden Files | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| Planning and integration | Codex | repo-wide if needed | none | in_progress | Own v1 scope, integration, and verification. |
| Backend quote quality | Backend Agent | `supabase/functions/quote/index.ts`, `supabase/functions/_shared/ai.ts` | UI, paywall UI, store assets | in_progress | Codex is currently implementing directly because this is the release blocker. |
| Paywall scope | Logic Agent | `src/domain/subscription/**`, `src/appState/subscriptionStore.ts`, `src/features/paywall/**`, `__tests__/**` | Supabase functions, app identity assets | ready | Wait for product decision before editing gates. |
| App identity | Theme Agent | `app.json`, `app.config.ts`, `assets/images/**`, `store-assets/**`, `src/theme/**` | paywall logic, Supabase functions | ready | Needs one final brand direction before asset work. |
| Release tests | Test Agent | `__tests__/**`, test utilities | production feature rewrites | ready | Add targeted regression tests after gates are frozen. |

## Agent Handoffs

Use `tasks/codex-to-cursor-handoff-template.md` when sending implementation work to Cursor or another worker.

### Handoff: Paywall v1 scope freeze

- Goal:
  - Simplify v1 monetization so users understand what Free vs Pro means.
- Why this task exists:
  - Current gates include AI count, exports, premium themes, persona level, and watermark behavior. That is too much for a first release unless each gate has clear value.
- Files allowed to edit:
  - `src/domain/subscription/**`
  - `src/appState/subscriptionStore.ts`
  - `src/features/paywall/**`
  - `src/utils/paywallPackage.ts`
  - `__tests__/**`
- Files forbidden to edit:
  - `supabase/functions/**`
  - `assets/images/**`
  - unrelated home/feed UI files
- Inputs or contracts to follow:
  - Keep RevenueCat entitlement id `pro_access` unless a separate release decision changes it.
  - Recommended v1 free limit remains small but understandable: daily AI generations.
  - Do not introduce new product tiers.
- Acceptance criteria:
  - Free/pro gates can be explained in one sentence.
  - Paywall reasons shown in UI match actual locked behavior.
  - Tests cover any changed guard behavior.
- Notes on risks:
  - Over-gating before trust is built can hurt activation and make the app feel paywalled too early.

### Handoff: App identity and asset cleanup

- Goal:
  - Make the app identity production-ready for v1.
- Why this task exists:
  - App config uses `Inkly: Daily Vibes`, but starter Expo assets still exist and the icon/splash set needs final consistency.
- Files allowed to edit:
  - `app.json`
  - `app.config.ts`
  - `assets/images/**`
  - `store-assets/**`
  - `scripts/sync-app-icons.sh`
  - `src/theme/appBrand.ts`
- Files forbidden to edit:
  - `src/domain/**`
  - `src/services/**`
  - `supabase/functions/**`
- Inputs or contracts to follow:
  - Keep bundle/package identifiers unchanged unless explicitly approved.
  - Keep app scheme `inkly` unless explicitly approved.
- Acceptance criteria:
  - iOS icon, Android adaptive icon, splash image, favicon, notification icon, and store icons are visually aligned.
  - Expo starter logo files are removed only if unused.
  - App display name is final and consistent across config and brand strings.
- Notes on risks:
  - Store asset changes are externally visible and should be reviewed visually before release.

## Implementation Checklist

- [x] V1 stabilization scope defined
- [x] Highest-risk quote quality work started
- [x] Quote backend changes verified locally as far as the repo supports
- [ ] Paywall gates frozen for v1
- [ ] App identity assets reviewed
- [ ] Release smoke checklist executed
- [ ] Final integration reviewed in Codex

## Verification

- Manual checks:
  - generate quotes with and without photos in Vietnamese and English
  - confirm obvious generic lines are not returned
  - confirm auth failures still return `401`
  - confirm generated quote response shape still matches the mobile client
  - run purchase and restore flows in sandbox before release
- Automated checks:
  - run `npm test`
  - run `npm run lint`
- Remaining risks:
  - Supabase edge functions require deployment smoke checks outside Jest
  - Quote quality still depends on model behavior and should be monitored after release

## Completed Recently

| Task | Completed On | Outcome |
| --- | --- | --- |
| AI quote backend contract completion | 2026-03-30 | Added `quote-explain`, `quote-rewrite`, and `quote-future` Supabase functions. |
| AI quote tools UI integration | 2026-03-30 | Added explain, rewrite, and future-quote actions to the home quote flow. |
| AI API documentation | 2026-03-30 | Documented supported endpoints and payload contracts. |
| AI client contract tests | 2026-03-30 | Added coverage for success, validation, and failure handling. |
| Project structure alignment | 2026-03-30 | Documented Expo-first structure and Supabase backend role. |
| Local run and env audit | 2026-03-30 | Verified key env variables and local developer commands. |

## Progress Log

- 2026-05-11: Reframed the active board around v1 release stabilization instead of v2 feature expansion.
- 2026-05-11: Started quote quality hardening as the first release blocker because generic quotes directly damage the core user promise.
- 2026-05-11: Strengthened quote prompts, added one retry for generic drafts, removed temporary quote/auth debug logging, and ran local tests.
- 2026-05-11: Deployed `quote` to Supabase project `nwaqdinhdtqqdcjcpxnq` and verified a `200` smoke response with a non-empty quote.
- 2026-05-11: Deployed `quote-explain`, `quote-rewrite`, and `quote-future` to the same project; all three passed authenticated smoke checks.
- 2026-05-11: Audited app icon references, removed unused Expo starter logo assets, and added a shared `AppIcon` component for onboarding/login brand surfaces.

## Backlog Ideas

- Keep `tasks/v2-plan.md` as the backlog for feed engagement and social expansion after v1.
- Add repeatable staging smoke scripts for Supabase AI functions.
- Add AI observability once production usage exists.
