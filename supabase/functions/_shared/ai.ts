import { adminClient } from "./admin.ts";

export const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";

export const requireAuth = async (
  req: Request,
): Promise<{ userId: string } | Response> => {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim();
  if (!token) return jsonResponse({ error: "Unauthorized" }, 401);

  const { data, error } = await adminClient.auth.getUser(token);
  if (error || !data.user) return jsonResponse({ error: "Unauthorized" }, 401);

  return { userId: data.user.id };
};

export const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
};

export type SupportedLanguage = "vi" | "en";

export const MAX_TRAITS = 8;
export const MAX_TRAIT_LENGTH = 40;
export const MAX_BASE64_LENGTH = 2_000_000;
export const MAX_QUOTE_LENGTH = 180;
export const MAX_EXPLANATION_LENGTH = 320;

export const normalizeTraits = (traits: string[]): string[] =>
  traits
    .filter((trait) => typeof trait === "string" && trait.trim().length > 0)
    .map((trait) => trait.trim().slice(0, MAX_TRAIT_LENGTH))
    .slice(0, MAX_TRAITS);

export const normalizeLanguage = (language?: string): SupportedLanguage => {
  if (!language) return "en";

  const value = language.trim().toLowerCase();

  if (value === "en" || value === "english") return "en";
  return "vi";
};

export const cleanBase64Image = (value?: string): string => {
  if (typeof value !== "string" || !value.trim()) return "";

  return value.trim().replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
};

export const safeParseJson = <T>(value: string): T | null => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const extractOutputText = (data: unknown): string => {
  const payload = data as {
    output?: Array<{
      content?: Array<{ type?: string; text?: string }>;
    }>;
  };

  if (!Array.isArray(payload?.output)) return "";

  for (const item of payload.output) {
    if (!Array.isArray(item?.content)) continue;

    for (const part of item.content) {
      if (part?.type === "refusal") continue;
      if (typeof part?.text === "string" && part.text.trim()) {
        return part.text.trim();
      }
    }
  }

  return "";
};

export const cleanQuote = (value: string): string =>
  value
    .replace(/^[\"'""'']+|[\"'""'']+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

export type QuoteValidationResult =
  | { ok: true; quote: string }
  | { ok: false; error: string };

export const readQuoteInput = (value: unknown): QuoteValidationResult => {
  if (typeof value !== "string") {
    return { ok: false, error: "Missing quote" };
  }

  const quote = cleanQuote(value);
  if (!quote) return { ok: false, error: "Missing quote" };
  if (quote.length > MAX_QUOTE_LENGTH) {
    return { ok: false, error: "Quote exceeds 180 characters" };
  }

  return { ok: true, quote };
};

export const validateGeneratedQuote = (
  value: unknown,
): QuoteValidationResult => {
  const parsed = readQuoteInput(value);
  if (!parsed.ok) return parsed;

  const sentenceEndings = parsed.quote.match(/[.!?]+(?=\s|$)/g) ?? [];
  if (sentenceEndings.length > 1) {
    return { ok: false, error: "Quote must stay as one sentence" };
  }

  return parsed;
};

export const cleanExplanation = (value: string): string => {
  let explanation = value.replace(/\s+/g, " ").trim();

  if (explanation.length > MAX_EXPLANATION_LENGTH) {
    explanation = `${explanation.slice(0, MAX_EXPLANATION_LENGTH - 3).trimEnd()}...`;
  }

  return explanation;
};

export type OpenAIRequestBody = {
  model: string;
  input: unknown;
  temperature?: number;
  top_p?: number;
  max_output_tokens?: number;
  text?: {
    format?: {
      type: string;
      name?: string;
      schema?: Record<string, unknown>;
      strict?: boolean;
    };
  };
};

export const callOpenAI = async (body: OpenAIRequestBody) => {
  return fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({ ...body, store: false }),
  });
};

export const callOpenAIText = async (body: OpenAIRequestBody): Promise<string> => {
  const res = await callOpenAI(body);
  if (!res.ok) {
    console.error("OpenAI error:", await res.text());
    throw new Error("OpenAI request failed");
  }
  return extractOutputText(await res.json());
};

export const jsonResponse = (payload: unknown, status: number = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS,
  });
