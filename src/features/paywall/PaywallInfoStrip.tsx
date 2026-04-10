import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import i18n from "@/i18n";

type Variant = "loadingPlans" | "purchasing" | "restoring" | "error";

type Props = {
  variant: Variant;
  errorDetail?: string | null;
  onRetryLoad?: () => void;
};

const stripTitle = (variant: Variant): string => {
  if (variant === "loadingPlans") {
    return i18n.t("subscription.statusLoadingPlansTitle");
  }
  if (variant === "purchasing") {
    return i18n.t("subscription.statusPurchasingTitle");
  }
  if (variant === "restoring") {
    return i18n.t("subscription.statusRestoringTitle");
  }
  return i18n.t("subscription.statusErrorTitle");
};

const stripBody = (variant: Variant, errorDetail: string | null | undefined): string => {
  if (variant === "error") {
    return errorDetail ?? "";
  }
  if (variant === "loadingPlans") {
    return i18n.t("subscription.statusLoadingPlansBody");
  }
  if (variant === "purchasing") {
    return i18n.t("subscription.statusPurchasingBody");
  }
  return i18n.t("subscription.statusRestoringBody");
};

export const PaywallInfoStrip = ({
  variant,
  errorDetail,
  onRetryLoad,
}: Props) => {
  if (variant === "error" && !errorDetail) {
    return null;
  }

  const isError = variant === "error";
  const isLoadingPlans = variant === "loadingPlans";

  return (
    <View
      className="border-b px-4 py-3.5"
      style={{
        borderColor: isError ? "rgba(248,113,113,0.35)" : "rgba(251,191,36,0.28)",
        backgroundColor: isError ? "rgba(69,10,10,0.92)" : "rgba(15,23,42,0.98)",
      }}>
      <View className="flex-row items-start gap-3">
        {isError ? (
          <Ionicons name="alert-circle" size={22} color="#fca5a5" />
        ) : (
          <ActivityIndicator
            color={isLoadingPlans ? "#fcd34d" : "#fbbf24"}
            size="small"
          />
        )}
        <View className="min-w-0 flex-1">
          <Text
            className={`text-sm font-semibold ${isError ? "text-red-50" : "text-amber-100"}`}>
            {stripTitle(variant)}
          </Text>
          <Text
            className={`mt-1 text-xs leading-[18px] ${isError ? "text-red-100" : "text-slate-200"}`}>
            {stripBody(variant, errorDetail)}
          </Text>
          {isError && onRetryLoad ? (
            <Pressable
              onPress={onRetryLoad}
              className="mt-3 self-start rounded-full bg-white/15 px-4 py-2">
              <Text className="text-xs font-bold text-white">
                {i18n.t("subscription.retryLoadPlans")}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
};
