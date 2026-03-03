import { downscaleImageForGPT } from '@/utils/imageProcessor';
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
  console.log("AI generateQuote called", {
    personaId: request.personaId,
    traitsCount: request.personaTraits.length,
    hasImageUri: !!request.imageUri,
    hasImageContext: !!request.imageContext,
  });

  checkCooldown();

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    return {
      quote: "",
      isValid: false,
      reason: "Missing Supabase URL configuration",
    };
  }

  if (!supabaseAnonKey) {
    return {
      quote: "",
      isValid: false,
      reason: "Missing Supabase anon key configuration",
    };
  }

  try {
    let processedImageContext = request.imageContext;

    if (request.imageUri && !request.imageContext) {
      console.log("AI downscaling image for GPT");
      processedImageContext = await downscaleImageForGPT(request.imageUri);
    }

    console.log("AI calling Supabase quote function", {
      url: `${supabaseUrl}/functions/v1/quote`,
      hasImageContext: !!processedImageContext,
    });

    const response = await fetch(`${supabaseUrl}/functions/v1/quote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        personaTraits: request.personaTraits,
        imageContext: processedImageContext,
      }),
    });

    if (!response.ok) {
      console.error("AI Supabase quote error status", response.status);
      const errorData: { error?: string } = await response
        .json()
        .catch(() => ({}));

      return {
        quote: "",
        isValid: false,
        reason: errorData.error || `HTTP ${response.status}`,
      };
    }

    const data: { quote: string } = await response.json();

    console.log("AI Supabase quote RAW", {
      raw: data.quote,
      length: data.quote?.length ?? 0,
    });

    const sanitized = sanitizeQuote(data.quote);

    console.log("AI Supabase quote sanitized", {
      sanitized,
      length: sanitized.length,
    });
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
    console.error("AI generateQuote unexpected error", error);
    return {
      quote: "",
      isValid: false,
      reason:
        error instanceof Error ? error.message : "Failed to generate quote",
    };
  }
};
