import {
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
