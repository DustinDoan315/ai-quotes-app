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

/** Scale a fixed-center quote by projecting the dragged corner onto its diagonal. */
export function resizeQuoteScale(
  startScale: number,
  dx: number,
  dy: number,
  quoteSize: QuoteBoxSize,
  rotation = 0,
): number {
  "worklet";
  const start = Number.isFinite(startScale)
    ? Math.min(1, Math.max(MIN_QUOTE_SCALE, startScale))
    : 1;
  const { width, height } = quoteSize;
  if (
    !Number.isFinite(dx) || !Number.isFinite(dy) ||
    !Number.isFinite(rotation) || !Number.isFinite(width) ||
    !Number.isFinite(height) || width < 0 || height < 0
  ) return start;
  const diagonalSquared = width * width + height * height;
  if (!Number.isFinite(diagonalSquared) || diagonalSquared <= 0) return start;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const delta = 2 * (dx * (cos * width - sin * height) + dy * (sin * width + cos * height)) / diagonalSquared;
  if (!Number.isFinite(delta)) return start;
  return Math.min(1, Math.max(MIN_QUOTE_SCALE, start + delta));
}
