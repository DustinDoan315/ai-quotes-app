import {
  PHOTO_REACTION_EMOJIS,
  sendUserPhotoReaction,
  type UserPhotoReactionType,
} from "@/services/media/userPhotoReactions";
import type { QuoteVisibility } from "@/types/memory";
import { useState } from "react";

export type EmojiBurst = {
  id: string;
  emoji: string;
  x: number;
  delay: number;
  scale: number;
  driftDir: 1 | -1;
};

type UseHomeReactionsOptions = {
  userId: string | null;
  activeQuote: { id: string; userId: string | null; visibility: QuoteVisibility } | null;
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

export function useHomeReactions({ activeQuote, userId }: UseHomeReactionsOptions) {
  const [emojiBursts, setEmojiBursts] = useState<EmojiBurst[]>([]);
  const activeQuoteId = activeQuote?.id ?? null;
  const shouldShowReactions = canReactToQuotePhoto(
    userId,
    activeQuote?.userId ?? null,
    activeQuote?.visibility ?? "private",
  );

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

    playBurst(type);
  }

  function previewReaction(type: UserPhotoReactionType) {
    if (typeof __DEV__ === 'undefined' || !__DEV__) return;
    playBurst(type);
  }

  function playBurst(type: UserPhotoReactionType) {
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

  return { emojiBursts, handleReact, previewReaction, shouldShowReactions };
}
