import type { CountryCode } from "@realtril/react-native-country-picker-modal";
import { AsYouType, parsePhoneNumberFromString } from "libphonenumber-js";
import { useEffect, useMemo, useState } from "react";
import { errorToMessage, getDefaultCountryCode, normalizeOtpDigits, toFriendlyOtpError } from "@/utils/phoneOtp";

type Step = "phone" | "otp";

const RESEND_SECONDS = 30;

type UsePhoneOtpLoginArgs = {
  signInWithPhoneOtp: (phone: string) => Promise<{ error: unknown }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error: unknown }>;
  onVerified: () => void;
};

export function usePhoneOtpLogin({ signInWithPhoneOtp, verifyPhoneOtp, onVerified }: UsePhoneOtpLoginArgs) {
  const [step, setStep] = useState<Step>("phone");
  const [countryCode, setCountryCode] = useState<CountryCode>(() => getDefaultCountryCode());
  const [nationalPhoneInput, setNationalPhoneInput] = useState("");
  const [token, setToken] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendRemaining, setResendRemaining] = useState(0);

  useEffect(() => {
    if (resendRemaining <= 0) return;
    const id = setInterval(() => {
      setResendRemaining((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [resendRemaining]);

  const formattedNationalPhone = useMemo(() => {
    const digits = nationalPhoneInput.replaceAll(/[^\d+]/g, "");
    return new AsYouType(countryCode).input(digits);
  }, [countryCode, nationalPhoneInput]);

  const parsedPhone = useMemo(() => {
    const digits = nationalPhoneInput.trim().replaceAll(/[^\d+]/g, "");
    if (!digits) return null;
    const parsed = parsePhoneNumberFromString(digits, countryCode);
    return parsed ?? null;
  }, [countryCode, nationalPhoneInput]);

  const e164Phone = parsedPhone?.isValid() ? parsedPhone.number : null;
  const displayE164 = parsedPhone?.isPossible() ? parsedPhone.formatInternational() : null;
  const tokenDigits = useMemo(() => normalizeOtpDigits(token), [token]);
  const isBusy = sending || verifying || resending;
  const canSend = Boolean(e164Phone) && !isBusy;
  const canVerify = tokenDigits.length === 6 && !isBusy;

  const goToOtp = () => {
    setStep("otp");
    setToken("");
    setResendRemaining(RESEND_SECONDS);
  };

  const backToPhone = () => {
    if (isBusy) return;
    setStep("phone");
    setToken("");
    setError(null);
    setResendRemaining(0);
  };

  const sendCode = async () => {
    if (!canSend || !e164Phone) return;
    setError(null);
    setSending(true);
    try {
      const { error: err } = await signInWithPhoneOtp(e164Phone);
      if (err) {
        setError(toFriendlyOtpError(errorToMessage(err)));
        return;
      }
      goToOtp();
    } finally {
      setSending(false);
    }
  };

  const verifyCode = async () => {
    if (!canVerify || !e164Phone) return;
    setError(null);
    setVerifying(true);
    try {
      const { error: err } = await verifyPhoneOtp(e164Phone, tokenDigits);
      if (err) {
        setError(toFriendlyOtpError(errorToMessage(err)));
        return;
      }
      onVerified();
    } finally {
      setVerifying(false);
    }
  };

  const resendCode = async () => {
    if (!e164Phone) return;
    if (resendRemaining > 0) return;
    if (isBusy) return;
    setError(null);
    setResending(true);
    try {
      const { error: err } = await signInWithPhoneOtp(e164Phone);
      if (err) {
        setError(toFriendlyOtpError(errorToMessage(err)));
        return;
      }
      setResendRemaining(RESEND_SECONDS);
    } finally {
      setResending(false);
    }
  };

  const setOtp = (next: string) => {
    setToken(normalizeOtpDigits(next));
  };

  return {
    step,
    countryCode,
    formattedNationalPhone,
    nationalPhoneInput,
    tokenDigits,
    sending,
    verifying,
    resending,
    error,
    resendRemaining,
    displayE164,
    canSend,
    canVerify,
    isBusy,
    setCountryCode,
    setNationalPhoneInput,
    setOtp,
    sendCode,
    verifyCode,
    resendCode,
    backToPhone,
  };
}

