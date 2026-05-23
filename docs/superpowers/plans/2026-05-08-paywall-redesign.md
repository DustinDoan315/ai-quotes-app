# Paywall Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the paywall to match the onboarding's Dawn-gradient visual language — immersive hero, combined unlock card, gradient-selected plan cards, Dawn-gradient CTA button.

**Architecture:** Replace the existing emoji-card hero, `PaywallValueBullets`, and `PaywallFeatureComparison` with two new focused components (`PaywallHero`, `PaywallUnlockCard`). Update `PaywallPackageList` and `PaywallStickyFooter` for the new accent/gradient. Delete two obsolete files. Zero new dependencies — reuses `HomeBackground` + `DAWN_PALETTE` already used in `PersonaStep`.

**Tech Stack:** React Native, NativeWind, Moti, react-native-svg (via existing `HomeBackground`), react-i18next, expo-haptics.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/features/paywall/PaywallHero.tsx` | Create | Full-bleed Dawn gradient hero: close btn, section label, headline, subtitle, conditional quote preview |
| `src/features/paywall/PaywallUnlockCard.tsx` | Create | Single bordered card with 4 unlock feature rows + gradient icon badges |
| `src/features/paywall/PaywallScreen.tsx` | Modify | Remove standalone close btn; derive `sectionLabel`; pass `sectionLabel`/`source`/`onClose` to scroll content |
| `src/features/paywall/PaywallScrollContent.tsx` | Modify | Add `PaywallHero` + `PaywallUnlockCard`; remove hero card, bullets, comparison, reassurance strip |
| `src/features/paywall/PaywallPackageList.tsx` | Modify | Dawn gradient selected state; orange checkmark badge; remove ShimmerBadge + annual feature bullets |
| `src/features/paywall/PaywallStickyFooter.tsx` | Modify | Dawn gradient CTA button via `HomeBackground` |
| `src/features/paywall/PaywallValueBullets.tsx` | Delete | Replaced by `PaywallUnlockCard` |
| `src/features/paywall/PaywallFeatureComparison.tsx` | Delete | Replaced by `PaywallUnlockCard` |
| `src/i18n/locales/en.json` | Modify | Add 16 new `subscription.*` keys |
| `src/i18n/locales/vi.json` | Modify | Mirror same keys (en strings as placeholder) |

---

## Task 1: Add i18n keys

**Files:**
- Modify: `src/i18n/locales/en.json:214`
- Modify: `src/i18n/locales/vi.json` (same location in subscription object)

- [ ] **Step 1: Add keys to en.json**

In `src/i18n/locales/en.json`, find line 214:
```json
    "contextGenericTitle": "Upgrade to Pro"
```

Replace with (adding comma + new keys before the closing `}`):
```json
    "contextGenericTitle": "Upgrade to Pro",
    "heroLabelGeneric": "YOUR VIBE IS READY",
    "heroLabelAiLimit": "DAILY LIMIT REACHED",
    "heroLabelExportLimit": "EXPORT LIMIT REACHED",
    "heroLabelPremiumTheme": "PREMIUM STYLE LOCKED",
    "heroLabelPersonaLocked": "ADVANCED PERSONA LOCKED",
    "heroOnboardingQuote": "Today bends toward the calm you carry.",
    "heroOnboardingQuoteMeta": "COMPOSING · TODAY · DAWN",
    "unlockCardLabel": "WHAT UNLOCKS WITH PRO",
    "unlockAiTitle": "Unlimited AI quotes",
    "unlockAiDesc": "Every day, no daily cap",
    "unlockVibesTitle": "All vibes & palettes",
    "unlockVibesDesc": "Every mood, every season",
    "unlockShareTitle": "Share without limits",
    "unlockShareDesc": "No watermark, unlimited exports",
    "unlockPersonaTitle": "Full persona tuning",
    "unlockPersonaDesc": "Deep trait & goal controls"
```

- [ ] **Step 2: Mirror keys in vi.json**

Find the same `"contextGenericTitle"` line in `src/i18n/locales/vi.json` and apply the identical addition (same English strings — translation pass is separate).

- [ ] **Step 3: Verify JSON is valid**

```bash
cd /Users/mobiledeveloper/Desktop/ReactNative/ai-quotes-app
node -e "require('./src/i18n/locales/en.json'); console.log('en.json OK')"
node -e "require('./src/i18n/locales/vi.json'); console.log('vi.json OK')"
```

Expected output:
```
en.json OK
vi.json OK
```

- [ ] **Step 4: Commit**

```bash
git add src/i18n/locales/en.json src/i18n/locales/vi.json
git commit -m "feat: add paywall redesign i18n keys"
```

---

## Task 2: Create `PaywallHero`

**Files:**
- Create: `src/features/paywall/PaywallHero.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { HomeBackground } from "@/features/home/HomeBackground";
import type { PaywallSource } from "@/features/paywall/types";
import { HOME_BACKGROUNDS } from "@/theme/homeBackgrounds";

const DAWN_PALETTE = HOME_BACKGROUNDS[0]; // dawn — purple/orange

type Props = {
  headline: string;
  contextBody: string;
  sectionLabel: string;
  source: PaywallSource;
  onClose: () => void;
};

export const PaywallHero = ({
  headline,
  contextBody,
  sectionLabel,
  source,
  onClose,
}: Props) => {
  const { t } = useTranslation();

  return (
    <View style={{ overflow: "hidden" }}>
      {/* Dawn gradient background */}
      <HomeBackground palette={DAWN_PALETTE} />

      {/* Dark overlay */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: "rgba(0,0,0,0.32)" },
        ]}
        pointerEvents="none"
      />

      {/* Bottom fade to page bg */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 64,
          backgroundColor: "rgba(9,9,11,0.88)",
        }}
        pointerEvents="none"
      />

      {/* Content */}
      <View style={{ padding: 20, paddingTop: 16, zIndex: 2 }}>
        {/* Close row */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            marginBottom: 14,
          }}>
          <Pressable
            onPress={onClose}
            hitSlop={14}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={({ pressed }) => ({
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: "rgba(255,255,255,0.12)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.18)",
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}>
            <Ionicons name="close" size={15} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>

        {/* Section label */}
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            letterSpacing: 1.4,
            textTransform: "uppercase",
            color: "#c2410c",
            marginBottom: 10,
          }}>
          {sectionLabel}
        </Text>

        {/* Headline */}
        <Text
          style={{
            fontSize: 24,
            fontWeight: "800",
            lineHeight: 29,
            color: "#ffffff",
            marginBottom: 8,
          }}>
          {headline}
        </Text>

        {/* Subtitle */}
        <Text
          style={{
            fontSize: 12.5,
            lineHeight: 20,
            color: "rgba(255,255,255,0.58)",
            marginBottom: source === "onboarding" ? 14 : 4,
          }}>
          {contextBody}
        </Text>

        {/* Quote preview — onboarding source only */}
        {source === "onboarding" ? (
          <View
            style={{
              padding: 12,
              backgroundColor: "rgba(255,255,255,0.08)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.14)",
              borderRadius: 14,
            }}>
            <Text
              style={{
                fontSize: 13,
                fontStyle: "italic",
                fontWeight: "600",
                lineHeight: 20,
                color: "rgba(255,255,255,0.88)",
                marginBottom: 5,
              }}>
              {t("subscription.heroOnboardingQuote")}
            </Text>
            <Text
              style={{
                fontSize: 9,
                fontWeight: "600",
                letterSpacing: 0.9,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.38)",
              }}>
              {t("subscription.heroOnboardingQuoteMeta")}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/features/paywall/PaywallHero.tsx
git commit -m "feat: add PaywallHero with Dawn gradient and context-aware section label"
```

---

## Task 3: Create `PaywallUnlockCard`

**Files:**
- Create: `src/features/paywall/PaywallUnlockCard.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { HomeBackground } from "@/features/home/HomeBackground";
import { HOME_BACKGROUNDS } from "@/theme/homeBackgrounds";

const DAWN_PALETTE = HOME_BACKGROUNDS[0];

type UnlockItem = {
  icon: string;
  titleKey: string;
  descKey: string;
};

const ITEMS: UnlockItem[] = [
  {
    icon: "∞",
    titleKey: "subscription.unlockAiTitle",
    descKey: "subscription.unlockAiDesc",
  },
  {
    icon: "✦",
    titleKey: "subscription.unlockVibesTitle",
    descKey: "subscription.unlockVibesDesc",
  },
  {
    icon: "↗",
    titleKey: "subscription.unlockShareTitle",
    descKey: "subscription.unlockShareDesc",
  },
  {
    icon: "◈",
    titleKey: "subscription.unlockPersonaTitle",
    descKey: "subscription.unlockPersonaDesc",
  },
];

export const PaywallUnlockCard = () => {
  const { t } = useTranslation();

  return (
    <View>
      {/* Section label */}
      <Text
        style={{
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 1.4,
          textTransform: "uppercase",
          color: "#c2410c",
          marginBottom: 9,
        }}>
        {t("subscription.unlockCardLabel")}
      </Text>

      {/* Combined feature card */}
      <View
        style={{
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.09)",
          backgroundColor: "rgba(255,255,255,0.04)",
          paddingHorizontal: 14,
        }}>
        {ITEMS.map(({ icon, titleKey, descKey }, index) => (
          <View
            key={titleKey}
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 11,
              paddingVertical: 10,
              borderBottomWidth: index < ITEMS.length - 1 ? 1 : 0,
              borderBottomColor: "rgba(255,255,255,0.06)",
            }}>
            {/* Gradient icon badge */}
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                overflow: "hidden",
                flexShrink: 0,
                marginTop: 1,
              }}>
              <HomeBackground palette={DAWN_PALETTE} width={28} height={28} />
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  { backgroundColor: "rgba(0,0,0,0.35)" },
                ]}
              />
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  { alignItems: "center", justifyContent: "center" },
                ]}>
                <Text style={{ fontSize: 13, color: "#fff" }}>{icon}</Text>
              </View>
            </View>

            {/* Title + description */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 12.5,
                  fontWeight: "700",
                  color: "#ffffff",
                  marginBottom: 2,
                }}>
                {t(titleKey)}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.42)",
                  lineHeight: 16,
                }}>
                {t(descKey)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/features/paywall/PaywallUnlockCard.tsx
git commit -m "feat: add PaywallUnlockCard replacing bullets and comparison table"
```

---

## Task 4: Update `PaywallPackageList`

**Files:**
- Modify: `src/features/paywall/PaywallPackageList.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { HomeBackground } from "@/features/home/HomeBackground";
import {
  type RevenueCatOffering,
  type RevenueCatPackageId,
} from "@/services/paywall/types";
import { HOME_BACKGROUNDS } from "@/theme/homeBackgrounds";
import {
  calculateSavingsPercent,
  deriveBillingPeriod,
  derivePerPeriodBreakdown,
  displayTitleForPackage,
} from "@/utils/paywallPackage";

const DAWN_PALETTE = HOME_BACKGROUNDS[0];

type Props = {
  offerings: RevenueCatOffering;
  selectedPackageId: RevenueCatPackageId | null;
  bestValuePackageId: string | null;
  onSelectPackage: (id: RevenueCatPackageId) => void;
};

export const PaywallPackageList = ({
  offerings,
  selectedPackageId,
  bestValuePackageId,
  onSelectPackage,
}: Props) => {
  const { t } = useTranslation();
  const savingsPercent = calculateSavingsPercent(offerings.availablePackages);

  return (
    <View className="mb-2 w-full max-w-full">
      {/* Section label */}
      <Text
        style={{
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 1.4,
          textTransform: "uppercase",
          color: "#c2410c",
          marginBottom: 9,
        }}>
        {t("subscription.choosePlanHeader")}
      </Text>

      <View className="w-full gap-3">
        {offerings.availablePackages.map((pkg, index) => {
          const isSelected = pkg.identifier === selectedPackageId;
          const isBest = pkg.identifier === bestValuePackageId;
          const title = displayTitleForPackage(pkg);
          const period = deriveBillingPeriod(pkg.identifier);
          const perPeriod = derivePerPeriodBreakdown(pkg);
          const isLifetime = period === "lifetime";

          const badgeLabel = isBest
            ? savingsPercent
              ? `Best Value · Save ${savingsPercent}%`
              : t("subscription.bestValueTag")
            : isLifetime
              ? t("subscription.lifetimeOneTimeTag")
              : null;

          return (
            <MotiView
              key={pkg.identifier}
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: "timing",
                duration: 340,
                delay: 80 + index * 90,
              }}>
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSelectPackage(pkg.identifier);
                }}
                className="w-full max-w-full overflow-hidden rounded-2xl border-2"
                style={({ pressed }) => ({
                  opacity: pressed ? 0.88 : 1,
                  borderColor: isSelected
                    ? "rgba(255,255,255,0.38)"
                    : isBest
                      ? "rgba(255,255,255,0.18)"
                      : "rgba(148,163,184,0.2)",
                })}>

                {/* Dawn gradient background — selected only */}
                {isSelected ? (
                  <>
                    <HomeBackground palette={DAWN_PALETTE} />
                    <View
                      style={[
                        StyleSheet.absoluteFillObject,
                        { backgroundColor: "rgba(0,0,0,0.28)" },
                      ]}
                      pointerEvents="none"
                    />
                  </>
                ) : null}

                {/* Orange checkmark badge — selected only */}
                {isSelected ? (
                  <View
                    style={{
                      position: "absolute",
                      top: -7,
                      right: -7,
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: "#c2410c",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 10,
                    }}>
                    <Text style={{ fontSize: 9, color: "#fff", fontWeight: "800" }}>
                      ✓
                    </Text>
                  </View>
                ) : null}

                {/* Card body */}
                <View className="w-full px-3.5 py-3.5" style={{ zIndex: 2 }}>
                  <View className="w-full flex-row items-center">
                    {/* Animated radio button */}
                    <MotiView
                      animate={{
                        borderColor: isSelected
                          ? "rgba(255,255,255,0.85)"
                          : "rgba(255,255,255,0.35)",
                        backgroundColor: isSelected
                          ? "rgba(255,255,255,0.15)"
                          : "transparent",
                      }}
                      transition={{ type: "timing", duration: 180 }}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        borderWidth: 2,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 10,
                        flexShrink: 0,
                      }}>
                      {isSelected ? (
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: "#09090b",
                          }}
                        />
                      ) : null}
                    </MotiView>

                    {/* Title + inline badge */}
                    <View className="min-w-0 flex-1">
                      <View className="flex-row items-center gap-2 flex-wrap">
                        <Text
                          className="text-[16px] font-bold text-slate-50"
                          numberOfLines={1}>
                          {title}
                        </Text>
                        {badgeLabel ? (
                          <View
                            style={{
                              paddingHorizontal: 7,
                              paddingVertical: 2,
                              borderRadius: 99,
                              backgroundColor: "#6d28d9",
                            }}>
                            <Text
                              style={{
                                fontSize: 8,
                                fontWeight: "800",
                                letterSpacing: 0.4,
                                textTransform: "uppercase",
                                color: "#fff",
                              }}>
                              {badgeLabel}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    {/* Price column */}
                    <View className="shrink-0 items-end pl-3">
                      <Text
                        className="text-right text-base font-extrabold text-orange-400"
                        numberOfLines={1}>
                        {pkg.priceString}
                      </Text>
                      {perPeriod ? (
                        <Text
                          className="mt-0.5 text-right text-[10px] text-slate-400"
                          numberOfLines={1}>
                          {perPeriod}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Description for non-annual packages */}
                  {period !== "annual" && pkg.description ? (
                    <Text
                      className="ml-8 mt-1 text-xs leading-4 text-slate-400"
                      numberOfLines={2}>
                      {pkg.description}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            </MotiView>
          );
        })}
      </View>
    </View>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/features/paywall/PaywallPackageList.tsx
git commit -m "feat: update PaywallPackageList with Dawn gradient selected state and orange checkmark"
```

---

## Task 5: Update `PaywallStickyFooter`

**Files:**
- Modify: `src/features/paywall/PaywallStickyFooter.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { HomeBackground } from "@/features/home/HomeBackground";
import { HOME_BACKGROUNDS } from "@/theme/homeBackgrounds";

const DAWN_PALETTE = HOME_BACKGROUNDS[0];

const APPLE_SUBSCRIPTION_TERMS =
  "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

type Props = {
  primaryLabel: string;
  primaryDisabled: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  onPurchase: () => void;
  onRestore: () => void;
  onDismiss: () => void;
};

export const PaywallStickyFooter = ({
  primaryLabel,
  primaryDisabled,
  isPurchasing,
  isRestoring,
  onPurchase,
  onRestore,
  onDismiss,
}: Props) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const privacyUrl = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL?.trim();
  const buttonWidth = screenWidth - 32; // px-4 on each side

  return (
    <View
      className="border-t border-white/15 bg-slate-950"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
      <View className="max-w-full px-4 pt-3">
        {/* Dawn gradient CTA button */}
        <Pressable
          onPress={onPurchase}
          disabled={primaryDisabled}
          style={({ pressed }) => ({
            height: 54,
            borderRadius: 27,
            overflow: "hidden",
            opacity: pressed || primaryDisabled ? 0.75 : 1,
            shadowColor: "#6d28d9",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 8,
          })}>
          <HomeBackground palette={DAWN_PALETTE} width={buttonWidth} height={54} />
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { alignItems: "center", justifyContent: "center" },
            ]}>
            {isPurchasing ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "800",
                  color: "#ffffff",
                  letterSpacing: 0.2,
                }}>
                {primaryLabel}
              </Text>
            )}
          </View>
        </Pressable>

        {/* Restore + Maybe Later */}
        <View className="mt-3 flex-row items-center justify-center gap-3">
          <Pressable
            onPress={onRestore}
            disabled={isRestoring}
            style={({ pressed }) => ({
              opacity: pressed || isRestoring ? 0.55 : 1,
            })}>
            {isRestoring ? (
              <ActivityIndicator color="#94a3b8" size="small" />
            ) : (
              <Text className="text-[12px] font-medium text-slate-400">
                {t("subscription.restoreCta")}
              </Text>
            )}
          </Pressable>

          <Text className="text-[12px] text-slate-600">·</Text>

          <Pressable
            onPress={onDismiss}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Text className="text-[12px] font-medium text-slate-400">
              {t("subscription.maybeLaterCta")}
            </Text>
          </Pressable>
        </View>

        {/* Legal links */}
        <View className="mt-3 flex-row flex-wrap items-center justify-center gap-x-2 gap-y-2 px-1">
          <Pressable
            onPress={() => {
              void Linking.openURL(APPLE_SUBSCRIPTION_TERMS);
            }}>
            <Text className="text-[11px] leading-4 text-slate-500 underline">
              {t("subscription.subscriptionTermsLink")}
            </Text>
          </Pressable>
          {privacyUrl ? (
            <>
              <Text className="text-[11px] text-slate-600">·</Text>
              <Pressable
                onPress={() => {
                  void Linking.openURL(privacyUrl);
                }}>
                <Text className="text-[11px] leading-4 text-slate-500 underline">
                  {t("subscription.privacyPolicyLink")}
                </Text>
              </Pressable>
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/features/paywall/PaywallStickyFooter.tsx
git commit -m "feat: replace PaywallStickyFooter CTA with Dawn gradient button"
```

---

## Task 6: Update `PaywallScrollContent`

**Files:**
- Modify: `src/features/paywall/PaywallScrollContent.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
import { ScrollView, Text, View } from "react-native";

import { PaywallHero } from "@/features/paywall/PaywallHero";
import { PaywallPackageList } from "@/features/paywall/PaywallPackageList";
import { PaywallPlansSkeleton } from "@/features/paywall/PaywallPlansSkeleton";
import { PaywallUnlockCard } from "@/features/paywall/PaywallUnlockCard";
import type { PaywallSource } from "@/features/paywall/types";
import {
  type RevenueCatOffering,
  type RevenueCatPackageId,
} from "@/services/paywall/types";
import { useTranslation } from "react-i18next";

type Props = {
  headline: string;
  contextBody: string;
  sectionLabel: string;
  source: PaywallSource;
  showOfferingsLoading: boolean;
  showOfferingsError: boolean;
  offerings: RevenueCatOffering | null;
  hasPackages: boolean;
  bestValuePackageId: string | null;
  selectedPackageId: RevenueCatPackageId | null;
  onSelectPackage: (id: RevenueCatPackageId) => void;
  onClose: () => void;
};

export const PaywallScrollContent = ({
  headline,
  contextBody,
  sectionLabel,
  source,
  showOfferingsLoading,
  showOfferingsError,
  offerings,
  hasPackages,
  bestValuePackageId,
  selectedPackageId,
  onSelectPackage,
  onClose,
}: Props) => {
  const { t } = useTranslation();

  return (
    <ScrollView
      className="flex-1 w-full max-w-full self-stretch"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        width: "100%",
        maxWidth: "100%",
        alignSelf: "stretch",
        paddingBottom: 24,
      }}>

      {/* Full-bleed hero — no horizontal padding */}
      <PaywallHero
        headline={headline}
        contextBody={contextBody}
        sectionLabel={sectionLabel}
        source={source}
        onClose={onClose}
      />

      {/* Padded body sections */}
      <View style={{ paddingHorizontal: 16 }}>
        {/* Unlock card */}
        <View style={{ marginTop: 20 }}>
          <PaywallUnlockCard />
        </View>

        {/* Plan list — loading state */}
        {showOfferingsLoading && !showOfferingsError ? (
          <View className="mt-5 w-full max-w-full rounded-3xl border border-white/10 bg-slate-950/90 p-4">
            <PaywallPlansSkeleton />
          </View>
        ) : null}

        {/* Plan list — loaded */}
        {!showOfferingsLoading && offerings && hasPackages ? (
          <View className="mt-5 w-full max-w-full">
            <PaywallPackageList
              offerings={offerings}
              selectedPackageId={selectedPackageId}
              bestValuePackageId={bestValuePackageId}
              onSelectPackage={onSelectPackage}
            />
          </View>
        ) : null}

        {/* No plans available */}
        {!showOfferingsLoading && !hasPackages && !showOfferingsError ? (
          <View className="mt-5 w-full max-w-full rounded-2xl border border-amber-400/20 bg-slate-950/95 px-4 py-4">
            <Text className="w-full text-center text-sm leading-[22px] text-slate-200">
              {t("subscription.noPlansAvailable")}
            </Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/features/paywall/PaywallScrollContent.tsx
git commit -m "feat: update PaywallScrollContent with PaywallHero and PaywallUnlockCard"
```

---

## Task 7: Update `PaywallScreen`

**Files:**
- Modify: `src/features/paywall/PaywallScreen.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
import * as Haptics from "expo-haptics";
import { useEffect, useMemo } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSubscriptionStore } from "@/appState/subscriptionStore";
import { useUIStore } from "@/appState/uiStore";
import { PaywallAmbientBackground } from "@/features/paywall/PaywallAmbientBackground";
import { PaywallInfoStrip } from "@/features/paywall/PaywallInfoStrip";
import { PaywallScrollContent } from "@/features/paywall/PaywallScrollContent";
import { PaywallStickyFooter } from "@/features/paywall/PaywallStickyFooter";
import type { PaywallReason, PaywallSource } from "@/features/paywall/types";
import { usePaywallOfferings } from "@/features/paywall/usePaywallOfferings";
import { analyticsEvents } from "@/services/analytics/events";
import { useTranslation } from "react-i18next";
import { pickBestValuePackageId } from "@/utils/paywallPackage";

type Props = {
  reason?: PaywallReason;
  source?: PaywallSource;
  onClose: () => void;
};

export const PaywallScreen = ({
  reason = "generic",
  source = "manual",
  onClose,
}: Props) => {
  const { t } = useTranslation();
  const plan = useSubscriptionStore((s) => s.plan);
  const offerings = useSubscriptionStore((s) => s.offerings);
  const selectedPackageId = useSubscriptionStore((s) => s.selectedPackageId);
  const setSelectedPackageId = useSubscriptionStore(
    (s) => s.setSelectedPackageId,
  );
  const purchaseSelectedPackage = useSubscriptionStore(
    (s) => s.purchaseSelectedPackage,
  );
  const restorePurchases = useSubscriptionStore((s) => s.restorePurchases);
  const isPurchasing = useSubscriptionStore((s) => s.isPurchasing);
  const isRestoring = useSubscriptionStore((s) => s.isRestoring);
  const errorMessage = useSubscriptionStore((s) => s.errorMessage);
  const isLoading = useSubscriptionStore((s) => s.isLoading);

  const showToast = useUIStore((s) => s.showToast);

  const { offeringsFetchStatus, loadOfferings } = usePaywallOfferings(
    reason,
    source,
  );

  useEffect(() => {
    if (plan !== "pro" || isPurchasing || isRestoring) {
      return;
    }
    showToast(t("subscription.alreadyProToast"), "success", 3000);
    onClose();
  }, [plan, isPurchasing, isRestoring, onClose, showToast, t]);

  const sectionLabel = useMemo(() => {
    if (reason === "ai_limit") return t("subscription.heroLabelAiLimit");
    if (reason === "export_limit") return t("subscription.heroLabelExportLimit");
    if (reason === "premium_theme") return t("subscription.heroLabelPremiumTheme");
    if (reason === "persona_locked") return t("subscription.heroLabelPersonaLocked");
    return t("subscription.heroLabelGeneric");
  }, [reason, t]);

  const headline = useMemo(() => {
    if (reason === "ai_limit") return t("subscription.contextAiLimitTitle");
    if (reason === "export_limit") return t("subscription.contextExportLimitTitle");
    if (reason === "premium_theme") return t("subscription.contextPremiumThemeTitle");
    if (reason === "persona_locked") return t("subscription.contextPersonaLockedTitle");
    return t("subscription.paywallHeroTitle");
  }, [reason, t]);

  const contextBody = useMemo(() => {
    if (reason === "ai_limit") return t("subscription.aiLimitPaywallBody");
    if (reason === "export_limit") return t("subscription.exportLimitPaywallBody");
    if (reason === "premium_theme") return t("subscription.premiumThemePaywallBody");
    if (reason === "persona_locked") return t("subscription.personaPaywallBody");
    return t("subscription.paywallHeroSubtitle");
  }, [reason, t]);

  const bestValuePackageId = useMemo(() => {
    if (!offerings?.availablePackages.length) {
      return null;
    }
    return pickBestValuePackageId(
      offerings.availablePackages.map((p) => p.identifier),
    );
  }, [offerings]);

  const showOfferingsError =
    offeringsFetchStatus === "error" && Boolean(errorMessage);
  const showOfferingsLoading =
    offeringsFetchStatus === "loading" || (isLoading && !offerings);
  const hasPackages = Boolean(offerings?.availablePackages?.length);
  const canPurchase = hasPackages;
  const primaryLabel = isPurchasing
    ? t("subscription.processingCta")
    : selectedPackageId
      ? t("subscription.primaryCta")
      : t("subscription.selectPlanCta");

  const infoStrip = useMemo(() => {
    if (isPurchasing) {
      return { variant: "purchasing" as const, error: null as string | null };
    }
    if (isRestoring) {
      return { variant: "restoring" as const, error: null as string | null };
    }
    if (showOfferingsLoading && !showOfferingsError) {
      return { variant: "loadingPlans" as const, error: null as string | null };
    }
    if (showOfferingsError) {
      return { variant: "error" as const, error: errorMessage ?? null };
    }
    return null;
  }, [isPurchasing, isRestoring, showOfferingsLoading, showOfferingsError, errorMessage]);

  const handlePrimaryPress = async () => {
    const fallbackPackageId =
      selectedPackageId ??
      bestValuePackageId ??
      offerings?.availablePackages[0]?.identifier ??
      null;

    if (!fallbackPackageId) {
      const result = await loadOfferings();
      if (!result.ok) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast(
          result.errorMessage ?? t("subscription.noPlansAvailable"),
          "error",
          4500,
        );
      }
      return;
    }

    if (fallbackPackageId !== selectedPackageId) {
      setSelectedPackageId(fallbackPackageId);
    }

    analyticsEvents.paywallCheckoutStarted(reason, source, fallbackPackageId);
    const result = await purchaseSelectedPackage(fallbackPackageId);
    if (!result.ok) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(
        result.errorMessage ?? t("subscription.purchaseFailedToast"),
        "error",
        4500,
      );
      return;
    }
    if (result.becamePro) {
      analyticsEvents.paywallPurchaseSucceeded(reason, source, fallbackPackageId);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(t("subscription.purchaseSuccessToast"), "success", 5200);
      setTimeout(() => { onClose(); }, 450);
      return;
    }
    showToast(t("subscription.purchaseVerifyLater"), "info", 5000);
  };

  const handleRestorePress = async () => {
    const result = await restorePurchases();
    if (!result.ok) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(
        result.errorMessage ?? t("subscription.restoreFailedToast"),
        "error",
        4500,
      );
      return;
    }
    if (result.becamePro) {
      analyticsEvents.paywallRestoreSucceeded(reason, source);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(t("subscription.restoreSuccessToast"), "success", 5200);
      setTimeout(() => { onClose(); }, 450);
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    showToast(t("subscription.restoreNoActiveToast"), "info", 4000);
  };

  return (
    <View className="flex-1 bg-transparent">
      <PaywallAmbientBackground />
      <SafeAreaView className="flex-1 w-full max-w-full" edges={["top"]}>
        {infoStrip ? (
          <PaywallInfoStrip
            variant={infoStrip.variant}
            errorDetail={infoStrip.error}
            onRetryLoad={() => {
              loadOfferings().catch(() => undefined);
            }}
          />
        ) : null}

        <PaywallScrollContent
          headline={headline}
          contextBody={contextBody}
          sectionLabel={sectionLabel}
          source={source}
          showOfferingsLoading={showOfferingsLoading}
          showOfferingsError={showOfferingsError}
          offerings={offerings}
          hasPackages={hasPackages}
          bestValuePackageId={bestValuePackageId}
          selectedPackageId={selectedPackageId}
          onSelectPackage={setSelectedPackageId}
          onClose={onClose}
        />

        <PaywallStickyFooter
          primaryLabel={primaryLabel}
          primaryDisabled={isPurchasing || !canPurchase || plan === "pro"}
          isPurchasing={isPurchasing}
          isRestoring={isRestoring}
          onPurchase={() => {
            handlePrimaryPress().catch(() => undefined);
          }}
          onRestore={() => {
            handleRestorePress().catch(() => undefined);
          }}
          onDismiss={onClose}
        />
      </SafeAreaView>
    </View>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/features/paywall/PaywallScreen.tsx
git commit -m "feat: update PaywallScreen to use new hero architecture"
```

---

## Task 8: Delete obsolete components

**Files:**
- Delete: `src/features/paywall/PaywallValueBullets.tsx`
- Delete: `src/features/paywall/PaywallFeatureComparison.tsx`

- [ ] **Step 1: Delete the files**

```bash
rm src/features/paywall/PaywallValueBullets.tsx
rm src/features/paywall/PaywallFeatureComparison.tsx
```

- [ ] **Step 2: Verify no remaining imports**

```bash
grep -r "PaywallValueBullets\|PaywallFeatureComparison" src/ --include="*.ts" --include="*.tsx"
```

Expected: no output (zero matches).

- [ ] **Step 3: Commit**

```bash
git add -u
git commit -m "chore: remove obsolete PaywallValueBullets and PaywallFeatureComparison"
```

---

## Task 9: Lint and test

- [ ] **Step 1: Run lint**

```bash
npm run lint
```

Expected: no new errors.

- [ ] **Step 2: Run tests**

```bash
npm test -- --runInBand
```

Expected: all existing tests pass (no paywall component tests exist; `paywallOpen.test.ts` and `paywallPackage.test.ts` are pure logic and unaffected).

- [ ] **Step 3: Fix any lint errors, then commit**

```bash
git add -A
git commit -m "fix: address lint issues in paywall redesign"
```

Only create this commit if there were lint fixes. Skip otherwise.

---

## Verification Checklist

After all tasks complete, manually verify on iOS simulator (`npm run ios`):

- [ ] Paywall opened via onboarding end (`source: "onboarding"`) → Dawn gradient hero + quote preview card visible, orange section label "YOUR VIBE IS READY"
- [ ] Paywall opened via AI limit gate → "DAILY LIMIT REACHED" label, no quote preview
- [ ] Select any plan → Dawn gradient selected state + orange checkmark badge top-right
- [ ] Tap "Start Pro" → Dawn gradient button shows spinner while purchasing, haptic fires on success/error
- [ ] Close button inside hero dismisses modal
- [ ] Restore + Maybe Later still work in footer
- [ ] `PaywallInfoStrip` loading / error / purchasing states still render correctly above scroll
- [ ] No violet `#A855F7` remnants in paywall components (amber is fine in skeleton)
