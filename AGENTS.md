# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is an **Expo SDK 54 React Native** app (`ai-quotes-app`) that generates AI-powered inspirational quotes from camera photos. It's iOS-first but supports web for development.

### Running the app

- **Web dev server**: `npx expo start --web --port 8081` — use this for development in Cloud Agent environments.
- **Lint**: `npx expo lint`
- **TypeScript check**: `npx tsc --noEmit` (pre-existing TS errors exist in `src/services/analytics/` and `src/services/api/types.ts`)
- See `package.json` `scripts` for all available commands.

### Key web-mode caveats

- `app.json` web output is set to `"single"` (SPA mode) to avoid a known Expo SDK 54 SSR issue where `framer-motion` (via `moti`) causes a `tslib` ESM destructuring error in Metro's server-side lambda bundler. Native builds are unaffected.
- `babel.config.js` includes `unstable_transformImportMeta: true` to fix Zustand v5's use of `import.meta.env` which Metro doesn't transform by default.
- `metro.config.js` has `unstable_enablePackageExports = false` to avoid Metro's package exports resolution causing issues with certain dependencies.
- Camera features (the app's core loop) don't work in headless/web environments — the app will show a camera permission gate.

### Environment variables

Copy `.env.example` to `.env`. The `.env.example` contains working Supabase credentials for development. Required vars: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Optional services (RevenueCat, PostHog, Sentry) gracefully degrade when their keys are empty.

### Package manager

Yarn v1 is used (`yarn.lock` is the primary lockfile). Multiple lockfiles exist (`package-lock.json`, `bun.lock`) — stick with `yarn install`.
