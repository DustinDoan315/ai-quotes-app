import { useReminderStore } from "@/appState/reminderStore";
import { useSubscriptionStore } from "@/appState/subscriptionStore";
import { syncUserProfile } from "@/features/auth/authService";
import { supabase } from "@/config/supabase";
import {
  configureNotificationHandler,
  ensureReminderNotificationChannel,
  syncDailyReminderSchedule,
} from "@/services/notifications/dailyReminder";
import { initPostHog } from "@/services/analytics/posthog";
import { initSentry } from "@/services/analytics/sentry";
import {
  initializeRevenueCat,
  isRevenueCatInitialized,
} from "@/services/paywall/nativeRevenueCat";
import { useEffect } from "react";

function syncReminderOnBoot(): (() => void) | undefined {
  configureNotificationHandler();
  void ensureReminderNotificationChannel();

  const applyReminderSync = () => {
    const snapshot = useReminderStore.getState();
    void syncDailyReminderSchedule(snapshot).then((patch) => {
      useReminderStore.setState(patch);
    });
  };

  if (useReminderStore.persist.hasHydrated()) {
    applyReminderSync();
    return undefined;
  }

  return useReminderStore.persist.onFinishHydration(() => {
    applyReminderSync();
  });
}

async function bootstrapRevenueCat(): Promise<void> {
  await initializeRevenueCat();
  if (isRevenueCatInitialized()) {
    await useSubscriptionStore.getState().initSubscription();
  }
}

async function bootstrapAuth(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    await syncUserProfile(session.user);
    return;
  }

  const { signInAnonymously } = await import("@/services/supabase-auth");
  const { user, error } = await signInAnonymously();
  if (!error && user) {
    await syncUserProfile(user);
  }
}

function bootstrapTelemetry(): void {
  if (process.env.EXPO_PUBLIC_POSTHOG_API_KEY) {
    initPostHog(
      process.env.EXPO_PUBLIC_POSTHOG_API_KEY,
      process.env.EXPO_PUBLIC_POSTHOG_HOST,
    );
  }

  if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
    initSentry(process.env.EXPO_PUBLIC_SENTRY_DSN);
  }
}

export function useAppBootstrap(): void {
  useEffect(() => {
    const unsubscribeReminderHydration = syncReminderOnBoot();
    bootstrapTelemetry();

    void bootstrapRevenueCat().catch((error: unknown) => {
      console.error("Failed to initialize RevenueCat:", error);
    });

    void bootstrapAuth().catch((error: unknown) => {
      console.error("Failed to bootstrap auth:", error);
    });

    return () => {
      unsubscribeReminderHydration?.();
    };
  }, []);
}
