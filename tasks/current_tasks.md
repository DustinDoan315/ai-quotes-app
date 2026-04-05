# Current Tasks

Last updated: 2026-04-05

This file is the live task board for medium and large work in this repo.

Use it together with:

- `tasks/task-intake-template.md`
- `tasks/codex-to-cursor-handoff-template.md`
- `docs/workflow.md`
- `AGENTS.md`

## How to Use This Board

1. Add new medium or large tasks to `Task Queue`.
2. When a task is selected, create an entry in `Active Task`.
3. Split work by ownership area before implementation begins.
4. Record Cursor or worker handoffs in `Agent Handoffs`.
5. Move completed work to `Completed Recently`.
6. Capture risks, verification, and follow-ups before closing the task.

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
| AI edge function production readiness | Codex | high | ready | Deploy and verify the new AI edge functions before production rollout. |
| Add integration smoke checks for AI flows | Codex | medium | planned | Validate explain, rewrite, and future-quote behavior against deployed functions. |
| Add AI observability and rate-limiting follow-up plan | Codex | medium | planned | Scope guardrails if AI usage grows. |

## Active Task

Use this section for the current medium or large task only.

### Summary

- Task: AI edge function production readiness
- Goal: Prepare the app and backend for safe rollout of the new AI explain, rewrite, and future-quote flows.
- User-visible outcome: AI tools work reliably in a deployed environment and are safe to enable in production.
- Status: ready
- Started: 2026-04-05
- Target finish: 2026-04-06

### Scope

- In scope:
  - verify deployed readiness for `quote`, `quote-explain`, `quote-rewrite`, and `quote-future`
  - confirm request and response contracts still match the mobile client
  - identify any missing production env or deployment steps
  - define a smoke-test checklist for post-deploy validation
- Out of scope:
  - redesigning AI prompts
  - broad UI redesign of AI tools
  - new monetization rules
  - long-term observability platform work

### Impacted Areas

- Routes: no route changes expected
- Features: `src/features/home/**`, `src/features/ai/**`
- Shared components: only if rollout feedback reveals UI state issues
- State: AI usage and quote-related stores only if contract mismatches are found
- Domain logic: subscription and usage guards only if rollout constraints need tightening
- Services: `src/services/ai/**`, related API client behavior
- Theme: none expected
- Backend: `supabase/functions/**`, deployed function config, backend contract docs
- Tests: `__tests__/aiClient.test.ts` and any rollout-related regression coverage

### Risks

- Product risk: AI tools may appear available in UI before deployed functions are fully ready.
- Technical risk: deployed environment variables or function behavior may diverge from local expectations.
- Regression risk: app-side AI client behavior may fail against deployed function contracts if request or response shapes drifted.

### Contracts and Assumptions

- Existing contracts to preserve:
  - mobile client request and response shapes documented in `docs/ai-api-contract.md`
  - current AI tool entry points in the home flow
- New contracts to define:
  - deployment and smoke-check expectations for production readiness
- Assumptions:
  - local implementation is already functionally correct
  - the main remaining gap is deployed verification and rollout safety

## Parallel Split

Use ownership boundaries, not vague feature splits.

| Workstream | Agent | Allowed Files | Forbidden Files | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| Planning and integration | Codex | repo-wide if needed | none | in_progress | Own rollout plan, integration, and final verification. |
| UI | Cursor UI Agent | `app/**`, `src/features/**`, `src/components/**` | `src/domain/**`, `src/services/**`, `src/appState/**`, `supabase/**` | planned | Only needed if rollout reveals UI state, loading, or messaging gaps. |
| Logic | Logic Agent | `src/domain/**`, `src/services/**`, `src/appState/**`, `src/hooks/**`, `src/utils/**` | `app/**`, `src/components/**`, `supabase/**` | ready | Verify AI client contract handling and fix any app-side mismatch. |
| Theme | Theme Agent | `src/theme/**`, `global.css` | business logic and backend files | not_needed | No theme work expected for this task. |
| Backend | Backend Agent | `supabase/**` | unrelated UI files | ready | Verify edge functions, deployment needs, and contract safety. |
| Tests | Test Agent | `__tests__/**` | unrelated production files | ready | Add targeted smoke or regression coverage if contract issues are found. |

## Agent Handoffs

Record active or recent handoffs here. Copy from `tasks/codex-to-cursor-handoff-template.md`.

### Handoff 1

- To: Backend Agent
- Goal: Verify AI edge function readiness for deployment and identify any missing production setup.
- Allowed files:
  - `supabase/functions/**`
  - `docs/ai-api-contract.md`
- Forbidden files:
  - `app/**`
  - `src/features/**`
  - `src/components/**`
- Contracts to preserve:
  - request and response shapes already consumed by the mobile client
  - existing function names and intended capabilities
- Acceptance criteria:
  - deployed-readiness gaps are identified
  - required env and deployment steps are documented
  - no unrelated backend refactors are introduced
- Status: ready

### Handoff 2

- To: Logic Agent
- Goal: Verify the app-side AI client and stores are resilient to deployed contract behavior and patch any mismatch if found.
- Allowed files:
  - `src/services/ai/**`
  - `src/features/ai/**`
  - `src/appState/**`
  - `__tests__/aiClient.test.ts`
- Forbidden files:
  - `supabase/**`
  - `src/theme/**`
  - broad route refactors in `app/**`
- Contracts to preserve:
  - current user-visible AI flows in the home experience
  - existing subscription and usage gating behavior unless a bug is found
- Acceptance criteria:
  - app-side contract handling is reviewed
  - any mismatch is fixed with minimal scope
  - tests are updated if behavior changes
- Status: ready

## Implementation Checklist

- [ ] Task was scoped with clear in-scope and out-of-scope boundaries
- [ ] Ownership split was defined before parallel work started
- [ ] Contracts were agreed before UI, logic, or backend edits began
- [ ] Handoffs were created for worker-safe subtasks
- [ ] Tests were updated where risk justified it
- [ ] Final integration was reviewed in Codex

## Verification

- Manual checks:
  - confirm deployed functions are reachable
  - exercise explain, rewrite, and future-quote flows in a production-like environment
  - confirm error handling is acceptable when a function fails
- Automated checks:
  - run `npm test` or targeted AI client tests if logic changes are made
- Remaining risks:
  - production env or deployment configuration may still require manual validation outside this repo
- Follow-up items:
  - enable production rollout only after backend readiness is confirmed
  - decide whether smoke checks should become a repeatable release checklist

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

- 2026-03-30: Analyzed the existing Expo/Supabase app structure and confirmed the mobile client references AI endpoints that were not implemented in `supabase/functions`.
- 2026-03-30: Added shared Supabase AI helpers and implemented `quote-explain`, `quote-rewrite`, and `quote-future` edge functions.
- 2026-03-30: Added AI client contract tests and documented the active AI API surface in `docs/ai-api-contract.md`.
- 2026-03-30: Fixed the local lint script to match the actual `app/`, `src/`, and `__tests__/` layout, then re-ran lint and tests successfully.
- 2026-03-30: Integrated AI tools into the home quote UI so users can explain a quote, generate a future-facing quote, and rewrite tone inline.

## Backlog Ideas

- Deploy the new Supabase Edge Functions before enabling these AI extras in production.
- Add integration tests or staging smoke checks against deployed functions and the home-screen AI tool flow.
- Expand AI API coverage to include input rate limiting and observability if usage grows.
