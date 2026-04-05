import { useCallback, useState } from "react";
import { explainQuote, generateFutureQuote, rewriteQuote } from "@/services/ai/client";
import { validateRewriteReviewQuote } from "@/services/ai/rewriteReview";
import type { RewriteTone } from "@/services/ai/types";
import { useUserStore } from "@/appState/userStore";
import { useQuoteStore } from "@/appState/quoteStore";
import { useUIStore } from "@/appState/uiStore";

export const useExplainQuote = (quoteText: string | null) => {
  const persona = useUserStore((s) => s.persona);
  const quoteLanguage = useUserStore((s) => s.quoteLanguage);
  const showToast = useUIStore((s) => s.showToast);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const explain = useCallback(async () => {
    if (!quoteText) return null;
    const traits =
      persona && persona.traits && persona.traits.length > 0
        ? persona.traits
        : ["curious", "optimistic"];
    setLoading(true);
    try {
      const response = await explainQuote({
        quote: quoteText,
        personaTraits: traits,
        language: quoteLanguage,
      });
      if (!response.isValid) {
        if (response.reason) {
          showToast(response.reason, "error");
        }
        return null;
      }
      setExplanation(response.explanation);
      return response.explanation;
    } finally {
      setLoading(false);
    }
  }, [quoteText, persona, quoteLanguage, showToast]);

  return { explanation, loading, explain };
};

export const useRewriteQuote = () => {
  const persona = useUserStore((s) => s.persona);
  const quoteLanguage = useUserStore((s) => s.quoteLanguage);
  const { dailyQuote, setDailyQuote, addToHistory } = useQuoteStore();
  const showToast = useUIStore((s) => s.showToast);
  const [loading, setLoading] = useState(false);

  const previewRewrite = useCallback(
    async (tone: RewriteTone) => {
      if (!dailyQuote) {
        return null;
      }
      const traits =
        persona && persona.traits && persona.traits.length > 0
          ? persona.traits
          : ["curious", "optimistic"];
      setLoading(true);
      try {
        const response = await rewriteQuote({
          quote: dailyQuote.text,
          personaTraits: traits,
          tone,
          language: quoteLanguage,
        });
        if (!response.isValid) {
          if (response.reason) {
            showToast(response.reason, "error");
          }
          return null;
        }
        const validation = validateRewriteReviewQuote(
          response.quote,
          dailyQuote.text,
        );
        if (!validation.isValid) {
          showToast(validation.reason ?? "Invalid rewrite", "error");
          return null;
        }
        return validation.sanitizedQuote;
      } finally {
        setLoading(false);
      }
    },
    [dailyQuote, persona, quoteLanguage, showToast],
  );

  const applyRewrittenQuote = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) {
        return;
      }
      const dq = useQuoteStore.getState().dailyQuote;
      if (!dq) {
        return;
      }
      const updated = {
        ...dq,
        id: Date.now().toString(),
        text: trimmed,
        createdAt: Date.now(),
      };
      setDailyQuote(updated);
      addToHistory(updated);
    },
    [setDailyQuote, addToHistory],
  );

  return { loading, previewRewrite, applyRewrittenQuote };
};

export const useFutureQuote = () => {
  const persona = useUserStore((s) => s.persona);
  const quoteLanguage = useUserStore((s) => s.quoteLanguage);
  const showToast = useUIStore((s) => s.showToast);
  const [loading, setLoading] = useState(false);

  const generate = useCallback(
    async (sourceQuote: string) => {
      const traits =
        persona && persona.traits && persona.traits.length > 0
          ? persona.traits
          : ["curious", "optimistic"];
      setLoading(true);
      try {
        const response = await generateFutureQuote({
          quote: sourceQuote,
          personaTraits: traits,
          language: quoteLanguage,
        });
        if (!response.isValid) {
          if (response.reason) {
            showToast(response.reason, "error");
          }
          return null;
        }
        return response.quote;
      } finally {
        setLoading(false);
      }
    },
    [persona, quoteLanguage, showToast],
  );

  return { loading, generate };
};
