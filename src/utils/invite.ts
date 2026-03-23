import { APP_URL_SCHEME } from "@/theme/appBrand";

export function parseInviteCode(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;

  const schemeMatch = raw.match(
    new RegExp(`^${APP_URL_SCHEME}:\\/\\/invite\\/([a-z0-9]{6,64})`, "i"),
  );
  if (schemeMatch?.[1]) return schemeMatch[1].toLowerCase();

  try {
    const url = new URL(raw);
    const parts = url.pathname.split("/").filter(Boolean);
    const inviteIndex = parts.findIndex((p) => p.toLowerCase() === "invite");
    const code = inviteIndex >= 0 ? parts[inviteIndex + 1] : null;
    if (code && /^[a-z0-9]{6,64}$/i.test(code)) return code.toLowerCase();
  } catch {
    if (/^[a-z0-9]{6,64}$/i.test(raw)) return raw.toLowerCase();
  }

  return null;
}
