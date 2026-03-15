import { getQuoteLanguage } from "./quoteLanguage";
import { sanitizeQuote, validateQuote } from "./safety";
import type { GenerateQuoteRequest, GenerateQuoteResponse } from "./types";

function cleanBase64(value: string | undefined): string {
  if (typeof value !== "string" || !value.trim()) return "";
  return value
    .trim()
    .replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
}

export const generateQuote = async (
  request: GenerateQuoteRequest,
): Promise<GenerateQuoteResponse> => {
  console.log("AI generateQuote called", {
    personaId: request.personaId,
    traitsCount: request.personaTraits.length,
    hasBase64Image: !!request.base64Image,
  });

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
    const cleanedBase64 = cleanBase64(request.base64Image);
    const language = request.language ?? getQuoteLanguage();

    const payload: {
      personaTraits: string[];
      base64Image?: string;
      language: "vi" | "en";
      debugVision?: boolean;
    } = {
      personaTraits: request.personaTraits,
      language,
    };
    if (cleanedBase64) payload.base64Image = cleanedBase64;
    if (request.debugVision) payload.debugVision = true;

    console.log("AI calling Supabase quote function", {
      url: `${supabaseUrl}/functions/v1/quote`,
      hasBase64Image: !!cleanedBase64,
      language: payload.language,
    });

    const response = await fetch(`${supabaseUrl}/functions/v1/quote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json().catch(() => ({}));
    console.log("AI quote API response", {
      ok: response.ok,
      status: response.status,
      data: responseData,
    });

    if (!response.ok) {
      const errorData = responseData as { error?: string };
      const serverMessage = errorData.error?.trim();
      const reason =
        serverMessage ||
        (response.status >= 500
          ? "Quote service is temporarily unavailable. Try again in a moment."
          : `Request failed (${response.status})`);
      return {
        quote: "",
        isValid: false,
        reason,
      };
    }

    const data = responseData as { quote?: string };
    const rawQuote = typeof data.quote === "string" ? data.quote : "";

    if (!rawQuote.trim()) {
      return {
        quote: "",
        isValid: false,
        reason: "Empty quote from service",
      };
    }

    const sanitized = sanitizeQuote(rawQuote);
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
