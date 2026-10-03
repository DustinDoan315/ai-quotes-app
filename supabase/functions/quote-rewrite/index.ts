import {
  buildRewriteSystemPrompt,
  getRewriteToneInstruction,
  type RewriteTone,
} from "../_shared/quoteVoice.ts";
import {
  callOpenAI,
  extractOutputText,
  jsonResponse,
  MAX_QUOTE_LENGTH,
  normalizeLanguage,
  normalizeTraits,
  OPENAI_API_KEY,
  readQuoteInput,
  requireAuth,
  validateGeneratedQuote,
} from "../_shared/ai.ts";
import {
  assertAndIncrementUsage,
  UsageLimitError,
  usageLimitResponse,
} from "../_shared/usage.ts";

type RewriteQuoteRequestBody = {
  quote: string;
  personaTraits: string[];
  tone: RewriteTone;
  language?: "vi" | "en";
};

const VALID_TONES: RewriteTone[] = ["funny", "savage", "calm"];

const normalizeForComparison = (value: string): string =>
  value
    .toLowerCase()
    .replace(/["']/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .trim();

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;

  try {
    if (!OPENAI_API_KEY) {
      return jsonResponse(
        { error: "Missing OPENAI_API_KEY in environment" },
        500,
      );
    }

    const body = (await req.json()) as RewriteQuoteRequestBody;
    const quoteInput = readQuoteInput(body.quote);
    if (!quoteInput.ok) return jsonResponse({ error: quoteInput.error }, 400);
    const quote = quoteInput.quote;

    if (!Array.isArray(body.personaTraits) || body.personaTraits.length === 0) {
      return jsonResponse({ error: "Missing persona traits" }, 400);
    }

    const normalizedTraits = normalizeTraits(body.personaTraits);

    if (normalizedTraits.length === 0) {
      return jsonResponse({ error: "Missing valid persona traits" }, 400);
    }

    if (!VALID_TONES.includes(body.tone)) {
      return jsonResponse({ error: "Invalid rewrite tone" }, 400);
    }

    const language = normalizeLanguage(body.language);
    const traitsDescription = normalizedTraits.join(", ");
    const toneInstruction = getRewriteToneInstruction(body.tone, language);

    await assertAndIncrementUsage(authResult.userId);

    const response = await callOpenAI({
      model: "gpt-4.1-mini",
      temperature: 0.7,
      max_output_tokens: 120,
      input: [
        {
          role: "system",
          content: buildRewriteSystemPrompt(language, MAX_QUOTE_LENGTH),
        },
        {
          role: "user",
          content: `
Original quote: ${quote}
Persona traits: ${traitsDescription}
Tone target: ${body.tone}

${toneInstruction}
Return only the rewritten quote.
          `.trim(),
        },
      ],
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI quote-rewrite error:", errorText);
      throw new Error("Failed to rewrite quote");
    }

    const data = await response.json();
    const rawQuote = extractOutputText(data);

    if (!rawQuote) {
      console.error("Empty quote-rewrite response:", JSON.stringify(data));
      throw new Error("Empty rewritten quote generated");
    }

    const generatedQuote = validateGeneratedQuote(rawQuote);
    if (!generatedQuote.ok) throw new Error(generatedQuote.error);
    const cleanedQuote = generatedQuote.quote;

    if (
      normalizeForComparison(cleanedQuote) === normalizeForComparison(quote)
    ) {
      throw new Error("Rewrite is too similar to the original quote");
    }

    return jsonResponse({
      quote: cleanedQuote,
      language,
      tone: body.tone,
    });
  } catch (error) {
    if (error instanceof UsageLimitError) return usageLimitResponse();
    console.error("Unhandled error in quote-rewrite function:", error);

    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      500,
    );
  }
});
