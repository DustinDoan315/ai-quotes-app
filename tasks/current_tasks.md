# Current Tasks

Last updated: 2026-03-30

## Task List

| Task name | Description | Priority | Status |
| --- | --- | --- | --- |
| AI quote backend contract completion | Add missing Supabase AI endpoints used by the mobile client for quote explanation, rewrite, and future quote generation. | high | done |
| AI quote tools UI integration | Expose explain, rewrite, and future-quote actions inside the home quote flow. | high | done |
| AI API documentation | Document the supported AI endpoints, request payloads, and response contracts for local development. | medium | done |
| AI client contract tests | Add automated tests for AI client success, validation, and failure handling. | high | done |
| Project structure alignment | Preserve the existing Expo-first layout while documenting how `supabase/` acts as the current backend and migrations layer. | medium | done |
| Local run and env audit | Verify the minimum environment variables and developer commands required to run the app locally. | medium | done |

## Feature Breakdown

### AI quote backend contract completion

| Area | Work | Status |
| --- | --- | --- |
| API | Implement `quote-explain`, `quote-rewrite`, and `quote-future` Supabase functions. | done |
| Database | No schema change required for this feature. | done |
| Business logic | Reuse validation, language normalization, and response extraction patterns for all AI flows. | done |
| UI | No screen changes required; existing mobile client already calls these endpoints. | done |
| Testing | Add client-level tests that validate endpoint usage and response parsing. | done |

## Progress Log

- 2026-03-30: Analyzed the existing Expo/Supabase app structure and confirmed the mobile client references AI endpoints that are not implemented in `supabase/functions`.
- 2026-03-30: Added shared Supabase AI helpers and implemented `quote-explain`, `quote-rewrite`, and `quote-future` edge functions.
- 2026-03-30: Added AI client contract tests and documented the active AI API surface in `docs/ai-api-contract.md`.
- 2026-03-30: Fixed the local lint script to match the actual `app/`, `src/`, and `__tests__/` layout, then re-ran lint and tests successfully.
- 2026-03-30: Integrated AI tools into the home quote UI so users can explain a quote, generate a future-facing quote, and rewrite tone inline.

## Next Steps

- Deploy the new Supabase Edge Functions before enabling these AI extras in production.
- Consider adding integration tests or staging smoke checks against deployed functions and the new home-screen AI tool flow.
- Expand the AI API coverage to include input-rate limiting and observability if usage grows.
