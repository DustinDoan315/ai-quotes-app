import { useCallback, useEffect, useState } from "react";
import { useUserStore } from "@/appState/userStore";
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
  refresh: () => Promise<void>;
  refreshSilently: () => Promise<void>;
};

export const useQuotePhotoFeed = (): QuotePhotoFeedState => {
  const { profile, ensureGuestId } = useUserStore();
  const [items, setItems] = useState<QuotePhotoCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const userId = profile?.user_id ?? null;
      const guestId = userId ? null : ensureGuestId();
      let data: QuotePhotoCard[];
      if (userId) {
        const friends = await listMyFriends(userId);
        const friendIds = friends.map((f) => f.friend_id);
        const feedUserIds = [userId, ...friendIds];
        data = await listQuotePhotoCards({
          feedUserIds,
          limit: 60,
        });
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        const anonUserId = session?.user?.id ?? null;
        if (anonUserId) {
          data = await listQuotePhotoCards({ feedUserIds: [anonUserId], limit: 60 });
        } else {
          data = await listQuotePhotoCards({ guestId, limit: 60 });
        }
      }
      setItems(data);
    } finally {
      setIsLoading(false);
    }
  }, [profile, ensureGuestId]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await load();
    } finally {
      setIsRefreshing(false);
    }
  }, [load]);

  const refreshSilently = useCallback(async () => {
    try {
      const userId = profile?.user_id ?? null;
      const guestId = userId ? null : ensureGuestId();
      let data: QuotePhotoCard[];
      if (userId) {
        const friends = await listMyFriends(userId);
        const friendIds = friends.map((f) => f.friend_id);
        const feedUserIds = [userId, ...friendIds];
        data = await listQuotePhotoCards({ feedUserIds, limit: 60 });
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        const anonUserId = session?.user?.id ?? null;
        if (anonUserId) {
          data = await listQuotePhotoCards({ feedUserIds: [anonUserId], limit: 60 });
        } else {
          data = await listQuotePhotoCards({ guestId, limit: 60 });
        }
      }
      setItems(data);
    } catch (err) {
      console.error("[useQuotePhotoFeed] refreshSilently failed:", err);
    }
  }, [profile, ensureGuestId]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, isLoading, isRefreshing, refresh, refreshSilently };
};

