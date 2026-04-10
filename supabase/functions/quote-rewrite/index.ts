import {
  MAX_QUOTE_LENGTH,
  OPENAI_API_KEY,
  callOpenAI,
  cleanQuote,
  extractOutputText,
  jsonResponse,
  normalizeLanguage,
  normalizeTraits,
  requireAuth,
} from "../_shared/ai.ts";

type RewriteTone = "funny" | "savage" | "calm";

type RewriteQuoteRequestBody = {
  quote: string;
  personaTraits: string[];
  tone: RewriteTone;
  language?: "vi" | "en";
};

type SupportedLanguage = "vi" | "en";

const VALID_TONES: RewriteTone[] = ["funny", "savage", "calm"];

const normalizeForComparison = (value: string): string =>
  value
    .toLowerCase()
    .replace(/["']/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .trim();

const hasMultipleSentences = (value: string): boolean => {
  const sentenceEndings = value.match(/[.!?]+(?=\s|$)/g) ?? [];
  return /\r|\n/.test(value) || sentenceEndings.length > 1;
};

const getToneInstruction = (
  tone: RewriteTone,
  language: SupportedLanguage,
): string => {
  if (language === "en") {
    switch (tone) {
      case "funny":
        return "Make it playful and witty without becoming silly or sarcastic.";
      case "savage":
        return "Make it sharp and bold without being insulting, cruel, or profane.";
      case "calm":
        return "Make it softer, steadier, and more grounding.";
    }
  }

  switch (tone) {
    case "funny":
      return "Biến câu quote thành dí dỏm, nhẹ nhàng, thông minh, không lố.";
    case "savage":
      return "Biến câu quote thành sắc bén và mạnh mẽ nhưng không thô tục hay xúc phạm.";
    case "calm":
      return "Biến câu quote thành dịu hơn, vững vàng hơn và tạo cảm giác an tâm.";
  }
};

const buildRewriteSystemPrompt = (language: SupportedLanguage): string => {
  if (language === "en") {
    return `
Rewrite one motivational quote in English.

Rules:
- Maximum ${MAX_QUOTE_LENGTH} characters
- Return only the rewritten quote
- Keep it as one complete sentence
- Keep the core meaning recognizable
- Make the wording clearly different from the original quote
- Do not wrap the quote in quotation marks
- Avoid profanity, insults, and explicit content
`.trim();
  }

  return `
Viết lại một câu quote động lực bằng tiếng Việt.

Quy tắc:
- Tối đa ${MAX_QUOTE_LENGTH} ký tự
- Chỉ trả về câu quote đã viết lại
- Giữ thành một câu hoàn chỉnh
- Giữ nguyên ý chính dễ nhận ra
- Cách diễn đạt phải khác rõ ràng so với câu gốc
- Không thêm dấu ngoặc kép quanh câu quote
- Không thô tục, xúc phạm hay phản cảm
`.trim();
};

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;

  try {
    if (!OPENAI_API_KEY) {
      return jsonResponse({ error: "Missing OPENAI_API_KEY in environment" }, 500);
    }

    const body = (await req.json()) as RewriteQuoteRequestBody;
    const quote = typeof body.quote === "string" ? body.quote.trim() : "";

    if (!quote) {
      return jsonResponse({ error: "Missing quote" }, 400);
    }

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
    const toneInstruction = getToneInstruction(body.tone, language);

    const response = await callOpenAI({
      model: "gpt-4.1-mini",
      temperature: 0.7,
      max_output_tokens: 120,
      input: [
        {
          role: "system",
          content: buildRewriteSystemPrompt(language),
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

    const cleanedQuote = cleanQuote(rawQuote);

    if (hasMultipleSentences(cleanedQuote)) {
      throw new Error("Rewrite must stay as one sentence");
    }

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
    console.error("Unhandled error in quote-rewrite function:", error);

    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      500,
    );
  }
});
