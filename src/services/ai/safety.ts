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
  let sanitized = quote.trim();

  sanitized = sanitized.replace(/[^\w\s.,!?'"-]/g, "");

  if (sanitized.length > 180) {
    sanitized = sanitized.substring(0, 177) + "...";
  }

  return sanitized;
};
