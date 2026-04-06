import { useAuth } from "@/hooks/useSupabaseAuth";
import { EmailAddressRow } from "@/features/auth/EmailAddressRow";
import { OtpCodeInput } from "@/features/auth/OtpCodeInput";
import { useEmailOtpLogin } from "@/features/auth/useEmailOtpLogin";
import { strings } from "@/theme/strings";
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
  const { sendEmailOtp, verifyEmailOtp } = useAuth();
  const {
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
  } = useEmailOtpLogin({
    sendEmailOtp,
    verifyEmailOtp,
    onVerified: () => router.replace(returnTo as never),
  });

  const backLabel = useMemo(
    () => (step === "otp" ? strings.auth.wrongEmail : strings.auth.back),
    [step],
  );
  const title = useMemo(
    () => (step === "email" ? strings.auth.welcomeTitle : strings.auth.enterCodeTitle),
    [step],
  );
  const subtitle = useMemo(() => {
    if (step === "email") return strings.auth.welcomeSubtitle;
    if (verificationEmail) return strings.auth.codeSentTo(verificationEmail);
    return strings.auth.codeSentGeneric;
  }, [step, verificationEmail]);

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
                ? backToEmail()
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

            {step === "email" ? (
              <>
                <EmailAddressRow
                  value={emailInput}
                  disabled={isBusy}
                  onChangeText={setEmailInput}
                />

                <Text className="mt-3 text-xs text-white/55">
                  {resendRemaining > 0
                    ? strings.auth.resendIn(resendRemaining)
                    : normalizedEmail
                      ? strings.auth.verificationTo(normalizedEmail)
                      : strings.auth.verificationGeneric}
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
                    <Text className="text-center text-base font-semibold text-black">
                      {strings.auth.continueCta}
                    </Text>
                  )}
                </Pressable>

                <Text className="mt-3 text-center text-[11px] leading-4 text-white/40">
                  {strings.auth.verificationConsent}
                </Text>

                <Pressable
                  onPress={() => router.replace(returnTo as never)}
                  disabled={isBusy}
                  className="mt-4"
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                  <Text className="text-center text-sm text-white/70">
                    {strings.auth.continueAsGuest}
                  </Text>
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
                    <Text className="text-center text-base font-semibold text-black">
                      {strings.auth.verifyCta}
                    </Text>
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
                      {resendRemaining > 0
                        ? strings.auth.resendIn(resendRemaining)
                        : resending
                          ? strings.auth.resending
                          : strings.auth.resendCode}
                    </Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={backToEmail}
                  disabled={isBusy}
                  className="mt-4"
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                  <Text className="text-center text-sm text-white/70">
                    {strings.auth.editEmail}
                  </Text>
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
