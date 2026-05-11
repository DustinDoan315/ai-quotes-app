export const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";

// The Supabase gateway validates the JWT signature before the function runs.
// We only need to decode the payload to extract the user ID.
export const requireAuth = (req: Request): { userId: string } | Response => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.slice(7).trim();

  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const raw = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = raw + "=".repeat((4 - (raw.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { sub?: string; role?: string; exp?: number };

    if (payload.role !== "authenticated" || !payload.sub) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    return { userId: payload.sub };
  } catch (err) {
    console.error("[requireAuth] exception:", err);
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
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
  if (!language) return "vi";

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
      content?: Array<{ text?: string }>;
    }>;
  };

  if (!Array.isArray(payload?.output)) return "";

  for (const item of payload.output) {
    if (!Array.isArray(item?.content)) continue;

    for (const part of item.content) {
      if (typeof part?.text === "string" && part.text.trim()) {
        return part.text.trim();
      }
    }
  }

  return "";
};

export const cleanQuote = (value: string): string => {
  let quote = value
    .replace(/^[\"'""'']+|[\"'""'']+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (quote.length > MAX_QUOTE_LENGTH) {
    quote = quote.slice(0, MAX_QUOTE_LENGTH).trimEnd();
  }

  return quote;
};

export const cleanExplanation = (value: string): string => {
  let explanation = value.replace(/\s+/g, " ").trim();

  if (explanation.length > MAX_EXPLANATION_LENGTH) {
    explanation = `${explanation.slice(0, MAX_EXPLANATION_LENGTH - 3).trimEnd()}...`;
  }

  return explanation;
};

export const callOpenAI = async (body: unknown) => {
  return fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });
};

export const jsonResponse = (payload: unknown, status: number = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS,
  });
