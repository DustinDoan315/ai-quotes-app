import { useReminderStore } from "@/appState/reminderStore";
import { initializeRevenueCat, isRevenueCatInitialized } from "../services/revenuecat";
import { useSubscriptionStore } from "@/appState/subscriptionStore";
import {
  configureNotificationHandler,
  ensureReminderNotificationChannel,
  syncDailyReminderSchedule,
} from "@/services/notifications/dailyReminder";
import { ToastHost } from '@/components/ToastHost';
import { GlobalHomeBackground } from '@/features/home/GlobalHomeBackground';
import { initPostHog } from '@/services/analytics/posthog';
import { initSentry } from '@/services/analytics/sentry';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from '@/config/supabase';
import { syncUserProfile } from '@/features/auth/authService';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import '../global.css';

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "transparent",
    card: "transparent",
  },
};


export default function RootLayout() {
  useEffect(() => {
    configureNotificationHandler();
    void ensureReminderNotificationChannel();
    const applyReminderSync = () => {
      const snapshot = useReminderStore.getState();
      void syncDailyReminderSchedule(snapshot).then((patch) => {
        useReminderStore.setState(patch);
      });
    };
    let unsubHydration: (() => void) | undefined;
    if (useReminderStore.persist.hasHydrated()) {
      applyReminderSync();
    } else {
      unsubHydration = useReminderStore.persist.onFinishHydration(() => {
        applyReminderSync();
      });
    }

    initializeRevenueCat()
      .then(() => {
        if (isRevenueCatInitialized()) {
          return useSubscriptionStore.getState().initSubscription();
        }
        return undefined;
      })
      .catch((error: unknown) => {
        console.error("Failed to initialize RevenueCat:", error);
      });

    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (session) {
          syncUserProfile(session.user);
          return;
        }
        const { signInAnonymously } = await import("@/services/supabase-auth");
        const { user, error } = await signInAnonymously();
        if (!error && user) {
          syncUserProfile(user);
        }
      })
      .catch((error) => {
        console.error("Failed to get Supabase session:", error);
      });

    if (process.env.EXPO_PUBLIC_POSTHOG_API_KEY) {
      initPostHog(
        process.env.EXPO_PUBLIC_POSTHOG_API_KEY,
        process.env.EXPO_PUBLIC_POSTHOG_HOST,
      );
    }

    if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
      initSentry(process.env.EXPO_PUBLIC_SENTRY_DSN);
    }

    return () => {
      unsubHydration?.();
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider value={navTheme}>
          <View style={styles.root}>
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFillObject, styles.bgLayer]}>
              <GlobalHomeBackground />
            </View>
            <View style={styles.stackLayer}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: "transparent" },
                }}
              />
            </View>
            <ToastHost />
          </View>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bgLayer: { zIndex: 0 },
  stackLayer: {
    flex: 1,
    zIndex: 1,
    backgroundColor: "transparent",
  },
});
