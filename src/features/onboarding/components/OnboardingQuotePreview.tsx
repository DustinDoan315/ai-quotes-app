import { QUOTE_DISPLAY_ASPECT } from "@/constants/quoteImageSize";
import { Image } from "expo-image";
import { InklyShareWatermark } from "@/components/InklyShareWatermark";
import { MotiView } from "moti";
import { Text, View } from "react-native";

const photoSource = require("../../../../assets/images/onboarding-coffee.jpg");

type Props = {
  width: number;
  quote: string;
  attribution: string;
  sampleLabel: string;
  showWatermark?: boolean;
  reduceMotion: boolean;
};

export function OnboardingQuotePreview({
  width,
  quote,
  attribution,
  sampleLabel,
  showWatermark = false,
  reduceMotion,
}: Props) {
  return (
    <View
      testID="onboarding-quote-preview"
      style={{
        pointerEvents: "none",
        width,
        aspectRatio: QUOTE_DISPLAY_ASPECT,
        overflow: "hidden",
        borderRadius: 28,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.18)",
        backgroundColor: "#16131b",
      }}
    >
      <Image
        source={photoSource}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
        transition={0}
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
          reduceMotion || showWatermark
            ? { opacity: 1, translateY: 0 }
            : { opacity: 0, translateY: 14 }
        }
        animate={{ opacity: 1, translateY: 0 }}
        transition={{
          type: "timing",
          duration: reduceMotion || showWatermark ? 0 : 320,
          delay: reduceMotion || showWatermark ? 0 : 900,
        }}
        style={{
          position: "absolute",
          left: "7%",
          right: "7%",
          bottom: 48,
        }}
      >
        <View
          style={{
            alignSelf: "flex-start",
            maxWidth: "100%",
            borderRadius: 18,
            backgroundColor: "rgba(0,0,0,0.45)",
            paddingHorizontal: 15,
            paddingVertical: 12,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 15,
              fontWeight: "700",
              lineHeight: 21,
              textAlign: "left",
            }}
          >
            {quote}
          </Text>
        </View>
      </MotiView>
      <InklyShareWatermark visible={showWatermark} />
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
