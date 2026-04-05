# Code Conventions

## Imports and Exports

- Prefer `@/` imports for source modules.
- Prefer named exports by default.
- Keep imports readable and grouped logically.

## File Responsibility

- Route files in `app/` should stay small.
- Shared UI belongs in `src/components`.
- Feature-specific UI belongs in `src/features`.
- Business logic belongs in `src/domain`.
- Integration code belongs in `src/services`.
- App stores belong in `src/appState`.

## React Patterns

- Keep components focused.
- Extract hooks for reusable coordination logic.
- Avoid burying core business decisions inside UI event handlers when they should live in shared logic.

## Theme and Copy

- Reuse `src/theme` tokens before adding local values.
- Keep brand strings aligned with `src/theme/appBrand.ts`.
- Prefer shared strings when the same wording is used repeatedly.

## Testing

- Add focused regression tests for risky behavior changes.
- Prioritize tests for paywall, subscription, AI, and domain rules.
