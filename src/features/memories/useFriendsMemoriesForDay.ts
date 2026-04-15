import { useCallback, useEffect, useState } from "react";

import { useUserStore } from "@/appState";
import type { QuotePhotoCard } from "@/services/media/userPhotosApi";
import { listMyFriends } from "@/services/inviteApi";
import { listQuotePhotoCardsForDay } from "@/services/media/userPhotosApi";

type FriendsDayState = {
  cards: QuotePhotoCard[];
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string | null;
  refresh: () => Promise<void>;
};

export function useFriendsMemoriesForDay(dateKey: string): FriendsDayState {
  const profile = useUserStore((s) => s.profile);
  const [cards, setCards] = useState<QuotePhotoCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const userId = profile?.user_id ?? null;
    if (!userId) {
      setCards([]);
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setErrorMessage(null);
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
      const isNetworkError =
        err instanceof TypeError &&
        (err.message.toLowerCase().includes("network") ||
          err.message.toLowerCase().includes("fetch"));
      setErrorMessage(
        isNetworkError
          ? "No internet connection. Check your connection and try again."
          : "Couldn't load friends' memories. Try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [dateKey, profile?.user_id]);

  useEffect(() => {
    void load();
  }, [load]);

  return { cards, isLoading, hasError, errorMessage, refresh: load };
}

