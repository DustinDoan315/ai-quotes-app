# Guest Subscription Persistence and RevenueCat Configuration

- Status: `in_progress`
- Owner: Codex
- Created: 2026-09-14
- Scope: iOS guest identity, subscription persistence, server reconciliation, and RevenueCat configuration

## Objective

Allow an anonymous iOS user to retain access to a purchased subscription after relaunch or app reinstall when the iOS Keychain session is preserved, while keeping server-side subscription checks tied to the same Supabase identity.

## Scope

- Use the Supabase anonymous user UUID as the RevenueCat App User ID.
- Reconcile RevenueCat entitlement state into `user_subscriptions` through an authenticated Edge Function.
- Keep guest cloud memories associated with the Supabase UUID.
- Handle RevenueCat webhook aliases safely.
- Configure RevenueCat entitlement, iOS products, webhook, and restore behavior.
- Rotate the exposed RevenueCat server key and remove the unused legacy secret.

## Acceptance criteria

- [x] Anonymous Supabase users are identified in RevenueCat with their Supabase UUID.
- [x] `sync-subscription` is authenticated and updates `user_subscriptions` from RevenueCat.
- [x] RevenueCat webhook resolves canonical Supabase UUIDs and aliases.
- [x] Guest cloud-memory ownership uses the authenticated Supabase UUID.
- [x] Supabase has `REVENUECAT_SECRET_API_KEY` configured.
- [x] Subscription-related Edge Functions are deployed.
- [ ] RevenueCat entitlement `pro_access` is configured.
- [ ] iOS products are attached to the current RevenueCat offering.
- [ ] RevenueCat webhook URL and authorization secret are verified.
- [ ] Restore behavior is set to “Transfer to new App User ID.”
- [ ] A replacement RevenueCat v1 secret is generated and stored in Supabase.
- [ ] The unused `REVENUECAT_API_KEY` secret is removed after rotation.
- [ ] Physical iPhone sandbox reinstall and restore flow passes.

## Timeline

| Timestamp | Event | Result |
| --- | --- | --- |
| `2026-09-14` | Audited the existing guest, RevenueCat, Supabase, and memory identity flow. | Found that anonymous RevenueCat IDs were not aligned with Supabase UUIDs and server subscription checks could disagree with the client. |
| `2026-09-14` | Implemented canonical guest identity and server subscription reconciliation. | Added RevenueCat initialization ordering, `authUserId`, `sync-subscription`, webhook alias handling, and regression tests. |
| `2026-09-14` | Verified locally. | TypeScript passed; Jest passed with 21 suites and 71 tests. |
| `2026-09-14` | Set `REVENUECAT_SECRET_API_KEY` in Supabase. | Secret name and non-empty digest verified without exposing the value. |
| `2026-09-14` | Deployed `sync-subscription` and updated `revenuecat-webhook`. | Both active in Supabase; unauthenticated requests return `401`. |
| `2026-09-14` | Audited all deployed Edge Functions. | Only legacy `billing-offerings` and `billing-customer` used `REVENUECAT_API_KEY`; both were updated to the new secret name and deployed at version 8. |
| `2026-09-14` | Committed and pushed the implementation. | Commit `1de4a16` is on `origin/main`. |
| `2026-09-14` | Attempted RevenueCat dashboard configuration and secret rotation through MCP. | Blocked because no RevenueCat management MCP is available and no replacement key has been generated. |

## Risks and notes

- iOS Keychain persistence is device/app-identity dependent; “Restore Purchases” remains the fallback when the session cannot be recovered.
- The RevenueCat key pasted during setup must not be used as the final production credential; rotate it before release.
- The legacy `billing-customer` function still contains a hardcoded `anonymous-user` fallback. The current app uses `sync-subscription`, but the legacy function should be fixed or retired before an older client relies on it.

## Next actions

1. Enable RevenueCat management MCP or authorize a logged-in RevenueCat dashboard session.
2. Configure `pro_access`, attach the iOS products to the current offering, configure the webhook, and set restore behavior.
3. Generate a replacement v1 secret, set it as `REVENUECAT_SECRET_API_KEY`, verify it, then unset the old `REVENUECAT_API_KEY`.
4. Run the physical iPhone sandbox test matrix and record the result here.
