import { Text, TextInput, View } from "react-native";
import CountryPicker, { type CountryCode } from "react-native-country-picker-modal";
import { useState } from "react";

interface PhoneNumberRowProps {
  countryCode: CountryCode;
  formattedValue: string;
  disabled?: boolean;
  onSelectCountry: (countryCode: CountryCode) => void;
  onChangeText: (next: string) => void;
}

export function PhoneNumberRow({
  countryCode,
  formattedValue,
  disabled,
  onSelectCountry,
  onChangeText,
}: PhoneNumberRowProps) {
  const [dialCode, setDialCode] = useState<string | null>(null);

  return (
    <View className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <View className="flex-row items-center px-3 py-3">
        <CountryPicker
          countryCode={countryCode}
          withFilter
          withFlag
          withCallingCode
          withEmoji
          withCountryNameButton={false}
          onSelect={(c) => {
            onSelectCountry(c.cca2);
            const firstCode = Array.isArray(c.callingCode) && c.callingCode.length > 0 ? c.callingCode[0] : null;
            setDialCode(firstCode);
          }}
          containerButtonStyle={{ paddingVertical: 6, paddingHorizontal: 6 }}
        />
        <View className="ml-2">
          <Text className="text-sm font-semibold text-white">
            {dialCode ? `+${dialCode}` : countryCode}
          </Text>
        </View>
        <View className="mx-3 h-6 w-px bg-white/10" />
        <TextInput
          value={formattedValue}
          onChangeText={onChangeText}
          placeholder="Phone number"
          placeholderTextColor="rgba(255,255,255,0.4)"
          keyboardType="phone-pad"
          editable={!disabled}
          className="flex-1 py-1 text-base text-white"
          autoCapitalize="none"
          autoComplete="tel"
        />
      </View>
    </View>
  );
}
