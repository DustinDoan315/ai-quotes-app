import type { QuotePhotoCard } from "@/services/media/userPhotosApi";
import type { HomeVibeKey } from "@/types/homeBackground";
import type { QuoteStack } from "./types";

const DEFAULT_WINDOW_MS = 60 * 60 * 1000;

type GroupOptions = {
  windowMs?: number;
  requireSameVibeKey?: boolean;
};

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
  options?: GroupOptions,
): QuoteStack[] {
  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
  const requireSameVibeKey = options?.requireSameVibeKey ?? true;

  const stacks: QuoteStack[] = [];

  for (const card of cards) {
    const createdAtMs = safeParseMs(card.createdAt);
    const ownerKey = getOwnerKey(card);

    const lastStack = stacks.at(-1);

    if (!lastStack) {
      stacks.push({
        id: card.id,
        quotes: [card],
        ownerKey,
        primaryVibeKey: card.homeVibeKey ?? null,
        displayVibeKey: card.homeVibeKey ?? null,
        createdAtMs,
      });
      continue;
    }

    const ownerMatch = lastStack.ownerKey === ownerKey;
    const withinWindow = lastStack.createdAtMs - createdAtMs <= windowMs;

    const stackPrimaryVibeKey = lastStack.primaryVibeKey;
    const candidateVibeKey = card.homeVibeKey ?? null;

    const vibeMatch =
      !requireSameVibeKey ||
      stackPrimaryVibeKey == null ||
      candidateVibeKey == null ||
      stackPrimaryVibeKey === candidateVibeKey;

    if (ownerMatch && withinWindow && vibeMatch) {
      lastStack.quotes.push(card);
      if (lastStack.primaryVibeKey == null && card.homeVibeKey) {
        lastStack.primaryVibeKey = card.homeVibeKey;
      }
      lastStack.displayVibeKey = computeDisplayVibeKey(lastStack.quotes);
      continue;
    }

    stacks.push({
      id: card.id,
      quotes: [card],
      ownerKey,
      primaryVibeKey: card.homeVibeKey ?? null,
      displayVibeKey: card.homeVibeKey ?? null,
      createdAtMs,
    });
  }

  return stacks;
}

