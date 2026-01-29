import { initializeRevenueCat } from '../services/revenuecat';
import { initPostHog } from '@/services/analytics/posthog';
import { initSentry } from '@/services/analytics/sentry';
import { Stack } from 'expo-router';
import { supabase } from '../config/supabase';
import { syncUserProfile } from '@/features/auth/authService';
import { useEffect } from 'react';
import '../global.css';


export default function RootLayout() {
  useEffect(() => {
    initializeRevenueCat().catch((error) => {
      console.error("Failed to initialize RevenueCat:", error);
    });

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        syncUserProfile(session?.user ?? null);
      })
      .catch((error) => {
        console.error("Failed to get Supabase session:", error);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUserProfile(session?.user ?? null);
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
      subscription.unsubscribe();
    };
  }, []);

  return <Stack />;
}
