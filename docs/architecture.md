# Architecture

## Stack

- Expo + React Native
- Expo Router for navigation
- TypeScript with strict mode
- Zustand-style stores in `src/appState`
- Supabase edge functions in `supabase/functions`

## Folder Map

- `app/`: route entries and layouts
- `src/features/`: feature-level UI and flows
- `src/components/`: shared components
- `src/appState/`: client state stores
- `src/domain/`: business rules
- `src/services/`: integrations and SDK wrappers
- `src/hooks/`: reusable hooks
- `src/utils/`: pure helpers
- `src/theme/`: colors, typography, brand, strings, and visual tokens
- `supabase/functions/`: edge functions
- `supabase/migrations/`: database changes
- `__tests__/`: tests

## Architecture Principles

- Keep routes thin and move substantial logic into `src/features`.
- Keep business rules out of route and presentational UI files.
- Centralize reusable domain logic and integration code.
- Centralize shared visual tokens in `src/theme`.
- Split parallel work by file ownership to reduce merge conflicts.
