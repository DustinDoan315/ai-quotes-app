import * as Localization from "expo-localization";
import type { CountryCode } from "react-native-country-picker-modal";

export function normalizeOtpDigits(value: string): string {
  return value.replaceAll(/[^\d]/g, "").slice(0, 6);
}

function isTwoLetterCountryCode(value: string | undefined): value is CountryCode {
  return Boolean(value && /^[A-Z]{2}$/.test(value));
}

export function getDefaultCountryCode(): CountryCode {
  const locales = Localization.getLocales();
  const first = locales[0];
  if (isTwoLetterCountryCode(first?.regionCode)) return first.regionCode;
  if (isTwoLetterCountryCode(first?.countryCode)) return first.countryCode;
  return "US";
}

export function toFriendlyOtpError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid phone")) return "That phone number doesn’t look valid. Double-check it and try again.";
  if (m.includes("invalid number")) return "That phone number doesn’t look valid. Double-check it and try again.";
  if (m.includes("expired")) return "That code expired. Request a new one and try again.";
  if (m.includes("too many")) return "Too many attempts. Please wait a bit and try again.";
  if (m.includes("network")) return "Network issue. Check your connection and try again.";
  if (m.includes("rate")) return "Please wait a moment before trying again.";
  if (m.includes("otp") && m.includes("invalid")) return "That code doesn’t match. Try again.";
  if (m.includes("token") && m.includes("invalid")) return "That code doesn’t match. Try again.";
  return "Something went wrong. Please try again.";
}

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

