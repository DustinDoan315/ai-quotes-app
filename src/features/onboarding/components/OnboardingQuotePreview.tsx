import { HomeBackground } from "@/features/home/HomeBackground";
import { HOME_BACKGROUNDS } from "@/theme/homeBackgrounds";
import { MotiView } from "moti";
import { Text, View } from "react-native";

type Props = {
  width: number;
  quote: string;
  attribution: string;
  sampleLabel: string;
  quotePositionY: number;
  reduceMotion: boolean;
};

const CARD_ASPECT_RATIO = 3 / 5;

export function OnboardingQuotePreview({
  width,
  quote,
  attribution,
  sampleLabel,
  quotePositionY,
  reduceMotion,
}: Props) {
  return (
    <View
      testID="onboarding-quote-preview"
      style={{
        pointerEvents: "none",
        width,
        aspectRatio: CARD_ASPECT_RATIO,
        overflow: "hidden",
        borderRadius: 28,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.18)",
        backgroundColor: "#16131b",
      }}
    >
      <HomeBackground
        palette={HOME_BACKGROUNDS[0]}
        width={width}
        height={width / CARD_ASPECT_RATIO}
      />
      <View
        style={{
          pointerEvents: "none",
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: "rgba(0,0,0,0.18)",
        }}
      />
      <Text
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          color: "rgba(255,255,255,0.72)",
          fontSize: 9,
          fontWeight: "700",
          letterSpacing: 1.4,
        }}
      >
        {sampleLabel}
      </Text>
      <MotiView
        from={
          reduceMotion
            ? { opacity: 1, translateY: 0 }
            : { opacity: 0, translateY: 14 }
        }
        animate={{ opacity: 1, translateY: 0 }}
        transition={{
          type: "timing",
          duration: reduceMotion ? 0 : 320,
          delay: reduceMotion ? 0 : 300,
        }}
        style={{
          position: "absolute",
          left: "7%",
          right: "7%",
          top: `${quotePositionY}%`,
        }}
      >
        <View
          style={{
            alignSelf: "center",
            maxWidth: "100%",
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.28)",
            backgroundColor: "rgba(0,0,0,0.58)",
            paddingHorizontal: 15,
            paddingVertical: 12,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 15,
              fontWeight: "600",
              fontStyle: "italic",
              lineHeight: 21,
              textAlign: "center",
            }}
          >
            {quote}
          </Text>
        </View>
      </MotiView>
      <Text
        style={{
          position: "absolute",
          bottom: 14,
          left: 14,
          color: "rgba(255,255,255,0.58)",
          fontSize: 9,
          fontWeight: "700",
          letterSpacing: 1.3,
        }}
      >
        {attribution}
      </Text>
    </View>
  );
}
