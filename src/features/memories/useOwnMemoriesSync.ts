import { useCallback, useEffect, useRef, useState } from "react";

import { useMemoryStore, useUserStore } from "@/appState";
import { loadOwnMemories } from "@/domain/memories/loadOwnMemories";
import { mergeMemories } from "@/domain/memories/mergeMemories";

/** Memories routes must sync independently of whether Home has mounted. */
export function useOwnMemoriesSync() {
  const profileId = useUserStore((state) => state.profile?.user_id);
  const authUserId = useUserStore((state) => state.authUserId);
  const guestId = useUserStore((state) => state.guestId);
  const hasHydrated = useMemoryStore((state) => state._hasHydrated);
  const userId = profileId ?? authUserId;
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const generation = useRef(0);
  const currentOwner = useRef({ userId, guestId });
  currentOwner.current = { userId, guestId };

  const refresh = useCallback(async () => {
    const request = ++generation.current;
    if (!hasHydrated || (!userId && !guestId)) {
      setIsLoading(false);
      setHasError(false);
      return;
    }
    const isCurrent = () => generation.current === request
      && currentOwner.current.userId === userId
      && currentOwner.current.guestId === guestId;
    setIsLoading(true);
    setHasError(false);
    try {
      const cloud = await loadOwnMemories({ userId, guestId });
      if (!isCurrent() || !useMemoryStore.getState()._hasHydrated) return;
      const latest = useMemoryStore.getState();
      latest.replaceMemories(mergeMemories(cloud, latest.memories));
    } catch {
      if (isCurrent()) setHasError(true);
    } finally {
      if (isCurrent()) setIsLoading(false);
    }
  }, [guestId, hasHydrated, userId]);

  useEffect(() => {
    void refresh();
    return () => { generation.current += 1; };
  }, [refresh]);

  return { isLoading, hasError, refresh };
}
