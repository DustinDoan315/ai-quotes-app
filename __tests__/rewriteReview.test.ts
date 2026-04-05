import {
  MAX_REWRITE_REVIEW_CHARACTERS,
  validateEditableQuote,
  validateRewriteReviewQuote,
} from "@/services/ai/rewriteReview";

describe("rewrite review rules", () => {
  it("accepts a one-sentence rewrite that changes the wording", () => {
    const result = validateRewriteReviewQuote(
      "Your pace still counts, even when the day feels quiet.",
      "You are still showing up.",
    );

    expect(result).toEqual({
      isValid: true,
      sanitizedQuote: "Your pace still counts, even when the day feels quiet.",
      characterCount: 54,
      remainingCharacters: MAX_REWRITE_REVIEW_CHARACTERS - 54,
    });
  });

  it("rejects rewrites that are effectively unchanged", () => {
    const result = validateRewriteReviewQuote(
      "You are still showing up!",
      "You are still showing up.",
    );

    expect(result).toEqual({
      isValid: false,
      reason: "Rewrite needs to feel meaningfully different from the original",
      sanitizedQuote: "You are still showing up!",
      characterCount: 25,
      remainingCharacters: MAX_REWRITE_REVIEW_CHARACTERS - 25,
    });
  });

  it("rejects rewrites with multiple sentences", () => {
    const result = validateRewriteReviewQuote(
      "You are rebuilding. Keep going.",
      "You are still showing up.",
    );

    expect(result).toEqual({
      isValid: false,
      reason: "Rewrite must stay as one sentence",
      sanitizedQuote: "You are rebuilding. Keep going.",
      characterCount: 31,
      remainingCharacters: MAX_REWRITE_REVIEW_CHARACTERS - 31,
    });
  });

  it("accepts editable quotes that stay as one safe sentence", () => {
    const result = validateEditableQuote(
      "Small progress still deserves respect today.",
    );

    expect(result).toEqual({
      isValid: true,
      sanitizedQuote: "Small progress still deserves respect today.",
      characterCount: 44,
      remainingCharacters: MAX_REWRITE_REVIEW_CHARACTERS - 44,
    });
  });
});
