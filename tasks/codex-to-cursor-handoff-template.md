# Codex to Cursor Handoff Template

Copy this template when Codex has already planned the task and you want Cursor to implement a safe, scoped slice.

```md
You are implementing a scoped subtask that was already planned.

## Task

- Goal:
- Why this work exists:

## Scope

- In scope:
- Out of scope:

## Files Allowed to Edit

- `path/to/file`
- `path/to/file`

## Files Forbidden to Edit

- `path/to/file-or-folder`
- `path/to/file-or-folder`

## Contracts to Preserve

- Do not change:
- Keep behavior compatible with:
- Reuse existing patterns from:

## Implementation Notes

- Architecture boundary:
- UI or logic expectations:
- Theme or copy guidance:
- Testing expectations:

## Acceptance Criteria

- [ ] The scoped task is completed
- [ ] No forbidden files were changed
- [ ] Existing contracts were preserved
- [ ] The implementation follows repo conventions
- [ ] Any necessary tests were updated, or the omission is explained

## Output Format

When finished, respond with:

1. What changed
2. Which files were edited
3. Any risks or follow-ups

## Task Details for This Run

- Goal:
- Why this work exists:
- In scope:
- Out of scope:
- Files allowed to edit:
- Files forbidden to edit:
- Contracts to preserve:
- Implementation notes:
- Acceptance criteria:
```

## Example

```md
You are implementing a scoped subtask that was already planned.

## Task

- Goal: Polish the home header layout and spacing.
- Why this work exists: The current header feels crowded and does not match the rest of the feed polish.

## Scope

- In scope: spacing, typography balance, alignment, minor component extraction if needed
- Out of scope: feed state, API behavior, navigation flow, store changes

## Files Allowed to Edit

- `src/components/HomeHeader.tsx`
- `src/features/home/HomeFeedFlow.tsx`

## Files Forbidden to Edit

- `src/appState/**`
- `src/domain/**`
- `src/services/**`
- `supabase/**`

## Contracts to Preserve

- Do not change feed data flow.
- Keep behavior compatible with the current props and route usage.
- Reuse existing patterns from `src/theme/*`.

## Implementation Notes

- Architecture boundary: presentation only
- UI or logic expectations: no store or business-logic changes
- Theme or copy guidance: reuse shared spacing, colors, and typography tokens where possible
- Testing expectations: no new test required unless component behavior changes

## Acceptance Criteria

- [ ] Header spacing and balance are improved
- [ ] No store or service code changed
- [ ] Existing props contract is preserved
- [ ] Visual changes are consistent with repo theme patterns
- [ ] Any follow-up risk is noted

## Output Format

When finished, respond with:

1. What changed
2. Which files were edited
3. Any risks or follow-ups
```

## Usage Notes

- Fill this only after Codex has decided the architecture and boundaries.
- Prefer small, ownership-safe slices.
- If Cursor needs to cross into forbidden files, stop and hand the task back to Codex for re-planning.
