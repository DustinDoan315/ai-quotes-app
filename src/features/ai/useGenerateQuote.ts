import { generateQuote } from '@/services/ai/client';
import { useAIStore } from './aiStore';
import { useQuoteStore } from '@/appState/quoteStore';
import { useUIStore } from '@/appState/uiStore';
import { useUserStore } from '@/appState/userStore';

export const useGenerateQuote = () => {
  const { setIsGenerating, setLastGeneratedAt } = useAIStore();
  const { setDailyQuote, addToHistory } = useQuoteStore();
  const { persona } = useUserStore();
  const { showToast } = useUIStore();

  const generate = async (imageContext?: string, imageUri?: string) => {
    if (!persona) {
      showToast("Please complete onboarding first", "error");
      return null;
    }

    setIsGenerating(true);

    try {
      const response = await generateQuote({
        personaId: persona.id,
        personaTraits: persona.traits,
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
        personaId: persona.id,
        createdAt: Date.now(),
      };

      setDailyQuote(quote);
      addToHistory(quote);
      setLastGeneratedAt(Date.now());

      return quote;
    } catch (error) {
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
