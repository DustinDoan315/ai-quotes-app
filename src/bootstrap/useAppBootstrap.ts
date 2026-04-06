import { useSubscriptionConfigStore } from "@/appState/subscriptionConfigStore";
import { useReminderStore } from "@/appState/reminderStore";
import { useSubscriptionStore } from "@/appState/subscriptionStore";
import { syncUserProfile } from "@/features/auth/authService";
import { supabase } from "@/config/supabase";
import {
  completeSupabaseAuthRedirectFromInitialUrl,
  completeSupabaseAuthRedirectFromUrl,
} from "@/services/supabaseAuthRedirect";
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
import * as Linking from "expo-linking";

async function syncAuthenticatedSession(): Promise<boolean> {
  const redirectedSession = await completeSupabaseAuthRedirectFromInitialUrl();
  if (redirectedSession?.user) {
    await syncUserProfile(redirectedSession.user);
    return true;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) {
    await syncUserProfile(session.user);
    return true;
  }

  return false;
}

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
  const hasAuthenticatedSession = await syncAuthenticatedSession();
  if (hasAuthenticatedSession) {
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
    const authRedirectSubscription = Linking.addEventListener("url", ({ url }) => {
      void completeSupabaseAuthRedirectFromUrl(url)
        .then((session) => {
          if (session?.user) {
            return syncUserProfile(session.user);
          }
          return undefined;
        })
        .catch((error: unknown) => {
          console.error("Failed to complete Supabase auth redirect:", error);
        });
    });

    bootstrapTelemetry();

    void useSubscriptionConfigStore
      .getState()
      .loadPlanLimits()
      .catch((error: unknown) => {
        console.error("Failed to load subscription plan settings:", error);
      });

    void bootstrapRevenueCat().catch((error: unknown) => {
      console.error("Failed to initialize RevenueCat:", error);
    });

    void bootstrapAuth().catch((error: unknown) => {
      console.error("Failed to bootstrap auth:", error);
    });

    return () => {
      unsubscribeReminderHydration?.();
      authRedirectSubscription.remove();
    };
  }, []);
}
