import { useAuth } from "@/hooks/useSupabaseAuth";
import * as Crypto from "expo-crypto";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { goBackOrReplace } from "@/utils/goBackOrReplace";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

GoogleSignin.configure({
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  scopes: ["profile", "email"],
});

const FEATURE_ROW_ICONS = [
  "shield-checkmark-outline",
  "settings-outline",
  "cloud-outline",
] as const;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const returnTo = params.returnTo ?? "/(tabs)";
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { t } = useTranslation();
  const isBusy = loadingGoogle || loadingApple;
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

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
      await GoogleSignin.hasPlayServices();
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
      const { error: authError } = await signInWithGoogle(idToken, rawNonce);
      if (authError) {
        setError(t("auth.login.errors.signInFailed"));
        return;
      }
      router.replace(returnTo as never);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled — no error shown
      } else if (e?.code === statusCodes.IN_PROGRESS) {
        // already in progress — ignore
      } else {
        setError(t("auth.login.errors.googleFailed"));
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError(null);
    setLoadingApple(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const identityToken = credential.identityToken;
      if (!identityToken) {
        setError(t("auth.login.errors.appleFailed"));
        return;
      }
      const { error: authError } = await signInWithApple(identityToken);
      if (authError) {
        setError(t("auth.login.errors.signInFailed"));
        return;
      }
      router.replace(returnTo as never);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === "ERR_REQUEST_CANCELED") {
        // user cancelled — no error shown
      } else {
        setError(t("auth.login.errors.appleFailed"));
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
        <View className="flex-row items-center justify-between mb-5">
          <Pressable
            onPress={() => goBackOrReplace(router, returnTo as never)}
            disabled={isBusy}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            className="flex-row items-center gap-1">
            <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.7)" />
            <Text className="text-white/70 text-base">{t("auth.login.back")}</Text>
          </Pressable>
          <Text className="text-white/40 text-sm">v{appVersion}</Text>
        </View>

        {/* Hero card */}
        <View className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 mb-7">
          {/* Card header row */}
          <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
            <Text className="text-white text-base font-semibold">Inkly</Text>
            <View className="w-10 h-5 rounded-full bg-white/20 border border-white/10" />
          </View>

          {/* Orb */}
          <View className="items-center justify-center py-6">
            <View
              style={{
                width: 150,
                height: 150,
                borderRadius: 75,
                backgroundColor: "#1a2a6c",
                shadowColor: "#4B6CB7",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.9,
                shadowRadius: 40,
                elevation: 25,
              }}>
              {/* Highlight shimmer */}
              <View
                style={{
                  position: "absolute",
                  top: 18,
                  left: 22,
                  width: 55,
                  height: 55,
                  borderRadius: 27.5,
                  backgroundColor: "rgba(255,255,255,0.12)",
                }}
              />
              {/* Darker centre depth */}
              <View
                style={{
                  position: "absolute",
                  top: 40,
                  left: 40,
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  backgroundColor: "rgba(0,0,40,0.35)",
                }}
              />
            </View>
          </View>

          {/* Vibe label */}
          <View className="items-center pb-6">
            <Text className="text-white/40 text-xs font-semibold tracking-widest uppercase mb-1">
              {t("auth.login.todaysVibeLabel")}
            </Text>
            <Text className="text-white text-3xl font-bold">Midnight</Text>
          </View>
        </View>

        {/* Headline */}
        <Text className="text-white text-2xl font-bold mb-2">{t("auth.login.welcome")}</Text>
        <Text className="text-white/50 text-sm mb-6 leading-5">
          {t("auth.login.subtitle")}
        </Text>

        {/* Apple Sign-in */}
        {Platform.OS === "ios" && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={16}
            style={{ width: "100%", height: 52, marginBottom: 12 }}
            onPress={handleAppleSignIn}
          />
        )}

        {/* Google Sign-in */}
        <Pressable
          onPress={handleGoogleSignIn}
          disabled={isBusy}
          className="flex-row items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white/5 py-3.5"
          style={({ pressed }) => ({ opacity: isBusy ? 0.5 : pressed ? 0.75 : 1 })}>
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
        <View className="mt-7 gap-5">
          {featureRows.map((row) => (
            <View key={row.title} className="flex-row items-start gap-3">
              <View className="w-8 h-8 rounded-xl bg-white/8 items-center justify-center mt-0.5">
                <Ionicons name={row.icon} size={17} color="rgba(255,255,255,0.55)" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-sm font-semibold mb-0.5">{row.title}</Text>
                <Text className="text-white/45 text-xs leading-4">{row.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View className="mt-8 items-center">
          <Pressable
            onPress={() => router.replace(returnTo as never)}
            disabled={isBusy}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <Text className="text-white/60 text-sm">{t("auth.login.continueAsGuest")}</Text>
          </Pressable>

          <Text className="text-white/25 text-xs text-center mt-4 leading-4">
            {t("auth.login.termsPrefix")}{" "}
            <Text
              className="underline text-white/35"
              onPress={() => Linking.openURL("https://inkly.app/terms")}>
              {t("auth.login.terms")}
            </Text>
            {" "}{t("auth.login.and")}{" "}
            <Text
              className="underline text-white/35"
              onPress={() => Linking.openURL("https://inkly.app/privacy")}>
              {t("auth.login.privacy")}
            </Text>
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
