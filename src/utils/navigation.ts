const DEFAULT_RETURN_TO = "/(tabs)";

export function sanitizeReturnTo(value: string | undefined): string {
  const trimmed = value?.trim();

  if (!trimmed) {
    return DEFAULT_RETURN_TO;
  }

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return DEFAULT_RETURN_TO;
  }

  if (trimmed.includes(":")) {
    return DEFAULT_RETURN_TO;
  }

  return trimmed;
}

