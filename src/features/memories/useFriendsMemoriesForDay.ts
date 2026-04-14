import { useCallback, useEffect, useState } from "react";

import { useUserStore } from "@/appState";
import type { QuotePhotoCard } from "@/services/media/userPhotosApi";
import { listMyFriends } from "@/services/inviteApi";
import { listQuotePhotoCardsForDay } from "@/services/media/userPhotosApi";

type FriendsDayState = {
  cards: QuotePhotoCard[];
  isLoading: boolean;
  hasError: boolean;
  refresh: () => Promise<void>;
};

export function useFriendsMemoriesForDay(dateKey: string): FriendsDayState {
  const profile = useUserStore((s) => s.profile);
  const [cards, setCards] = useState<QuotePhotoCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const load = useCallback(async () => {
    const userId = profile?.user_id ?? null;
    if (!userId) {
      setCards([]);
      return;
    }

    setIsLoading(true);
    setHasError(false);
    try {
      const friends = await listMyFriends(userId);
      const friendIds = friends.map((f) => f.friend_id);
      const feedUserIds = friendIds;

      const data = await listQuotePhotoCardsForDay({
        dateKey,
        feedUserIds,
        limit: 60,
      });

      setCards(data);
    } catch (err) {
      console.error("[useFriendsMemoriesForDay] failed to load:", err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [dateKey, profile?.user_id]);

  useEffect(() => {
    void load();
  }, [load]);

  return { cards, isLoading, hasError, refresh: load };
}

