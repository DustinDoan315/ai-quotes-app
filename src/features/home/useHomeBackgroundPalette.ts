import { useSubscriptionStore } from "@/appState/subscriptionStore";
import { useUserStore } from "@/appState/userStore";
import { isPremiumHomeBackgroundPalette } from "@/domain/subscription/homeVibePremium";
import i18n from "@/i18n";
import {
  HOME_BACKGROUNDS,
  getHomeBackgroundPaletteByKey,
} from "@/theme/homeBackgrounds";
import { getTodayLocalDateKey } from "@/utils/dateKey";
import type {
  HomeBackgroundPalette,
  HomeVibeHintParts,
} from "@/types/homeBackground";
import {
  getDailyHomeBackground,
  getDailyHomeBackgroundWithoutPremium,
} from "@/utils/homeBackgroundRoll";
import { useUserStoreHydrated } from "@/utils/useUserStoreHydrated";
import { useEffect, useMemo } from "react";

export function useHomeBackgroundPalette(): {
  palette: HomeBackgroundPalette;
  vibeHint: HomeVibeHintParts | null;
} {
  const isPro = useSubscriptionStore((s) => s.isPro);
  const profile = useUserStore((s) => s.profile);
  const authState = useUserStore((s) => s.authState);
  const guestId = useUserStore((s) => s.guestId);
  const ensureGuestId = useUserStore((s) => s.ensureGuestId);
  const userStoreHydrated = useUserStoreHydrated();
  const today = getTodayLocalDateKey();
  useEffect(() => {
    if (!userStoreHydrated) {
      return;
    }
    if (profile?.user_id) {
      return;
    }
    if (authState === "authenticated") {
      return;
    }
    ensureGuestId();
  }, [userStoreHydrated, profile?.user_id, authState, ensureGuestId]);
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
    return guestId;
  }, [profile?.user_id, authState, guestId, userStoreHydrated]);
  const dailyBackground = useMemo(() => {
    if (identityKey == null) {
      return {
        palette: HOME_BACKGROUNDS[0],
        luckPercent: 0,
      };
    }
    if (isPro) {
      return getDailyHomeBackground(identityKey, today);
    }
    return getDailyHomeBackgroundWithoutPremium(identityKey, today);
  }, [identityKey, today, isPro]);
  const effectiveDaily = useMemo(() => {
    const rawKey = profile?.home_vibe_key;
    const serverKey =
      profile?.user_id &&
      rawKey != null &&
      String(rawKey).trim() !== ""
        ? String(rawKey).trim()
        : null;
    if (serverKey) {
      const fromServer = getHomeBackgroundPaletteByKey(serverKey);
      if (!isPro && isPremiumHomeBackgroundPalette(fromServer)) {
        return {
          palette: HOME_BACKGROUNDS[0],
          luckPercent: dailyBackground.luckPercent,
        };
      }
      return {
        palette: fromServer,
        luckPercent: dailyBackground.luckPercent,
      };
    }
    return dailyBackground;
  }, [profile?.user_id, profile?.home_vibe_key, dailyBackground, isPro]);
  const vibeHint = useMemo(() => {
    if (identityKey == null) {
      return null;
    }
    const { palette, luckPercent } = effectiveDaily;
    return {
      vibeName: i18n.t(`home.vibes.${palette.vibeKey}`),
      rarityLabel: i18n.t(`home.vibeRarity.${palette.rarity}`),
      rarity: palette.rarity,
      luckPercent,
    };
  }, [identityKey, effectiveDaily]);
  return {
    palette: effectiveDaily.palette,
    vibeHint,
  };
}
