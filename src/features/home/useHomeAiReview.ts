import { useEffect, useState } from "react";

import {
  useFutureQuote,
  useRewriteQuote,
} from "@/features/ai/useQuoteAIExtras";
import type { RewriteTone } from "@/services/ai/types";
import i18n from "@/i18n";

export type HomeAiTool = "future" | RewriteTone;

type AiResult = {
  title: string;
  body: string;
};

export function useHomeAiReview(dailyQuoteText: string | null) {
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [selectedAiTool, setSelectedAiTool] = useState<HomeAiTool | null>(null);
  const [pendingAiTool, setPendingAiTool] = useState<HomeAiTool | null>(null);
  const [rewriteReviewText, setRewriteReviewText] = useState<string | null>(null);
  const [futureReviewText, setFutureReviewText] = useState<string | null>(null);

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
      setRewriteReviewText(null);
      setFutureReviewText(null);
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
    setRewriteReviewText(null);
    setFutureReviewText(null);
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
    setFutureReviewText(result);
    setSelectedAiTool("future");
    setPendingAiTool(null);
  }

  function handleApproveFutureQuote(text: string) {
    applyRewrittenQuote(text);
    setAiResult({
      title: i18n.t("home.aiTools.futureResult"),
      body: text,
    });
    setFutureReviewText(null);
  }

  function handleCancelFutureQuote() {
    setFutureReviewText(null);
    setSelectedAiTool((current) => (current === "future" ? "calm" : current));
  }

  async function handleRewriteQuote(tone: RewriteTone) {
    setSelectedAiTool(tone);
    setPendingAiTool(tone);
    const text = await previewRewrite(tone);
    setPendingAiTool(null);
    if (!text) {
      return;
    }
    setRewriteReviewText(text);
  }

  function handleApproveRewrite(text: string) {
    applyRewrittenQuote(text);
    setAiResult({
      title: i18n.t("home.aiTools.rewriteResult"),
      body: text,
    });
    setRewriteReviewText(null);
  }

  function handleCancelRewrite() {
    setRewriteReviewText(null);
  }

  const pendingToneLabel =
    pendingAiTool && pendingAiTool !== "future"
      ? i18n.t(`home.aiTools.${pendingAiTool}`)
      : null;

  return {
    aiResult,
    selectedAiTool,
    pendingAiTool,
    clearAiToolState,
    handleFutureQuotePress,
    handleApproveFutureQuote,
    handleCancelFutureQuote,
    futureReviewText,
    handleRewriteQuote,
    handleApproveRewrite,
    handleCancelRewrite,
    rewriteReviewText,
    isAiToolLoading: isRewritingQuote || isGeneratingFutureQuote,
    aiToolsLoadingLabel: isGeneratingFutureQuote
      ? i18n.t("home.aiTools.loadingFuture")
      : pendingToneLabel
        ? i18n.t("home.aiTools.loadingRewrite", { tone: pendingToneLabel })
        : null,
  };
}
