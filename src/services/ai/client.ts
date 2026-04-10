import { supabase } from "@/config/supabase";
import { getQuoteLanguage } from "./quoteLanguage";
import { validateRewriteReviewQuote } from "./rewriteReview";
import { sanitizeQuote, validateQuote } from "./safety";
import type {
  GenerateQuoteRequest,
  GenerateQuoteResponse,
  ExplainQuoteRequest,
  ExplainQuoteResponse,
  RewriteQuoteRequest,
  RewriteQuoteResponse,
  FutureQuoteRequest,
  FutureQuoteResponse,
} from "./types";

function cleanBase64(value: string | undefined): string {
  if (typeof value !== "string" || !value.trim()) return "";
  return value
    .trim()
    .replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
}

async function callEdgeFunction(
  name: string,
  payload: object,
): Promise<{ response: Response; data: Record<string, unknown> }> {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase configuration");
  }

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? supabaseAnonKey;

  const response = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({})) as Record<string, unknown>;
  return { response, data };
}

export const generateQuote = async (
  request: GenerateQuoteRequest,
): Promise<GenerateQuoteResponse> => {
  try {
    const cleanedBase64 = cleanBase64(request.base64Image);
    const language = request.language ?? getQuoteLanguage();
    const visionLanguage = request.visionLanguage ?? "en";

    const payload: {
      personaTraits: string[];
      base64Image?: string;
      language: "vi" | "en";
      visionLanguage?: "vi" | "en";
      debugVision?: boolean;
    } = {
      personaTraits: request.personaTraits,
      language,
      visionLanguage,
    };
    if (cleanedBase64) payload.base64Image = cleanedBase64;
    if (request.debugVision) payload.debugVision = true;

    const { response, data } = await callEdgeFunction("quote", payload);

    if (!response.ok) {
      const serverMessage = (data.error as string | undefined)?.trim();
      const reason =
        serverMessage ||
        (response.status >= 500
          ? "Quote couldn't be generated. Tap Generate to try again."
          : `Request failed (${response.status})`);
      return { quote: "", isValid: false, reason };
    }

    const rawQuote = typeof data.quote === "string" ? data.quote : "";
    if (!rawQuote.trim()) {
      return { quote: "", isValid: false, reason: "Empty quote from service" };
    }

    const sanitized = sanitizeQuote(rawQuote);
    const validation = validateQuote(sanitized);
    if (!validation.isValid) {
      return { quote: "", isValid: false, reason: validation.reason };
    }

    return { quote: sanitized, isValid: true };
  } catch (error) {
    return {
      quote: "",
      isValid: false,
      reason: error instanceof Error ? error.message : "Failed to generate quote",
    };
  }
};

export const explainQuote = async (
  request: ExplainQuoteRequest,
): Promise<ExplainQuoteResponse> => {
  try {
    const { response, data } = await callEdgeFunction("quote-explain", {
      quote: request.quote,
      personaTraits: request.personaTraits,
      language: request.language ?? getQuoteLanguage(),
    });

    if (!response.ok) {
      const serverMessage = (data.error as string | undefined)?.trim();
      return {
        explanation: "",
        isValid: false,
        reason: serverMessage || `Request failed (${response.status})`,
      };
    }

    const explanation =
      typeof data.explanation === "string" ? data.explanation.trim() : "";
    if (!explanation) {
      return { explanation: "", isValid: false, reason: "Empty explanation from service" };
    }

    return { explanation, isValid: true };
  } catch (error) {
    return {
      explanation: "",
      isValid: false,
      reason: error instanceof Error ? error.message : "Failed to explain quote",
    };
  }
};

export const rewriteQuote = async (
  request: RewriteQuoteRequest,
): Promise<RewriteQuoteResponse> => {
  try {
    const { response, data } = await callEdgeFunction("quote-rewrite", {
      quote: request.quote,
      personaTraits: request.personaTraits,
      tone: request.tone,
      language: request.language ?? getQuoteLanguage(),
    });

    if (!response.ok) {
      const serverMessage = (data.error as string | undefined)?.trim();
      return {
        quote: "",
        isValid: false,
        reason: serverMessage || `Request failed (${response.status})`,
      };
    }

    const rawQuote = typeof data.quote === "string" ? data.quote : "";
    if (!rawQuote.trim()) {
      return { quote: "", isValid: false, reason: "Empty quote from service" };
    }

    const rewriteValidation = validateRewriteReviewQuote(rawQuote, request.quote);
    if (!rewriteValidation.isValid) {
      return { quote: "", isValid: false, reason: rewriteValidation.reason };
    }

    return { quote: rewriteValidation.sanitizedQuote, isValid: true };
  } catch (error) {
    return {
      quote: "",
      isValid: false,
      reason: error instanceof Error ? error.message : "Failed to rewrite quote",
    };
  }
};

export const generateFutureQuote = async (
  request: FutureQuoteRequest,
): Promise<FutureQuoteResponse> => {
  try {
    const { response, data } = await callEdgeFunction("quote-future", {
      quote: request.quote,
      personaTraits: request.personaTraits,
      language: request.language ?? getQuoteLanguage(),
    });

    if (!response.ok) {
      const serverMessage = (data.error as string | undefined)?.trim();
      return {
        quote: "",
        isValid: false,
        reason: serverMessage || `Request failed (${response.status})`,
      };
    }

    const rawQuote = typeof data.quote === "string" ? data.quote : "";
    if (!rawQuote.trim()) {
      return { quote: "", isValid: false, reason: "Empty quote from service" };
    }

    const sanitized = sanitizeQuote(rawQuote);
    const validation = validateQuote(sanitized);
    if (!validation.isValid) {
      return { quote: "", isValid: false, reason: validation.reason };
    }

    return { quote: sanitized, isValid: true };
  } catch (error) {
    return {
      quote: "",
      isValid: false,
      reason: error instanceof Error ? error.message : "Failed to generate future quote",
    };
  }
};
