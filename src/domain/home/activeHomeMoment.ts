import type { QuoteStack } from '@/features/quotes/quoteStack/types';
import type { QuotePhotoCard } from '@/services/media/userPhotosApi';
import type { HomeBackgroundPalette } from '@/types/homeBackground';
import { getHomeBackgroundPaletteByKey } from '@/theme/homeBackgrounds';
import { parseHomeVibeKey } from './homeVibeKey';
export type HomeActiveSelection = {
  stackId: string;
  quoteId: string;
} | null;
export type ActiveHomeMoment = {
  card: QuotePhotoCard;
  stackId: string;
  index: number;
  count: number;
  palette: HomeBackgroundPalette;
};
/** Owner qualification protects selection when two owners share a stack UUID. */
export function getHomeStackIdentity(stack: QuoteStack): string { return stack.id; }
export function resolveActiveHomeMoment(stacks: readonly QuoteStack[], stackIndex: number, activeQuoteId: string | null): ActiveHomeMoment | null {
  const stack = stacks[stackIndex];
  if (!stack?.quotes.length)
    return null;
  const matched = stack.quotes.findIndex((card) => card.id === activeQuoteId);
  const index = Math.max(0, matched);
  const card = stack.quotes[index];
  return { card, stackId: getHomeStackIdentity(stack), index, count: stack.quotes.length, palette: getHomeBackgroundPaletteByKey(parseHomeVibeKey(card.homeVibeKey) ?? 'mist') };
}
export function reconcileHomeActiveSelection(stacks: readonly QuoteStack[], selection: HomeActiveSelection, fallbackStackIndex = 0): HomeActiveSelection {
  if (!selection)
    return null;
  const preserved = stacks.find((stack) => getHomeStackIdentity(stack) === selection.stackId && stack.quotes.length);
  const stack = preserved ?? stacks[Math.min(Math.max(0, fallbackStackIndex), stacks.length - 1)];
  if (!stack?.quotes.length)
    return null;
  const card = stack.quotes.find((quote) => quote.id === selection.quoteId) ?? stack.quotes[0];
  return { stackId: getHomeStackIdentity(stack), quoteId: card.id };
}
export function getHomeMomentIndexWindow(index: number, count: number): {
  indices: number[];
  label: string | null;
} {
  const total = Math.max(0, Math.floor(count));
  const selected = Math.min(Math.max(0, Math.floor(index)), Math.max(0, total - 1));
  const size = Math.min(5, total);
  const start = Math.max(0, Math.min(selected - 2, total - size));
  return { indices: Array.from({ length: size }, (_, offset) => start + offset), label: total > 1 ? `${selected + 1} / ${total}` : null };
}
export { parseHomeVibeKey } from "./homeVibeKey";
