import { useSubscriptionConfigStore } from "@/appState/subscriptionConfigStore";
import { useBootstrapStore } from "@/appState/bootstrapStore";
import { useReminderStore } from "@/appState/reminderStore";
import { useSubscriptionStore } from "@/appState/subscriptionStore";
import { useUserStore } from "@/appState/userStore";
import i18n from "@/i18n";
import { syncUserProfile } from "@/features/auth/authService";
import {
  configureNotificationHandler,
  ensureReminderNotificationChannel,
  setupNotificationCategories,
  syncDailyReminderSchedule,
} from "@/services/notifications/dailyReminder";
import { initPostHog } from "@/services/analytics/posthog";
import { initSentry } from "@/services/analytics/sentry";
import { getSessionSafely } from "@/services/supabase-auth";
import {
  initializeRevenueCat,
  isRevenueCatInitialized,
} from "@/services/paywall/nativeRevenueCat";
import { revenuecatClient } from "@/services/paywall/revenuecatClient";
import { checkSupabaseReachable } from "@/config/supabase";
import { useEffect } from "react";

export const AUTH_UNAVAILABLE_MESSAGE =
  "Inkly can't connect to its service right now. Check your connection and try again.";

function syncUiLanguageOnBoot(): (() => void) | undefined {
  const applyLanguageSync = () => {
    const { uiLanguage } = useUserStore.getState();
    if (uiLanguage && i18n.language !== uiLanguage) {
      void i18n.changeLanguage(uiLanguage);
    }
  };

  if (useUserStore.persist.hasHydrated()) {
    applyLanguageSync();
    return undefined;
  }

  return useUserStore.persist.onFinishHydration(() => {
    applyLanguageSync();
  });
}

function syncReminderOnBoot(): (() => void) | undefined {
  configureNotificationHandler();
  void setupNotificationCategories();
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
    const { session } = await getSessionSafely();
    if (session?.user && !session.user.is_anonymous) {
      await revenuecatClient.logIn(session.user.id);
    }
    await useSubscriptionStore.getState().initSubscription();
  }
}

async function waitForUserStoreHydration(): Promise<void> {
  if (useUserStore.persist.hasHydrated()) return;
  await new Promise<void>((resolve) => {
    const unsubscribe = useUserStore.persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
  });
}

async function bootstrapAuth(): Promise<void> {
  await waitForUserStoreHydration();
  const { session, error: sessionError } = await getSessionSafely();
  if (sessionError) {
    throw sessionError;
  }

  if (session) {
    await syncUserProfile(session.user);
    return;
  }

  const { signInAnonymously } = await import("@/services/supabase-auth");
  const { user, session: anonymousSession, error } = await signInAnonymously();
  if (error || !user || !anonymousSession) {
    throw error ?? new Error("Anonymous Supabase session was not created");
  }

  await syncUserProfile(user);
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
  const authRetryCount = useBootstrapStore((state) => state.authRetryCount);

  useEffect(() => {
    const unsubscribeLanguageHydration = syncUiLanguageOnBoot();
    const unsubscribeReminderHydration = syncReminderOnBoot();
    bootstrapTelemetry();
    const { setConfigReady } = useBootstrapStore.getState();

    checkSupabaseReachable();

    void useSubscriptionConfigStore
      .getState()
      .loadPlanLimits()
      .catch((error: unknown) => {
        console.error("Failed to load subscription plan settings:", error);
      })
      .finally(() => {
        setConfigReady(true);
      });

    // Auth and RevenueCat are independent startup tasks. Auth must not wait
    // on the store SDK, otherwise the first route can render without a
    // Supabase session while RevenueCat is still contacting Apple.
    void bootstrapRevenueCat().catch((error: unknown) => {
      console.error("Failed to initialize RevenueCat:", error);
    });

    return () => {
      unsubscribeLanguageHydration?.();
      unsubscribeReminderHydration?.();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const { setAuthReady, setAuthError, setAuthRetrying } =
      useBootstrapStore.getState();

    setAuthReady(false);
    setAuthError(null);
    setAuthRetrying(true);

    // A missing anonymous session is a service outage for the core guest
    // flow. Keep the app in a retryable state instead of rendering a home
    // screen that will fail later with "No active session".
    void bootstrapAuth()
      .catch((error: unknown) => {
        console.error("Failed to bootstrap auth:", error);
        if (!cancelled) setAuthError(AUTH_UNAVAILABLE_MESSAGE);
      })
      .finally(() => {
        if (cancelled) return;
        setAuthReady(true);
        setAuthRetrying(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authRetryCount]);
}
