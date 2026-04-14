import { useReminderStore } from "@/appState/reminderStore";
import { useUIStore } from "@/appState/uiStore";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import * as Localization from "expo-localization";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  Switch,
  Text,
  View,
} from "react-native";

function buildTimeDate(hour: number, minute: number): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

function formatTimeLabel(hour: number, minute: number): string {
  const d = buildTimeDate(hour, minute);
  const tag =
    Localization.getLocales()[0]?.languageTag ??
    Localization.getLocales()[0]?.languageCode ??
    "en-US";
  return d.toLocaleTimeString(tag, { hour: "numeric", minute: "2-digit" });
}

function getNextReminderLabel(
  hour: number,
  minute: number,
  todayKey: string,
  tomorrowKey: string,
  timeLabel: string,
): string {
  const now = new Date();
  const target = buildTimeDate(hour, minute);
  const isToday = now < target;
  return (isToday ? todayKey : tomorrowKey).replace("{{time}}", timeLabel);
}

interface ProfileReminderSectionProps {
  showDescription?: boolean;
}

export function ProfileReminderSection({
  showDescription = true,
}: ProfileReminderSectionProps) {
  const { t } = useTranslation();
  const showToast = useUIStore((s) => s.showToast);
  const reminderEnabled = useReminderStore((s) => s.reminderEnabled);
  const reminderHour = useReminderStore((s) => s.reminderHour);
  const reminderMinute = useReminderStore((s) => s.reminderMinute);
  const enableReminder = useReminderStore((s) => s.enableReminder);
  const disableReminder = useReminderStore((s) => s.disableReminder);
  const setReminderTime = useReminderStore((s) => s.setReminderTime);

  const [iosPickerOpen, setIosPickerOpen] = useState(false);
  const [iosDraft, setIosDraft] = useState(() =>
    buildTimeDate(reminderHour, reminderMinute),
  );
  const [androidPickerOpen, setAndroidPickerOpen] = useState(false);

  useEffect(() => {
    if (iosPickerOpen) {
      setIosDraft(buildTimeDate(reminderHour, reminderMinute));
    }
  }, [iosPickerOpen, reminderHour, reminderMinute]);

  const timeLabel = useMemo(
    () => formatTimeLabel(reminderHour, reminderMinute),
    [reminderHour, reminderMinute],
  );

  const pickerValue = useMemo(
    () => buildTimeDate(reminderHour, reminderMinute),
    [reminderHour, reminderMinute],
  );

  const nextReminderLabel = useMemo(
    () =>
      getNextReminderLabel(
        reminderHour,
        reminderMinute,
        t("profile.reminderNextToday"),
        t("profile.reminderNextTomorrow"),
        timeLabel,
      ),
    [reminderHour, reminderMinute, timeLabel, t],
  );

  if (Platform.OS === "web") {
    return null;
  }

  const handleToggle = async (value: boolean) => {
    if (value) {
      const ok = await enableReminder();
      if (!ok) {
        showToast(t("profile.reminderNotificationToast"), "info");
      }
      return;
    }
    await disableReminder();
  };

  const openTimePicker = () => {
    if (Platform.OS === "android") {
      setAndroidPickerOpen(true);
      return;
    }
    setIosPickerOpen(true);
  };

  const applyPickedTime = (date: Date | undefined) => {
    if (!date) return;
    setReminderTime(date.getHours(), date.getMinutes());
  };

  return (
    <View className="mb-6">
      {/* Section header */}
      <View className="mb-3 flex-row items-center gap-2">
        <Ionicons name="notifications-outline" size={15} color="rgba(255,255,255,0.5)" />
        <Text className="text-sm font-semibold uppercase tracking-widest text-white/50">
          {t("profile.reminderLabel")}
        </Text>
        {/* Status badge */}
        <View
          style={{
            marginLeft: "auto",
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: 99,
            backgroundColor: reminderEnabled
              ? "rgba(52,211,153,0.15)"
              : "rgba(255,255,255,0.06)",
            borderWidth: 1,
            borderColor: reminderEnabled
              ? "rgba(52,211,153,0.35)"
              : "rgba(255,255,255,0.10)",
          }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: reminderEnabled ? "#34d399" : "rgba(255,255,255,0.35)",
              letterSpacing: 0.4,
            }}>
            {reminderEnabled
              ? t("profile.reminderStatusActive")
              : t("profile.reminderStatusOff")}
          </Text>
        </View>
      </View>

      {/* Main card */}
      <View
        style={{
          borderRadius: 20,
          borderWidth: 1,
          borderColor: reminderEnabled
            ? "rgba(52,211,153,0.18)"
            : "rgba(255,255,255,0.10)",
          backgroundColor: reminderEnabled
            ? "rgba(2,44,34,0.35)"
            : "rgba(255,255,255,0.04)",
          overflow: "hidden",
        }}>

        {/* Toggle row */}
        <View className="flex-row items-center px-4 py-4">
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: reminderEnabled
                ? "rgba(52,211,153,0.15)"
                : "rgba(255,255,255,0.08)",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}>
            <Ionicons
              name={reminderEnabled ? "notifications" : "notifications-off-outline"}
              size={18}
              color={reminderEnabled ? "#34d399" : "rgba(255,255,255,0.45)"}
            />
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-semibold text-white">
              {t("profile.remindMeButton")}
            </Text>
            {showDescription ? (
              <Text className="mt-0.5 text-xs leading-4 text-white/45">
                {t("profile.reminderDescription")}
              </Text>
            ) : null}
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={handleToggle}
            trackColor={{
              false: "rgba(255,255,255,0.15)",
              true: "rgba(52,211,153,0.65)",
            }}
            thumbColor="#fff"
          />
        </View>

        {/* Divider + Time row (only when enabled) */}
        {reminderEnabled ? (
          <>
            <View
              style={{
                height: 1,
                backgroundColor: "rgba(52,211,153,0.12)",
                marginHorizontal: 16,
              }}
            />
            <Pressable
              onPress={openTimePicker}
              className="flex-row items-center px-4 py-4"
              style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: "rgba(245,158,11,0.12)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}>
                <Ionicons name="time-outline" size={18} color="#f59e0b" />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
                  {t("profile.reminderTimeLabel")}
                </Text>
                <Text className="mt-0.5 text-[17px] font-bold text-white">
                  {timeLabel}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 99,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.12)",
                }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.6)" }}>
                  {t("profile.reminderChangeTime")}
                </Text>
                <Ionicons name="chevron-forward" size={12} color="rgba(255,255,255,0.4)" />
              </View>
            </Pressable>
          </>
        ) : null}
      </View>

      {/* Next reminder info (below card, only when enabled) */}
      {reminderEnabled ? (
        <View className="mt-2.5 flex-row items-center gap-2 px-1">
          <Ionicons name="checkmark-circle" size={13} color="#34d399" />
          <Text className="text-xs text-white/50">{nextReminderLabel}</Text>
        </View>
      ) : null}

      {/* Android native picker */}
      {androidPickerOpen ? (
        <DateTimePicker
          value={pickerValue}
          mode="time"
          display="default"
          onChange={(event, date) => {
            setAndroidPickerOpen(false);
            if (event.type === "dismissed") return;
            applyPickedTime(date);
          }}
        />
      ) : null}

      {/* iOS sheet picker */}
      <Modal
        visible={iosPickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIosPickerOpen(false)}>
        <Pressable
          className="flex-1 justify-end bg-black/60"
          onPress={() => setIosPickerOpen(false)}>
          <Pressable
            style={{
              backgroundColor: "#111",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingBottom: 36,
              overflow: "hidden",
            }}
            onPress={(e) => e.stopPropagation()}>

            {/* Handle bar */}
            <View className="items-center pt-3 pb-1">
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "rgba(255,255,255,0.2)",
                }}
              />
            </View>

            {/* Header */}
            <View
              className="flex-row items-center justify-between px-5 py-4"
              style={{
                borderBottomWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              }}>
              <Pressable
                onPress={() => setIosPickerOpen(false)}
                hitSlop={12}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "500",
                    color: "rgba(255,255,255,0.5)",
                  }}>
                  {t("profile.reminderPickerCancel")}
                </Text>
              </Pressable>

              <View className="flex-row items-center gap-2">
                <Ionicons name="time-outline" size={16} color="#f59e0b" />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: "#fff",
                  }}>
                  {t("profile.reminderTimeLabel")}
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  setReminderTime(
                    iosDraft.getHours(),
                    iosDraft.getMinutes(),
                  ).then(() => setIosPickerOpen(false));
                }}
                hitSlop={12}
                style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
                <View
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 7,
                    borderRadius: 99,
                    backgroundColor: "#f59e0b",
                  }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: "#000",
                    }}>
                    {t("profile.reminderPickerDone")}
                  </Text>
                </View>
              </Pressable>
            </View>

            <DateTimePicker
              value={iosDraft}
              mode="time"
              display="spinner"
              themeVariant="dark"
              onChange={(_e, date) => {
                if (date) setIosDraft(date);
              }}
              style={{ marginTop: 8 }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
