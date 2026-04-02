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

type RewriteDraft = {
  tone: RewriteTone;
  text: string;
};

export function useHomeAiReview(dailyQuoteText: string | null) {
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [rewriteDraft, setRewriteDraft] = useState<RewriteDraft | null>(null);
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
      setRewriteDraft(null);
      setSelectedAiTool(null);
      setPendingAiTool(null);
    }
  }, [dailyQuoteText]);

  function clearAiToolState() {
    setAiResult(null);
    setRewriteDraft(null);
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
    setPendingAiTool(tone);
    const text = await previewRewrite(tone);
    setPendingAiTool(null);
    if (!text) {
      return;
    }
    setRewriteDraft({ tone, text });
  }

  function handleApproveRewrite(editedText: string) {
    const trimmed = editedText.trim();
    if (!trimmed || !rewriteDraft) {
      return;
    }

    applyRewrittenQuote(trimmed);
    setRewriteDraft(null);
    setAiResult({
      title: strings.home.aiTools.rewriteResult,
      body: trimmed,
    });
    setSelectedAiTool(rewriteDraft.tone);
  }

  function handleCancelRewrite() {
    setRewriteDraft(null);
  }

  return {
    aiResult,
    rewriteDraft,
    selectedAiTool,
    pendingAiTool,
    clearAiToolState,
    handleFutureQuotePress,
    handleRewriteQuote,
    handleApproveRewrite,
    handleCancelRewrite,
    isAiToolLoading: isRewritingQuote || isGeneratingFutureQuote,
    aiToolsLoadingLabel: isGeneratingFutureQuote
      ? strings.home.aiTools.loadingFuture
      : null,
  };
}
