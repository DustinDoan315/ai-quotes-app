import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { Pressable, Text, View } from "react-native";

import { useTranslation } from "react-i18next";
import {
  type RevenueCatOffering,
  type RevenueCatPackageId,
} from "@/services/paywall/types";
import {
  calculateSavingsPercent,
  deriveBillingPeriod,
  derivePerPeriodBreakdown,
  displayTitleForPackage,
} from "@/utils/paywallPackage";

type Props = {
  offerings: RevenueCatOffering;
  selectedPackageId: RevenueCatPackageId | null;
  bestValuePackageId: string | null;
  onSelectPackage: (id: RevenueCatPackageId) => void;
};

const ANNUAL_CARD_FEATURE_KEYS = [
  "subscription.cardFeatureUnlimitedAi",
  "subscription.cardFeatureNoWatermark",
  "subscription.cardFeatureAllThemes",
] as const;

function ShimmerBadge({ label }: { label: string }) {
  return (
    <View
      style={{
        backgroundColor: "#FBBF24",
        overflow: "hidden",
        paddingVertical: 7,
        alignItems: "center",
      }}>
      <Text
        style={{
          fontSize: 10,
          fontWeight: "800",
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: "#09090b",
        }}>
        {label}
      </Text>
      <MotiView
        from={{ translateX: -120, opacity: 0.6 }}
        animate={{ translateX: 320, opacity: 0 }}
        transition={{
          type: "timing",
          duration: 1800,
          loop: true,
          repeatReverse: false,
        }}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          width: 80,
          backgroundColor: "rgba(255,255,255,0.35)",
          transform: [{ skewX: "-20deg" }],
        }}
        pointerEvents="none"
      />
    </View>
  );
}

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
      <Text className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-amber-200/90">
        {t("subscription.choosePlanHeader")}
      </Text>
      <View className="w-full gap-3">
        {offerings.availablePackages.map((pkg, index) => {
          const isSelected = pkg.identifier === selectedPackageId;
          const isBest = pkg.identifier === bestValuePackageId;
          const title = displayTitleForPackage(pkg);
          const period = deriveBillingPeriod(pkg.identifier);
          const perPeriod = derivePerPeriodBreakdown(pkg);
          const isAnnual = period === "annual";
          const isLifetime = period === "lifetime";

          const badgeLabel = isBest
            ? savingsPercent
              ? `Best Value · Save ${savingsPercent}%`
              : t("subscription.bestValueTag")
            : isLifetime
              ? t("subscription.lifetimeOneTimeTag")
              : null;

          const periodPillLabel = isAnnual
            ? t("subscription.billedYearly")
            : isLifetime
              ? null
              : t("subscription.billedMonthly");

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
                style={{
                  borderColor: isSelected
                    ? "#FBBF24"
                    : isBest
                      ? "rgba(251,191,36,0.4)"
                      : "rgba(148,163,184,0.25)",
                  backgroundColor: isSelected
                    ? "rgba(251,191,36,0.14)"
                    : isAnnual
                      ? "rgba(15,23,42,0.99)"
                      : "rgba(15,23,42,0.92)",
                  shadowColor: isSelected ? "#fbbf24" : "transparent",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: isSelected ? 0.45 : 0,
                  shadowRadius: isSelected ? 18 : 0,
                  elevation: isSelected ? 10 : 0,
                }}>
                {/* Top badge */}
                {badgeLabel ? (
                  isBest ? (
                    <ShimmerBadge label={badgeLabel} />
                  ) : (
                    <View
                      style={{ backgroundColor: "rgba(51,65,85,0.8)" }}
                      className="px-3 py-1.5">
                      <Text className="text-center text-[10px] font-bold uppercase tracking-wide text-slate-300">
                        {badgeLabel}
                      </Text>
                    </View>
                  )
                ) : null}

                {/* Card body */}
                <View className="w-full px-3.5 py-3.5">
                  {/* Row: radio + title + period pill + price */}
                  <View className="w-full flex-row items-center">
                    {/* Animated radio button */}
                    <MotiView
                      animate={{
                        borderColor: isSelected
                          ? "#FBBF24"
                          : "rgba(255,255,255,0.4)",
                        backgroundColor: isSelected ? "#FBBF24" : "transparent",
                      }}
                      transition={{ type: "timing", duration: 180 }}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 2,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 10,
                        flexShrink: 0,
                      }}>
                      {isSelected ? (
                        <View
                          style={{
                            width: 9,
                            height: 9,
                            borderRadius: 5,
                            backgroundColor: "#09090b",
                          }}
                        />
                      ) : null}
                    </MotiView>

                    {/* Title + period pill */}
                    <View className="min-w-0 flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text
                          className="text-[16px] font-bold text-slate-50"
                          numberOfLines={1}>
                          {title}
                        </Text>
                        {periodPillLabel ? (
                          <View
                            className="rounded-full px-2 py-0.5"
                            style={{
                              backgroundColor: isAnnual
                                ? "rgba(251,191,36,0.15)"
                                : "rgba(148,163,184,0.15)",
                            }}>
                            <Text
                              style={{
                                fontSize: 9,
                                fontWeight: "700",
                                letterSpacing: 0.3,
                                color: isAnnual
                                  ? "#fcd34d"
                                  : "rgba(148,163,184,0.9)",
                              }}>
                              {periodPillLabel}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    {/* Price column */}
                    <View className="shrink-0 items-end pl-3">
                      <Text
                        className="text-right text-base font-extrabold text-amber-300"
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

                  {/* Description (monthly/lifetime only) */}
                  {!isAnnual && pkg.description ? (
                    <Text
                      className="ml-8 mt-1 text-xs leading-4 text-slate-400"
                      numberOfLines={2}>
                      {pkg.description}
                    </Text>
                  ) : null}

                  {/* Feature bullets (annual card only) */}
                  {isAnnual ? (
                    <View className="ml-8 mt-3 gap-1.5">
                      {ANNUAL_CARD_FEATURE_KEYS.map((key) => (
                        <View key={key} className="flex-row items-center gap-2">
                          <Ionicons
                            name="checkmark-circle"
                            size={13}
                            color="#6ee7b7"
                          />
                          <Text className="text-[12px] leading-[17px] text-slate-300">
                            {t(key)}
                          </Text>
                        </View>
                      ))}
                    </View>
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
