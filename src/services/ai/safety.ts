const PROFANITY_WORDS = ["damn", "hell", "crap"];

const FORBIDDEN_TOPICS = [
  "hate",
  "violence",
  "sexual",
  "medical",
  "legal",
  "financial",
];

const containsProfanity = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return PROFANITY_WORDS.some((word) => lowerText.includes(word));
};

const containsForbiddenTopic = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return FORBIDDEN_TOPICS.some((topic) => lowerText.includes(topic));
};

export const validateQuote = (
  quote: string,
): { isValid: boolean; reason?: string } => {
  if (quote.length > 180) {
    return { isValid: false, reason: "Quote exceeds 180 characters" };
  }

  if (containsProfanity(quote)) {
    return { isValid: false, reason: "Quote contains profanity" };
  }

  if (containsForbiddenTopic(quote)) {
    return { isValid: false, reason: "Quote contains forbidden topics" };
  }

  return { isValid: true };
};

export const sanitizeQuote = (quote: string): string => {
  const trimmed = quote.trim();
  if (trimmed.length > 180) {
    return `${trimmed.substring(0, 177)}...`;
  }
  return trimmed;
};
