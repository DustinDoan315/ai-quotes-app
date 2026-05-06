import { useAuth } from "@/hooks/useSupabaseAuth";
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
import { AntDesign } from "@expo/vector-icons";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const returnTo = params.returnTo ?? "/(tabs)";
  const { signInWithOAuth } = useAuth();
  const [loadingProvider, setLoadingProvider] = useState<"google" | "apple" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isBusy = loadingProvider !== null;

  const handleOAuthSignIn = async (provider: "google" | "apple") => {
    if (isBusy) return;
    setError(null);
    setLoadingProvider(provider);
    try {
      const { error: authError } = await signInWithOAuth(provider);
      if (authError) {
        setError("Sign-in failed. Please try again.");
        return;
      }
      router.replace(returnTo as never);
    } catch {
      setError("Sign-in failed. Please try again.");
    } finally {
      setLoadingProvider(null);
    }
  };

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
            <Pressable
              onPress={() => handleOAuthSignIn("apple")}
              disabled={isBusy}
              className="mt-5 flex-row items-center justify-center gap-2 rounded-2xl bg-white py-3.5"
              style={({ pressed }) => ({ opacity: isBusy ? 0.5 : pressed ? 0.8 : 1 })}>
              {loadingProvider === "apple" ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <AntDesign name="apple1" size={18} color="#000" />
                  <Text className="text-base font-semibold text-black">
                    Sign in with Apple
                  </Text>
                </>
              )}
            </Pressable>
          )}

          <Pressable
            onPress={() => handleOAuthSignIn("google")}
            disabled={isBusy}
            className="mt-3 flex-row items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 py-3.5"
            style={({ pressed }) => ({ opacity: isBusy ? 0.5 : pressed ? 0.8 : 1 })}>
            {loadingProvider === "google" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <AntDesign name="google" size={18} color="#fff" />
                <Text className="text-base font-semibold text-white">
                  Sign in with Google
                </Text>
              </>
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
