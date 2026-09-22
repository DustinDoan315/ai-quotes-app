import {
  MAX_BASE64_LENGTH,
  OPENAI_API_KEY,
  callOpenAI,
  cleanBase64Image,
  extractOutputText,
  jsonResponse,
  normalizeLanguage,
  normalizeTraits,
  parseStructuredQuote,
  requireAuth,
  shouldRetryQuote,
} from "../_shared/ai.ts";
import {
  UsageLimitError,
  assertAndIncrementUsage,
  usageLimitResponse,
} from "../_shared/usage.ts";

type QuoteRequestBody = {
  personaTraits: string[];
  base64Image?: string;
  momentContext?: string;
  language?: "vi" | "en";
};

type SupportedLanguage = "vi" | "en";

const CREATIVE_MODEL = "gpt-4.1";
const GENERATION_ERROR_MESSAGE =
  "Quote couldn't be generated. Tap Generate to try again.";

const normalizeMomentContext = (value: unknown): string =>
  typeof value === "string" ? value.trim().slice(0, 180) : "";

const buildSystemPrompt = (language: SupportedLanguage): string =>
  language === "en"
    ? `Write one personal, emotionally precise quote in English for a photo journal.

Signal priority: the user's stated feeling is authoritative; use the photo only for one concrete supporting detail; use persona traits only to shape voice.

Return one natural complete sentence of at most 180 characters. Do not describe the image literally or mention a photo, camera, or scene. Avoid slogans, clichés, generic advice, profanity, and quotation marks.`
    : `Viết một quote cá nhân, giàu cảm xúc bằng tiếng Việt cho nhật ký ảnh.

Thứ tự ưu tiên: cảm xúc người dùng tự nói là quan trọng nhất; chỉ dùng ảnh để lấy một chi tiết cụ thể hỗ trợ; traits chỉ định hình giọng văn.

Chỉ trả về một câu tự nhiên, hoàn chỉnh, tối đa 180 ký tự. Không mô tả ảnh theo nghĩa đen hoặc nhắc đến ảnh, camera, hay khung cảnh. Tránh khẩu hiệu, sáo rỗng, lời khuyên chung chung, thô tục và dấu ngoặc kép.`;

const buildInput = (
  traitsDescription: string,
  momentContext: string,
  image: string,
  retryInstruction = "",
) => [
  {
    role: "user",
    content: [
      {
        type: "input_text",
        text: `User's stated feeling (primary signal): ${momentContext || "none"}\nPersona traits (voice only): ${traitsDescription}\n${retryInstruction}`,
      },
      ...(image
        ? [
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${image}`,
              detail: "low",
            },
          ]
        : []),
    ],
  },
];

const generateMatchedQuote = async (
  systemPrompt: string,
  traitsDescription: string,
  momentContext: string,
  image: string,
  retryInstruction = "",
) => {
  const response = await callOpenAI({
    model: CREATIVE_MODEL,
    temperature: 0.8,
    max_output_tokens: 96,
    input: [
      { role: "system", content: systemPrompt },
      ...buildInput(traitsDescription, momentContext, image, retryInstruction),
    ],
    text: {
      format: {
        type: "json_schema",
        name: "quote_result",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: { quote: { type: "string" } },
          required: ["quote"],
        },
      },
    },
  });

  if (!response.ok) {
    console.error("OpenAI quote error:", response.status);
    throw new Error(GENERATION_ERROR_MESSAGE);
  }

  return parseStructuredQuote(extractOutputText(await response.json()));
};

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;

  try {
    const body = (await req.json()) as QuoteRequestBody;
    if (!Array.isArray(body.personaTraits) || body.personaTraits.length === 0) {
      return jsonResponse({ error: "Missing persona traits" }, 400);
    }

    const traits = normalizeTraits(body.personaTraits);
    if (traits.length === 0) {
      return jsonResponse({ error: "Missing valid persona traits" }, 400);
    }

    const image = cleanBase64Image(body.base64Image);
    if (image && image.length > MAX_BASE64_LENGTH) {
      return jsonResponse({ error: "Image too large" }, 400);
    }
    if (!OPENAI_API_KEY) {
      return jsonResponse({ error: "Missing OPENAI_API_KEY in environment" }, 500);
    }

    await assertAndIncrementUsage(authResult.userId);

    const language = normalizeLanguage(body.language);
    const systemPrompt = buildSystemPrompt(language);
    const traitsDescription = traits.join(", ");
    const momentContext = normalizeMomentContext(body.momentContext);
    let result = await generateMatchedQuote(
      systemPrompt,
      traitsDescription,
      momentContext,
      image,
    );

    if (shouldRetryQuote(result)) {
      result = await generateMatchedQuote(
        systemPrompt,
        traitsDescription,
        momentContext,
        image,
        "The previous draft was generic or invalid. Write a distinctly more concrete, personal alternative.",
      );
    }

    if (!result.ok || shouldRetryQuote(result)) {
      throw new Error(GENERATION_ERROR_MESSAGE);
    }

    return jsonResponse({ quote: result.quote, language });
  } catch (error) {
    if (error instanceof UsageLimitError) return usageLimitResponse();
    console.error(
      "Unhandled error in quote function:",
      error instanceof Error ? error.message : error,
    );
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Internal server error" },
      500,
    );
  }
});
