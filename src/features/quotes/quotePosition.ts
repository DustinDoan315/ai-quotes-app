export type QuotePosition = { x: number; y: number };

export type QuoteBoxSize = { width: number; height: number };

export const DEFAULT_QUOTE_POSITION: QuotePosition = { x: 0.5, y: 0.84 };

export function parseQuotePosition(x: unknown, y: unknown): QuotePosition {
  if (
    typeof x !== "number" ||
    !Number.isFinite(x) ||
    x < 0 ||
    x > 1 ||
    typeof y !== "number" ||
    !Number.isFinite(y) ||
    y < 0 ||
    y > 1
  ) {
    return { ...DEFAULT_QUOTE_POSITION };
  }

  return { x, y };
}

function clampAxis(position: number, frameSize: number, quoteSize: number) {
  if (!Number.isFinite(position)) return 0.5;
  if (!Number.isFinite(frameSize) || frameSize <= 0) return 0.5;

  const quoteHalfSize = Math.min(
    0.5,
    Math.max(0, quoteSize) / frameSize / 2,
  );
  return Math.min(1 - quoteHalfSize, Math.max(quoteHalfSize, position));
}

export function clampQuotePosition(
  position: QuotePosition,
  frame: QuoteBoxSize,
  quote: QuoteBoxSize,
): QuotePosition {
  return {
    x: clampAxis(position.x, frame.width, quote.width),
    y: clampAxis(position.y, frame.height, quote.height),
  };
}
