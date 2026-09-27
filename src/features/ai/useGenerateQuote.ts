import { generateQuote } from "@/services/ai/client";
import { useAIStore } from "./aiStore";
import { useQuoteStore } from "@/appState/quoteStore";
import { useUIStore } from "@/appState/uiStore";
import { useUserStore } from "@/appState/userStore";
import { useSubscriptionConfigStore } from "@/appState/subscriptionConfigStore";
import { useSubscriptionStore } from "@/appState/subscriptionStore";
import { useUsageStore } from "@/appState/usageStore";
import { ADVANCED_PERSONA_IDS } from "@/domain/subscription/subscriptionConstants";
import { createSubscriptionGuards } from "@/domain/subscription/subscriptionGuards";
import { openPaywall } from "@/features/paywall/openPaywall";
import { getQuoteValidationMessageKey } from "@/services/ai/rewriteReview";
import i18n from "@/i18n";
import { useCallback, useRef } from "react";

const MAX_PERSONA_TRAITS = 8;
const MAX_PERSONA_TRAIT_LENGTH = 40;
const COOLDOWN_MS = 10000;

const localizeQuoteValidationReason = (reason: string): string => {
  const messageKey = getQuoteValidationMessageKey(reason);
  return messageKey
    ? i18n.t(messageKey)
    : i18n.t("camera.errors.failedToGenerateQuote");
};

const normalizePersonaTraits = (traits: string[] | undefined): string[] => {
  if (!traits || traits.length === 0) {
    return ["curious", "optimistic"];
  }

  const normalized = traits
    .filter((trait) => trait.trim().length > 0)
    .map((trait) => trait.trim().slice(0, MAX_PERSONA_TRAIT_LENGTH))
    .slice(0, MAX_PERSONA_TRAITS);

  if (normalized.length === 0) {
    return ["curious", "optimistic"];
  }

  return normalized;
};

export const useGenerateQuote = () => {
  const { setIsGenerating, setLastGeneratedAt, lastGeneratedAt } = useAIStore();
  const { setDailyQuote, addToHistory } = useQuoteStore();
  const { persona, quoteLanguage } = useUserStore();
  const { showToast } = useUIStore();
  const { customerInfo } = useSubscriptionStore();
  const planLimits = useSubscriptionConfigStore((s) => s.planLimits);
  const { resetIfNewDay, incrementAiUsage } = useUsageStore();
  const latestRequestIdRef = useRef(0);

  const cancelGeneration = useCallback(() => {
    latestRequestIdRef.current += 1;
    setIsGenerating(false);
  }, [setIsGenerating]);

  const generate = async (
    base64Image?: string,
    enforceCooldown: boolean = true,
    momentContext?: string,
    shouldCommit: () => boolean = () => true,
  ) => {
    if (!shouldCommit()) {
      return null;
    }
    resetIfNewDay();
    const freshAiCount = useUsageStore.getState().dailyAiCount;

    const snapshot = customerInfo
      ? { activeEntitlementIds: customerInfo.activeEntitlementIds }
      : null;
    const guards = createSubscriptionGuards(snapshot, planLimits);
    const isAdvancedPersona =
      persona != null && ADVANCED_PERSONA_IDS.includes(persona.id);
    const personaGuard = guards.canUsePersonaLevel(isAdvancedPersona);
    if (!personaGuard.allowed) {
      showToast(
        `${i18n.t("subscription.personaLockedTitle")} ${i18n.t("subscription.personaLockedBody")}`,
        "info",
      );
      openPaywall({
        reason: "persona_locked",
        source: "persona_gate",
      });
      return null;
    }

    const guardResult = guards.canGenerateQuote(freshAiCount);

    if (!guardResult.allowed) {
      showToast(
        `${i18n.t("subscription.aiLimitReachedTitle")} ${i18n.t("subscription.aiLimitReachedBody")}`,
        "info",
      );
      openPaywall({
        reason: "ai_limit",
        source: "ai_generate",
      });
      return null;
    }

    if (enforceCooldown && lastGeneratedAt != null) {
      const now = Date.now();
      const timeSinceLastRequest = now - lastGeneratedAt;
      if (timeSinceLastRequest < COOLDOWN_MS) {
        const waitTime = COOLDOWN_MS - timeSinceLastRequest;
        showToast(
          i18n.t("camera.info.generationCooldown", {
            seconds: Math.ceil(waitTime / 1000),
          }),
          "info",
        );
        return null;
      }
    }

    const effectivePersonaId = persona?.id ?? "guest";
    const effectiveTraits = normalizePersonaTraits(persona?.traits);

    const requestId = ++latestRequestIdRef.current;
    const isCurrentRequest = () =>
      requestId === latestRequestIdRef.current && shouldCommit();
    setIsGenerating(true);

    try {
      const response = await generateQuote({
        personaId: effectivePersonaId,
        personaTraits: effectiveTraits,
        base64Image: base64Image ?? undefined,
        momentContext,
        language: quoteLanguage ?? "en",
      });

      if (!isCurrentRequest()) {
        if (response.isValid) {
          incrementAiUsage();
          setLastGeneratedAt(Date.now());
        }
        return null;
      }

      if (!response.isValid) {
        if (response.reason === "ai_limit") {
          showToast(
            `${i18n.t("subscription.aiLimitReachedTitle")} ${i18n.t("subscription.aiLimitReachedBody")}`,
            "info",
          );
          openPaywall({ reason: "ai_limit", source: "ai_generate" });
        } else {
          showToast(
            response.reason
              ? localizeQuoteValidationReason(response.reason)
              : i18n.t("camera.errors.failedToGenerateQuote"),
            "error",
          );
        }
        return null;
      }

      const quote = {
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
        text: response.quote,
        personaId: effectivePersonaId,
        language: (quoteLanguage ?? "en") as "vi" | "en",
        createdAt: Date.now(),
      };

      setDailyQuote(quote);
      addToHistory(quote);
      incrementAiUsage();
      setLastGeneratedAt(Date.now());

      return quote;
    } catch (error) {
      console.error("AI generate error", error);
      if (isCurrentRequest()) {
        showToast(i18n.t("camera.errors.failedToGenerateQuote"), "error");
      }
      return null;
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setIsGenerating(false);
      }
    }
  };

  return { generate, cancelGeneration };
};
