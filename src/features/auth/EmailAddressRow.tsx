import { strings } from "@/theme/strings";
import { TextInput, View } from "react-native";

interface EmailAddressRowProps {
  value: string;
  disabled?: boolean;
  onChangeText: (next: string) => void;
}

export function EmailAddressRow({
  value,
  disabled,
  onChangeText,
}: EmailAddressRowProps) {
  return (
    <View className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={strings.auth.emailPlaceholder}
        placeholderTextColor="rgba(255,255,255,0.4)"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!disabled}
        autoComplete="email"
        textContentType="emailAddress"
        className="text-base text-white"
      />
    </View>
  );
}
