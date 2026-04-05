# AGENTS.md

This repository uses a lead-and-workers workflow:

- Codex is the lead agent for planning, architecture, integration, and verification.
- Cursor is the fast in-editor worker for scoped implementation work.
- Parallel work is split by file ownership, not just by task size.

## Core Workflow

1. Codex defines scope, acceptance criteria, and file boundaries.
2. Worker agents implement inside their assigned folders.
3. Codex integrates results, resolves boundary issues, and verifies behavior.

## Tool Selection

Use Codex first when any of these are true:

- The task touches more than 3 files
- The task crosses UI, state, service, or backend boundaries
- The task changes architecture, contracts, or data flow
- The task affects AI, auth, paywall, subscription, navigation, or Supabase behavior
- The task needs investigation, planning, or final verification
- The task should be split into parallel subtasks

Use Cursor directly when all of these are true:

- The change is scoped to 1 or 2 nearby files
- The work is mostly UI, styling, copy, or local refactoring
- No shared store, API contract, migration, or business rule changes are needed
- The result can be validated locally by reading the edited files or a quick app check

Recommended workflow:

1. Start in Codex for planning on medium or large tasks.
2. Hand scoped implementation slices to Cursor or another worker.
3. Return to Codex for integration, review, and verification.

## Ownership Model

### Codex Lead

Use Codex for:

- Multi-file features
- Refactors across modules
- Debugging unclear issues
- Architecture or data-flow changes
- Final review, cleanup, and test verification
- Any risky change touching AI, auth, paywall, subscription, or backend contracts

Codex may edit any file when needed, but should prefer coordinating specialized workers first.

### Cursor UI Agent

Primary purpose: fast UI implementation and local refactors.

May edit:

- `app/**`
- `src/features/**`
- `src/components/**`

Should focus on:

- Screen layout
- Component extraction
- Visual polish
- Copy placement
- Route-level UI wiring
- Animation and presentation details

Must not change architecture or core contracts without Codex direction.

### Logic Agent

Primary purpose: business rules, app state, and integration behavior.

May edit:

- `src/domain/**`
- `src/services/**`
- `src/appState/**`
- `src/hooks/**`
- `src/utils/**`

Should focus on:

- Business rules
- State transitions
- Guards and resolvers
- API and SDK integration logic
- Shared hooks and pure utilities

Should avoid unowned UI refactors unless required for integration.

### Theme Agent

Primary purpose: design tokens and shared presentation conventions.

May edit:

- `src/theme/**`
- `global.css`

Should focus on:

- Colors
- Typography
- Brand strings
- Shared visual tokens
- Reusable presentation primitives

Must avoid embedding one-off tokens in feature files if a shared token is more appropriate.

### Backend Agent

Primary purpose: Supabase and backend-facing contracts.

May edit:

- `supabase/functions/**`
- `supabase/migrations/**`
- `docs/ai-api-contract.md`
- other backend contract docs

Should focus on:

- Edge functions
- Request and response shapes
- Database migration safety
- Server-side validation

### Test Agent

Primary purpose: add or update tests after implementation boundaries are defined.

May edit:

- `__tests__/**`

Should focus on:

- Domain logic coverage
- AI and paywall logic coverage
- Utility tests
- Regression tests for changed behavior

## Parallel Work Rules

- Each worker must have a clear goal and fixed write scope.
- Avoid assigning two agents to the same file set at the same time.
- Prefer splitting by ownership boundary rather than by feature name.
- Shared contracts should be defined first by Codex before parallel edits begin.
- If a task changes both UI and logic, split it into separate UI and logic subtasks.
- If a task changes API contracts, backend and logic work should align on the contract before implementation continues.

## Repository Architecture

- `app/`: Expo Router routes and screen entry points
- `src/features/`: feature-specific UI and flows
- `src/components/`: shared UI components
- `src/appState/`: Zustand-style app state stores
- `src/domain/`: business logic, rules, guards, resolvers
- `src/services/`: external APIs, SDKs, analytics, native integrations
- `src/hooks/`: shared hooks
- `src/utils/`: pure helpers and low-level utilities
- `src/theme/`: colors, typography, strings, brand and visual tokens
- `supabase/functions/`: edge functions
- `supabase/migrations/`: database changes
- `__tests__/`: automated tests

## Coding Conventions

- Use TypeScript strict mode conventions.
- Prefer `@/` imports for app source modules.
- Keep route files thin and move non-trivial UI into `src/features`.
- Keep business decisions out of screen files when possible.
- Put reusable logic in `src/domain`, `src/services`, `src/hooks`, or `src/utils` based on responsibility.
- Reuse theme tokens from `src/theme` instead of inventing repeated local values.
- Add or update tests when changing risky behavior.

## Escalation Rules

Escalate back to Codex when:

- A change will affect more than one ownership area
- A contract between layers is unclear
- The task requires architecture decisions
- A worker needs to touch files outside its assigned scope
- There is a regression risk in AI, auth, subscription, paywall, navigation, or backend behavior

## Task Handoff Template

When Codex hands work to another agent, use this structure:

- Goal:
- Why this task exists:
- Files allowed to edit:
- Files forbidden to edit:
- Inputs or contracts to follow:
- Acceptance criteria:
- Notes on risks:

Keep handoffs concrete and bounded so workers can run in parallel without overlapping.
