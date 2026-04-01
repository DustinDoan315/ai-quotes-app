import { MotiView } from "moti";
import { Text, View } from "react-native";

import type { EmojiBurst } from "@/features/home/useHomeFeedState";

type Props = {
  bursts: EmojiBurst[];
  screenHeight: number;
};

export function HomeEmojiOverlay({ bursts, screenHeight }: Props) {
  return (
    <View className="pointer-events-none absolute inset-0">
      {bursts.map((burst) => (
        <MotiView
          key={burst.id}
          from={{
            opacity: 1,
            translateY: screenHeight * 0.25,
            scale: 0.9 * burst.scale,
          }}
          animate={{
            opacity: 1,
            translateY: -screenHeight * 1.2,
            scale: 1.6 * burst.scale,
          }}
          exit={{
            opacity: 0,
            translateY: -screenHeight * 1.6,
            scale: 1.4 * burst.scale,
          }}
          transition={{
            type: "timing",
            duration: 2500,
            delay: burst.delay,
          }}
          style={{
            position: "absolute",
            bottom: 60,
            left: `${burst.x}%`,
          }}>
          <Text className="text-5xl">{burst.emoji}</Text>
        </MotiView>
      ))}
    </View>
  );
}
