import { useHomeBackgroundStore } from "@/appState/homeBackgroundStore";
import { useUserStore } from "@/appState/userStore";
import { strings } from "@/theme/strings";
import { HOME_BACKGROUNDS } from "@/theme/homeBackgrounds";
import type {
  HomeBackgroundPalette,
  HomeVibeHintParts,
} from "@/types/homeBackground";
import { getDailyHomeBackground } from "@/utils/homeBackgroundRoll";
import { useUserStoreHydrated } from "@/utils/useUserStoreHydrated";
import { useMemo } from "react";

export function useHomeBackgroundPalette(): {
  palette: HomeBackgroundPalette;
  vibeHint: HomeVibeHintParts | null;
} {
  const profile = useUserStore((s) => s.profile);
  const guestId = useUserStore((s) => s.guestId);
  const ensureGuestId = useUserStore((s) => s.ensureGuestId);
  const userStoreHydrated = useUserStoreHydrated();
  const devBgIndex = useHomeBackgroundStore((s) => s.devBgIndex);
  const today = new Date().toISOString().split("T")[0];
  const identityKey = useMemo(() => {
    if (profile?.user_id) {
      return profile.user_id;
    }
    if (!userStoreHydrated) {
      return null;
    }
    return guestId ?? ensureGuestId();
  }, [profile?.user_id, guestId, ensureGuestId, userStoreHydrated]);
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
    if (__DEV__ && devBgIndex != null) {
      const palette = HOME_BACKGROUNDS[devBgIndex];
      return {
        palette,
        luckPercent: 50 + (devBgIndex % 7),
      };
    }
    return dailyBackground;
  }, [devBgIndex, dailyBackground]);
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
  return {
    palette: effectiveDaily.palette,
    vibeHint,
  };
}
