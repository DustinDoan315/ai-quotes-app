export const APPLE_STANDARD_EULA_URL =
  "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

const normalizeUrl = (value: string | undefined): string | null => {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  if (!/^https:\/\//i.test(trimmed)) {
    return null;
  }

  return trimmed;
};

export const LEGAL_LINKS = {
  privacyPolicyUrl: normalizeUrl(process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL),
  termsOfServiceUrl:
    normalizeUrl(process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL) ??
    APPLE_STANDARD_EULA_URL,
} as const;

