import {
  parseStructuredQuote,
  shouldRetryQuote,
  readQuoteInput,
  validateGeneratedQuote,
} from "./ai.ts";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

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
