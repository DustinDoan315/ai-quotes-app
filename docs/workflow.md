# Workflow

## Default Model

- Codex is the lead for planning, task splitting, integration, and verification.
- Cursor is the fast worker for scoped edits, especially in UI files.
- Specialized workers can run in parallel when write ownership is clearly separated.

## Decision Rule

Use Codex when:

- a task is medium or large
- a task crosses folders or layers
- a task changes logic, contracts, or architecture
- a task needs planning or investigation

Use Cursor when:

- the change is local
- the change is mostly visual or structural inside a small file set
- no shared contracts are changing

## Parallel Execution Pattern

1. Define scope and acceptance criteria.
2. Decide which ownership areas are involved.
3. Split into worker-safe subtasks by file boundary.
4. Prepare the worker handoff using `tasks/codex-to-cursor-handoff-template.md`.
5. Implement in parallel where possible.
6. Integrate and verify in Codex.

## Preferred Split for This Repo

- UI work: `app/`, `src/features/`, `src/components/`
- Logic work: `src/domain/`, `src/services/`, `src/appState/`, `src/hooks/`, `src/utils/`
- Theme work: `src/theme/`, `global.css`
- Backend work: `supabase/functions/`, `supabase/migrations/`
- Test work: `__tests__/`

## Handoff Requirements

Every worker handoff should include:

- the goal
- allowed files
- forbidden files
- contracts to preserve
- acceptance criteria

This is what keeps parallel edits fast and safe.

Default template:

- Use `tasks/codex-to-cursor-handoff-template.md` for Codex-to-Cursor task handoffs.
