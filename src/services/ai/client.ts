import { apiClient } from '../api/client';
import { buildQuotePrompt } from './prompts';
import { downscaleImageForGPT } from '@/utils/imageProcessor';
import { GPT_CONFIG } from './config';
import { sanitizeQuote, validateQuote } from './safety';
import type { GenerateQuoteRequest, GenerateQuoteResponse } from "./types";


const COOLDOWN_MS = 10000;
let lastRequestTime = 0;

const checkCooldown = (): void => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < COOLDOWN_MS) {
    const waitTime = COOLDOWN_MS - timeSinceLastRequest;
    throw new Error(
      `Please wait ${Math.ceil(waitTime / 1000)} seconds before generating another quote`,
    );
  }

  lastRequestTime = now;
};

export const generateQuote = async (
  request: GenerateQuoteRequest,
): Promise<GenerateQuoteResponse> => {
  checkCooldown();

  try {
    let processedImageContext = request.imageContext;

    if (request.imageUri && !request.imageContext) {
      processedImageContext = await downscaleImageForGPT(request.imageUri);
    }

    const prompt = buildQuotePrompt({
      ...request,
      imageContext: processedImageContext,
    });

    const response = await apiClient.post<{ quote: string }>(
      "/ai/generate-quote",
      {
        prompt,
        personaId: request.personaId,
        personaTraits: request.personaTraits,
        imageContext: processedImageContext,
        model: request.model || GPT_CONFIG.model,
      },
    );

    const sanitized = sanitizeQuote(response.quote);
    const validation = validateQuote(sanitized);

    if (!validation.isValid) {
      return {
        quote: "",
        isValid: false,
        reason: validation.reason,
      };
    }

    return {
      quote: sanitized,
      isValid: true,
    };
  } catch (error) {
    return {
      quote: "",
      isValid: false,
      reason:
        error instanceof Error ? error.message : "Failed to generate quote",
    };
  }
};
