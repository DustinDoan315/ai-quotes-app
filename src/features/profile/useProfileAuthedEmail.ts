import { getCurrentUser } from "@/services/supabase-auth";
import { useEffect, useState } from "react";

function maskEmail(raw: string): string {
  const [localPart, domainPart] = raw.split("@");
  if (!localPart || !domainPart) return raw;

  const visible = localPart.slice(0, Math.min(localPart.length, 2));
  const hiddenCount = Math.max(localPart.length - visible.length, 2);

  return `${visible}${"*".repeat(hiddenCount)}@${domainPart}`;
}

export function useProfileAuthedEmail() {
  const [emailDisplay, setEmailDisplay] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadEmail = async () => {
      const user = await getCurrentUser();
      if (!user || cancelled) {
        setEmailDisplay(null);
        setEmailVerified(null);
        return;
      }

      const raw = (user.email ?? "").trim().toLowerCase();
      if (!raw) {
        setEmailDisplay(null);
        setEmailVerified(null);
        return;
      }

      setEmailDisplay(maskEmail(raw));
      setEmailVerified(
        Boolean((user as { email_confirmed_at?: string | null }).email_confirmed_at),
      );
    };

    void loadEmail();

    return () => {
      cancelled = true;
    };
  }, []);

  return { emailDisplay, emailVerified };
}
