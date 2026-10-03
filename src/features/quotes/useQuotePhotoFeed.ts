import { useFocusEffect } from "@react-navigation/native";
import { HomeFavoriteCache } from "@/domain/home/homeFavoriteCache";
import { AppState } from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserStore } from "@/appState/userStore";
import { useUIStore } from "@/appState/uiStore";
import { listMyFriends } from "@/services/inviteApi";
import {
  listQuotePhotoCards,
  refreshQuotePhotoCardUrls,
  SIGNED_URL_RETRY_INTERVAL_MS,
  SIGNED_URL_REFRESH_INTERVAL_MS,
  type QuotePhotoCard,
} from "@/services/media/userPhotosApi";
import { supabase } from "@/config/supabase";

type QuotePhotoFeedState = {
  items: QuotePhotoCard[];
  patchFavorite: (id: string, value: boolean) => void;
  setFavoritePending: (id: string, value: boolean | null) => void;
  isLoading: boolean;
  isRefreshing: boolean;
  hasError: boolean;
  refresh: () => Promise<void>;
  refreshSilently: () => Promise<void>;
};

async function fetchFeedData(
  profile: { user_id: string } | null,
  guestId: string | null,
  authUserId: string | null,
): Promise<QuotePhotoCard[]> {
  const userId = profile?.user_id ?? null;
  if (userId) {
    const friends = await listMyFriends(userId);
    const friendIds = friends.map((f) => f.friend_id);
    return listQuotePhotoCards({ feedUserIds: [userId, ...friendIds], limit: 60 });
  }
  if (authUserId) return listQuotePhotoCards({ feedUserIds: [authUserId], limit: 60 });
  const { data: { session } } = await supabase.auth.getSession();
  const anonUserId = session?.user?.id ?? null;
  if (anonUserId) {
    return listQuotePhotoCards({ feedUserIds: [anonUserId], limit: 60 });
  }
  return listQuotePhotoCards({ guestId, limit: 60 });
}

export const useQuotePhotoFeed = (): QuotePhotoFeedState => {
  const { profile, authUserId, ensureGuestId } = useUserStore();
  const showToast = useUIStore((s) => s.showToast);
  const { t } = useTranslation();
  const [items, setItems] = useState<QuotePhotoCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const favoriteOverrides = useRef(new HomeFavoriteCache());
  const loadEpoch = useRef(0);
  const loadRequest = useRef(0);
  const itemsRef = useRef<QuotePhotoCard[]>([]);
  const nextUrlRefreshAtRef = useRef(0);
  const isRefreshingUrlsRef = useRef(false);

  const setCurrentItems = useCallback((next: QuotePhotoCard[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const patchFavorite = useCallback((id: string, value: boolean) => {
    favoriteOverrides.current.patch(id, value);
    setCurrentItems(itemsRef.current.map(card => card.id === id ? { ...card, isFavorite: value } : card));
  }, [setCurrentItems]);
  const setFavoritePending = useCallback((id: string, value: boolean | null) => {
    favoriteOverrides.current.pending(id, value);
  }, []);

  const refreshSignedUrls = useCallback(async () => {
    if (isRefreshingUrlsRef.current || itemsRef.current.length === 0) return;
    isRefreshingUrlsRef.current = true;
    try {
      const requestedCards = itemsRef.current;
      const result = await refreshQuotePhotoCardUrls(requestedCards);
      const refreshedById = new Map<string, QuotePhotoCard>(
        result.cards.map((card) => [card.id, card] as const),
      );
      const currentCards = itemsRef.current;
      setCurrentItems(
        currentCards.map((card) => {
          const refreshed = refreshedById.get(card.id);
          return refreshed?.storagePath === card.storagePath
            ? { ...card, imageUrl: refreshed.imageUrl }
            : card;
        }),
      );
      nextUrlRefreshAtRef.current =
        Date.now() +
        (result.complete
          ? SIGNED_URL_REFRESH_INTERVAL_MS
          : SIGNED_URL_RETRY_INTERVAL_MS);
    } catch (error) {
      console.error("[useQuotePhotoFeed] signed URL refresh failed:", error);
      nextUrlRefreshAtRef.current = Date.now() + 60_000;
    } finally {
      isRefreshingUrlsRef.current = false;
    }
  }, [setCurrentItems]);

  const load = useCallback(async (isRefresh = false) => {
    const request = ++loadRequest.current;
    const epoch = loadEpoch.current;
    const favoriteSnapshot = favoriteOverrides.current.snapshot();
    if (!isRefresh) setIsLoading(true);
    setHasError(false);
    try {
      const guestId = profile?.user_id ? null : ensureGuestId();
      const data = await fetchFeedData(profile, guestId, authUserId);
      if (epoch !== loadEpoch.current || request !== loadRequest.current) return;
      setCurrentItems(favoriteOverrides.current.merge(data, favoriteSnapshot));
      nextUrlRefreshAtRef.current =
        Date.now() +
        (data.some((card) => !card.imageUrl)
          ? SIGNED_URL_RETRY_INTERVAL_MS
          : SIGNED_URL_REFRESH_INTERVAL_MS);
    } catch (err) {
      if (epoch !== loadEpoch.current || request !== loadRequest.current) return;
      console.error("[useQuotePhotoFeed] load failed:", err);
      setHasError(true);
      if (isRefresh) {
        showToast(t("home.feedRefreshError"), "error");
      }
    } finally {
      if (!isRefresh && epoch === loadEpoch.current) setIsLoading(false);
    }
  }, [profile, authUserId, ensureGuestId, setCurrentItems, showToast, t]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await load(true);
    } finally {
      setIsRefreshing(false);
    }
  }, [load]);

  const refreshSilently = useCallback(async () => {
    const request = ++loadRequest.current;
    const epoch = loadEpoch.current;
    const favoriteSnapshot = favoriteOverrides.current.snapshot();
    try {
      const guestId = profile?.user_id ? null : ensureGuestId();
      const data = await fetchFeedData(profile, guestId, authUserId);
      if (epoch !== loadEpoch.current || request !== loadRequest.current) return;
      setCurrentItems(favoriteOverrides.current.merge(data, favoriteSnapshot));
      nextUrlRefreshAtRef.current =
        Date.now() +
        (data.some((card) => !card.imageUrl)
          ? SIGNED_URL_RETRY_INTERVAL_MS
          : SIGNED_URL_REFRESH_INTERVAL_MS);
    } catch (err) {
      console.error("[useQuotePhotoFeed] refreshSilently failed:", err);
    }
  }, [profile, authUserId, ensureGuestId, setCurrentItems]);

  useEffect(() => {
    loadEpoch.current += 1;
    favoriteOverrides.current.clear();
    setCurrentItems([]);
    void load();
    return () => { loadEpoch.current += 1; };
  }, [load, setCurrentItems]);

  useFocusEffect(useCallback(() => { void refreshSilently(); }, [refreshSilently]));

  useEffect(() => {
    const refreshIfExpired = () => {
      if (Date.now() >= nextUrlRefreshAtRef.current) {
        void refreshSignedUrls();
      }
    };
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshIfExpired();
    });
    const interval = setInterval(refreshIfExpired, 60_000);
    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [refreshSignedUrls]);

  return { items, patchFavorite, setFavoritePending, isLoading, isRefreshing, hasError, refresh, refreshSilently };
};
