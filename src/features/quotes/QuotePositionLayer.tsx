import {
  clampQuotePosition,
  MIN_QUOTE_SCALE,
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
  const scale = useSharedValue(position.scale ?? 1);
  const rotation = useSharedValue(position.rotation ?? 0);
  const activeGestures = useSharedValue(0);

  useEffect(() => {
    if (activeGestures.value > 0) return;
    x.value = position.x;
    y.value = position.y;
    scale.value = position.scale ?? 1;
    rotation.value = position.rotation ?? 0;
  }, [position.x, position.y, position.scale, position.rotation, x, y, scale, rotation, activeGestures]);

  const reportPosition = useCallback(
    (nextX: number, nextY: number, nextScale: number, nextRotation: number) => {
      onPositionChange?.(
        clampQuotePosition({ x: nextX, y: nextY, scale: nextScale, rotation: nextRotation }, frame, quote),
      );
    },
    [frame, onPositionChange, quote],
  );

  const transformGesture = useMemo(() => {
    const begin = () => {
      "worklet";
      activeGestures.value += 1;
    };
    const finish = () => {
      "worklet";
      activeGestures.value = Math.max(0, activeGestures.value - 1);
      if (activeGestures.value !== 0) return;
      const bounded = clampQuotePosition(
        { x: x.value, y: y.value, scale: scale.value, rotation: rotation.value },
        frame, quote,
      );
      x.value = bounded.x;
      y.value = bounded.y;
      scheduleOnRN(reportPosition, x.value, y.value, scale.value, rotation.value);
    };
    const enabled = Boolean(onPositionChange);
    return Gesture.Simultaneous(
      Gesture.Pan()
        .enabled(enabled)
        .averageTouches(true)
        .minDistance(1)
        .onBegin(begin)
        .onChange(event => {
          if (frame.width <= 0 || frame.height <= 0) return;
          const bounded = clampQuotePosition({
            x: x.value + event.changeX / frame.width,
            y: y.value + event.changeY / frame.height,
            scale: scale.value,
            rotation: rotation.value,
          }, frame, quote);
          x.value = bounded.x;
          y.value = bounded.y;
        })
        .onFinalize(finish),
      Gesture.Pinch()
        .enabled(enabled)
        .onBegin(begin)
        .onChange(event => {
          scale.value = Math.min(1, Math.max(MIN_QUOTE_SCALE, scale.value * event.scaleChange));
        })
        .onFinalize(finish),
      Gesture.Rotation()
        .enabled(enabled)
        .onBegin(begin)
        .onChange(event => { rotation.value += event.rotationChange; })
        .onFinalize(finish),
    );
  }, [activeGestures, frame, onPositionChange, quote, reportPosition, rotation, scale, x, y]);

  const positionedStyle = useAnimatedStyle(() => {
    const bounded = clampQuotePosition(
      { x: x.value, y: y.value, scale: scale.value, rotation: rotation.value }, frame, quote,
    );
    const centerX = bounded.x;
    const centerY = bounded.y;

    return {
      transform: [
        { translateX: frame.width * centerX - quote.width / 2 },
        { translateY: frame.height * centerY - quote.height / 2 },
        { rotate: `${rotation.value}rad` },
        { scale: scale.value },
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
      <GestureDetector gesture={transformGesture}>
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
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  positionedQuote: {
    position: "absolute",
    left: 0,
    top: 0,
  },
});
