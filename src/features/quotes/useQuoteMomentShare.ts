import { createSubscriptionGuards } from "@/domain/subscription/subscriptionGuards";
import { getCapabilitiesForPlan } from "@/domain/subscription/subscriptionCapabilities";
import { openPaywall } from "@/features/paywall/openPaywall";
import { useSubscriptionConfigStore } from "@/appState/subscriptionConfigStore";
import { useSubscriptionStore } from "@/appState/subscriptionStore";
import { useUsageStore } from "@/appState/usageStore";
import { waitTwoFrames } from "@/utils/waitTwoFrames";
import { shareImageFile } from "@/utils/sharing";
import { analyticsEvents } from "@/services/analytics/events";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Share, View } from "react-native";
import { captureRef } from "react-native-view-shot";

export function useQuoteMomentShare() {
  const { t } = useTranslation();
  const captureRefView = useRef<View>(null);
  const [watermarkForExport, setWatermarkForExport] = useState(false);
  const customerInfo = useSubscriptionStore((s) => s.customerInfo);
  const plan = useSubscriptionStore((s) => s.plan);
  const planLimits = useSubscriptionConfigStore((s) => s.planLimits);
  const resetIfNewDay = useUsageStore((s) => s.resetIfNewDay);
  const dailyExportCount = useUsageStore((s) => s.dailyExportCount);
  const incrementExportUsage = useUsageStore((s) => s.incrementExportUsage);

  const snapshot = useMemo(
    () =>
      customerInfo
        ? { activeEntitlementIds: customerInfo.activeEntitlementIds }
        : null,
    [customerInfo],
  );

  const capabilities = useMemo(
    () => getCapabilitiesForPlan(plan, planLimits),
    [plan, planLimits],
  );

  const shareMoment = useCallback(async (quoteId?: string) => {
    const target = captureRefView.current;
    if (!target) {
      return;
    }
    resetIfNewDay();
    const guards = createSubscriptionGuards(snapshot, planLimits);
    const guardResult = guards.canExportQuote(dailyExportCount);
    if (!guardResult.allowed) {
      openPaywall({
        reason: "export_limit",
        source: "quote_share",
      });
      return;
    }

    const showWatermark = capabilities.hasWatermark;
    setWatermarkForExport(showWatermark);
    await waitTwoFrames();
    try {
      const uri = await captureRef(target, {
        format: "png",
        quality: 1,
      });
      if (Platform.OS === "web") {
        await Share.share({
          title: "Moment",
          url: uri,
        });
        incrementExportUsage();
        return;
      }
      const result = await shareImageFile(uri, { dialogTitle: t("share.shareMomentDialogTitle") });
      if (result.ok) {
        incrementExportUsage();
        analyticsEvents.quoteMomentShared(quoteId ?? "");
      }
    } catch {
    } finally {
      setWatermarkForExport(false);
    }
  }, [
    snapshot,
    dailyExportCount,
    resetIfNewDay,
    incrementExportUsage,
    capabilities.hasWatermark,
    planLimits,
    t,
  ]);

  return {
    captureRefView,
    watermarkForExport,
    shareMoment,
  };
}
