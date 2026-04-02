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
import { strings } from "@/theme/strings";

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
  const { dailyAiCount, resetIfNewDay, incrementAiUsage } = useUsageStore();

  const generate = async (
    base64Image?: string,
    enforceCooldown: boolean = true,
  ) => {
    console.log("AI useGenerateQuote.generate called", {
      hasPersona: !!persona,
      hasBase64Image: !!base64Image,
    });

    resetIfNewDay();

    const snapshot = customerInfo
      ? { activeEntitlementIds: customerInfo.activeEntitlementIds }
      : null;
    const guards = createSubscriptionGuards(snapshot, planLimits);
    const isAdvancedPersona =
      persona != null && ADVANCED_PERSONA_IDS.includes(persona.id);
    const personaGuard = guards.canUsePersonaLevel(isAdvancedPersona);
    if (!personaGuard.allowed) {
      showToast(
        `${strings.subscription.personaLockedTitle} ${strings.subscription.personaLockedBody}`,
        "info",
      );
      openPaywall({
        reason: "persona_locked",
        source: "persona_gate",
      });
      return null;
    }

    const guardResult = guards.canGenerateQuote(dailyAiCount);

    if (!guardResult.allowed) {
      showToast(
        `${strings.subscription.aiLimitReachedTitle} ${strings.subscription.aiLimitReachedBody}`,
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
        throw new Error(
          `Please wait ${Math.ceil(waitTime / 1000)} seconds before generating another quote`,
        );
      }
    }

    const effectivePersonaId = persona?.id ?? "guest";
    const effectiveTraits = normalizePersonaTraits(persona?.traits);

    setIsGenerating(true);

    try {
      console.log("AI calling generateQuote service");
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
        id: Date.now().toString(),
        text: response.quote,
        personaId: effectivePersonaId,
        createdAt: Date.now(),
      };

      console.log("AI quote stored RAW", {
        text: quote.text,
        length: quote.text.length,
      });

      setDailyQuote(quote);
      addToHistory(quote);
      incrementAiUsage();
      setLastGeneratedAt(Date.now());

      console.log("AI quote stored", {
        id: quote.id,
        textLength: quote.text.length,
      });

      return quote;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Please wait ")) {
        showToast(error.message, "info");
        return null;
      }
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
