import {
  MAX_BASE64_LENGTH,
  OPENAI_API_KEY,
  callOpenAI,
  cleanBase64Image,
  cleanQuote,
  extractOutputText,
  jsonResponse,
  normalizeLanguage,
  normalizeTraits,
  requireAuth,
  safeParseJson,
} from "../_shared/ai.ts";
import { UsageLimitError, assertAndIncrementUsage, usageLimitResponse } from "../_shared/usage.ts";

if (!OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY in Supabase environment");
}

type QuoteRequestBody = {
  personaTraits: string[];
  base64Image?: string;
  debugVision?: boolean;
  language?: "vi" | "en";
  visionLanguage?: "vi" | "en";
};

type SupportedLanguage = "vi" | "en";

type ImageDetectionResult = {
  scene_summary: string;
  observed_items: string[];
  people: string[];
  animals: string[];
  objects: string[];
  text_in_image: string[];
  setting: string;
  colors: string[];
  mood: string[];
  confidence_note: string;
};

const GENERIC_QUOTE_PATTERNS = [
  /\bstay (strong|positive|focused)\b/i,
  /\bbelieve in yourself\b/i,
  /\bnever give up\b/i,
  /\bkeep going\b/i,
  /\bfollow your dreams\b/i,
  /\bevery day is a new (day|beginning)\b/i,
  /\byou'?ve got this\b/i,
  /\bthe sky is the limit\b/i,
  /\bsuccess is a journey\b/i,
  /\bembrace the journey\b/i,
  /\bchase your dreams\b/i,
  /\bhãy (mạnh mẽ|cố gắng|tin vào bản thân)\b/i,
  /\bđừng bao giờ bỏ cuộc\b/i,
  /\bmỗi ngày là một (khởi đầu|cơ hội)\b/i,
];
const GENERIC_QUOTE_ERROR_MESSAGE =
  "Quote couldn't be generated. Tap Generate to try again.";
const MAX_QUOTE_ATTEMPTS = 2;

const isGenericQuote = (quote: string): boolean => {
  const normalized = quote.trim();

  if (normalized.length < 24) {
    return true;
  }

  return GENERIC_QUOTE_PATTERNS.some((pattern) => pattern.test(normalized));
};

const validateGeneratedQuote = (value: string): string => {
  const quote = cleanQuote(value);

  if (isGenericQuote(quote)) {
    throw new Error(GENERIC_QUOTE_ERROR_MESSAGE);
  }

  return quote;
};

const requestQuoteDraft = async (
  systemPrompt: string,
  userPrompt: string,
  errorLabel: string,
): Promise<string> => {
  const response = await callOpenAI({
    model: "gpt-4.1-mini",
    temperature: 0.7,
    max_output_tokens: 120,
    input: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`OpenAI ${errorLabel} error:`, errorText);
    throw new Error("Failed to generate quote");
  }

  const data = await response.json();
  const text = extractOutputText(data);

  if (!text) {
    console.error(`Empty ${errorLabel} response:`, JSON.stringify(data));
    throw new Error("Empty quote generated");
  }

  return text;
};

const generateQualityQuote = async (
  systemPrompt: string,
  baseUserPrompt: string,
  errorLabel: string,
): Promise<string> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_QUOTE_ATTEMPTS; attempt += 1) {
    const userPrompt =
      attempt === 0
        ? baseUserPrompt
        : `${baseUserPrompt}

Previous draft was rejected because it sounded generic. Rewrite it with a more specific emotional detail and no cliché phrases.`;

    const draft = await requestQuoteDraft(systemPrompt, userPrompt, errorLabel);

    try {
      return validateGeneratedQuote(draft);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === GENERIC_QUOTE_ERROR_MESSAGE
      ) {
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  throw lastError ?? new Error("Failed to generate quote");
};

const buildQuoteSystemPrompt = (language: SupportedLanguage): string => {
  if (language === "en") {
    return `
  You write personal quotes for a photo-based daily journal app.

  Write exactly one short motivational quote in English.

  Rules:
  - Maximum 180 characters
  - Return only one complete sentence
  - Do not describe the image literally
  - Do not mention camera, photo, image, or scene
  - Use one specific emotional detail from the user context
  - Prefer "you" or "I" so it feels personal
  - Avoid generic advice, slogans, and clichés
  - Do not use phrases like "stay strong", "keep going", "never give up", "believe in yourself", "embrace the journey", or "success is a journey"
  - Keep it natural, concise, concrete, and emotionally strong
  - If your first draft sounds like a generic motivational poster, rewrite it before returning
  `.trim();
  }

  return `
  Bạn viết quote cá nhân cho một app nhật ký hằng ngày bằng hình ảnh.

  Viết đúng một câu quote động lực ngắn bằng tiếng Việt.

  Rules:
  - Maximum 180 characters
  - Use full Vietnamese diacritics
  - Do not output ASCII-only Vietnamese
  - Return only one complete sentence
  - Do not describe the image literally
  - Do not mention camera, photo, image, or scene
  - Dựa vào một chi tiết cảm xúc cụ thể từ ngữ cảnh của người dùng
  - Ưu tiên giọng "bạn" hoặc "mình" để câu quote có cảm giác cá nhân
  - Tránh lời khuyên chung chung, khẩu hiệu, và sáo rỗng
  - Không dùng các ý như "hãy mạnh mẽ", "cố gắng lên", "đừng bao giờ bỏ cuộc", "tin vào bản thân", hoặc "mỗi ngày là một cơ hội"
  - Giữ câu tự nhiên, ngắn, cụ thể, và có lực cảm xúc
  - Nếu bản nháp đầu nghe như poster động lực chung chung, hãy viết lại trước khi trả về
  `.trim();
};

const buildVisionPrompt = (language: SupportedLanguage): string => {
  if (language === "en") {
    return `
  Analyze this image and return:
  - scene_summary: one short sentence
  - observed_items: main visible items
  - people: visible people or person descriptors
  - animals: visible animals
  - objects: visible non-living objects
  - text_in_image: any readable text visible in the image
  - setting: place or environment type
  - colors: dominant visible colors
  - mood: likely mood conveyed by the image
  - confidence_note: short note about certainty
  `.trim();
  }

  return `
  Phân tích hình ảnh này và trả về:
  - scene_summary: một câu ngắn mô tả cảnh chính
  - observed_items: các chi tiết chính nhìn thấy được
  - people: người xuất hiện hoặc mô tả ngắn về họ
  - animals: động vật xuất hiện
  - objects: đồ vật vô tri xuất hiện
  - text_in_image: chữ thật sự nhìn thấy trong ảnh
  - setting: loại bối cảnh hoặc môi trường
  - colors: các màu nổi bật
  - mood: cảm xúc hoặc không khí mà ảnh gợi ra
  - confidence_note: ghi chú ngắn về mức độ chắc chắn
  `.trim();
};

const detectImage = async (
  cleanedBase64: string,
  language: SupportedLanguage,
): Promise<ImageDetectionResult> => {
  const response = await callOpenAI({
    model: "gpt-4.1-mini",
    temperature: 0.2,
    max_output_tokens: 400,
    input: [
      {
        role: "system",
        content: `
  You analyze images and return only valid JSON.

  Rules:
  - Return JSON only
  - Do not use markdown
  - Do not add explanation outside JSON
  - Report only what is visually supported by the image
  - If uncertain, mention uncertainty in confidence_note
  - text_in_image must contain only text actually visible in the image
  - If no visible text exists, return an empty array
          `.trim(),
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: buildVisionPrompt(language),
          },
          {
            type: "input_image",
            image_url: `data:image/jpeg;base64,${cleanedBase64}`,
            detail: "high",
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "image_detection_result",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            scene_summary: { type: "string" },
            observed_items: {
              type: "array",
              items: { type: "string" },
            },
            people: {
              type: "array",
              items: { type: "string" },
            },
            animals: {
              type: "array",
              items: { type: "string" },
            },
            objects: {
              type: "array",
              items: { type: "string" },
            },
            text_in_image: {
              type: "array",
              items: { type: "string" },
            },
            setting: { type: "string" },
            colors: {
              type: "array",
              items: { type: "string" },
            },
            mood: {
              type: "array",
              items: { type: "string" },
            },
            confidence_note: { type: "string" },
          },
          required: [
            "scene_summary",
            "observed_items",
            "people",
            "animals",
            "objects",
            "text_in_image",
            "setting",
            "colors",
            "mood",
            "confidence_note",
          ],
        },
      },
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI vision error:", errorText);
    throw new Error("Failed to analyze image");
  }

  const data = await response.json();
  const rawText = extractOutputText(data);

  if (!rawText) {
    console.error("Empty vision response:", JSON.stringify(data));
    throw new Error("Empty image analysis");
  }

  const parsed = safeParseJson<ImageDetectionResult>(rawText);

  if (!parsed) {
    console.error("Invalid vision JSON:", rawText);
    throw new Error("Invalid image analysis");
  }

  return parsed;
};

const generateQuoteFromVision = async (
  traitsDescription: string,
  vision: ImageDetectionResult,
  language: SupportedLanguage,
): Promise<string> => {
  return generateQualityQuote(
    buildQuoteSystemPrompt(language),
    `
  Persona traits: ${traitsDescription}

  Image understanding:
  - Scene summary: ${vision.scene_summary}
  - Observed items: ${vision.observed_items.join(", ") || "none"}
  - People: ${vision.people.join(", ") || "none"}
  - Animals: ${vision.animals.join(", ") || "none"}
  - Objects: ${vision.objects.join(", ") || "none"}
  - Setting: ${vision.setting || "unknown"}
  - Colors: ${vision.colors.join(", ") || "unknown"}
  - Mood: ${vision.mood.join(", ") || "neutral"}

  Write one quote that captures the emotional meaning of this exact context.
  Anchor it in one concrete detail from the context, but do not describe the image.
  Return only the quote.
          `.trim(),
    "quote-from-vision",
  );
};

const generateQuoteWithoutImage = async (
  traitsDescription: string,
  language: SupportedLanguage,
): Promise<string> => {
  return generateQualityQuote(
    buildQuoteSystemPrompt(language),
    `
  Persona traits: ${traitsDescription}

  Write one short quote that feels like it was written for this specific person today.
  Use the traits as emotional direction, not as labels.
  Avoid generic motivational language.
  Return only the quote.
          `.trim(),
    "no-image quote",
  );
};

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;

  try {
    await assertAndIncrementUsage(authResult.userId);

    if (!OPENAI_API_KEY) {
      return jsonResponse({ error: "Missing OPENAI_API_KEY in environment" }, 500);
    }

    const body = (await req.json()) as QuoteRequestBody;
    const {
      personaTraits,
      base64Image,
      debugVision = false,
      language,
      visionLanguage,
    } = body;

    if (!Array.isArray(personaTraits) || personaTraits.length === 0) {
      return jsonResponse({ error: "Missing persona traits" }, 400);
    }

    const normalizedTraits = normalizeTraits(personaTraits);

    if (normalizedTraits.length === 0) {
      return jsonResponse({ error: "Missing valid persona traits" }, 400);
    }

    const normalizedLanguage = normalizeLanguage(language);
    const visionLang = normalizeLanguage(visionLanguage ?? "en");
    const traitsDescription = normalizedTraits.join(", ");
    const cleanedBase64 = cleanBase64Image(base64Image);

    if (cleanedBase64 && cleanedBase64.length > MAX_BASE64_LENGTH) {
      return jsonResponse({ error: "Image too large" }, 400);
    }

    let visionDebug: ImageDetectionResult | null = null;
    let quote = "";

    if (cleanedBase64) {
      visionDebug = await detectImage(cleanedBase64, visionLang);
      quote = await generateQuoteFromVision(
        traitsDescription,
        visionDebug,
        normalizedLanguage,
      );
    } else {
      quote = await generateQuoteWithoutImage(
        traitsDescription,
        normalizedLanguage,
      );
    }

    const payload = debugVision
      ? {
          quote,
          language: normalizedLanguage,
          visionDebug,
        }
      : {
          quote,
          language: normalizedLanguage,
        };

    return jsonResponse(payload);
  } catch (err) {
    if (err instanceof UsageLimitError) return usageLimitResponse();
    console.error("Unhandled error in quote function:", err);

    return jsonResponse(
      {
        error: err instanceof Error ? err.message : "Internal server error",
      },
      500,
    );
  }
});
