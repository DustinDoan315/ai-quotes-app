import { supabase } from "@/config/supabase";
import type { Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";

const AUTH_CALLBACK_PATH = "/auth/callback";
const SUPPORTED_EMAIL_OTP_TYPES = new Set([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
] as const);

type SupportedEmailOtpType =
  | "signup"
  | "invite"
  | "magiclink"
  | "recovery"
  | "email_change"
  | "email";

type SupabaseAuthRedirectParams = {
  accessToken?: string;
  refreshToken?: string;
  code?: string;
  tokenHash?: string;
  type?: string;
  errorCode?: string;
  errorDescription?: string;
};

let lastHandledAuthUrl: string | null = null;

function parseParamSegment(segment?: string): Record<string, string> {
  if (!segment) return {};

  return segment
    .split("&")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, entry) => {
      const [rawKey, ...rawValueParts] = entry.split("=");
      if (!rawKey) return acc;

      const rawValue = rawValueParts.join("=");
      const key = decodeURIComponent(rawKey);
      const value = decodeURIComponent(rawValue);
      acc[key] = value;
      return acc;
    }, {});
}

export function getSupabaseEmailRedirectUrl(): string {
  return Linking.createURL(AUTH_CALLBACK_PATH);
}

export function getSupabaseAuthRedirectParams(url: string): SupabaseAuthRedirectParams {
  const [, query = ""] = url.split("?");
  const queryWithoutFragment = query.split("#")[0] ?? "";
  const [, fragment = ""] = url.split("#");
  const params = {
    ...parseParamSegment(queryWithoutFragment),
    ...parseParamSegment(fragment),
  };

  return {
    accessToken: params.access_token,
    refreshToken: params.refresh_token,
    code: params.code,
    tokenHash: params.token_hash,
    type: params.type,
    errorCode: params.error_code,
    errorDescription: params.error_description,
  };
}

function isSupportedEmailOtpType(value: string): value is SupportedEmailOtpType {
  return SUPPORTED_EMAIL_OTP_TYPES.has(value as SupportedEmailOtpType);
}

function hasSupabaseAuthParams(params: SupabaseAuthRedirectParams): boolean {
  return Boolean(
    params.accessToken ||
      params.refreshToken ||
      params.code ||
      params.tokenHash ||
      params.errorCode ||
      params.errorDescription,
  );
}

export async function completeSupabaseAuthRedirectFromUrl(
  url: string,
): Promise<Session | null> {
  const params = getSupabaseAuthRedirectParams(url);

  if (!hasSupabaseAuthParams(params) || lastHandledAuthUrl === url) {
    return null;
  }

  lastHandledAuthUrl = url;

  if (params.errorCode || params.errorDescription) {
    throw new Error(params.errorDescription ?? params.errorCode ?? "Supabase auth redirect failed.");
  }

  if (params.accessToken && params.refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
    });

    if (error) throw error;
    return data.session;
  }

  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return data.session;
  }

  if (params.tokenHash && params.type && isSupportedEmailOtpType(params.type)) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: params.tokenHash,
      type: params.type,
    });

    if (error) throw error;
    return data.session ?? null;
  }

  return null;
}

export async function completeSupabaseAuthRedirectFromInitialUrl(): Promise<Session | null> {
  const initialUrl = await Linking.getInitialURL();
  if (!initialUrl) return null;
  return completeSupabaseAuthRedirectFromUrl(initialUrl);
}
