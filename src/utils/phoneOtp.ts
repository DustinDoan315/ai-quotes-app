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
  const region = first?.regionCode ?? undefined;
  if (isTwoLetterCountryCode(region)) return region;
  return "US";
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
