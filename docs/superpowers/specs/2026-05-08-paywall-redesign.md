# Paywall Redesign — Design Spec

**Date:** 2026-05-08  
**Status:** Approved

## Context

The app received a new 7-screen cold-open onboarding flow (Dawn gradient, orange `#c2410c` accent, white/black CTA pattern). The existing paywall uses a different visual language — violet `#A855F7` accent, emoji hero card, feature comparison table — creating a jarring style break when the paywall appears after onboarding or mid-app.

**Goal:** Both paywall entry points (post-onboarding and mid-app modal) adopt the onboarding visual language: Dawn gradient hero, orange accent, immersive story-driven layout, no feature comparison table.

---

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Accent color | Dawn gradient bridging violet → orange | Ties both design systems together |
| Layout | Immersive / story-driven | Matches onboarding flow, no comparison table |
| Unlock section | Single combined card (4 rows) | Cleaner than 2×2 grid or bulleted list |
| CTA button | Dawn gradient (`#6d28d9 → #c2410c`) | Matches "Begin →" energy without losing premium feel |
| Gradient implementation | `HomeBackground` + `react-native-svg` | Already used in onboarding (PersonaStep), no new dependencies |

---

## Screen Structure

```
PaywallScreen
├── PaywallAmbientBackground (kept, softened)
├── SafeAreaView
│   ├── PaywallInfoStrip (unchanged)
│   ├── ScrollView
│   │   ├── PaywallHero          ← NEW (replaces hero card + close btn)
│   │   ├── PaywallUnlockCard    ← NEW (replaces PaywallValueBullets + PaywallFeatureComparison)
│   │   ├── PaywallPackageList   ← UPDATED (Dawn gradient selected state, inline badge)
│   │   └── [empty state / skeleton — unchanged]
│   └── PaywallStickyFooter      ← UPDATED (Dawn gradient CTA button)
```

**Removed:** `PaywallValueBullets`, `PaywallFeatureComparison`, security reassurance strip, standalone close button row in `PaywallScreen`.

---

## Component Specs

### PaywallHero (new)
Props: `headline`, `contextBody`, `sectionLabel`, `source`, `onClose`

- Full-bleed background: `HomeBackground` with `DAWN_PALETTE` (`HOME_BACKGROUNDS[0]`) + dark overlay (`rgba(0,0,0,0.35)`) + bottom fade to `#09090b`
- Close button: top-right, 28×28 white/12 circle, inside hero
- Section label: `#c2410c`, 11px, 700 weight, uppercase, tracking 0.14em
- Headline: 24px, 800 weight, white
- Subtitle: 12.5px, `rgba(255,255,255,0.58)`, 1.65 line-height
- Quote preview card: shown only when `source === "onboarding"` — bordered card with italic quote text + "COMPOSING · TODAY · DAWN" meta

### PaywallUnlockCard (new)
No props (static, i18n-driven)

- Section label: `#c2410c`, "WHAT UNLOCKS WITH PRO"
- Single bordered card (`rgba(255,255,255,0.04)` bg, `rgba(255,255,255,0.09)` border, 16px radius)
- 4 rows separated by `rgba(255,255,255,0.06)` dividers:
  1. ∞ Unlimited AI quotes — "Every day, no daily cap"
  2. ✦ All vibes & palettes — "Every mood, every season"
  3. ↗ Share without limits — "No watermark, unlimited exports"
  4. ◈ Full persona tuning — "Deep trait & goal controls"
- Icon badge: 28×28, 8px radius, gradient bg via `HomeBackground` with `width=28 height=28`, dark overlay

### PaywallPackageList (updated)
- Remove `ShimmerBadge` top banner — replace with inline gradient pill badge in the plan name row
- Selected state: `HomeBackground` with `DAWN_PALETTE` + `rgba(0,0,0,0.28)` overlay (same pattern as PersonaStep)
- Selected border: `rgba(255,255,255,0.38)` 
- Orange checkmark badge: absolute top-right, 18×18, `#c2410c` background, white checkmark
- Radio button: keep animated MotiView, change selected color from `#A855F7` → `#ffffff` (inner dot → `#09090b`)
- Remove annual card feature bullet list (covered by unlock card)
- Section label: update from `text-violet-300/90` → `color: "#c2410c"`

### PaywallStickyFooter (updated)
- CTA button: `overflow: "hidden"`, `borderRadius: 27`, height 54px
  - `HomeBackground` rendered at `width = screenWidth - 32` and `height = 54`
  - `StyleSheet.absoluteFill` View on top with text/spinner
  - Shadow: `rgba(109,40,217,0.35)`
- Remove platform-specific helper text below button (simplify)
- Restore + Maybe Later: keep as inline row (`·` separator), reduce to `text-slate-400`

### PaywallScreen (updated)
- Remove standalone close button `<View>` row
- Derive `sectionLabel` from `reason` (same useMemo pattern as `headline`/`contextBody`)
- Pass `sectionLabel` and `source` to `PaywallScrollContent`

---

## Section Labels by Reason

| reason | sectionLabel |
|---|---|
| `"generic"` / default | "YOUR VIBE IS READY" |
| `"ai_limit"` | "DAILY LIMIT REACHED" |
| `"export_limit"` | "EXPORT LIMIT REACHED" |
| `"premium_theme"` | "PREMIUM STYLE LOCKED" |
| `"persona_locked"` | "ADVANCED PERSONA LOCKED" |

---

## i18n Keys to Add (en.json + vi.json)

```
subscription.heroLabelGeneric        "YOUR VIBE IS READY"
subscription.heroLabelAiLimit        "DAILY LIMIT REACHED"
subscription.heroLabelExportLimit    "EXPORT LIMIT REACHED"
subscription.heroLabelPremiumTheme   "PREMIUM STYLE LOCKED"
subscription.heroLabelPersonaLocked  "ADVANCED PERSONA LOCKED"
subscription.heroOnboardingQuote     "Today bends toward the calm you carry."
subscription.heroOnboardingQuoteMeta "COMPOSING · TODAY · DAWN"
subscription.unlockCardLabel         "WHAT UNLOCKS WITH PRO"
subscription.unlockAiTitle           "Unlimited AI quotes"
subscription.unlockAiDesc            "Every day, no daily cap"
subscription.unlockVibesTitle        "All vibes & palettes"
subscription.unlockVibesDesc         "Every mood, every season"
subscription.unlockShareTitle        "Share without limits"
subscription.unlockShareDesc         "No watermark, unlimited exports"
subscription.unlockPersonaTitle      "Full persona tuning"
subscription.unlockPersonaDesc       "Deep trait & goal controls"
```

---

## Files Changed

| File | Action |
|---|---|
| `src/features/paywall/PaywallHero.tsx` | Create |
| `src/features/paywall/PaywallUnlockCard.tsx` | Create |
| `src/features/paywall/PaywallScreen.tsx` | Update (remove close btn, add sectionLabel, pass source) |
| `src/features/paywall/PaywallScrollContent.tsx` | Update (swap hero card + bullets + comparison for new components) |
| `src/features/paywall/PaywallPackageList.tsx` | Update (Dawn selected state, inline badge, remove features list) |
| `src/features/paywall/PaywallStickyFooter.tsx` | Update (gradient CTA button) |
| `src/features/paywall/PaywallValueBullets.tsx` | Delete (replaced by PaywallUnlockCard) |
| `src/features/paywall/PaywallFeatureComparison.tsx` | Delete (replaced by PaywallUnlockCard) |
| `src/i18n/locales/en.json` | Add new keys |
| `src/i18n/locales/vi.json` | Add new keys (vi translations) |

---

## Verification

1. Open paywall from onboarding end (`source: "onboarding"`) — hero shows quote preview card
2. Open paywall from AI limit (`reason: "ai_limit"`) — hero shows "DAILY LIMIT REACHED" label, no quote preview
3. Select a plan — Dawn gradient selected state + orange checkmark badge appears
4. Tap CTA — Dawn gradient button, spinner on purchasing, haptics fire
5. Restore purchases — still works
6. Dismiss — close button in hero dismisses modal
7. No regressions: `PaywallInfoStrip` loading/error/purchasing states still render
