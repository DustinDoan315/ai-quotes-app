import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

type ServiceUnavailableScreenProps = {
  isRetrying: boolean;
  onRetry: () => void;
};

export function ServiceUnavailableScreen({
  isRetrying,
  onRetry,
}: ServiceUnavailableScreenProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-1 items-center justify-center bg-black px-8">
      <View className="w-full max-w-sm items-center rounded-[28px] border border-white/15 bg-white/10 px-6 py-7">
        <Text className="text-center text-xl font-semibold text-white">
          {t("serviceUnavailable.title")}
        </Text>
        <Text className="mt-3 text-center text-sm leading-5 text-white/70">
          {t("serviceUnavailable.body")}
        </Text>
        <Pressable
          onPress={onRetry}
          disabled={isRetrying}
          className="mt-6 rounded-full bg-white px-6 py-3"
          style={({ pressed }) => ({
            opacity: isRetrying ? 0.6 : pressed ? 0.85 : 1,
          })}
        >
          <Text className="font-semibold text-black">
            {isRetrying
              ? t("serviceUnavailable.retrying")
              : t("serviceUnavailable.retry")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
