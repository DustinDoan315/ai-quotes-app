import { useAuth } from "@/hooks/useSupabaseAuth";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { goBackOrReplace } from "@/utils/goBackOrReplace";

const IOS_CLIENT_ID = "744209131746-b05bu8ei1gqsa7s62b8ve4v2re3n3dsd.apps.googleusercontent.com";
const WEB_CLIENT_ID = "744209131746-c948eqrvvencbe2ijqu5qjtf4f5m39li.apps.googleusercontent.com";

GoogleSignin.configure({
  iosClientId: IOS_CLIENT_ID,
  webClientId: WEB_CLIENT_ID,
  scopes: ["profile", "email"],
});

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const returnTo = params.returnTo ?? "/(tabs)";
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    if (isBusy) return;
    setError(null);
    setLoadingGoogle(true);
    try {
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      const idToken = tokens.idToken;
      if (!idToken) {
        setError("Google sign-in failed. Please try again.");
        return;
      }
      const { error: authError } = await signInWithGoogle(idToken);
      if (authError) {
        setError("Sign-in failed. Please try again.");
        return;
      }
      router.replace(returnTo as never);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled — no error shown
      } else if (e?.code === statusCodes.IN_PROGRESS) {
        // already signing in — ignore
      } else {
        setError("Google sign-in failed. Please try again.");
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleAppleSignIn = async () => {
    if (isBusy) return;
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
        setError("Apple sign-in failed. Please try again.");
        return;
      }
      const { error: authError } = await signInWithApple(identityToken);
      if (authError) {
        setError("Sign-in failed. Please try again.");
        return;
      }
      router.replace(returnTo as never);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === "ERR_REQUEST_CANCELED") {
        // user cancelled — no error shown
      } else {
        setError("Apple sign-in failed. Please try again.");
      }
    } finally {
      setLoadingApple(false);
    }
  };

  const isBusy = loadingGoogle || loadingApple;

  return (
    <View
      className="flex-1 bg-transparent px-6"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="mt-4">
        <Pressable
          onPress={() => goBackOrReplace(router, returnTo as never)}
          className="self-start"
          disabled={isBusy}
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <Text className="text-base text-white/80">Back</Text>
        </Pressable>
      </View>

      <View className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <View className="h-28 bg-white/5" />
        <View className="px-6 pb-6 pt-5">
          <Text className="text-2xl font-semibold text-white">Welcome</Text>
          <Text className="mt-2 text-sm text-white/60">
            Get your daily personalized quotes.
          </Text>

          {Platform.OS === "ios" && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={16}
              style={{ width: "100%", height: 50, marginTop: 20 }}
              onPress={handleAppleSignIn}
            />
          )}

          <Pressable
            onPress={handleGoogleSignIn}
            disabled={isBusy}
            className="mt-3 flex-row items-center justify-center rounded-2xl border border-white/20 bg-white/10 py-3.5"
            style={({ pressed }) => ({ opacity: isBusy ? 0.5 : pressed ? 0.8 : 1 })}>
            {loadingGoogle ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-semibold text-white">
                Sign in with Google
              </Text>
            )}
          </Pressable>

          {error ? (
            <Text className="mt-4 text-center text-sm text-red-400">{error}</Text>
          ) : null}

          <Pressable
            onPress={() => router.replace(returnTo as never)}
            disabled={isBusy}
            className="mt-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
            <Text className="text-center text-sm text-white/70">
              Continue as guest
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
