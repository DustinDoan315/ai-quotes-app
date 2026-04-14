import {
  REMINDER_CATEGORY_ID,
  REMINDER_CHANNEL_ID,
  REMINDER_NOTIFICATION_BODY,
  REMINDER_NOTIFICATION_SUBTITLE,
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

/**
 * Sets how notifications are displayed when the app is in the foreground.
 * On iOS this also controls whether the banner/sound appear while the app is open.
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      // iOS: show alert, play sound, and show the notification in Notification Center
      ...(Platform.OS === "ios"
        ? { presentationOptions: ["banner", "sound", "list"] as const }
        : {}),
    }),
  });
}

/**
 * iOS only: registers a notification category that adds an "Open Inkly" action
 * button directly on the lock-screen / notification banner.
 */
export async function setupNotificationCategories(): Promise<void> {
  if (Platform.OS !== "ios") return;
  await Notifications.setNotificationCategoryAsync(REMINDER_CATEGORY_ID, [
    {
      identifier: "open",
      buttonTitle: "Open Inkly",
      options: { opensAppToForeground: true },
    },
  ]);
}

/**
 * Android only: creates / updates the notification channel used for reminders.
 */
export async function ensureReminderNotificationChannel(): Promise<void> {
  if (Platform.OS === "web" || Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: "Daily reminder",
    description: "Your personalized daily quote reminder from Inkly.",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 150, 250],
    lightColor: "#F59E0B",
    sound: "default",
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
      allowAnnouncements: true,
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
      // subtitle is iOS-only — shows between title and body in the notification
      ...(Platform.OS === "ios"
        ? { subtitle: REMINDER_NOTIFICATION_SUBTITLE }
        : {}),
      body: REMINDER_NOTIFICATION_BODY,
      sound: true,
      // iOS: attach the category so the "Open Inkly" action button appears
      ...(Platform.OS === "ios"
        ? { categoryIdentifier: REMINDER_CATEGORY_ID }
        : {}),
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
