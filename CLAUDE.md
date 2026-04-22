# CLAUDE.md

This file tells Claude Code how to work in this repository.

## Project Overview

**Inkly Daily Vibes** — an Expo / React Native app (iOS + Android) that generates AI-powered daily motivational quotes personalized to the user's persona. Users can also explain, rewrite, or extend a quote via AI tools. Social features include friends, shared photo moments, and memories.

## Stack

- **Framework**: Expo ~54 + React Native 0.81, Expo Router v6 (file-based navigation)
- **Language**: TypeScript (strict mode throughout)
- **State**: Zustand stores in `src/appState/`
- **Styling**: NativeWind (Tailwind for RN) + `src/theme/` tokens
- **Backend**: Supabase (auth, database, storage, Edge Functions)
- **AI**: OpenAI via Supabase Edge Functions (`supabase/functions/`)
- **Payments**: RevenueCat (`react-native-purchases`)
- **Analytics/Errors**: PostHog + Sentry
- **Testing**: Jest + `jest-expo`

## Folder Map

```
app/                    Expo Router routes (keep thin)
src/
  features/             Feature-specific UI and flows
  components/           Shared UI components
  appState/             Zustand stores
  domain/               Business rules, guards, resolvers
  services/             External API/SDK integrations
  hooks/                Shared hooks
  utils/                Pure helpers
  theme/                Colors, typography, brand strings, visual tokens
  config/               Supabase and RevenueCat client setup
supabase/
  functions/            Edge functions (AI, etc.)
  migrations/           Database schema changes
__tests__/              Jest tests
docs/                   Architecture, contracts, conventions
tasks/                  Task board and handoff templates
```

## Commands

```bash
npm start              # Expo dev server
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator
npm test               # Run Jest tests
npm test -- --runInBand  # Run tests serially (required for some suites)
npm run lint           # ESLint on app/ src/ __tests__/
npm run build:ios      # EAS production build (iOS)
npm run build:android  # EAS production build (Android)
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `EXPO_PUBLIC_REVENUECAT_API_KEY` | RevenueCat SDK key |
| `EXPO_PUBLIC_GPT_API_URL` | OpenAI API base URL |
| `EXPO_PUBLIC_GPT_MODEL` | OpenAI model (e.g. `gpt-4o-mini`) |
| `EXPO_PUBLIC_POSTHOG_API_KEY` | PostHog analytics |
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry error tracking |
| `OPENAI_API_KEY` | Set as Supabase function secret (not in app .env) |

**Never commit real secret values. Never put `OPENAI_API_KEY` in the app `.env`.**

## Coding Conventions

- Use `@/` path aliases for all source imports (not relative `../../`).
- Prefer named exports.
- Route files (`app/`) must stay thin — delegate to `src/features/`.
- Keep business rules out of UI files — put them in `src/domain/`.
- Reuse `src/theme/` tokens before creating local style values.
- Brand copy must align with `src/theme/appBrand.ts` and `src/theme/strings.ts`.
- Do not embed business decisions inside UI event handlers.

## Architecture Rules

- **Routes** → delegate to features, never contain logic.
- **Features** → UI + local coordination only.
- **Domain** → business rules, subscription guards, usage caps. No UI.
- **Services** → one-way wrappers around Supabase, OpenAI, RevenueCat, PostHog, Sentry. No business logic.
- **Stores** → Zustand state slices. Hydrate via `useAppBootstrap`.
- **Theme** → tokens only. No one-off values in feature files.

## Key Domain Areas

### AI Quote Tools
- Entry point: `src/features/ai/`, `src/features/home/`
- API contracts: `docs/ai-api-contract.md`
- Edge functions: `supabase/functions/quote`, `quote-explain`, `quote-rewrite`, `quote-future`
- Client: `src/services/ai/client.ts`
- Do not change AI request/response shapes without updating `docs/ai-api-contract.md`.

### Auth
- Google and Apple OAuth via Supabase Auth (signInWithIdToken)
- Logic: `src/features/auth/`, `src/services/supabase-auth.ts`, `src/hooks/useSupabaseAuth.ts`
- Do not put auth state logic inside route files.

### Subscription / Paywall
- RevenueCat handles entitlements.
- Guards: `src/domain/subscription/subscriptionGuards.ts`
- Resolver: `src/domain/subscription/subscriptionResolver.ts`
- Capabilities: `src/domain/subscription/subscriptionCapabilities.ts`
- Store: `src/appState/subscriptionStore.ts`
- All access checks must go through domain guards — never check plan state directly in UI.

### Usage Limits
- Store: `src/appState/usageStore.ts`
- Domain: `src/domain/usage/usageState.ts`
- Usage caps are enforced in domain logic, not in feature components.

### Supabase Migrations
- New migrations go in `supabase/migrations/` with a timestamped filename.
- Never edit existing migrations — add a new one.
- RLS policies are required for any new user-facing table.

## Testing

- Tests live in `__tests__/`.
- Prioritize coverage for: paywall, subscription guards, AI client, usage state.
- Run `npm test -- --runInBand` when tests share process-level state.
- Do not mock the Supabase client unless a unit test has no alternative — prefer testing domain logic in isolation.
- Add regression tests whenever changing risky behavior (auth, AI, subscription, paywall).

## What NOT to Do

- Do not write secrets into `.env` or committed files.
- Do not bypass RLS when writing Supabase queries.
- Do not duplicate subscription/paywall guard logic in UI — centralize it.
- Do not add inline styles or hardcoded colors — use `src/theme/`.
- Do not edit existing database migrations.
- Do not push to the remote or create PRs without explicit user confirmation.
- Do not add speculative abstractions or features beyond what was asked.

## Multi-Agent Workflow

This repo uses a lead-and-workers pattern (see `AGENTS.md` for full rules):

- **Claude Code / Codex** = lead for planning, architecture, integration, verification.
- **Cursor** = fast worker for scoped UI edits (1–2 files, no contract changes).

Use Claude Code when: the task crosses folders/layers, touches auth/AI/paywall/subscriptions/backend, or needs investigation.

Task board: `tasks/current_tasks.md`
Handoff template: `tasks/codex-to-cursor-handoff-template.md`

## Docs Reference

| File | Purpose |
|---|---|
| `docs/architecture.md` | Stack and folder map |
| `docs/ai-api-contract.md` | AI endpoint request/response shapes |
| `docs/code-conventions.md` | Import and file responsibility rules |
| `docs/logic-flows.md` | Key data flows (auth, AI, subscription) |
| `docs/workflow.md` | When to use Codex vs Cursor |
| `AGENTS.md` | Full multi-agent ownership model |
