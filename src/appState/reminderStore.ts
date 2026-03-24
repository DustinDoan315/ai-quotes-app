import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  requestPermissionsForReminder,
  syncDailyReminderSchedule,
} from "@/services/notifications/dailyReminder";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type ReminderState = {
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  scheduledNotificationId: string | null;
  enableReminder: () => Promise<boolean>;
  disableReminder: () => Promise<void>;
  setReminderTime: (hour: number, minute: number) => Promise<void>;
};

const initial: Pick<
  ReminderState,
  | "reminderEnabled"
  | "reminderHour"
  | "reminderMinute"
  | "scheduledNotificationId"
> = {
  reminderEnabled: false,
  reminderHour: 9,
  reminderMinute: 0,
  scheduledNotificationId: null,
};

export const useReminderStore = create<ReminderState>()(
  persist(
    (set, get) => ({
      ...initial,
      enableReminder: async () => {
        const granted = await requestPermissionsForReminder();
        if (!granted) return false;
        set({ reminderEnabled: true });
        const patch = await syncDailyReminderSchedule({
          ...get(),
          reminderEnabled: true,
        });
        set(patch);
        return true;
      },
      disableReminder: async () => {
        set({ reminderEnabled: false });
        const patch = await syncDailyReminderSchedule({
          ...get(),
          reminderEnabled: false,
        });
        set(patch);
      },
      setReminderTime: async (hour, minute) => {
        const h = Math.min(23, Math.max(0, hour));
        const m = Math.min(59, Math.max(0, minute));
        set({ reminderHour: h, reminderMinute: m });
        const patch = await syncDailyReminderSchedule(get());
        set(patch);
      },
    }),
    {
      name: "reminder-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        reminderEnabled: state.reminderEnabled,
        reminderHour: state.reminderHour,
        reminderMinute: state.reminderMinute,
        scheduledNotificationId: state.scheduledNotificationId,
      }),
    },
  ),
);
