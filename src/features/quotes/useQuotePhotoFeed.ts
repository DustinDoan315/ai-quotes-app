import { useCallback, useEffect, useState } from "react";
import { useUserStore } from "@/appState/userStore";
import {
  listQuotePhotoCards,
  type QuotePhotoCard,
} from "@/services/media/userPhotosApi";

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
      const data = await listQuotePhotoCards({ userId, guestId, limit: 60 });
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
      const data = await listQuotePhotoCards({ userId, guestId, limit: 60 });
      setItems(data);
    } catch {}
  }, [profile, ensureGuestId]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, isLoading, isRefreshing, refresh, refreshSilently };
};

