import { getStrings } from "@/theme/strings";

type Mapping = { keywords: string[]; message: string };

function getOtpErrorMappings(): Mapping[] {
  const authErrors = getStrings().auth.errors;

  return [
    {
      keywords: ["invalid email"],
      message: authErrors.invalidEmail,
    },
    {
      keywords: ["email", "invalid"],
      message: authErrors.invalidEmail,
    },
    { keywords: ["expired"], message: authErrors.expired },
    { keywords: ["too many"], message: authErrors.tooMany },
    { keywords: ["network"], message: authErrors.network },
    { keywords: ["rate"], message: authErrors.rate },
    { keywords: ["otp", "invalid"], message: authErrors.invalidCode },
    { keywords: ["token", "invalid"], message: authErrors.invalidCode },
  ];
}

export function toFriendlyOtpError(message: string): string {
  const m = message.toLowerCase();
  for (const { keywords, message: msg } of getOtpErrorMappings()) {
    if (keywords.every((k) => m.includes(k))) return msg;
  }
  return getStrings().auth.errors.fallback;
}
