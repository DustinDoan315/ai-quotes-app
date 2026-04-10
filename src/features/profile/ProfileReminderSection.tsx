import { useReminderStore } from "@/appState/reminderStore";
import { useUIStore } from "@/appState/uiStore";
import DateTimePicker from "@react-native-community/datetimepicker";
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

function formatReminderLabel(hour: number, minute: number): string {
  const d = buildTimeDate(hour, minute);
  const tag =
    Localization.getLocales()[0]?.languageTag ??
    Localization.getLocales()[0]?.languageCode ??
    "en-US";
  return d.toLocaleTimeString(tag, { hour: "numeric", minute: "2-digit" });
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
    () => formatReminderLabel(reminderHour, reminderMinute),
    [reminderHour, reminderMinute],
  );

  const pickerValue = useMemo(
    () => buildTimeDate(reminderHour, reminderMinute),
    [reminderHour, reminderMinute],
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
      <Text className="mb-2 text-sm font-medium text-white/70">
        {t("profile.reminderLabel")}
      </Text>
      {showDescription ? (
        <Text className="mb-3 text-xs leading-5 text-white/45">
          {t("profile.reminderDescription")}
        </Text>
      ) : null}
      <View className="flex-row items-center justify-between rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5">
        <Text className="text-base text-white">{t("profile.remindMeButton")}</Text>
        <Switch
          value={reminderEnabled}
          onValueChange={handleToggle}
          trackColor={{ false: "rgba(255,255,255,0.2)", true: "rgba(255,255,255,0.45)" }}
          thumbColor={reminderEnabled ? "#fff" : "#f4f4f5"}
        />
      </View>
      <Pressable
        onPress={openTimePicker}
        disabled={!reminderEnabled}
        className={`mt-3 rounded-2xl border px-4 py-3.5 ${
          reminderEnabled ? "border-white/20 bg-white/10" : "border-white/10 bg-white/5"
        }`}
        style={({ pressed }) => ({
          opacity: reminderEnabled ? (pressed ? 0.85 : 1) : 0.5,
        })}>
        <Text className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
          {t("profile.reminderTimeLabel")}
        </Text>
        <Text className="mt-1 text-base text-white">{timeLabel}</Text>
      </Pressable>

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

      <Modal
        visible={iosPickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIosPickerOpen(false)}>
        <Pressable
          className="flex-1 justify-end bg-black/50"
          onPress={() => setIosPickerOpen(false)}>
          <Pressable
            className="rounded-t-3xl bg-neutral-900 px-4 pb-8 pt-4"
            onPress={(e) => e.stopPropagation()}>
            <View className="mb-3 flex-row justify-end">
              <Pressable
                onPress={() => {
                  setReminderTime(
                    iosDraft.getHours(),
                    iosDraft.getMinutes(),
                  ).then(() => setIosPickerOpen(false));
                }}
                className="rounded-full bg-white/15 px-4 py-2">
                <Text className="text-base font-semibold text-white">Done</Text>
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
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
