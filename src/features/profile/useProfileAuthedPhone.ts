import { getCurrentUser } from "@/services/supabase-auth";
import { useEffect, useState } from "react";

export function useProfileAuthedPhone() {
  const [phoneDisplay, setPhoneDisplay] = useState<string | null>(null);
  const [phoneVerified, setPhoneVerified] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadPhone = async () => {
      const user = await getCurrentUser();
      if (!user || cancelled) {
        setPhoneDisplay(null);
        setPhoneVerified(null);
        return;
      }
      const raw = (user.phone ?? "").trim();
      if (!raw) {
        setPhoneDisplay(null);
        setPhoneVerified(null);
        return;
      }
      const last4 = raw.slice(-4);
      const masked =
        raw.startsWith("+") && raw.length > 4
          ? `+*** *** ${last4}`
          : `*** *** ${last4}`;
      setPhoneDisplay(masked);
      setPhoneVerified(
        Boolean(
          (user as { phone_confirmed_at?: string | null }).phone_confirmed_at,
        ),
      );
    };
    loadPhone();
    return () => {
      cancelled = true;
    };
  }, []);

  return { phoneDisplay, phoneVerified };
}
