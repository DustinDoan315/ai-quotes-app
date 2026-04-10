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
import i18n from "@/i18n";

const MAX_PERSONA_TRAITS = 8;
const MAX_PERSONA_TRAIT_LENGTH = 40;
const COOLDOWN_MS = 10000;

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

  const generate = async (
    base64Image?: string,
    enforceCooldown: boolean = true,
  ) => {
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
          `Please wait ${Math.ceil(waitTime / 1000)} seconds before generating another quote`,
          "info",
        );
        return null;
      }
    }

    const effectivePersonaId = persona?.id ?? "guest";
    const effectiveTraits = normalizePersonaTraits(persona?.traits);

    setIsGenerating(true);

    try {
      const response = await generateQuote({
        personaId: effectivePersonaId,
        personaTraits: effectiveTraits,
        base64Image: base64Image ?? undefined,
        language: quoteLanguage ?? "vi",
        visionLanguage: "en",
      });

      if (!response.isValid) {
        showToast(response.reason || "Failed to generate quote", "error");
        return null;
      }

      const quote = {
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
        text: response.quote,
        personaId: effectivePersonaId,
        createdAt: Date.now(),
      };

      setDailyQuote(quote);
      addToHistory(quote);
      incrementAiUsage();
      setLastGeneratedAt(Date.now());

      return quote;
    } catch (error) {
      console.error("AI generate error", error);
      showToast(
        error instanceof Error ? error.message : "Failed to generate quote",
        "error",
      );
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generate };
};
