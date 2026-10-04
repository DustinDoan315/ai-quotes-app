import { useCallback, useState } from "react";
import { rewriteQuote } from "@/services/ai/client";
import {
  getQuoteValidationMessageKey,
  validateRewriteReviewQuote,
} from "@/services/ai/rewriteReview";
import type { RewriteTone } from "@/services/ai/types";
import { useUserStore } from "@/appState/userStore";
import { useQuoteStore } from "@/appState/quoteStore";
import { useUIStore } from "@/appState/uiStore";
import { openPaywall } from "@/features/paywall/openPaywall";
import i18n from "@/i18n";

const localizeQuoteValidationReason = (reason: string): string => {
  const messageKey = getQuoteValidationMessageKey(reason);
  return messageKey ? i18n.t(messageKey) : reason;
};

export const useRewriteQuote = () => {
  const persona = useUserStore((s) => s.persona);
  const quoteLanguage = useUserStore((s) => s.quoteLanguage ?? "en");
  const { dailyQuote, setDailyQuote, addToHistory } = useQuoteStore();
  const showToast = useUIStore((s) => s.showToast);
  const [loading, setLoading] = useState(false);

  const previewRewrite = useCallback(
    async (tone: RewriteTone = "natural") => {
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
          if (response.reason === "ai_limit") {
            showToast(
              `${i18n.t("subscription.aiLimitReachedTitle")} ${i18n.t("subscription.aiLimitReachedBody")}`,
              "info",
            );
            openPaywall({ reason: "ai_limit", source: "ai_generate" });
          } else if (response.reason) {
            showToast(localizeQuoteValidationReason(response.reason), "error");
          }
          return null;
        }
        const validation = validateRewriteReviewQuote(
          response.quote,
          dailyQuote.text,
        );
        if (!validation.isValid) {
          showToast(
            validation.reason
              ? localizeQuoteValidationReason(validation.reason)
              : i18n.t("home.aiTools.validation.rewriteAtLeastOneWord"),
            "error",
          );
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
