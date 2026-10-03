import { parseStructuredQuote, validateGeneratedQuote } from "./ai.ts";
import {
  buildGenerationSystemPrompt,
  buildRewriteSystemPrompt,
  getRewriteToneInstruction,
} from "./quoteVoice.ts";

const assert = (value: boolean, reason: string) => {
  if (!value) throw new Error(reason);
};
for (const language of ["en", "vi"] as const) {
  Deno.test(`${language} generation preserves emotion/photo/persona priority and optional expression`, () => {
    const prompt = buildGenerationSystemPrompt(language);
    const required = language === "en"
      ? [
        "English",
        "stated feeling",
        "primary content signal",
        "voice",
        "180",
        "fragments",
        "0–2",
        "occasionally",
        "Never force",
        "Avoid",
      ]
      : [
        "tiếng Việt",
        "nêu cảm xúc",
        "tín hiệu nội dung chính",
        "giọng",
        "180",
        "cụm ngắn",
        "0–2",
        "Thỉnh thoảng",
        "Không ép",
        "Tránh",
      ];
    for (const phrase of required) {
      assert(prompt.includes(phrase), `Missing ${phrase}`);
    }
    assert(
      !/complete sentence|câu.*hoàn chỉnh/.test(prompt),
      "Must permit caption fragments",
    );
  });
  Deno.test(`${language} rewrite changes voice without changing meaning or safety`, () => {
    const prompt = buildRewriteSystemPrompt(language, 180);
    const required = language === "en"
      ? [
        "English",
        "core meaning",
        "clearly different",
        "fragments",
        "0–2",
        "occasionally",
        "180",
        "insults",
      ]
      : [
        "tiếng Việt",
        "ý chính",
        "khác rõ ràng",
        "cụm ngắn",
        "0–2",
        "Thỉnh thoảng",
        "180",
        "xúc phạm",
      ];
    for (const phrase of required) {
      assert(prompt.includes(phrase), `Missing ${phrase}`);
    }
    assert(
      !/complete sentence|câu.*hoàn chỉnh/.test(prompt),
      "Must permit caption fragments",
    );
  });
  Deno.test(`${language} calm remains understated, funny expressive and savage safe`, () => {
    const calm = getRewriteToneInstruction("calm", language);
    const funny = getRewriteToneInstruction("funny", language);
    const savage = getRewriteToneInstruction("savage", language);
    assert(
      calm.includes(language === "en" ? "understated" : "tiết chế"),
      "Calm must remain understated",
    );
    assert(
      calm.includes(language === "en" ? "Avoid exaggerated" : "Tránh kéo dài"),
      "Calm must not shout",
    );
    assert(
      funny.includes(language === "en" ? "expressive" : "biểu cảm"),
      "Funny can be expressive",
    );
    assert(
      savage.includes(language === "en" ? "insulting" : "xúc phạm"),
      "Savage must not become abusive",
    );
  });
}

Deno.test("native fragments, expressive spelling and mood emoji survive real validation", () => {
  for (
    const caption of [
      "sooo boringgg 😩",
      "chán quáaaa 😩",
      "Finally, a little room to breathe 🌿",
      "Một chút bình yên cho mình",
      "just me and a slower morning",
      "hôm nay nhẹ lòng hơn 🌿✨",
    ]
  ) {
    const validated = validateGeneratedQuote(caption);
    assert(validated.ok, `Caption was rejected: ${caption}`);
    if (validated.ok) {
      assert(validated.quote === caption, "Expression must not be stripped");
    }
    assert(
      parseStructuredQuote(JSON.stringify({ quote: caption })).ok,
      "Generation JSON must accept same voice",
    );
  }
});
Deno.test("caption voice does not relax length or safety validation", () => {
  assert(
    !validateGeneratedQuote("a".repeat(180) + " 😩").ok,
    "Emoji still counts toward 180 characters",
  );
  assert(
    !validateGeneratedQuote("You need medical advice 😩").ok,
    "Safety remains enforced",
  );
});
