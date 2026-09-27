import { Ionicons } from "@expo/vector-icons";
import {
  clampQuotePosition,
  type QuoteBoxSize,
  type QuotePosition,
} from "@/features/quotes/quotePosition";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { StyleSheet, View } from "react-native";

type Props = {
  position: QuotePosition;
  children: ReactNode;
  onPositionChange?: (position: QuotePosition) => void;
};

export function QuotePositionLayer({
  position,
  children,
  onPositionChange,
}: Props) {
  const [frame, setFrame] = useState<QuoteBoxSize>({ width: 0, height: 0 });
  const [quote, setQuote] = useState<QuoteBoxSize>({ width: 0, height: 0 });
  const x = useSharedValue(position.x);
  const y = useSharedValue(position.y);
  const startX = useSharedValue(position.x);
  const startY = useSharedValue(position.y);

  useEffect(() => {
    x.value = position.x;
    y.value = position.y;
  }, [position.x, position.y, x, y]);

  const reportPosition = useCallback(
    (nextX: number, nextY: number) => {
      onPositionChange?.(
        clampQuotePosition({ x: nextX, y: nextY }, frame, quote),
      );
    },
    [frame, onPositionChange, quote],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(Boolean(onPositionChange))
        .maxPointers(1)
        .onStart(() => {
          startX.value = x.value;
          startY.value = y.value;
        })
        .onUpdate((event) => {
          "worklet";
          if (frame.width <= 0 || frame.height <= 0) return;

          const minX = Math.min(0.5, quote.width / frame.width / 2);
          const minY = Math.min(0.5, quote.height / frame.height / 2);
          x.value = Math.min(
            1 - minX,
            Math.max(minX, startX.value + event.translationX / frame.width),
          );
          y.value = Math.min(
            1 - minY,
            Math.max(minY, startY.value + event.translationY / frame.height),
          );
        })
        .onEnd(() => {
          "worklet";
          scheduleOnRN(reportPosition, x.value, y.value);
        }),
    [frame, onPositionChange, quote, reportPosition, startX, startY, x, y],
  );

  const positionedStyle = useAnimatedStyle(() => {
    const minX = frame.width > 0
      ? Math.min(0.5, quote.width / frame.width / 2)
      : 0.5;
    const minY = frame.height > 0
      ? Math.min(0.5, quote.height / frame.height / 2)
      : 0.5;
    const centerX = Math.min(1 - minX, Math.max(minX, x.value));
    const centerY = Math.min(1 - minY, Math.max(minY, y.value));

    return {
      transform: [
        { translateX: frame.width * centerX - quote.width / 2 },
        { translateY: frame.height * centerY - quote.height / 2 },
      ],
    };
  });

  return (
    <View
      pointerEvents="box-none"
      style={StyleSheet.absoluteFill}
      onLayout={({ nativeEvent }) => {
        const { width, height } = nativeEvent.layout;
        setFrame((current) =>
          current.width === width && current.height === height
            ? current
            : { width, height },
        );
      }}
    >
      <Animated.View
        onLayout={({ nativeEvent }) => {
          const { width, height } = nativeEvent.layout;
          setQuote((current) =>
            current.width === width && current.height === height
              ? current
              : { width, height },
          );
        }}
        style={[
          styles.positionedQuote,
          frame.width > 0 ? { maxWidth: frame.width } : null,
          positionedStyle,
        ]}
      >
        {children}
        {onPositionChange ? (
          <GestureDetector gesture={panGesture}>
            <View
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel="Move quote"
              accessibilityHint="Drag this handle to reposition the quote"
              style={styles.moveHandle}
            >
              <Ionicons name="move-outline" size={18} color="#FFFFFF" />
            </View>
          </GestureDetector>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  positionedQuote: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  moveHandle: {
    position: "absolute",
    top: 3,
    right: 3,
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(0,0,0,0.78)",
  },
});
