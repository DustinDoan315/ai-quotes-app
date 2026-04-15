import { useCallback, useEffect, useState } from "react";
import { useUserStore } from "@/appState/userStore";
import { useUIStore } from "@/appState/uiStore";
import { listMyFriends } from "@/services/inviteApi";
import {
  listQuotePhotoCards,
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
  const [items, setItems] = useState<QuotePhotoCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setIsLoading(true);
    setHasError(false);
    try {
      const guestId = profile?.user_id ? null : ensureGuestId();
      const data = await fetchFeedData(profile, guestId);
      setItems(data);
    } catch (err) {
      console.error("[useQuotePhotoFeed] load failed:", err);
      setHasError(true);
      if (isRefresh) {
        showToast("Couldn't refresh your feed. Try again.", "error");
      }
    } finally {
      if (!isRefresh) setIsLoading(false);
    }
  }, [profile, ensureGuestId, showToast]);

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
      setItems(data);
    } catch (err) {
      console.error("[useQuotePhotoFeed] refreshSilently failed:", err);
    }
  }, [profile, ensureGuestId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, isLoading, isRefreshing, hasError, refresh, refreshSilently };
};

