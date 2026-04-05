import { sanitizeQuote, validateQuote } from "./safety";

export const MAX_REWRITE_REVIEW_CHARACTERS = 180;

type RewriteReviewValidation = {
  isValid: boolean;
  reason?: string;
  sanitizedQuote: string;
  characterCount: number;
  remainingCharacters: number;
};

const normalizeForComparison = (value: string): string =>
  value
    .toLowerCase()
    .replace(/["']/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .trim();

const countWords = (value: string): number =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const hasMultipleSentences = (value: string): boolean => {
  if (/\r|\n/.test(value)) {
    return true;
  }

  const sentenceEndings = value.match(/[.!?]+(?=\s|$)/g) ?? [];
  return sentenceEndings.length > 1;
};

export const validateEditableQuote = (
  candidate: string,
): RewriteReviewValidation => {
  const sanitizedQuote = sanitizeQuote(candidate);
  const characterCount = sanitizedQuote.length;

  if (!sanitizedQuote) {
    return {
      isValid: false,
      reason: "Quote can't be empty",
      sanitizedQuote,
      characterCount,
      remainingCharacters: MAX_REWRITE_REVIEW_CHARACTERS,
    };
  }

  if (countWords(sanitizedQuote) < 3) {
    return {
      isValid: false,
      reason: "Quote should feel like a complete thought",
      sanitizedQuote,
      characterCount,
      remainingCharacters: MAX_REWRITE_REVIEW_CHARACTERS - characterCount,
    };
  }

  if (hasMultipleSentences(sanitizedQuote)) {
    return {
      isValid: false,
      reason: "Quote must stay as one sentence",
      sanitizedQuote,
      characterCount,
      remainingCharacters: MAX_REWRITE_REVIEW_CHARACTERS - characterCount,
    };
  }

  const validation = validateQuote(sanitizedQuote);

  if (!validation.isValid) {
    return {
      isValid: false,
      reason: validation.reason,
      sanitizedQuote,
      characterCount,
      remainingCharacters: MAX_REWRITE_REVIEW_CHARACTERS - characterCount,
    };
  }

  return {
    isValid: true,
    sanitizedQuote,
    characterCount,
    remainingCharacters: MAX_REWRITE_REVIEW_CHARACTERS - characterCount,
  };
};

export const validateRewriteReviewQuote = (
  candidate: string,
  sourceQuote: string,
): RewriteReviewValidation => {
  const baseValidation = validateEditableQuote(candidate);

  if (!baseValidation.isValid) {
    return {
      ...baseValidation,
      reason:
        baseValidation.reason === "Quote should feel like a complete thought"
          ? "Rewrite should feel like a complete thought"
          : baseValidation.reason === "Quote must stay as one sentence"
            ? "Rewrite must stay as one sentence"
            : baseValidation.reason === "Quote can't be empty"
              ? "Rewrite can't be empty"
              : baseValidation.reason,
    };
  }

  if (
    normalizeForComparison(baseValidation.sanitizedQuote) ===
    normalizeForComparison(sourceQuote)
  ) {
    return {
      isValid: false,
      reason: "Rewrite needs to feel meaningfully different from the original",
      sanitizedQuote: baseValidation.sanitizedQuote,
      characterCount: baseValidation.characterCount,
      remainingCharacters: baseValidation.remainingCharacters,
    };
  }

  return baseValidation;
};
