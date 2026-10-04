import { useEffect, useRef, useState } from "react";

import { useRewriteQuote } from "@/features/ai/useQuoteAIExtras";

export type HomeAiTool = "rewrite";

export function useHomeAiReview(dailyQuoteText: string | null) {
  const [pendingAiTool, setPendingAiTool] = useState<HomeAiTool | null>(null);
  const [rewriteReviewText, setRewriteReviewText] = useState<string | null>(null);
  const { loading, previewRewrite, applyRewrittenQuote } = useRewriteQuote();
  const mounted = useRef(false);
  const inFlight = useRef(false);
  const generation = useRef(0);
  const currentText = useRef(dailyQuoteText);
  const reviewSource = useRef<{ text: string; generation: number } | null>(null);

  // Invalidate before effects run so a changed input can never approve an old preview.
  if (currentText.current !== dailyQuoteText) {
    currentText.current = dailyQuoteText;
    generation.current += 1;
    reviewSource.current = null;
  }

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      generation.current += 1;
      reviewSource.current = null;
    };
  }, []);

  useEffect(() => {
    setRewriteReviewText(null);
    setPendingAiTool(null);
  }, [dailyQuoteText]);

  function clearAiToolState() {
    generation.current += 1;
    reviewSource.current = null;
    setRewriteReviewText(null);
    setPendingAiTool(null);
  }

  async function handleRewriteQuote(): Promise<void> {
    const sourceText = currentText.current;
    if (!sourceText?.trim() || inFlight.current || !mounted.current) return;
    inFlight.current = true;
    const operation = ++generation.current;
    reviewSource.current = null;
    setRewriteReviewText(null);
    setPendingAiTool("rewrite");
    try {
      const text = await previewRewrite("natural");
      if (
        !text || !mounted.current || operation !== generation.current ||
        currentText.current !== sourceText
      ) return;
      reviewSource.current = { text: sourceText, generation: operation };
      setRewriteReviewText(text);
    } catch {
      // The request layer owns error presentation; a failed preview never applies a quote.
    } finally {
      inFlight.current = false;
      if (mounted.current) setPendingAiTool(null);
    }
  }

  function handleApproveRewrite(text: string) {
    const source = reviewSource.current;
    if (
      !mounted.current || !source || source.text !== currentText.current ||
      source.generation !== generation.current
    ) return;
    applyRewrittenQuote(text);
    reviewSource.current = null;
    setRewriteReviewText(null);
  }

  function handleCancelRewrite() {
    clearAiToolState();
  }

  const isRewritingQuote = loading || pendingAiTool === "rewrite";
  return {
    rewriteReviewText: reviewSource.current ? rewriteReviewText : null,
    pendingAiTool,
    isAiToolLoading: isRewritingQuote,
    isRewritingQuote,
    handleRewriteQuote,
    handleApproveRewrite,
    handleCancelRewrite,
    clearAiToolState,
  };
}
