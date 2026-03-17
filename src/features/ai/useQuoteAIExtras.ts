import { useCallback, useState } from "react";
import { explainQuote, generateFutureQuote, rewriteQuote } from "@/services/ai/client";
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

  const rewrite = useCallback(
    async (tone: RewriteTone) => {
      if (!dailyQuote) return null;
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
        const updated = {
          ...dailyQuote,
          id: Date.now().toString(),
          text: response.quote,
          createdAt: Date.now(),
        };
        setDailyQuote(updated);
        addToHistory(updated);
        return updated;
      } finally {
        setLoading(false);
      }
    },
    [dailyQuote, persona, quoteLanguage, setDailyQuote, addToHistory, showToast],
  );

  return { loading, rewrite };
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

