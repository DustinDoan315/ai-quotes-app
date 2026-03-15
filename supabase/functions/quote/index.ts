const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";

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

const MAX_TRAITS = 8;
const MAX_TRAIT_LENGTH = 40;
const MAX_BASE64_LENGTH = 2_000_000;
const MAX_QUOTE_LENGTH = 180;

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
};

const normalizeTraits = (traits: string[]): string[] =>
  traits
    .filter((t) => typeof t === "string" && t.trim().length > 0)
    .map((t) => t.trim().slice(0, MAX_TRAIT_LENGTH))
    .slice(0, MAX_TRAITS);

const normalizeLanguage = (lang?: string): SupportedLanguage => {
  if (!lang) return "vi";

  const value = lang.trim().toLowerCase();

  if (value === "en" || value === "english") return "en";
  return "vi";
};

const cleanBase64Image = (value?: string): string => {
  if (typeof value !== "string" || !value.trim()) return "";

  return value.trim().replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
};

const safeParseJson = <T>(value: string): T | null => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const extractOutputText = (data: unknown): string => {
  const d = data as { output?: Array<{ content?: Array<{ text?: string }> }> };
  if (!Array.isArray(d?.output)) return "";
[][]
  for (const item of d.output) {
    if (!Array.isArray(item?.content)) continue;

    for (const part of item.content) {
      if (typeof part?.text === "string" && part.text.trim()) {
        return part.text.trim();
      }
    }
  }

  return "";
};

const cleanQuote = (value: string): string => {
  let quote = value
    .replace(/^[\"'""'']+|[\"'""'']+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (quote.length > MAX_QUOTE_LENGTH) {
    quote = quote.slice(0, MAX_QUOTE_LENGTH - 3).trimEnd() + "...";
  }

  return quote;
};

const buildQuoteSystemPrompt = (language: SupportedLanguage): string => {
  if (language === "en") {
    return `
  Write exactly one short motivational quote in English.

  Rules:
  - Maximum 180 characters
  - Return only one complete sentence
  - Do not describe the image literally
  - Do not mention camera, photo, image, or scene
  - Use the visual context only as inspiration
  - Keep it natural, concise, and emotionally strong
  `.trim();
  }

  return `
  Write exactly one short motivational quote in Vietnamese.

  Rules:
  - Maximum 180 characters
  - Use full Vietnamese diacritics
  - Do not output ASCII-only Vietnamese
  - Return only one complete sentence
  - Do not describe the image literally
  - Do not mention camera, photo, image, or scene
  - Use the visual context only as inspiration
  - Keep it natural, concise, and emotionally strong
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

const callOpenAI = async (body: unknown) => {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });

  return response;
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
  const response = await callOpenAI({
    model: "gpt-4.1-mini",
    temperature: 0.7,
    max_output_tokens: 120,
    input: [
      {
        role: "system",
        content: buildQuoteSystemPrompt(language),
      },
      {
        role: "user",
        content: `
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

  Write one motivational quote inspired by the feeling and context above.
  Return only the quote.
          `.trim(),
      },
    ],
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI quote-from-vision error:", errorText);
    throw new Error("Failed to generate quote");
  }

  const data = await response.json();
  const text = extractOutputText(data);

  if (!text) {
    console.error("Empty quote-from-vision response:", JSON.stringify(data));
    throw new Error("Empty quote generated");
  }

  return cleanQuote(text);
};

const generateQuoteWithoutImage = async (
  traitsDescription: string,
  language: SupportedLanguage,
): Promise<string> => {
  const response = await callOpenAI({
    model: "gpt-4.1-mini",
    temperature: 0.7,
    max_output_tokens: 120,
    input: [
      {
        role: "system",
        content: buildQuoteSystemPrompt(language),
      },
      {
        role: "user",
        content: `
  Persona traits: ${traitsDescription}

  Write one short motivational quote based on these traits.
  Return only the quote.
          `.trim(),
      },
    ],
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI no-image quote error:", errorText);
    throw new Error("Failed to generate quote");
  }

  const data = await response.json();
  const text = extractOutputText(data);

  if (!text) {
    console.error("Empty no-image quote response:", JSON.stringify(data));
    throw new Error("Empty quote generated");
  }

  return cleanQuote(text);
};

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing OPENAI_API_KEY in environment" }),
        { status: 500, headers: JSON_HEADERS },
      );
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
      return new Response(JSON.stringify({ error: "Missing persona traits" }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    const normalizedTraits = normalizeTraits(personaTraits);

    if (normalizedTraits.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing valid persona traits" }),
        { status: 400, headers: JSON_HEADERS },
      );
    }

    const normalizedLanguage = normalizeLanguage(language);
    const visionLang = normalizeLanguage(visionLanguage ?? "en");
    const traitsDescription = normalizedTraits.join(", ");
    const cleanedBase64 = cleanBase64Image(base64Image);

    if (cleanedBase64 && cleanedBase64.length > MAX_BASE64_LENGTH) {
      return new Response(JSON.stringify({ error: "Image too large" }), {
        status: 400,
        headers: JSON_HEADERS,
      });
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

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (err) {
    console.error("Unhandled error in quote function:", err);

    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Internal server error",
      }),
      { status: 500, headers: JSON_HEADERS },
    );
  }
});
