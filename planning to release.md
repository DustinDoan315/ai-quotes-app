# Planning to release (v1)

Single checklist. Work phases in order unless noted.

---

## Phase 1 — Subscription correctness (do first)

- [ ] **1.1** In RevenueCat, confirm the exact **entitlement identifier** for Pro (one source of truth).
- [x] **1.2** Set `SUBSCRIPTION_ENTITLEMENT_ID` in `subscriptionConstants` to match RevenueCat (`pro_access`; confirm in dashboard).
- [x] **1.3** Align RevenueCat config and app code — `src/config/revenuecat.ts` re-exports `SUBSCRIPTION_ENTITLEMENT_ID`; removed `premium` vs `pro_access` drift and deleted legacy `useRevenueCat`.
- [x] **1.4** After `initializeRevenueCat()` succeeds in root layout, call `initSubscription()` on `subscriptionStore`. No crash if API key is missing.
- [ ] **1.5** Smoke-test: free user hits AI limits; sandbox Pro restores and shows `isPro` after app restart **without** opening the paywall.

---

## Phase 2 — Pro / free behavior (match what you ship)

- [x] **2.1** Write a one-paragraph **v1 spec**: daily AI cap, daily export cap, watermark rules, which themes/persona are Pro-only.

**v1 spec (product):** Free users get **3 AI generations per day** and **3 image exports (shares) per day**; Pro has unlimited AI and exports. **Watermarks** appear on exported quote cards for free only; Pro exports have no watermark. **Premium home vibes** are **Aurora** and **Prism** (superRare / superLegend): free users never receive them in the daily roll and cannot use a server-set premium `home_vibe_key` until they upgrade. **Advanced persona** gating is wired via `ADVANCED_PERSONA_IDS` (empty in v1; add IDs when you ship specific Pro-only personas).

- [x] **2.2** **Exports:** before share/export, use `resetIfNewDay`, `canExportQuote(dailyExportCount)`, call `incrementExportUsage` only after a successful export; navigate to paywall with `export_limit` when blocked.
- [x] **2.3** **Watermark:** derive `watermarkForExport` from plan / `getCapabilitiesForPlan` (not always-on for every user).
- [x] **2.4** **Premium themes & persona:** premium vibes gated for free; `canUsePersonaLevel` enforced in AI flow when `ADVANCED_PERSONA_IDS` lists a persona id.
- [x] **2.5** **RevenueCatTestScreen** moved to `src/features/dev/` and uses `subscriptionStore` only; `__DEV__` returns null in production; legacy `useRevenueCat` removed.

---

## Phase 3 — EAS builds and OTA

- [x] **3.1** Add **`eas.json`**: profiles (`development`, `preview`, `production`); bundle IDs aligned with `app.json`.
- [x] **3.2** Set **`runtimeVersion`** policy and document it (native version vs fingerprint — pick one approach for updates).
- [ ] **3.3** Configure **EAS Update** channels per environment (`eas.json` has `development` / `preview` / `production` channels); verify `expo-updates` + `postinstall` patch on real EAS builds.
- [ ] **3.4** Produce **first store binaries** (EAS), submit to TestFlight / Play internal track before relying on OTA in production.

---

## Phase 4 — Assets and store listing

- [ ] **4.1** Verify every path in **`app.json`**: icon, splash, Android adaptive (foreground / background / monochrome) — confirm files exist in `assets/` before store submission.
- [ ] **4.2** Final **1024** App Store icon and **adaptive** Android assets (replace placeholders).
- [ ] **4.3** Store listing: screenshots, description, subscription copy, **privacy policy URL**, support URL.

---

## Phase 5 — Config and compliance

- [x] **5.1** Update **`.env.example`** with `EXPO_PUBLIC_API_URL` and any other `EXPO_PUBLIC_*` vars the app reads.
- [x] **5.2** Wire **`EXPO_PUBLIC_PRIVACY_POLICY_URL`** (and terms if required) in Profile / Settings / paywall footer.
- [ ] **5.3** Put **Sentry** and **PostHog** keys in EAS secrets for production; confirm analytics events stay PII-free.

---

## Phase 6 — Tests (parallel with Phase 2 or after)

- [x] **6.1** Add a test runner (Jest or Expo-recommended setup).
- [x] **6.2** Unit tests: `resolvePlanFromSnapshot`, `createSubscriptionGuards` (AI, export, theme, persona), optional `pickBestValuePackageId`.

---

## Runtime version (OTA)

- **`runtimeVersion`**: policy **`appVersion`** in `app.json` — ties OTA updates to the same `expo.version` string as native builds. Bump `expo.version` when shipping a new binary; OTA only goes to builds with matching runtime.

---

## Dependency quick reference

| Prerequisite | Unblocks |
|--------------|----------|
| Phase 1 | Correct Pro status app-wide |
| v1 spec (2.1) | Export / watermark / theme work |
| Native binary (3.4) | Real-device OTA validation |
| Phase 4 | App Store / Play submission |

---

## Notes

- OTA must not change auth, navigation, or persisted Zustand schemas without a migration plan.
- Keep RevenueCat products, entitlements, and App Store / Play subscription IDs in sync with the dashboard.
