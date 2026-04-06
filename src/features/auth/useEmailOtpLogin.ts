import { errorToMessage, normalizeOtpDigits, toFriendlyOtpError } from "@/utils/otp";
import { strings } from "@/theme/strings";
import { useEffect, useMemo, useState } from "react";

type Step = "email" | "otp";

const RESEND_SECONDS = 60;
const otpCooldownExpiresAtByEmail = new Map<string, number>();

type UseEmailOtpLoginArgs = {
  sendEmailOtp: (email: string) => Promise<{ error: unknown }>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ error: unknown }>;
  onVerified: () => void;
};

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string): boolean {
  const normalized = normalizeEmail(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

function getOtpCooldownRemaining(email: string, now = Date.now()): number {
  if (!email) return 0;
  const expiresAt = otpCooldownExpiresAtByEmail.get(email) ?? 0;
  return Math.max(0, Math.ceil((expiresAt - now) / 1000));
}

function startOtpCooldown(email: string, now = Date.now()): number {
  otpCooldownExpiresAtByEmail.set(email, now + RESEND_SECONDS * 1000);
  return RESEND_SECONDS;
}

function isRateLimitedError(message: string): boolean {
  const normalized = message.toLowerCase();
  return normalized.includes("rate") || normalized.includes("too many");
}

export function useEmailOtpLogin({
  sendEmailOtp,
  verifyEmailOtp,
  onVerified,
}: UseEmailOtpLoginArgs) {
  const [emailInput, setEmailInput] = useState("");
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendRemaining, setResendRemaining] = useState(0);

  useEffect(() => {
    if (resendRemaining <= 0) return;
    const id = setInterval(() => {
      setResendRemaining((seconds) => (seconds <= 1 ? 0 : seconds - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [resendRemaining]);

  useEffect(() => {
    setResendRemaining(getOtpCooldownRemaining(normalizedEmail));
  }, [normalizedEmail]);

  const normalizedEmail = useMemo(() => normalizeEmail(emailInput), [emailInput]);
  const verificationEmail = pendingVerificationEmail ?? normalizedEmail;
  const step: Step = pendingVerificationEmail ? "otp" : "email";
  const tokenDigits = useMemo(() => normalizeOtpDigits(token), [token]);
  const isBusy = sending || verifying || resending;
  const canSend = isValidEmail(normalizedEmail) && resendRemaining <= 0 && !isBusy;
  const canVerify = tokenDigits.length === 6 && !isBusy;

  const goToOtp = (email: string) => {
    setPendingVerificationEmail(email);
    setToken("");
    setResendRemaining(getOtpCooldownRemaining(email));
  };

  const backToEmail = () => {
    if (isBusy) return;
    setPendingVerificationEmail(null);
    setToken("");
    setError(null);
    setResendRemaining(getOtpCooldownRemaining(normalizedEmail));
  };

  const sendCode = async () => {
    if (!isValidEmail(normalizedEmail) || isBusy) return;
    if (resendRemaining > 0) {
      setError(strings.auth.rate);
      return;
    }
    setError(null);
    setSending(true);
    try {
      goToOtp(normalizedEmail);
      const { error: err } = await sendEmailOtp(normalizedEmail);
      if (err) {
        const rawMessage = errorToMessage(err);
        if (isRateLimitedError(rawMessage)) {
          setResendRemaining(
            Math.max(getOtpCooldownRemaining(normalizedEmail), startOtpCooldown(normalizedEmail)),
          );
          setError(toFriendlyOtpError(rawMessage));
          return;
        }
        setPendingVerificationEmail(null);
        setError(toFriendlyOtpError(rawMessage));
        return;
      }
      setResendRemaining(startOtpCooldown(normalizedEmail));
    } finally {
      setSending(false);
    }
  };

  const verifyCode = async () => {
    if (!canVerify) return;
    setError(null);
    setVerifying(true);
    try {
      const { error: err } = await verifyEmailOtp(verificationEmail, tokenDigits);
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
    if (!verificationEmail || resendRemaining > 0 || isBusy) return;
    setError(null);
    setResending(true);
    try {
      const { error: err } = await sendEmailOtp(verificationEmail);
      if (err) {
        const rawMessage = errorToMessage(err);
        if (isRateLimitedError(rawMessage)) {
          setResendRemaining(
            Math.max(
              getOtpCooldownRemaining(verificationEmail),
              startOtpCooldown(verificationEmail),
            ),
          );
        }
        setError(toFriendlyOtpError(rawMessage));
        return;
      }
      setResendRemaining(startOtpCooldown(verificationEmail));
    } finally {
      setResending(false);
    }
  };

  const setOtp = (next: string) => {
    setToken(normalizeOtpDigits(next));
  };

  return {
    step,
    emailInput,
    normalizedEmail,
    verificationEmail,
    tokenDigits,
    sending,
    verifying,
    resending,
    error,
    resendRemaining,
    canSend,
    canVerify,
    isBusy,
    setEmailInput,
    setOtp,
    sendCode,
    verifyCode,
    resendCode,
    backToEmail,
  };
}
