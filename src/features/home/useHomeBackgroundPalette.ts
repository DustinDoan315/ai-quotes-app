import { useHomeBackgroundStore } from "@/appState/homeBackgroundStore";
import { useUserStore } from "@/appState/userStore";
import { strings } from "@/theme/strings";
import {
  HOME_BACKGROUNDS,
  getHomeBackgroundPaletteByKey,
} from "@/theme/homeBackgrounds";
import type {
  HomeBackgroundPalette,
  HomeVibeHintParts,
} from "@/types/homeBackground";
import { getDailyHomeBackground } from "@/utils/homeBackgroundRoll";
import { useUserStoreHydrated } from "@/utils/useUserStoreHydrated";
import { useEffect, useMemo } from "react";

let lastHomeBackgroundLogKey = "";

export function useHomeBackgroundPalette(): {
  palette: HomeBackgroundPalette;
  vibeHint: HomeVibeHintParts | null;
} {
  const profile = useUserStore((s) => s.profile);
  const authState = useUserStore((s) => s.authState);
  const guestId = useUserStore((s) => s.guestId);
  const ensureGuestId = useUserStore((s) => s.ensureGuestId);
  const userStoreHydrated = useUserStoreHydrated();
  const devBgIndex = useHomeBackgroundStore((s) => s.devBgIndex);
  const today = new Date().toISOString().split("T")[0];
  const identityKey = useMemo(() => {
    if (profile?.user_id) {
      return profile.user_id;
    }
    if (authState === "authenticated") {
      return null;
    }
    if (!userStoreHydrated) {
      return null;
    }
    return guestId ?? ensureGuestId();
  }, [
    profile?.user_id,
    authState,
    guestId,
    ensureGuestId,
    userStoreHydrated,
  ]);
  const dailyBackground = useMemo(() => {
    if (identityKey == null) {
      return {
        palette: HOME_BACKGROUNDS[0],
        luckPercent: 0,
      };
    }
    return getDailyHomeBackground(identityKey, today);
  }, [identityKey, today]);
  const effectiveDaily = useMemo(() => {
    const rawKey = profile?.home_vibe_key;
    const serverKey =
      profile?.user_id &&
      rawKey != null &&
      String(rawKey).trim() !== ""
        ? String(rawKey).trim()
        : null;
    if (serverKey) {
      return {
        palette: getHomeBackgroundPaletteByKey(serverKey),
        luckPercent: dailyBackground.luckPercent,
      };
    }
    if (__DEV__ && devBgIndex != null) {
      const palette = HOME_BACKGROUNDS[devBgIndex];
      return {
        palette,
        luckPercent: 50 + (devBgIndex % 7),
      };
    }
    return dailyBackground;
  }, [
    profile?.user_id,
    profile?.home_vibe_key,
    devBgIndex,
    dailyBackground,
  ]);
  const vibeHint = useMemo(() => {
    if (identityKey == null && !(__DEV__ && devBgIndex != null)) {
      return null;
    }
    const { palette, luckPercent } = effectiveDaily;
    return {
      vibeName: strings.home.vibes[palette.vibeKey],
      rarityLabel: strings.home.vibeRarity[palette.rarity],
      rarity: palette.rarity,
      luckPercent,
    };
  }, [identityKey, effectiveDaily, devBgIndex]);
  useEffect(() => {
    if (!__DEV__) {
      return;
    }
    const p = effectiveDaily.palette;
    const hasServerKey = Boolean(
      profile?.user_id &&
        profile?.home_vibe_key != null &&
        String(profile.home_vibe_key).trim() !== "",
    );
    let source = "daily_roll";
    if (hasServerKey) {
      source = "user_profiles.home_vibe_key";
    } else if (devBgIndex != null) {
      source = "dev_override";
    }
    const dedupeKey = `${source}:${p.vibeKey}:${p.colors.join(",")}`;
    if (lastHomeBackgroundLogKey === dedupeKey) {
      return;
    }
    lastHomeBackgroundLogKey = dedupeKey;
    console.log("[home background]", source, {
      vibeKey: p.vibeKey,
      rarity: p.rarity,
      colors: [...p.colors],
      storedHomeVibeKey: profile?.home_vibe_key ?? null,
      devBgIndex: devBgIndex ?? null,
    });
  }, [
    effectiveDaily.palette,
    devBgIndex,
    profile?.user_id,
    profile?.home_vibe_key,
  ]);
  return {
    palette: effectiveDaily.palette,
    vibeHint,
  };
}
