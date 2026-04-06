import { useEffect, useMemo, useRef } from "react";
import { normalizeOtpDigits } from "@/utils/otp";
import { Pressable, Text, TextInput, View } from "react-native";

interface OtpCodeInputProps {
  value: string;
  disabled?: boolean;
  autoFocus?: boolean;
  onChange: (next: string) => void;
}

export function OtpCodeInput({ value, disabled, autoFocus, onChange }: OtpCodeInputProps) {
  const inputRef = useRef<TextInput>(null);
  const digits = useMemo(() => normalizeOtpDigits(value), [value]);
  const activeIndex = Math.min(digits.length, 5);
  const keys = useMemo(() => ["0", "1", "2", "3", "4", "5"] as const, []);

  useEffect(() => {
    if (!autoFocus) return;
    if (disabled) return;
    const t = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, [autoFocus, disabled]);

  const handleChangeText = (next: string) => {
    onChange(normalizeOtpDigits(next));
  };

  const handlePress = () => {
    if (disabled) return;
    inputRef.current?.focus();
  };

  return (
    <View className="mt-5">
      <TextInput
        ref={inputRef}
        value={digits}
        onChangeText={handleChangeText}
        editable={!disabled}
        keyboardType="number-pad"
        maxLength={6}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        style={{ position: "absolute", opacity: 0, width: 1, height: 1 }}
      />
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        className="flex-row justify-between"
        style={({ pressed }) => ({ opacity: disabled ? 0.6 : pressed ? 0.95 : 1 })}>
        {keys.map((k) => {
          const i = Number(k);
          const char = digits[i] ?? "";
          const isActive = i === activeIndex;
          const border = isActive ? "border-white/40" : "border-white/10";
          return (
            <View key={k} className={`h-14 w-12 items-center justify-center rounded-2xl border ${border} bg-white/5`}>
              <Text className="text-2xl font-semibold text-white">{char || " "}</Text>
            </View>
          );
        })}
      </Pressable>
    </View>
  );
}
