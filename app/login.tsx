import { useAuth } from "@/hooks/useSupabaseAuth";
import { OtpCodeInput } from "@/features/auth/OtpCodeInput";
import { PhoneNumberRow } from "@/features/auth/PhoneNumberRow";
import { usePhoneOtpLogin } from "@/features/auth/usePhoneOtpLogin";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { goBackOrReplace } from "@/utils/goBackOrReplace";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const returnTo = params.returnTo ?? "/(tabs)";
  const { signInWithPhoneOtp, verifyPhoneOtp } = useAuth();
  const {
    step,
    countryCode,
    formattedNationalPhone,
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
  } = usePhoneOtpLogin({
    signInWithPhoneOtp,
    verifyPhoneOtp,
    onVerified: () => router.replace(returnTo as never),
  });

  const backLabel = useMemo(() => (step === "otp" ? "Wrong number?" : "Back"), [step]);
  const title = useMemo(() => (step === "phone" ? "Welcome" : "Enter the code"), [step]);
  const subtitle = useMemo(() => {
    if (step === "phone") return "Get your daily personalized quotes.";
    if (displayE164) return `We sent a 6-digit code to ${displayE164}.`;
    return "We sent a 6-digit code. Enter it below.";
  }, [displayE164, step]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-transparent"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-1 px-6">
        <View className="mt-4">
          <Pressable
            onPress={() =>
              step === "otp"
                ? backToPhone()
                : goBackOrReplace(router, returnTo as never)
            }
            className="self-start"
            disabled={isBusy}
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
            <Text className="text-base text-white/80">{backLabel}</Text>
          </Pressable>
        </View>

        <View className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <View className="h-28 bg-white/5" />
          <View className="px-6 pb-6 pt-5">
            <Text className="text-2xl font-semibold text-white">{title}</Text>
            <Text className="mt-2 text-sm text-white/60">{subtitle}</Text>

            {step === "phone" ? (
              <>
                <PhoneNumberRow
                  countryCode={countryCode}
                  formattedValue={formattedNationalPhone}
                  disabled={isBusy}
                  onSelectCountry={setCountryCode}
                  onChangeText={setNationalPhoneInput}
                />

                <Text className="mt-3 text-xs text-white/55">
                  {displayE164 ? `We’ll send a verification code to ${displayE164}.` : "We’ll send a verification code."}
                </Text>

                <Pressable
                  onPress={sendCode}
                  disabled={!canSend}
                  className="mt-5 rounded-2xl bg-white py-3"
                  style={({ pressed }) => ({
                    opacity: canSend ? (pressed ? 0.9 : 1) : 0.5,
                  })}>
                  {sending ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text className="text-center text-base font-semibold text-black">Continue</Text>
                  )}
                </Pressable>

                <Text className="mt-3 text-center text-[11px] leading-4 text-white/40">
                  By continuing, you agree to receive SMS messages for verification.
                </Text>

                <Pressable
                  onPress={() => router.replace(returnTo as never)}
                  disabled={isBusy}
                  className="mt-4"
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                  <Text className="text-center text-sm text-white/70">Continue as guest</Text>
                </Pressable>
              </>
            ) : (
              <>
                <OtpCodeInput
                  value={tokenDigits}
                  onChange={setOtp}
                  disabled={isBusy}
                  autoFocus
                />

                <Pressable
                  onPress={verifyCode}
                  disabled={!canVerify}
                  className="mt-5 rounded-2xl bg-white py-3"
                  style={({ pressed }) => ({
                    opacity: canVerify ? (pressed ? 0.9 : 1) : 0.5,
                  })}>
                  {verifying ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text className="text-center text-base font-semibold text-black">Verify</Text>
                  )}
                </Pressable>

                <View className="mt-4 flex-row items-center justify-center">
                  <Pressable
                    onPress={resendCode}
                    disabled={resendRemaining > 0 || resending || sending || verifying}
                    style={({ pressed }) => ({
                      opacity: resendRemaining > 0 || resending || sending || verifying ? 0.5 : pressed ? 0.8 : 1,
                    })}>
                    <Text className="text-sm text-white/70">
                      {resendRemaining > 0 ? `Resend in ${resendRemaining}s` : resending ? "Resending…" : "Resend code"}
                    </Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={backToPhone}
                  disabled={isBusy}
                  className="mt-4"
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                  <Text className="text-center text-sm text-white/70">Edit phone number</Text>
                </Pressable>
              </>
            )}

            {error ? (
              <Text className="mt-4 text-center text-sm text-red-400">{error}</Text>
            ) : null}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
