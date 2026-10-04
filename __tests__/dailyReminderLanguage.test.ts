import i18n from "@/i18n";
import {
  ensureReminderNotificationChannel,
  setupNotificationCategories,
  syncDailyReminderSchedule,
} from "@/services/notifications/dailyReminder";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

jest.mock("expo-device", () => ({ isDevice: true }));
jest.mock("expo-notifications", () => ({
  setNotificationCategoryAsync: jest.fn().mockResolvedValue(undefined),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  getPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue("localized-reminder"),
  SchedulableTriggerInputTypes: { DAILY: "daily" },
  AndroidImportance: { HIGH: 4 },
}));

const originalOS = Platform.OS;

afterEach(async () => {
  Platform.OS = originalOS;
  await i18n.changeLanguage("en");
  jest.clearAllMocks();
});

it("replaces an existing reminder with Vietnamese content and an iOS action", async () => {
  Platform.OS = "ios";
  await i18n.changeLanguage("vi");
  const patch = await syncDailyReminderSchedule({
    reminderEnabled: true,
    reminderHour: 9,
    reminderMinute: 30,
    scheduledNotificationId: "old-english-reminder",
  });
  expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith("old-english-reminder");
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({
    content: expect.objectContaining({
      title: i18n.t("profile.reminderNotifTitle"),
      subtitle: i18n.t("profile.reminderNotifSubtitle"),
      body: i18n.t("profile.reminderNotifBody"),
    }),
    trigger: expect.objectContaining({ hour: 9, minute: 30 }),
  }));
  expect(Notifications.setNotificationCategoryAsync).toHaveBeenCalledWith("daily-reminder", [
    expect.objectContaining({ buttonTitle: "Mở Inkly" }),
  ]);
  expect(patch.scheduledNotificationId).toBe("localized-reminder");
});

it("uses the current language for Android channel details", async () => {
  Platform.OS = "android";
  await i18n.changeLanguage("vi");
  await ensureReminderNotificationChannel();
  expect(Notifications.setNotificationChannelAsync).toHaveBeenLastCalledWith("daily-quote-reminder", expect.objectContaining({
    name: "Nhắc nhở hàng ngày",
    description: i18n.t("profile.reminderChannelDescription"),
  }));
  await i18n.changeLanguage("en");
  await ensureReminderNotificationChannel();
  expect(Notifications.setNotificationChannelAsync).toHaveBeenLastCalledWith("daily-quote-reminder", expect.objectContaining({ name: "Daily reminder" }));
});

it("does not schedule a disabled reminder", async () => {
  Platform.OS = "ios";
  await setupNotificationCategories();
  const patch = await syncDailyReminderSchedule({
    reminderEnabled: false,
    reminderHour: 9,
    reminderMinute: 0,
    scheduledNotificationId: "old-reminder",
  });
  expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith("old-reminder");
  expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  expect(patch.scheduledNotificationId).toBeNull();
});
