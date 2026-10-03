export type QuotePosition = { x: number; y: number; scale?: number; rotation?: number };

export const MIN_QUOTE_SCALE = 0.55;

export type QuoteBoxSize = { width: number; height: number };

export const DEFAULT_QUOTE_POSITION: QuotePosition = { x: 0.5, y: 0.87 };

export function parseQuotePosition(x: unknown, y: unknown, scale?: unknown, rotation?: unknown): QuotePosition {
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

  return { x, y,
    ...(typeof scale === "number" && Number.isFinite(scale) ? { scale: Math.min(1, Math.max(MIN_QUOTE_SCALE, scale)) } : {}),
    ...(typeof rotation === "number" && Number.isFinite(rotation) ? { rotation } : {}),
  };
}

function clampAxis(position: number, frameSize: number, quoteSize: number) {
  "worklet";
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
  "worklet";
  const scale = Math.min(1, Math.max(MIN_QUOTE_SCALE, position.scale ?? 1));
  const angle = position.rotation ?? 0;
  const width = scale * (Math.abs(Math.cos(angle)) * quote.width + Math.abs(Math.sin(angle)) * quote.height);
  const height = scale * (Math.abs(Math.sin(angle)) * quote.width + Math.abs(Math.cos(angle)) * quote.height);
  return {
    ...position,
    x: clampAxis(position.x, frame.width, width),
    y: clampAxis(position.y, frame.height, height),
  };
}
