import {
  REMINDER_CHANNEL_ID,
  REMINDER_NOTIFICATION_BODY,
  REMINDER_NOTIFICATION_TITLE,
} from "@/services/notifications/constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export type ReminderSyncState = {
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  scheduledNotificationId: string | null;
};

export type ReminderSyncPatch = {
  scheduledNotificationId: string | null;
  reminderEnabled?: boolean;
};

export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureReminderNotificationChannel(): Promise<void> {
  if (Platform.OS === "web" || Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: "Daily reminder",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function requestPermissionsForReminder(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
  return requested.granted;
}

export async function syncDailyReminderSchedule(
  state: ReminderSyncState,
): Promise<ReminderSyncPatch> {
  if (Platform.OS === "web") {
    return { scheduledNotificationId: null };
  }

  if (state.scheduledNotificationId) {
    await Notifications.cancelScheduledNotificationAsync(
      state.scheduledNotificationId,
    );
  }

  if (!state.reminderEnabled) {
    return { scheduledNotificationId: null };
  }

  await ensureReminderNotificationChannel();

  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) {
    return { scheduledNotificationId: null, reminderEnabled: false };
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: REMINDER_NOTIFICATION_TITLE,
      body: REMINDER_NOTIFICATION_BODY,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: state.reminderHour,
      minute: state.reminderMinute,
      channelId: REMINDER_CHANNEL_ID,
    },
  });

  return { scheduledNotificationId: id };
}
