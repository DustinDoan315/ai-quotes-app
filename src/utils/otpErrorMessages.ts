type Mapping = { keywords: string[]; message: string };

const OTP_ERROR_MAPPINGS: Mapping[] = [
  { keywords: ["invalid phone"], message: "That phone number doesn't look valid. Double-check it and try again." },
  { keywords: ["invalid number"], message: "That phone number doesn't look valid. Double-check it and try again." },
  { keywords: ["expired"], message: "That code expired. Request a new one and try again." },
  { keywords: ["too many"], message: "Too many attempts. Please wait a bit and try again." },
  { keywords: ["network"], message: "Network issue. Check your connection and try again." },
  { keywords: ["rate"], message: "Please wait a moment before trying again." },
  { keywords: ["otp", "invalid"], message: "That code doesn't match. Try again." },
  { keywords: ["token", "invalid"], message: "That code doesn't match. Try again." },
];

const DEFAULT_MESSAGE = "Something went wrong. Please try again.";

export function toFriendlyOtpError(message: string): string {
  const m = message.toLowerCase();
  for (const { keywords, message: msg } of OTP_ERROR_MAPPINGS) {
    if (keywords.every((k) => m.includes(k))) return msg;
  }
  return DEFAULT_MESSAGE;
}
