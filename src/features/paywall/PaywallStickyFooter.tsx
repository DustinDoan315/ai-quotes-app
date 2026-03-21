import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { strings } from "@/theme/strings";

type Props = {
  primaryLabel: string;
  primaryDisabled: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  onPurchase: () => void;
  onRestore: () => void;
  onDismiss: () => void;
};

const APPLE_SUBSCRIPTION_TERMS =
  "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

export const PaywallStickyFooter = ({
  primaryLabel,
  primaryDisabled,
  isPurchasing,
  isRestoring,
  onPurchase,
  onRestore,
  onDismiss,
}: Props) => {
  const insets = useSafeAreaInsets();
  const privacyUrl = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL?.trim();

  return (
    <View
      className="border-t border-white/10 bg-black/95"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
      <View className="px-5 pt-3">
        <Pressable
          onPress={onPurchase}
          disabled={primaryDisabled}
          className="h-[52px] flex-row items-center justify-center rounded-full bg-amber-400"
          style={({ pressed }) => ({
            opacity: pressed || primaryDisabled ? 0.75 : 1,
          })}>
          {isPurchasing ? (
            <ActivityIndicator color="#0f172a" />
          ) : (
            <Text className="text-base font-bold text-slate-950">{primaryLabel}</Text>
          )}
        </Pressable>

        <Pressable
          onPress={onRestore}
          disabled={isRestoring}
          className="mt-3 h-11 flex-row items-center justify-center gap-2"
          style={({ pressed }) => ({
            opacity: pressed || isRestoring ? 0.55 : 1,
          })}>
          {isRestoring ? (
            <ActivityIndicator color="#e2e8f0" size="small" />
          ) : (
            <Ionicons name="refresh-outline" size={18} color="#e2e8f0" />
          )}
          <Text className="text-sm font-semibold text-white/90">
            {strings.subscription.restoreCta}
          </Text>
        </Pressable>

        <Pressable
          onPress={onDismiss}
          className="mt-1 h-11 items-center justify-center"
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <Text className="text-sm font-medium text-white/45">
            {strings.subscription.maybeLaterCta}
          </Text>
        </Pressable>

        <View className="mt-3 flex-row flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <Pressable
            onPress={() => {
              void Linking.openURL(APPLE_SUBSCRIPTION_TERMS);
            }}>
            <Text className="text-[11px] text-white/40 underline">
              {strings.subscription.subscriptionTermsLink}
            </Text>
          </Pressable>
          {privacyUrl ? (
            <>
              <Text className="text-[11px] text-white/25">·</Text>
              <Pressable
                onPress={() => {
                  void Linking.openURL(privacyUrl);
                }}>
                <Text className="text-[11px] text-white/40 underline">
                  {strings.subscription.privacyPolicyLink}
                </Text>
              </Pressable>
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
};
