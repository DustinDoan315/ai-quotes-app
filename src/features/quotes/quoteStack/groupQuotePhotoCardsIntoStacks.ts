import type { QuotePhotoCard } from "@/services/media/userPhotosApi";
import type { HomeVibeKey } from "@/types/homeBackground";
import type { QuoteStack } from "./types";

function safeParseMs(isoDate: string): number {
  const ms = Date.parse(isoDate);
  return Number.isFinite(ms) ? ms : 0;
}

function getOwnerKey(card: QuotePhotoCard): string {
  if (card.userId) {
    return `user:${card.userId}`;
  }
  if (card.guestId) {
    return `guest:${card.guestId}`;
  }
  return "guest:unknown";
}

function computeDisplayVibeKey(quotes: QuotePhotoCard[]): HomeVibeKey | null {
  const keys = quotes
    .map((q) => q.homeVibeKey)
    .filter((k): k is HomeVibeKey => k != null);
  if (keys.length === 0) {
    return null;
  }
  const first = keys[0];
  for (const k of keys) {
    if (k !== first) {
      return null;
    }
  }
  return first;
}

export function groupQuotePhotoCardsIntoStacks(
  cards: QuotePhotoCard[],
): QuoteStack[] {
  const stacks: QuoteStack[] = [];
  const stacksById = new Map<string, QuoteStack>();

  for (const card of cards) {
    const ownerKey = getOwnerKey(card);
    const stackKey = card.photoStackId
      ? `${ownerKey}:${card.photoStackId}`
      : null;
    const existingStack = stackKey ? stacksById.get(stackKey) : undefined;

    if (existingStack) {
      existingStack.quotes.push(card);
      if (existingStack.primaryVibeKey == null && card.homeVibeKey) {
        existingStack.primaryVibeKey = card.homeVibeKey;
      }
      existingStack.displayVibeKey = computeDisplayVibeKey(existingStack.quotes);
      continue;
    }

    const stack: QuoteStack = {
      id: card.photoStackId ?? card.id,
      quotes: [card],
      ownerKey,
      primaryVibeKey: card.homeVibeKey ?? null,
      displayVibeKey: card.homeVibeKey ?? null,
      createdAtMs: safeParseMs(card.createdAt),
    };
    stacks.push(stack);
    if (stackKey) {
      stacksById.set(stackKey, stack);
    }
  }

  return stacks;
}
