import { useAuth } from "@/hooks/useSupabaseAuth";
import { useUserStore } from "@/appState/userStore";
import { AppIcon } from "@/components/AppIcon";
import { LEGAL_LINKS } from "@/config/legalLinks";
import * as Crypto from "expo-crypto";
import * as AppleAuthentication from "expo-apple-authentication";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  NativeModules,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TurboModuleRegistry,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { goBackOrReplace } from "@/utils/goBackOrReplace";
import { sanitizeReturnTo } from "@/utils/navigation";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

type GoogleSigninModule = {
  GoogleSignin: {
    configure: (options: {
      iosClientId?: string;
      webClientId?: string;
      scopes?: string[];
    }) => void;
    hasPlayServices: () => Promise<boolean>;
    signIn: (options?: { nonce?: string }) => Promise<unknown>;
    getTokens: () => Promise<{ idToken: string | null; accessToken: string | null }>;
  };
  statusCodes: {
    SIGN_IN_CANCELLED: string;
    IN_PROGRESS: string;
  };
};

let cachedGoogleSigninModulePromise: Promise<GoogleSigninModule> | null = null;

function hasGoogleSigninNativeModule(): boolean {
  const turboModuleRegistry = TurboModuleRegistry as {
    get?: (name: string) => unknown;
  };

  return Boolean(
    turboModuleRegistry.get?.("RNGoogleSignin") ??
      (NativeModules as Record<string, unknown>).RNGoogleSignin,
  );
}

async function getGoogleSigninModule(): Promise<GoogleSigninModule> {
  if (cachedGoogleSigninModulePromise) {
    return cachedGoogleSigninModulePromise;
  }

  if (!hasGoogleSigninNativeModule()) {
    throw new Error("RNGoogleSignin native module is unavailable in this build.");
  }

  cachedGoogleSigninModulePromise = import(
      "@react-native-google-signin/google-signin",
    ).then((googleSigninModule) => {
    googleSigninModule.GoogleSignin.configure({
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      scopes: ["profile", "email"],
    });
    return googleSigninModule as GoogleSigninModule;
  });

  return cachedGoogleSigninModulePromise;
}

const FEATURE_ROW_ICONS = [
  "shield-checkmark-outline",
  "settings-outline",
  "cloud-outline",
] as const;

function getSafeAuthErrorMessage(error: unknown, fallback: string, t: (key: string) => string): string {
  const message = error instanceof Error ? error.message.trim() : "";
  const normalized = message.toLowerCase();

  if (
    (normalized.includes("manual") && normalized.includes("link")) ||
    (normalized.includes("identity linking") && normalized.includes("unavailable"))
  ) {
    return t("auth.login.errors.identityLinkingUnavailable");
  }

  if (
    normalized.includes("already linked") ||
    normalized.includes("already exists") ||
    normalized.includes("belongs to another")
  ) {
    return t("auth.login.errors.identityAlreadyLinked");
  }

  if (/network request failed|failed to fetch|networkerror|load failed|timed out|timeout/i.test(normalized)) {
    return t("auth.login.errors.serviceUnavailable");
  }

  const containsCredential = /access[_ -]?token|authorization|bearer|api[_ -]?key|jwt/i.test(message);
  return message && message.length <= 240 && !containsCredential ? message : fallback;
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    returnTo?: string;
    fromOnboarding?: string;
  }>();
  const returnTo = sanitizeReturnTo(params.returnTo);
  const fromOnboarding = params.fromOnboarding === "true";
  const completeOnboarding = useUserStore((state) => state.completeOnboarding);
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { t } = useTranslation();
  const isBusy = loadingGoogle || loadingApple;
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";
  const privacyUrl = LEGAL_LINKS.privacyPolicyUrl;
  const termsUrl = LEGAL_LINKS.termsOfServiceUrl;

  const featureRows = [
    {
      icon: FEATURE_ROW_ICONS[0],
      title: t("auth.login.features.verifiedTitle"),
      description: t("auth.login.features.verifiedDesc"),
    },
    {
      icon: FEATURE_ROW_ICONS[1],
      title: t("auth.login.features.personaTitle"),
      description: t("auth.login.features.personaDesc"),
    },
    {
      icon: FEATURE_ROW_ICONS[2],
      title: t("auth.login.features.memoriesTitle"),
      description: t("auth.login.features.memoriesDesc"),
    },
  ];

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoadingGoogle(true);
    try {
      const googleSigninModule = await getGoogleSigninModule();
      const { GoogleSignin } = googleSigninModule;
      if (Platform.OS === "android") {
        await GoogleSignin.hasPlayServices();
      }
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      );
      await GoogleSignin.signIn({ nonce: hashedNonce });
      const tokens = await GoogleSignin.getTokens();
      const idToken = tokens.idToken;
      if (!idToken) {
        setError(t("auth.login.errors.googleFailed"));
        return;
      }
      const { error: authError } = await signInWithGoogle(
        idToken,
        rawNonce,
        tokens.accessToken ?? undefined,
      );
      if (authError) {
        setError(getSafeAuthErrorMessage(authError, t("auth.login.errors.signInFailed"), t));
        return;
      }
      if (fromOnboarding) completeOnboarding();
      router.replace(returnTo as never);
    } catch (err: unknown) {
      const e = err as { code?: string };
      const googleSigninModule = await cachedGoogleSigninModulePromise?.catch(() => null);
      if (e?.code && e.code === googleSigninModule?.statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled — no error shown
      } else if (e?.code && e.code === googleSigninModule?.statusCodes.IN_PROGRESS) {
        // already in progress — ignore
      } else if (err instanceof Error && err.message.includes("RNGoogleSignin")) {
        setError("Google Sign-In requires a development build or production app.");
      } else {
        setError(getSafeAuthErrorMessage(err, t("auth.login.errors.googleFailed"), t));
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError(null);
    setLoadingApple(true);
    try {
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      );
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });
      const identityToken = credential.identityToken;
      if (!identityToken) {
        setError(t("auth.login.errors.appleFailed"));
        return;
      }
      const { error: authError } = await signInWithApple(identityToken, rawNonce);
      if (authError) {
        setError(getSafeAuthErrorMessage(authError, t("auth.login.errors.signInFailed"), t));
        return;
      }
      if (fromOnboarding) completeOnboarding();
      router.replace(returnTo as never);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === "ERR_REQUEST_CANCELED") {
        // user cancelled — no error shown
      } else {
        setError(getSafeAuthErrorMessage(err, t("auth.login.errors.appleFailed"), t));
      }
    } finally {
      setLoadingApple(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-transparent"
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <View
        className="flex-1 px-5"
        style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }}>

        {/* Top bar */}
        <View className="flex-row items-center justify-between mb-4">
          <Pressable
            onPress={() => goBackOrReplace(router, returnTo as never)}
            disabled={isBusy}
            accessibilityRole="button"
            style={({ pressed }) => ({ minHeight: 44, opacity: isBusy ? 0.5 : pressed ? 0.7 : 1 })}
            className="flex-row items-center gap-1">
            <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.7)" />
            <Text className="text-white/70 text-base">{t("auth.login.back")}</Text>
          </Pressable>
          <Text className="text-white/40 text-sm">v{appVersion}</Text>
        </View>

        {/* A compact identity gives the sign-in actions room to breathe. */}
        <View className="items-center mb-7 px-3">
          <AppIcon size={76} borderRadius={22} />
          <Text className="text-white text-3xl font-bold text-center mt-5 mb-2">
            {t("auth.login.welcome")}
          </Text>
          <Text className="text-white/65 text-sm text-center leading-5" style={{ maxWidth: 300 }}>
            {t("auth.login.subtitle")}
          </Text>
        </View>

        {/* Apple Sign-in */}
        {Platform.OS === "ios" && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={16}
            style={{ width: "100%", height: 52, marginBottom: 12, opacity: isBusy ? 0.5 : 1 }}
            onPress={() => {
              if (!isBusy) void handleAppleSignIn();
            }}
          />
        )}

        {/* Google Sign-in */}
        <Pressable
          onPress={handleGoogleSignIn}
          disabled={isBusy}
          accessibilityRole="button"
          className="flex-row items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white/5 px-4"
          style={({ pressed }) => ({ minHeight: 52, opacity: isBusy ? 0.5 : pressed ? 0.75 : 1 })}>
          {loadingGoogle ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#EA4335" />
              <Text className="text-base font-semibold text-white">{t("auth.login.continueWithGoogle")}</Text>
            </>
          )}
        </Pressable>

        {/* Error */}
        {error ? (
          <Text className="mt-4 text-center text-sm text-red-400">{error}</Text>
        ) : null}

        {/* Feature rows */}
        <View className="mt-6 gap-4 rounded-3xl border border-white/10 bg-white/5 p-4">
          {featureRows.map((row) => (
            <View key={row.title} className="flex-row items-start gap-3">
              <View className="w-8 h-8 rounded-xl bg-white/5 items-center justify-center">
                <Ionicons name={row.icon} size={17} color="rgba(255,255,255,0.75)" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-sm font-semibold mb-0.5">{row.title}</Text>
                <Text className="text-white/60 text-xs leading-4">{row.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View className="mt-4 items-center">
          <Pressable
            onPress={() => {
              if (fromOnboarding) completeOnboarding();
              router.replace(returnTo as never);
            }}
            disabled={isBusy}
            accessibilityRole="button"
            className="items-center justify-center px-5"
            style={({ pressed }) => ({ minHeight: 44, opacity: isBusy ? 0.5 : pressed ? 0.7 : 1 })}>
            <Text className="text-white/75 text-sm font-medium">{t("auth.login.continueAsGuest")}</Text>
          </Pressable>

          <Text className="text-white/50 text-xs text-center mt-2 leading-5 px-3">
            {t("auth.login.termsPrefix")}{" "}
            <Text
              className="underline text-white/70"
              onPress={() => Linking.openURL(termsUrl)}>
              {t("auth.login.terms")}
            </Text>
            {privacyUrl ? (
              <>
                {" "}{t("auth.login.and")}{" "}
                <Text
                  className="underline text-white/70"
                  onPress={() => Linking.openURL(privacyUrl)}>
                  {t("auth.login.privacy")}
                </Text>
              </>
            ) : null}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
