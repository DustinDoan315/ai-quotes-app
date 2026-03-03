import { generateQuote } from '@/services/ai/client';
import { useAIStore } from './aiStore';
import { useQuoteStore } from '@/appState/quoteStore';
import { useUIStore } from '@/appState/uiStore';
import { useUserStore } from '@/appState/userStore';

const MAX_PERSONA_TRAITS = 8;
const MAX_PERSONA_TRAIT_LENGTH = 40;

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
  const { setIsGenerating, setLastGeneratedAt } = useAIStore();
  const { setDailyQuote, addToHistory } = useQuoteStore();
  const { persona } = useUserStore();
  const { showToast } = useUIStore();

  const generate = async (imageContext?: string, imageUri?: string) => {
    console.log("AI useGenerateQuote.generate called", {
      hasPersona: !!persona,
      hasImageUri: !!imageUri,
    });

    const effectivePersonaId = persona?.id ?? "guest";
    const effectiveTraits = normalizePersonaTraits(persona?.traits);

    setIsGenerating(true);

    try {
      console.log("AI calling generateQuote service");
      const response = await generateQuote({
        personaId: effectivePersonaId,
        personaTraits: effectiveTraits,
        imageContext,
        imageUri,
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

      setDailyQuote(quote);
      addToHistory(quote);
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
