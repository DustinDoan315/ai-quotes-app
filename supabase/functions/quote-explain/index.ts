import {
  MAX_EXPLANATION_LENGTH,
  OPENAI_API_KEY,
  callOpenAI,
  cleanExplanation,
  extractOutputText,
  jsonResponse,
  normalizeLanguage,
  normalizeTraits,
} from "../_shared/ai.ts";

type ExplainQuoteRequestBody = {
  quote: string;
  personaTraits: string[];
  language?: "vi" | "en";
};

type SupportedLanguage = "vi" | "en";

const buildExplainSystemPrompt = (language: SupportedLanguage): string => {
  if (language === "en") {
    return `
Explain the emotional meaning of a motivational quote in plain English.

Rules:
- Maximum ${MAX_EXPLANATION_LENGTH} characters
- Return only the explanation
- Use at most 2 short sentences
- Keep it warm, concrete, and easy to understand
- Do not use markdown, bullets, or labels
`.trim();
  }

  return `
Giải thích ý nghĩa cảm xúc của một câu quote bằng tiếng Việt tự nhiên.

Quy tắc:
- Tối đa ${MAX_EXPLANATION_LENGTH} ký tự
- Chỉ trả về phần giải thích
- Dùng tối đa 2 câu ngắn
- Giọng văn ấm áp, dễ hiểu, cụ thể
- Không dùng markdown, gạch đầu dòng hoặc nhãn
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

    const body = (await req.json()) as ExplainQuoteRequestBody;
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
      temperature: 0.4,
      max_output_tokens: 180,
      input: [
        {
          role: "system",
          content: buildExplainSystemPrompt(language),
        },
        {
          role: "user",
          content: `
Quote: ${quote}
Persona traits: ${traitsDescription}

Explain what this quote is trying to say to the user and why it may matter emotionally.
Return only the explanation.
          `.trim(),
        },
      ],
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI quote-explain error:", errorText);
      throw new Error("Failed to explain quote");
    }

    const data = await response.json();
    const rawExplanation = extractOutputText(data);

    if (!rawExplanation) {
      console.error("Empty quote-explain response:", JSON.stringify(data));
      throw new Error("Empty explanation generated");
    }

    return jsonResponse({
      explanation: cleanExplanation(rawExplanation),
      language,
    });
  } catch (error) {
    console.error("Unhandled error in quote-explain function:", error);

    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      500,
    );
  }
});
