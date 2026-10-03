import {
  parseStructuredQuote,
  shouldRetryQuote,
  readQuoteInput,
  validateGeneratedQuote,
} from "./ai.ts";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

Deno.test("generated captions replace long dash separators without changing ordinary hyphens", () => {
  for (const dash of ["—", "–", "--", "---"]) {
    const parsed = validateGeneratedQuote(`Sooo tired ${dash} still showing up 😮‍💨`);
    assert(parsed.ok && parsed.quote === "Sooo tired, still showing up 😮‍💨", `Unexpected separator for ${dash}`);
  }
  const hyphen = validateGeneratedQuote("A much-needed break 😌");
  assert(hyphen.ok && hyphen.quote === "A much-needed break 😌", "Ordinary hyphens must remain");
  const manual = readQuoteInput("My thought — my words");
  assert(manual.ok && manual.quote === "My thought — my words", "User input must remain unchanged");
  const vi = parseStructuredQuote('{"quote":"Chán quáaaa — muốn nghỉ một chút 😩"}');
  assert(vi.ok && vi.quote === "Chán quáaaa, muốn nghỉ một chút 😩", "Vietnamese generated captions must normalize separators");
});

Deno.test("quote input accepts 180 characters and rejects 181", () => {
  assert(readQuoteInput("a".repeat(180)).ok, "180 characters should be accepted");
  assert(!readQuoteInput("a".repeat(181)).ok, "181 characters should be rejected");
});

Deno.test("generated quote requires one non-empty sentence", () => {
  assert(!validateGeneratedQuote('""').ok, "empty quote should be rejected");
  assert(
    !validateGeneratedQuote("One thought. Another thought.").ok,
    "multiple sentences should be rejected",
  );
});

Deno.test("generated quote rejects unsafe content", () => {
  assert(
    !validateGeneratedQuote("You need medical advice.").ok,
    "unsafe content should be rejected server-side",
  );
});

Deno.test("structured quote parsing keeps a valid quote and retries generic output", () => {
  const parsed = parseStructuredQuote(
    '{"quote":"The quiet you chose today can still carry you forward."}',
  );
  assert(parsed.ok, "structured quote should parse");
  assert(!shouldRetryQuote(parsed), "specific quote should not retry");
  assert(
    shouldRetryQuote({ ok: true, quote: "Keep going." }),
    "generic quote should retry",
  );
});
