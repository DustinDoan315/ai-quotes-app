import { useCallback, useEffect, useRef, useState } from 'react';
import type { QuoteStack } from '@/features/quotes/quoteStack/types';
import { getHomeStackIdentity, reconcileHomeActiveSelection, resolveActiveHomeMoment, type HomeActiveSelection } from '@/domain/home/activeHomeMoment';

/** Commit both swipe axes through one selection; viewability never owns identity. */
export function useHomeAmbientController(stacks: QuoteStack[], identity: string, locked: boolean) {
  const [selection, setSelection] = useState<HomeActiveSelection>(null);
  const [isDragging, setIsDragging] = useState(false);
  const previousIndex = useRef(0);
  const previousIdentity = useRef(identity);
  const heldStacks = useRef(stacks);
  if (!locked || previousIdentity.current !== identity) heldStacks.current = stacks;
  const visibleStacks = heldStacks.current;
  const identityChanged = previousIdentity.current !== identity;
  const reconciled = identityChanged ? null : reconcileHomeActiveSelection(visibleStacks, selection, previousIndex.current);
  const stackIndex = reconciled ? visibleStacks.findIndex(stack => getHomeStackIdentity(stack) === reconciled.stackId) : -1;
  const active = stackIndex >= 0 ? resolveActiveHomeMoment(visibleStacks, stackIndex, reconciled?.quoteId ?? null) : null;
  useEffect(() => {
    previousIdentity.current = identity;
    setSelection(reconciled);
    if (identityChanged) setIsDragging(false);
  }, [identity, identityChanged, reconciled?.stackId, reconciled?.quoteId]); // eslint-disable-line react-hooks/exhaustive-deps
  if (stackIndex >= 0) previousIndex.current = stackIndex;
  const commitPage = useCallback((page: number) => {
    if (locked) return;
    setIsDragging(false);
    const stack = visibleStacks[Math.round(page) - 1];
    if (!stack?.quotes.length) { setSelection(null); return; }
    setSelection(current => current?.stackId === getHomeStackIdentity(stack)
      ? reconcileHomeActiveSelection(visibleStacks, current)
      : { stackId: getHomeStackIdentity(stack), quoteId: stack.quotes[0].id });
  }, [locked, visibleStacks]);
  const selectQuote = useCallback((quoteId: string) => {
    if (locked || isDragging || !active || !visibleStacks[stackIndex]?.quotes.some(card => card.id === quoteId)) return;
    setSelection({ stackId: active.stackId, quoteId });
  }, [active, isDragging, locked, stackIndex, visibleStacks]);
  return { active, visibleStacks, stackIndex, isOnFeed: Boolean(active), isDragging,
    beginDrag: () => { if (!locked) setIsDragging(true); }, commitPage, selectQuote,
    page: active ? stackIndex + 1 : 0,
    returnToCapture: () => { if (!locked) { setSelection(null); setIsDragging(false); } },
  };
}
