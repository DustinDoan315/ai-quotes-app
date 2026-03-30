import {
  OPENAI_API_KEY,
  callOpenAI,
  cleanQuote,
  extractOutputText,
  jsonResponse,
  normalizeLanguage,
  normalizeTraits,
} from "../_shared/ai.ts";

type FutureQuoteRequestBody = {
  quote: string;
  personaTraits: string[];
  language?: "vi" | "en";
};

type SupportedLanguage = "vi" | "en";

const buildFutureSystemPrompt = (language: SupportedLanguage): string => {
  if (language === "en") {
    return `
Write one future-facing motivational quote in English.

Rules:
- Maximum 180 characters
- Return only one complete sentence
- Build on the source quote without repeating it word-for-word
- Keep the tone warm, specific, and emotionally grounded
- Do not use markdown, labels, or explanation
`.trim();
  }

  return `
Viết một câu quote động lực hướng về tương lai bằng tiếng Việt.

Quy tắc:
- Tối đa 180 ký tự
- Chỉ trả về một câu hoàn chỉnh
- Phát triển từ câu gốc nhưng không lặp lại nguyên văn
- Giữ giọng văn ấm áp, cụ thể, có cảm xúc
- Không dùng markdown, nhãn hay giải thích
`.trim();
};

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    if (!OPENAI_API_KEY) {
      return jsonResponse({ error: "Missing OPENAI_API_KEY in environment" }, 500);
    }

    const body = (await req.json()) as FutureQuoteRequestBody;
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

    const language = normalizeLanguage(body.language);
    const traitsDescription = normalizedTraits.join(", ");

    const response = await callOpenAI({
      model: "gpt-4.1-mini",
      temperature: 0.8,
      max_output_tokens: 120,
      input: [
        {
          role: "system",
          content: buildFutureSystemPrompt(language),
        },
        {
          role: "user",
          content: `
Source quote: ${quote}
Persona traits: ${traitsDescription}

Write the next quote this person may need to hear if they are moving one step further from today's feeling toward tomorrow.
Return only the quote.
          `.trim(),
        },
      ],
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI quote-future error:", errorText);
      throw new Error("Failed to generate future quote");
    }

    const data = await response.json();
    const rawQuote = extractOutputText(data);

    if (!rawQuote) {
      console.error("Empty quote-future response:", JSON.stringify(data));
      throw new Error("Empty future quote generated");
    }

    return jsonResponse({
      quote: cleanQuote(rawQuote),
      language,
    });
  } catch (error) {
    console.error("Unhandled error in quote-future function:", error);

    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      500,
    );
  }
});
