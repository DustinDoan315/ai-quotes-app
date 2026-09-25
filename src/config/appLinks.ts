export const APP_STORE_URL =
  "https://apps.apple.com/us/app/inkly-daily-vibes/id6760991001" as const;

// This Vercel hostname is the existing Inkly web host used for legal links.
// It must remain attached to a deployment that serves the invite route and
// both platform association files.
export const INVITE_WEB_ORIGIN = (
  process.env.EXPO_PUBLIC_INVITE_WEB_ORIGIN ??
  "https://inkly-web-taupe.vercel.app"
).replace(/\/$/, "");

export function buildPublicInviteUrl(code: string): string {
  return `${INVITE_WEB_ORIGIN}/invite/${encodeURIComponent(code)}`;
}
