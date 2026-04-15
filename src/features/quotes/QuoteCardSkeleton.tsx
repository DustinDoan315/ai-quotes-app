import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

type Props = { screenHeight: number };

export function QuoteCardSkeleton({ screenHeight }: Props) {
  const shimmerOpacity = useSharedValue(0.4);

  useEffect(() => {
    shimmerOpacity.value = withRepeat(withTiming(1.0, { duration: 850 }), -1, true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmerOpacity.value,
  }));

  return (
    <View
      style={{ height: screenHeight }}
      className="items-center justify-center py-6">
      <Animated.View
        style={shimmerStyle}
        className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-black/50">
        <View style={{ aspectRatio: 3 / 4 }} className="relative bg-white/5">
          <View className="absolute inset-x-0 bottom-0 px-5 pb-4 pt-3">
            <View className="mb-2 flex-row items-center">
              <View className="h-9 w-9 rounded-full border border-white/25 bg-white/15" />
              <View className="ml-2.5 flex-1 gap-1.5">
                <View className="h-3 w-28 rounded bg-white/20" />
                <View className="h-2.5 w-20 rounded bg-white/10" />
              </View>
            </View>
            <View className="mt-1 gap-2">
              <View className="h-3.5 w-full rounded bg-white/15" />
              <View className="h-3.5 rounded bg-white/[0.12]" style={{ width: "83%" }} />
              <View className="h-3.5 rounded bg-white/10" style={{ width: "67%" }} />
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
