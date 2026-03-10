import { useAuth } from "@/hooks/useSupabaseAuth";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const returnTo = params.returnTo ?? "/(tabs)";
  const { signInWithPhoneOtp, verifyPhoneOtp } = useAuth();
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const otpInputRef = useRef<TextInput>(null);

  const normalizedPhone = phone.trim().replaceAll(/\s/g, "");
  const canSend = normalizedPhone.length >= 10;
  const canVerify = token.trim().length >= 4;

  const handleSendCode = async () => {
    if (!canSend) return;
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await signInWithPhoneOtp(
        normalizedPhone.startsWith("+") ? normalizedPhone : `+${normalizedPhone}`,
      );
      if (err) {
        setError(err.message ?? "Failed to send code");
        return;
      }
      setStep("otp");
      setToken("");
      setTimeout(() => otpInputRef.current?.focus(), 300);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!canVerify) return;
    setError(null);
    setLoading(true);
    try {
      const phoneForVerify =
        normalizedPhone.startsWith("+") ? normalizedPhone : `+${normalizedPhone}`;
      const { error: err } = await verifyPhoneOtp(phoneForVerify, token.trim());
      if (err) {
        setError(err.message ?? "Invalid code");
        return;
      }
      router.replace(returnTo as never);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-black"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-1 justify-center px-6">
        <View className="mb-6">
          <Pressable
            onPress={() => router.back()}
            className="mb-4 self-start"
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
            <Text className="text-base text-white/80">Back</Text>
          </Pressable>
          <Text className="text-2xl font-semibold text-white">
            {step === "phone" ? "Sign in with phone" : "Enter code"}
          </Text>
          <Text className="mt-2 text-sm text-white/60">
            {step === "phone"
              ? "We'll send a one-time code to your number."
              : `Code sent to ${normalizedPhone}. Enter it below.`}
          </Text>
        </View>

        {step === "phone" ? (
          <>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 234 567 8900"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="phone-pad"
              editable={!loading}
              className="mb-4 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-base text-white"
              autoCapitalize="none"
              autoComplete="tel"
            />
            <Pressable
              onPress={handleSendCode}
              disabled={!canSend || loading}
              className="rounded-xl bg-white py-3"
              style={({ pressed }) => ({
                opacity: canSend && !loading ? (pressed ? 0.9 : 1) : 0.5,
              })}>
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text className="text-center text-base font-semibold text-black">
                  Send code
                </Text>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <TextInput
              ref={otpInputRef}
              value={token}
              onChangeText={setToken}
              placeholder="000000"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="number-pad"
              maxLength={6}
              editable={!loading}
              className="mb-4 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-center text-xl tracking-[0.5em] text-white"
            />
            <Pressable
              onPress={handleVerify}
              disabled={!canVerify || loading}
              className="mb-3 rounded-xl bg-white py-3"
              style={({ pressed }) => ({
                opacity: canVerify && !loading ? (pressed ? 0.9 : 1) : 0.5,
              })}>
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text className="text-center text-base font-semibold text-black">
                  Verify
                </Text>
              )}
            </Pressable>
            <Pressable
              onPress={() => setStep("phone")}
              disabled={loading}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
              <Text className="text-center text-sm text-white/70">
                Use a different number
              </Text>
            </Pressable>
          </>
        )}

        {error ? (
          <Text className="mt-4 text-center text-sm text-red-400">{error}</Text>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}
