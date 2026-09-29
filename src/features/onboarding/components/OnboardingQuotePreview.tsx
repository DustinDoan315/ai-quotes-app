import { HomeBackground } from "@/features/home/HomeBackground";
import { HOME_BACKGROUNDS } from "@/theme/homeBackgrounds";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { Text, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

type Props = {
  width: number;
  quote: string;
  attribution: string;
  sampleLabel: string;
  quotePositionY: number;
  reduceMotion: boolean;
  stage?: "reveal" | "personalize";
  detailLabel?: string;
  outcomeLabel?: string;
};

const CARD_ASPECT_RATIO = 3 / 5;

function IllustrativePhoto({
  width,
  reduceMotion,
}: {
  width: number;
  reduceMotion: boolean;
}) {
  return (
    <MotiView
      from={reduceMotion ? { scale: 1 } : { scale: 0.62 }}
      animate={{ scale: 1 }}
      transition={{
        type: "timing",
        duration: reduceMotion ? 0 : 600,
        delay: reduceMotion ? 0 : 100,
      }}
      style={{
        position: "absolute",
        width,
        height: width / CARD_ASPECT_RATIO,
        overflow: "hidden",
        borderRadius: 26,
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.65)",
      }}
    >
      <Svg width="100%" height="100%" viewBox="0 0 240 400">
        <Rect width="240" height="400" fill="#5f82a3" />
        <Circle cx="174" cy="104" r="44" fill="#f9d49b" />
        <Path d="M0 265 L80 139 L147 254 L240 125 L240 400 L0 400 Z" fill="#324b72" />
        <Path d="M0 309 L94 205 L178 312 L240 229 L240 400 L0 400 Z" fill="#233c59" />
        <Rect y="318" width="240" height="82" fill="#315569" />
        <Path d="M0 347 Q60 331 120 348 T240 346 L240 400 L0 400 Z" fill="#d38e6d" />
      </Svg>
    </MotiView>
  );
}

export function OnboardingQuotePreview({
  width,
  quote,
  attribution,
  sampleLabel,
  quotePositionY,
  reduceMotion,
  stage = "reveal",
  detailLabel,
  outcomeLabel,
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
        palette={HOME_BACKGROUNDS[stage === "reveal" ? 0 : 2]}
        width={width}
        height={width / CARD_ASPECT_RATIO}
      />
      {stage === "reveal" && (
        <IllustrativePhoto width={width} reduceMotion={reduceMotion} />
      )}
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
      {detailLabel && (
        <View
          style={{
            position: "absolute",
            top: stage === "reveal" ? "22%" : "20%",
            alignSelf: "center",
            alignItems: "center",
            flexDirection: "row",
            gap: 7,
          }}
        >
          {stage === "personalize" && (
            <Ionicons
              name="pencil-outline"
              size={15}
              color="rgba(255,255,255,0.85)"
            />
          )}
          <Text
            style={{
              color: "#fff",
              fontSize: 10,
              fontWeight: "700",
              letterSpacing: 1,
              textAlign: "center",
            }}
          >
            {detailLabel}
          </Text>
        </View>
      )}
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
          delay: reduceMotion ? 0 : stage === "reveal" ? 800 : 300,
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
      <View style={{ position: "absolute", bottom: 14, left: 14, right: 14 }}>
        <Text
          style={{
            color: "rgba(255,255,255,0.85)",
            fontSize: 9,
            fontWeight: "700",
            letterSpacing: 1.1,
          }}
        >
          {attribution}
        </Text>
        {outcomeLabel && (
          <MotiView
            from={
              reduceMotion
                ? { opacity: 1, translateY: 0 }
                : { opacity: 0, translateY: 6 }
            }
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              type: "timing",
              duration: reduceMotion ? 0 : 250,
              delay: reduceMotion ? 0 : 750,
            }}
            style={{
              marginTop: 5,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
              {outcomeLabel}
            </Text>
          </MotiView>
        )}
      </View>
    </View>
  );
}
