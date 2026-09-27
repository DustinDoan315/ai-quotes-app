import { AppState } from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserStore } from "@/appState/userStore";
import { useUIStore } from "@/appState/uiStore";
import { listMyFriends } from "@/services/inviteApi";
import {
  listQuotePhotoCards,
  refreshQuotePhotoCardUrls,
  SIGNED_URL_REFRESH_INTERVAL_MS,
  type QuotePhotoCard,
} from "@/services/media/userPhotosApi";
import { supabase } from "@/config/supabase";

type QuotePhotoFeedState = {
  items: QuotePhotoCard[];
  isLoading: boolean;
  isRefreshing: boolean;
  hasError: boolean;
  refresh: () => Promise<void>;
  refreshSilently: () => Promise<void>;
};

async function fetchFeedData(
  profile: { user_id: string } | null,
  guestId: string | null,
): Promise<QuotePhotoCard[]> {
  const userId = profile?.user_id ?? null;
  if (userId) {
    const friends = await listMyFriends(userId);
    const friendIds = friends.map((f) => f.friend_id);
    return listQuotePhotoCards({ feedUserIds: [userId, ...friendIds], limit: 60 });
  }
  const { data: { session } } = await supabase.auth.getSession();
  const anonUserId = session?.user?.id ?? null;
  if (anonUserId) {
    return listQuotePhotoCards({ feedUserIds: [anonUserId], limit: 60 });
  }
  return listQuotePhotoCards({ guestId, limit: 60 });
}

export const useQuotePhotoFeed = (): QuotePhotoFeedState => {
  const { profile, ensureGuestId } = useUserStore();
  const showToast = useUIStore((s) => s.showToast);
  const { t } = useTranslation();
  const [items, setItems] = useState<QuotePhotoCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const itemsRef = useRef<QuotePhotoCard[]>([]);
  const nextUrlRefreshAtRef = useRef(0);
  const isRefreshingUrlsRef = useRef(false);

  const setCurrentItems = useCallback((next: QuotePhotoCard[]) => {
    itemsRef.current = next;
    setItems(next);
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
        (result.complete ? SIGNED_URL_REFRESH_INTERVAL_MS : 60_000);
    } catch (error) {
      console.error("[useQuotePhotoFeed] signed URL refresh failed:", error);
      nextUrlRefreshAtRef.current = Date.now() + 60_000;
    } finally {
      isRefreshingUrlsRef.current = false;
    }
  }, [setCurrentItems]);

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setIsLoading(true);
    setHasError(false);
    try {
      const guestId = profile?.user_id ? null : ensureGuestId();
      const data = await fetchFeedData(profile, guestId);
      setCurrentItems(data);
      nextUrlRefreshAtRef.current = Date.now() + SIGNED_URL_REFRESH_INTERVAL_MS;
    } catch (err) {
      console.error("[useQuotePhotoFeed] load failed:", err);
      setHasError(true);
      if (isRefresh) {
        showToast(t("home.feedRefreshError"), "error");
      }
    } finally {
      if (!isRefresh) setIsLoading(false);
    }
  }, [profile, ensureGuestId, setCurrentItems, showToast, t]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await load(true);
    } finally {
      setIsRefreshing(false);
    }
  }, [load]);

  const refreshSilently = useCallback(async () => {
    try {
      const guestId = profile?.user_id ? null : ensureGuestId();
      const data = await fetchFeedData(profile, guestId);
      setCurrentItems(data);
      nextUrlRefreshAtRef.current = Date.now() + SIGNED_URL_REFRESH_INTERVAL_MS;
    } catch (err) {
      console.error("[useQuotePhotoFeed] refreshSilently failed:", err);
    }
  }, [profile, ensureGuestId, setCurrentItems]);

  useEffect(() => {
    void load();
  }, [load]);

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

  return { items, isLoading, isRefreshing, hasError, refresh, refreshSilently };
};
