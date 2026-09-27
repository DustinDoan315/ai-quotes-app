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
    .filter((word) => /[\p{L}\p{N}]/u.test(word)).length;

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

  if (countWords(sanitizedQuote) < 1) {
    return {
      isValid: false,
      reason: "Quote must contain at least one word",
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
    const rewriteReasons: Record<string, string> = {
      "Quote can't be empty": "Rewrite can't be empty",
      "Quote must contain at least one word":
        "Rewrite must contain at least one word",
      "Quote should feel like a complete thought":
        "Rewrite must contain at least one word",
      "Quote must stay as one sentence": "Rewrite must stay as one sentence",
      "Quote exceeds 180 characters": "Rewrite exceeds 180 characters",
      "Quote contains forbidden content":
        "Rewrite contains forbidden content",
    };

    return {
      ...baseValidation,
      reason: baseValidation.reason
        ? (rewriteReasons[baseValidation.reason] ?? baseValidation.reason)
        : undefined,
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

const QUOTE_VALIDATION_MESSAGE_KEYS: Record<string, string> = {
  "Quote can't be empty": "home.aiTools.validation.quoteEmpty",
  "Quote must contain at least one word":
    "home.aiTools.validation.quoteAtLeastOneWord",
  "Quote should feel like a complete thought":
    "home.aiTools.validation.quoteAtLeastOneWord",
  "Quote must stay as one sentence":
    "home.aiTools.validation.quoteOneSentence",
  "Quote exceeds 180 characters": "home.aiTools.validation.quoteTooLong",
  "Quote contains forbidden content":
    "home.aiTools.validation.quoteForbiddenContent",
  "Rewrite can't be empty": "home.aiTools.validation.rewriteEmpty",
  "Rewrite must contain at least one word":
    "home.aiTools.validation.rewriteAtLeastOneWord",
  "Rewrite should feel like a complete thought":
    "home.aiTools.validation.rewriteAtLeastOneWord",
  "Rewrite must stay as one sentence":
    "home.aiTools.validation.rewriteOneSentence",
  "Rewrite exceeds 180 characters":
    "home.aiTools.validation.rewriteTooLong",
  "Rewrite contains forbidden content":
    "home.aiTools.validation.rewriteForbiddenContent",
  "Rewrite needs to feel meaningfully different from the original":
    "home.aiTools.validation.rewriteMustDiffer",
};

export const getQuoteValidationMessageKey = (
  reason: string,
): string | undefined => QUOTE_VALIDATION_MESSAGE_KEYS[reason];
