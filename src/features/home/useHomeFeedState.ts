import { sendUserPhotoReaction } from "@/services/media/userPhotoReactions";
import { strings } from "@/theme/strings";
import { useEffect, useRef, useState } from "react";

type QuoteStackLike = {
  quotes: { id: string }[];
};

export type EmojiBurst = {
  id: string;
  emoji: string;
  x: number;
  delay: number;
  scale: number;
};

type FeedReactionType = "love" | "clap" | "fire";

type UseHomeFeedStateOptions = {
  quoteStacks: QuoteStackLike[];
  userId: string | null;
  guestId: string | null;
};

export function useHomeFeedState(options: UseHomeFeedStateOptions) {
  const { quoteStacks, userId, guestId } = options;
  const [currentFeedIndex, setCurrentFeedIndex] = useState(0);
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null);
  const [emojiBursts, setEmojiBursts] = useState<EmojiBurst[]>([]);
  const [isOnFeed, setIsOnFeed] = useState(false);
  const [composerText, setComposerText] = useState("");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [lastSentLabel, setLastSentLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!isOnFeed) {
      return;
    }

    const nextId = quoteStacks[currentFeedIndex]?.quotes[0]?.id ?? null;
    setActiveQuoteId((prev) => (prev === nextId ? prev : nextId));
  }, [currentFeedIndex, isOnFeed, quoteStacks]);

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
      const hasItems = viewableItems.length > 0;
      setIsOnFeed(hasItems);
      if (!hasItems) {
        setActiveQuoteId(null);
        return;
      }

      const first = viewableItems[0];
      if (first.index == null) {
        return;
      }

      setCurrentFeedIndex(first.index);
    },
  ).current;

  async function handleReact(type: FeedReactionType) {
    if (!activeQuoteId) {
      return;
    }

    const success = await sendUserPhotoReaction({
      photoId: activeQuoteId,
      userId,
      guestId: userId ? null : guestId,
      type,
    });
    if (!success) {
      return;
    }

    const emojiByType: Record<FeedReactionType, string> = {
      love: "❤️",
      clap: "👏",
      fire: "🔥",
    };
    const emoji = emojiByType[type];
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

  async function handleSendMessage() {
    const trimmed = composerText.trim();
    if (!activeQuoteId || !trimmed || isSendingMessage) {
      return;
    }

    setIsSendingMessage(true);
    const success = await sendUserPhotoReaction({
      photoId: activeQuoteId,
      userId,
      guestId: userId ? null : guestId,
      type: "love",
      comment: trimmed,
    });
    setIsSendingMessage(false);

    if (!success) {
      return;
    }

    setComposerText("");
    setIsComposerOpen(false);
    setLastSentLabel(strings.home.messageSent);
    setTimeout(() => {
      setLastSentLabel((label) =>
        label === strings.home.messageSent ? null : label,
      );
    }, 1200);
  }

  return {
    currentFeedIndex,
    activeQuoteId,
    isOnFeed,
    emojiBursts,
    composerText,
    isComposerOpen,
    isSendingMessage,
    lastSentLabel,
    setActiveQuoteId,
    setComposerText,
    setIsComposerOpen,
    handleReact,
    handleSendMessage,
    viewabilityConfig,
    onViewableItemsChanged,
    shouldShowMessageBar: Boolean(isOnFeed && activeQuoteId),
  };
}
