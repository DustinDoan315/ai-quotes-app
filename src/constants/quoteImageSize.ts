export type QuoteOrientation = "portrait" | "landscape";

export const QUOTE_ASPECT = {
  portrait: { width: 3, height: 3.75 },
  landscape: { width: 3.5, height: 3 },
} as const;

export const QUOTE_OUTPUT_SIZE = {
  portrait: { width: 720, height: 960 },
  landscape: { width: 840, height: 720 },
} as const;

export function getQuoteAspectRatio(orientation: QuoteOrientation): number {
  const a = QUOTE_ASPECT[orientation];
  return a.width / a.height;
}
