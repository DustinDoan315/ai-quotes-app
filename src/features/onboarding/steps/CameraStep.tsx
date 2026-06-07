import { OnboardingStepShell } from "@/features/onboarding/components/OnboardingStepShell";
import { Ionicons } from "@expo/vector-icons";
import { useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Feature = {
  icon: "sparkles" | "heart" | "people";
  labelKey: string;
};

const FEATURES: Feature[] = [
  { icon: "sparkles", labelKey: "feature1" },
  { icon: "heart", labelKey: "feature2" },
  { icon: "people", labelKey: "feature3" },
];

type Props = {
  onContinue: () => void;
};

export function CameraStep({ onContinue }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [, requestPermission] = useCameraPermissions();
  const [isRequesting, setIsRequesting] = useState(false);

  async function handleAllow() {
    setIsRequesting(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await requestPermission();
    } finally {
      setIsRequesting(false);
      onContinue();
    }
  }

  return (
    <OnboardingStepShell>
      <View className="flex-1">
        <View className="flex-1 px-6">

          {/* Section label */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 300, delay: 40 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 1.2,
                color: "#c2410c",
                marginBottom: 12,
              }}>
              {t("onboarding.camera.sectionLabel")}
            </Text>
          </MotiView>

          {/* Title + subtitle */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 360, delay: 80 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "800",
                lineHeight: 34,
                color: "#fff",
                marginBottom: 8,
              }}>
              {t("onboarding.camera.title")}
            </Text>
            <Text
              style={{
                fontSize: 15,
                lineHeight: 22,
                color: "rgba(255,255,255,0.5)",
                marginBottom: 36,
              }}>
              {t("onboarding.camera.subtitle")}
            </Text>
          </MotiView>

          {/* Camera icon illustration */}
          <MotiView
            from={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", delay: 160, damping: 22, stiffness: 200 }}
            style={{
              alignSelf: "center",
              width: 96,
              height: 96,
              borderRadius: 28,
              backgroundColor: "rgba(255,255,255,0.07)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.12)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 36,
            }}>
            <Ionicons name="camera" size={44} color="rgba(255,255,255,0.7)" />
          </MotiView>

          {/* Feature list */}
          <View style={{ gap: 16 }}>
            {FEATURES.map((feat, index) => (
              <MotiView
                key={feat.labelKey}
                from={{ opacity: 0, translateX: -12 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{
                  type: "timing",
                  duration: 320,
                  delay: 260 + index * 80,
                }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      backgroundColor: "rgba(255,255,255,0.06)",
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.1)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                    <Ionicons
                      name={feat.icon}
                      size={18}
                      color="rgba(255,255,255,0.65)"
                    />
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 14,
                      fontWeight: "500",
                      color: "rgba(255,255,255,0.75)",
                      lineHeight: 20,
                    }}>
                    {t(`onboarding.camera.${feat.labelKey}`)}
                  </Text>
                </View>
              </MotiView>
            ))}
          </View>
        </View>

        {/* CTAs — sticky bottom */}
        <MotiView
          from={{ opacity: 0, translateY: 24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 380, delay: 500 }}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: Math.max(insets.bottom, 24),
            backgroundColor: "rgba(9,9,11,0.96)",
          }}>
          <Pressable
            onPress={() => { void handleAllow(); }}
            disabled={isRequesting}
            style={({ pressed }) => ({
              borderRadius: 18,
              marginBottom: 12,
              opacity: isRequesting ? 0.7 : pressed ? 0.88 : 1,
            })}>
            <View
              style={{
                minHeight: 56,
                borderRadius: 18,
                backgroundColor: "#fff",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 18,
                paddingVertical: 14,
              }}>
              {isRequesting ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "800",
                    color: "#000",
                  }}>
                  {t("onboarding.camera.ctaAllow")} →
                </Text>
              )}
            </View>
          </Pressable>

          <Pressable
            onPress={onContinue}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, paddingVertical: 12 })}>
            <Text
              style={{
                textAlign: "center",
                fontSize: 14,
                fontWeight: "500",
                color: "rgba(255,255,255,0.35)",
              }}>
              {t("onboarding.camera.ctaSkip")}
            </Text>
          </Pressable>
        </MotiView>
      </View>
    </OnboardingStepShell>
  );
}
