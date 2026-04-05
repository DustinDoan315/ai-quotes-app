import { useEffect, useState } from "react";

import {
  useFutureQuote,
  useRewriteQuote,
} from "@/features/ai/useQuoteAIExtras";
import type { RewriteTone } from "@/services/ai/types";
import { strings } from "@/theme/strings";

export type HomeAiTool = "future" | RewriteTone;

type AiResult = {
  title: string;
  body: string;
};

export function useHomeAiReview(dailyQuoteText: string | null) {
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [selectedAiTool, setSelectedAiTool] = useState<HomeAiTool | null>(null);
  const [pendingAiTool, setPendingAiTool] = useState<HomeAiTool | null>(null);

  const {
    loading: isRewritingQuote,
    previewRewrite,
    applyRewrittenQuote,
  } = useRewriteQuote();
  const { loading: isGeneratingFutureQuote, generate: generateFutureQuote } =
    useFutureQuote();

  useEffect(() => {
    if (!dailyQuoteText) {
      setAiResult(null);
      setSelectedAiTool(null);
      setPendingAiTool(null);
      return;
    }
    setAiResult(null);
    setSelectedAiTool((current) => current ?? "calm");
    setPendingAiTool(null);
  }, [dailyQuoteText]);

  function clearAiToolState() {
    setAiResult(null);
    setSelectedAiTool(null);
    setPendingAiTool(null);
  }

  async function handleFutureQuotePress() {
    if (!dailyQuoteText) {
      return;
    }
    setPendingAiTool("future");
    const result = await generateFutureQuote(dailyQuoteText);
    if (!result) {
      setPendingAiTool(null);
      return;
    }
    setAiResult({
      title: strings.home.aiTools.futureResult,
      body: result,
    });
    setSelectedAiTool("future");
    setPendingAiTool(null);
  }

  async function handleRewriteQuote(tone: RewriteTone) {
    setSelectedAiTool(tone);
    setPendingAiTool(tone);
    const text = await previewRewrite(tone);
    setPendingAiTool(null);
    if (!text) {
      return;
    }
    applyRewrittenQuote(text);
    setAiResult({
      title: strings.home.aiTools.rewriteResult,
      body: text,
    });
    setSelectedAiTool(tone);
  }

  return {
    aiResult,
    selectedAiTool,
    pendingAiTool,
    clearAiToolState,
    handleFutureQuotePress,
    handleRewriteQuote,
    isAiToolLoading: isRewritingQuote || isGeneratingFutureQuote,
    aiToolsLoadingLabel: isGeneratingFutureQuote
      ? strings.home.aiTools.loadingFuture
      : null,
  };
}
