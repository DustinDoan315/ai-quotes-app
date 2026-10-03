import {
  PHOTO_REACTION_EMOJIS,
  sendUserPhotoReaction,
  type UserPhotoReactionType,
} from "@/services/media/userPhotoReactions";
import type { QuoteVisibility } from "@/types/memory";
import { useEffect, useRef, useState } from "react";

type QuoteStackLike = {
  quotes: { id: string; userId: string | null; visibility: QuoteVisibility }[];
};

export type EmojiBurst = {
  id: string;
  emoji: string;
  x: number;
  delay: number;
  scale: number;
  driftDir: 1 | -1;
};

type UseHomeFeedStateOptions = {
  quoteStacks: QuoteStackLike[];
  userId: string | null;
  activeQuote?: QuoteStackLike["quotes"][number] | null;
};

export function canReactToQuotePhoto(
  actorUserId: string | null,
  quoteOwnerUserId: string | null,
  visibility: QuoteVisibility,
): boolean {
  return Boolean(
    actorUserId &&
      quoteOwnerUserId &&
      actorUserId !== quoteOwnerUserId &&
      visibility !== "private",
  );
}

export function useHomeFeedState(options: UseHomeFeedStateOptions) {
  const { quoteStacks, userId } = options;
  const [currentFeedIndex, setCurrentFeedIndex] = useState(0);
  const [legacyActiveQuoteId, setActiveQuoteId] = useState<string | null>(null);
  const [emojiBursts, setEmojiBursts] = useState<EmojiBurst[]>([]);
  const [legacyIsOnFeed, setIsOnFeed] = useState(false);
  const controlled = options.activeQuote !== undefined;
  const activeQuoteId = controlled ? options.activeQuote?.id ?? null : legacyActiveQuoteId;
  const isOnFeed = controlled ? Boolean(options.activeQuote) : legacyIsOnFeed;
  const activeQuote = options.activeQuote ??
    quoteStacks
      .flatMap((stack) => stack.quotes)
      .find((quote) => quote.id === activeQuoteId);
  const shouldShowReactions =
    isOnFeed &&
    Boolean(activeQuoteId) &&
    canReactToQuotePhoto(
      userId,
      activeQuote?.userId ?? null,
      activeQuote?.visibility ?? "private",
    );

  useEffect(() => {
    if (controlled || !isOnFeed) {
      return;
    }

    const stack = quoteStacks[currentFeedIndex];
    setActiveQuoteId((prev) => stack?.quotes.some(quote => quote.id === prev)
      ? prev : (stack?.quotes[0]?.id ?? null));
  }, [controlled, currentFeedIndex, isOnFeed, quoteStacks]);

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
      const first = viewableItems.find(item => item.index != null);
      const hasItems = Boolean(first);
      setIsOnFeed(hasItems);
      if (!hasItems) {
        setActiveQuoteId(null);
        return;
      }

      if (first?.index == null) {
        return;
      }

      setCurrentFeedIndex(first.index);
    },
  ).current;

  async function handleReact(type: UserPhotoReactionType) {
    if (!shouldShowReactions || !activeQuoteId || !userId) {
      return;
    }

    const success = await sendUserPhotoReaction({
      photoId: activeQuoteId,
      userId,
      type,
    });
    if (!success) {
      return;
    }

    const emoji = PHOTO_REACTION_EMOJIS[type];
    const bursts: EmojiBurst[] = [];
    const count = 24;
    const baseId = Date.now().toString();
    const durationMs = 2500;
    const delayStepMs = 40;

    for (let i = 0; i < count; i += 1) {
      bursts.push({
        id: `${baseId}-${i}`,
        emoji,
        x: 10 + Math.random() * 80,
        delay: i * delayStepMs,
        scale: 0.6 + Math.random() * 0.8,
        driftDir: Math.random() > 0.5 ? 1 : -1,
      });
    }

    const idsToRemove = new Set(bursts.map((burst) => burst.id));
    setEmojiBursts((prev) => [...prev, ...bursts]);

    setTimeout(() => {
      setEmojiBursts((prev) =>
        prev.filter((burst) => !idsToRemove.has(burst.id)),
      );
    }, durationMs + (count - 1) * delayStepMs + 100);
  }

  return {
    currentFeedIndex,
    activeQuoteId,
    isOnFeed,
    emojiBursts,
    setActiveQuoteId,
    handleReact,
    viewabilityConfig,
    onViewableItemsChanged,
    shouldShowReactions,
  };
}
