import { useReminderStore } from "@/appState/reminderStore";
import { useUIStore } from "@/appState/uiStore";
import { OnboardingStepShell } from "@/features/onboarding/components/OnboardingStepShell";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  onContinue: () => void;
};

const BULLETS: Array<{ icon: "sunny-outline" | "alarm-outline" | "ban-outline"; key: string }> = [
  { icon: "sunny-outline", key: "bullet1" },
  { icon: "alarm-outline", key: "bullet2" },
  { icon: "ban-outline", key: "bullet3" },
];

function NotificationPreview() {
  const { t } = useTranslation();
  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 400, delay: 300 }}
      style={{
        borderRadius: 18,
        overflow: "hidden",
        backgroundColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
        marginBottom: 28,
      }}>
      {/* Notification chrome bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 14,
          paddingTop: 12,
          paddingBottom: 6,
        }}>
        {/* App icon badge */}
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            overflow: "hidden",
            backgroundColor: "#000",
          }}>
          <Image
            source={require("../../../../../assets/images/icon.png")}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        </View>
        <Text
          style={{
            flex: 1,
            fontSize: 12,
            fontWeight: "700",
            color: "rgba(255,255,255,0.85)",
          }}>
          {t("onboarding.notification.previewAppName")}
        </Text>
        <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
          {t("onboarding.notification.previewTime")}
        </Text>
      </View>

      {/* Notification body */}
      <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 2 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: "#fff",
            lineHeight: 20,
          }}>
          {t("onboarding.notification.previewTitle")}
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.55)",
            lineHeight: 18,
          }}>
          {t("onboarding.notification.previewBody")}
        </Text>
      </View>

      {/* Amber accent bottom line */}
      <View
        style={{
          height: 2,
          backgroundColor: "#f59e0b",
          opacity: 0.6,
        }}
      />
    </MotiView>
  );
}

export function NotificationStep({ onContinue }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const enableReminder = useReminderStore((s) => s.enableReminder);
  const showToast = useUIStore((s) => s.showToast);
  const [isEnabling, setIsEnabling] = useState(false);

  async function handleEnable() {
    setIsEnabling(true);
    try {
      const granted = await enableReminder();
      if (!granted) {
        showToast(t("onboarding.notification.errorPermission"), "info");
      }
      onContinue();
    } catch {
      showToast(t("onboarding.notification.errorGeneric"), "error");
      onContinue();
    } finally {
      setIsEnabling(false);
    }
  }

  return (
    <OnboardingStepShell>
      <View
        className="flex-1 px-6"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}>

        {/* Animated bell icon */}
        <MotiView
          from={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 14, stiffness: 160, delay: 80 }}
          style={{ alignItems: "center", marginBottom: 24 }}>
          <MotiView
            animate={{ rotate: ["0deg", "-12deg", "12deg", "-8deg", "8deg", "0deg"] }}
            transition={{
              type: "timing",
              duration: 700,
              delay: 900,
              loop: true,
            }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 28,
                backgroundColor: "rgba(245,158,11,0.12)",
                borderWidth: 1,
                borderColor: "rgba(245,158,11,0.3)",
                alignItems: "center",
                justifyContent: "center",
              }}>
              <Ionicons name="notifications" size={36} color="#f59e0b" />
            </View>
          </MotiView>
        </MotiView>

        {/* Title + subtitle */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 360, delay: 200 }}>
          <Text
            style={{
              textAlign: "center",
              fontSize: 26,
              fontWeight: "800",
              lineHeight: 32,
              color: "#fff",
              marginBottom: 10,
            }}>
            {t("onboarding.notification.title")}
          </Text>
          <Text
            style={{
              textAlign: "center",
              fontSize: 15,
              lineHeight: 22,
              color: "rgba(255,255,255,0.5)",
              marginBottom: 24,
            }}>
            {t("onboarding.notification.subtitle")}
          </Text>
        </MotiView>

        {/* Notification preview mockup */}
        <NotificationPreview />

        {/* Bullet list */}
        <View style={{ gap: 14, marginBottom: 28 }}>
          {BULLETS.map(({ icon, key }, i) => (
            <MotiView
              key={key}
              from={{ opacity: 0, translateX: -16 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: "timing", duration: 340, delay: 400 + i * 80 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.07)",
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    backgroundColor: "rgba(245,158,11,0.12)",
                    borderWidth: 1,
                    borderColor: "rgba(245,158,11,0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                  <Ionicons name={icon} size={17} color="#f59e0b" />
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 14,
                    lineHeight: 20,
                    color: "rgba(255,255,255,0.75)",
                    fontWeight: "500",
                  }}>
                  {t(`onboarding.notification.${key}`)}
                </Text>
              </View>
            </MotiView>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        {/* CTAs */}
        <MotiView
          from={{ opacity: 0, translateY: 24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 380, delay: 600 }}>
          <Pressable
            onPress={() => { void handleEnable(); }}
            disabled={isEnabling}
            style={({ pressed }) => ({
              backgroundColor: "#f59e0b",
              borderRadius: 18,
              paddingVertical: 16,
              alignItems: "center",
              marginBottom: 12,
              opacity: isEnabling ? 0.7 : pressed ? 0.88 : 1,
            })}>
            {isEnabling ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="notifications" size={18} color="#000" />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "800",
                    color: "#000",
                    letterSpacing: 0.2,
                  }}>
                  {t("onboarding.notification.ctaEnable")}
                </Text>
              </View>
            )}
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
              {t("onboarding.notification.ctaSkip")}
            </Text>
          </Pressable>
        </MotiView>
      </View>
    </OnboardingStepShell>
  );
}
