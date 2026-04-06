export function normalizeOtpDigits(value: string): string {
  return value.replaceAll(/[^\d]/g, "").slice(0, 6);
}

export { toFriendlyOtpError } from "@/utils/otpErrorMessages";

export function errorToMessage(err: unknown): string {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (typeof err === "object") {
    const maybeMessage = (err as { message?: unknown }).message;
    if (typeof maybeMessage === "string") return maybeMessage;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return "Unexpected error";
  }
}
