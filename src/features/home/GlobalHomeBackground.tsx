import { useUserStore } from "@/appState/userStore";
import { HomeBackground } from "@/features/home/HomeBackground";
import { useHomeBackgroundPalette } from "@/features/home/useHomeBackgroundPalette";
import { updateUserProfile } from "@/services/supabase-auth";
import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";

export function GlobalHomeBackground() {
  const { palette } = useHomeBackgroundPalette();
  const profile = useUserStore((s) => s.profile);
  const lastSyncedRef = useRef<string | null>(null);
  useEffect(() => {
    const uid = profile?.user_id;
    if (!uid) {
      lastSyncedRef.current = null;
      return;
    }
    const key = palette.vibeKey;
    const token = `${uid}:${key}`;
    if (lastSyncedRef.current === token) {
      return;
    }
    lastSyncedRef.current = token;
    void updateUserProfile(uid, { home_vibe_key: key }).then(({ data }) => {
      if (data) {
        useUserStore.getState().setProfile(data);
      }
    });
  }, [profile?.user_id, palette.vibeKey]);
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <HomeBackground palette={palette} />
    </View>
  );
}
