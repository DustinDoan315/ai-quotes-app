import { useReminderStore } from "@/appState/reminderStore";
import { useUIStore } from "@/appState/uiStore";
import { AppIcon } from "@/components/AppIcon";
import { HomeBackground } from "@/features/home/HomeBackground";
import { OnboardingStepShell } from "@/features/onboarding/components/OnboardingStepShell";
import { HOME_BACKGROUNDS } from "@/theme/homeBackgrounds";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DAWN_PALETTE = HOME_BACKGROUNDS[0]; // dawn — purple/orange

type SlotId = "predawn" | "morning" | "midday" | "evening";

type TimeSlot = {
  id: SlotId;
  hour: number;
  minute: number;
  icon: "moon-outline" | "sunny-outline" | "partly-sunny-outline" | "moon";
};

const TIME_SLOTS: TimeSlot[] = [
  { id: "predawn", hour: 6, minute: 0, icon: "moon-outline" },
  { id: "morning", hour: 8, minute: 30, icon: "sunny-outline" },
  { id: "midday", hour: 12, minute: 30, icon: "partly-sunny-outline" },
  { id: "evening", hour: 20, minute: 0, icon: "moon" },
];

function NotificationPreview({ time }: { time: string }) {
  const { t } = useTranslation();
  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 380, delay: 200 }}
      style={{
        borderRadius: 18,
        overflow: "hidden",
        backgroundColor: "rgba(255,255,255,0.07)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
        marginBottom: 24,
      }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 14,
          paddingTop: 12,
          paddingBottom: 6,
        }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            overflow: "hidden",
            backgroundColor: "#000",
          }}>
          <AppIcon size={28} borderRadius={7} />
        </View>
        <Text style={{ flex: 1, fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.85)" }}>
          {t("onboarding.notification.previewAppName")}
        </Text>
        <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{time}</Text>
      </View>
      <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 2 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff", lineHeight: 20 }}>
          {t("onboarding.notification.previewTitle")}
        </Text>
        <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 18 }}>
          {t("onboarding.notification.previewBody")}
        </Text>
      </View>
      <View style={{ height: 2, backgroundColor: "#6d28d9", opacity: 0.6 }} />
    </MotiView>
  );
}

type Props = {
  onContinue: () => void;
};

export function NotificationStep({ onContinue }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const enableReminder = useReminderStore((s) => s.enableReminder);
  const setReminderTime = useReminderStore((s) => s.setReminderTime);
  const showToast = useUIStore((s) => s.showToast);
  const [selectedSlot, setSelectedSlot] = useState<SlotId>("morning");
  const [isEnabling, setIsEnabling] = useState(false);

  function handleSlotSelect(slot: TimeSlot) {
    setSelectedSlot(slot.id);
    void setReminderTime(slot.hour, slot.minute);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

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

  const selectedSlotData = TIME_SLOTS.find((s) => s.id === selectedSlot)!;
  const previewTime = `${selectedSlotData.hour}:${String(selectedSlotData.minute).padStart(2, "0")}`;

  return (
    <OnboardingStepShell>
      <View className="flex-1">
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 140 }}
          showsVerticalScrollIndicator={false}>

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
              {t("onboarding.notification.sectionLabel")}
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
              {t("onboarding.notification.title")}
            </Text>
            <Text
              style={{
                fontSize: 15,
                lineHeight: 22,
                color: "rgba(255,255,255,0.5)",
                marginBottom: 24,
              }}>
              {t("onboarding.notification.subtitle")}
            </Text>
          </MotiView>

          {/* Notification preview */}
          <NotificationPreview time={previewTime} />

          {/* 2×2 time slot grid */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {TIME_SLOTS.map((slot, index) => {
              const isSelected = selectedSlot === slot.id;
              return (
                <MotiView
                  key={slot.id}
                  from={{ opacity: 0, translateY: 12 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{
                    type: "spring",
                    delay: 200 + index * 60,
                    damping: 20,
                    stiffness: 180,
                  }}
                  style={{ width: "47%" }}>
                  <Pressable
                    onPress={() => handleSlotSelect(slot)}
                    style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                    <View style={{ overflow: "hidden", borderRadius: 16 }}>
                      {isSelected && <HomeBackground palette={DAWN_PALETTE} />}
                      {isSelected && (
                        <View
                          style={[
                            StyleSheet.absoluteFillObject,
                            { backgroundColor: "rgba(0,0,0,0.28)" },
                          ]}
                          pointerEvents="none"
                        />
                      )}
                      <View
                        style={{
                          padding: 14,
                          borderRadius: 16,
                          borderWidth: 1,
                          borderColor: isSelected
                            ? "rgba(255,255,255,0.38)"
                            : "rgba(255,255,255,0.12)",
                          backgroundColor: isSelected ? "transparent" : "rgba(255,255,255,0.04)",
                          minHeight: 90,
                        }}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                            marginBottom: 6,
                          }}>
                          <Ionicons
                            name={slot.icon}
                            size={14}
                            color={isSelected ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.4)"}
                          />
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "700",
                              color: "#fff",
                            }}>
                            {t(`onboarding.notification.slot_${slot.id}_time`)}
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: "#fff",
                            marginBottom: 2,
                          }}>
                          {t(`onboarding.notification.slot_${slot.id}`)}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            lineHeight: 16,
                            color: "rgba(255,255,255,0.5)",
                          }}>
                          {t(`onboarding.notification.slot_${slot.id}_desc`)}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                </MotiView>
              );
            })}
          </View>
        </ScrollView>

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
            onPress={() => { void handleEnable(); }}
            disabled={isEnabling}
            style={({ pressed }) => ({
              borderRadius: 18,
              marginBottom: 12,
              opacity: isEnabling ? 0.7 : pressed ? 0.88 : 1,
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
              {isEnabling ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "800",
                    color: "#000",
                  }}>
                  {t("onboarding.notification.ctaEnable")} →
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
              {t("onboarding.notification.ctaSkip")}
            </Text>
          </Pressable>
        </MotiView>
      </View>
    </OnboardingStepShell>
  );
}
