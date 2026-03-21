import { HOME_BACKGROUNDS } from "@/theme/homeBackgrounds";
import { Pressable, Text, View } from "react-native";

interface HomeBackgroundDevControlProps {
  readonly index: number | null;
  readonly onPress: () => void;
}

export function HomeBackgroundDevControl({
  index,
  onPress,
}: HomeBackgroundDevControlProps) {
  if (!__DEV__) {
    return null;
  }
  const total = HOME_BACKGROUNDS.length;
  const line =
    index === null ? "BG (prod roll)" : `BG ${index + 1}/${total}`;
  let sub = "tap → next";
  if (index === null) {
    sub = "tap → preset 1";
  } else if (index >= total - 1) {
    sub = "tap → prod";
  }
  return (
    <View className="absolute bottom-40 right-3 z-[100]">
      <Pressable
        onPress={onPress}
        className="min-w-[140px] rounded-xl border border-amber-400/60 bg-black/90 px-3 py-2.5"
        style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
        <Text className="text-center text-[10px] font-bold uppercase tracking-wide text-amber-300">
          Dev backgrounds
        </Text>
        <Text className="mt-1 text-center text-xs font-semibold text-white">
          {line}
        </Text>
        <Text className="mt-0.5 text-center text-[10px] text-white/65">
          {sub}
        </Text>
      </Pressable>
    </View>
  );
}
