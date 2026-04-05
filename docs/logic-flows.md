# Logic Flows

## Quote Generation

- UI triggers generation from feature-layer hooks and screens.
- Shared generation behavior flows through AI-related services and stores.
- Subscription and usage guards should remain centralized rather than duplicated in UI.

## Subscription and Paywall

- Feature paywall UI should consume centralized rules and capability checks.
- Domain-level subscription logic should drive access decisions.
- Store and service changes should stay aligned with plan settings and entitlement handling.

## Auth and Profile

- Authentication logic should stay in shared services and hooks.
- Profile UI should remain separate from low-level auth behavior.

## Reminders and Notifications

- Scheduling constants and delivery logic should stay in services or stores, not route files.

## Backend Contracts

- Supabase function request and response shapes should be documented and kept stable across app and backend changes.
