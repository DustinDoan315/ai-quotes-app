import { initializeRevenueCat } from '../services/revenuecat';
import { Stack } from 'expo-router';
import { supabase } from '../config/supabase';
import { useEffect } from 'react';

export default function RootLayout() {
  useEffect(() => {
    initializeRevenueCat().catch((error) => {
      console.error("Failed to initialize RevenueCat:", error);
    });

    supabase.auth.getSession().catch((error) => {
      console.error("Failed to get Supabase session:", error);
    });
  }, []);

  return <Stack />;
}
