import { createSubscriptionGuards } from "@/domain/subscription/subscriptionGuards";
import { getCapabilitiesForPlan } from "@/domain/subscription/subscriptionCapabilities";
import { useSubscriptionStore } from "@/appState/subscriptionStore";
import { useUsageStore } from "@/appState/usageStore";
import { waitTwoFrames } from "@/utils/waitTwoFrames";
import { router } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { Platform, Share, View } from "react-native";
import { captureRef } from "react-native-view-shot";

export function useQuoteMomentShare() {
  const captureRefView = useRef<View>(null);
  const [watermarkForExport, setWatermarkForExport] = useState(false);
  const customerInfo = useSubscriptionStore((s) => s.customerInfo);
  const plan = useSubscriptionStore((s) => s.plan);
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

  const capabilities = useMemo(() => getCapabilitiesForPlan(plan), [plan]);

  const shareMoment = useCallback(async () => {
    const target = captureRefView.current;
    if (!target) {
      return;
    }
    resetIfNewDay();
    const guards = createSubscriptionGuards(snapshot);
    const guardResult = guards.canExportQuote(dailyExportCount);
    if (!guardResult.allowed) {
      router.push("/modal/paywall?reason=export_limit" as never);
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
      await Share.share({ url: uri });
      incrementExportUsage();
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
  ]);

  return {
    captureRefView,
    watermarkForExport,
    shareMoment,
  };
}
