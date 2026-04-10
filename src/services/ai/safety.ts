const FORBIDDEN_PHRASES = [
  /\bkill\b/i,
  /\bsuicid(e|al)\b/i,
  /\bself[- ]harm\b/i,
  /\bhate speech\b/i,
  /\bfinancial advice\b/i,
  /\blegal advice\b/i,
  /\bmedical advice\b/i,
  /\bdiagnos(e|is|ed)\b/i,
  /\bsexually explicit\b/i,
  /\bpornograph/i,
];

const containsForbiddenPhrase = (text: string): boolean =>
  FORBIDDEN_PHRASES.some((pattern) => pattern.test(text));

export const validateQuote = (
  quote: string,
): { isValid: boolean; reason?: string } => {
  if (quote.length > 180) {
    return { isValid: false, reason: "Quote exceeds 180 characters" };
  }

  if (containsForbiddenPhrase(quote)) {
    return { isValid: false, reason: "Quote contains forbidden content" };
  }

  return { isValid: true };
};

export const sanitizeQuote = (quote: string): string => {
  const trimmed = quote.trim();
  if (trimmed.length > 180) {
    return trimmed.substring(0, 180).trimEnd();
  }
  return trimmed;
};
