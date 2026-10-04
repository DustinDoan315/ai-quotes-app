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
import { StyleSheet, Text, View } from "react-native";
import { HOME_AMBIENT_CHROME } from "@/theme/homeAmbient";

type Props = {
  position: QuotePosition;
  children: ReactNode;
  onPositionChange?: (position: QuotePosition) => void;
  controlsVisible?: boolean;
  hintText?: string;
  onInteraction?: () => void;
  onEditText?: () => void;
  resizeAccessibilityLabel?: string;
  editAccessibilityLabel?: string;
};

export function QuotePositionLayer({
  position,
  children,
  onPositionChange,
  controlsVisible = false,
  hintText = "Drag to move · Pinch to resize · Tap to edit",
  onInteraction,
  onEditText,
  resizeAccessibilityLabel = "Resize caption",
  editAccessibilityLabel = "Edit caption",
}: Props) {
  const [frame, setFrame] = useState<QuoteBoxSize>({ width: 0, height: 0 });
  const [quote, setQuote] = useState<QuoteBoxSize>({ width: 0, height: 0 });
  const x = useSharedValue(position.x);
  const y = useSharedValue(position.y);
  const scale = useSharedValue(position.scale ?? 1);
  const rotation = useSharedValue(position.rotation ?? 0);
  const activeGestures = useSharedValue(0);
  const interactionStarted = useSharedValue(false);
  const notifyInteraction = useCallback(() => onInteraction?.(), [onInteraction]);

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
      scheduleOnRN(notifyInteraction);
    };
    const interact = () => {
      "worklet";
      interactionStarted.value = true;
      scheduleOnRN(notifyInteraction);
    };
    const finish = () => {
      "worklet";
      activeGestures.value = Math.max(0, activeGestures.value - 1);
      if (activeGestures.value !== 0) return;
      if (interactionStarted.value) { interactionStarted.value = false; scheduleOnRN(notifyInteraction); }
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
        .onStart(interact)
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
        .onStart(interact)
        .onChange(event => {
          scale.value = Math.min(1, Math.max(MIN_QUOTE_SCALE, scale.value * event.scaleChange));
        })
        .onFinalize(finish),
      Gesture.Rotation()
        .enabled(enabled)
        .onBegin(begin)
        .onStart(interact)
        .onChange(event => { rotation.value += event.rotationChange; })
        .onFinalize(finish),
    );
  }, [activeGestures, frame, onPositionChange, quote, reportPosition, rotation, scale, x, y, notifyInteraction, interactionStarted]);

  const positionedStyle = useAnimatedStyle(() => {
    const bounded = clampQuotePosition(
      { x: x.value, y: y.value, scale: scale.value, rotation: rotation.value }, frame, quote,
    );
    const centerX = bounded.x;
    const centerY = bounded.y;

    return {
      transform: [
        { translateX: frame.width * centerX - quote.width / 2 },
        { translateY: frame.height * centerY - quote.height / 2 - 48 },
        { rotate: `${rotation.value}rad` },
        { scale: scale.value },
      ],
    };
  });

  const hintStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 / Math.max(MIN_QUOTE_SCALE, scale.value) }],
  }));

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
          accessible={Boolean(onPositionChange)}
          accessibilityRole={onPositionChange ? "adjustable" : undefined}
          accessibilityLabel={onPositionChange ? resizeAccessibilityLabel : undefined}
          accessibilityActions={onPositionChange ? [
            { name: "increment" }, { name: "decrement" },
            ...(onEditText ? [{ name: "activate", label: editAccessibilityLabel }] : []),
          ] : undefined}
          onAccessibilityAction={event => {
            const action = event.nativeEvent.actionName;
            notifyInteraction();
            if (action === "activate") { onEditText?.(); return; }
            const direction = action === "increment" ? 1 : action === "decrement" ? -1 : 0;
            if (!direction) return;
            scale.value = Math.min(1, Math.max(MIN_QUOTE_SCALE, scale.value + direction * 0.05));
            reportPosition(x.value, y.value, scale.value, rotation.value);
          }}
          style={[
            styles.positionedQuote,
            frame.width > 0 ? { maxWidth: frame.width } : null,
            positionedStyle,
          ]}
        >
          <View
          onLayout={({ nativeEvent }) => {
            const { width, height } = nativeEvent.layout;
            setQuote((current) =>
              current.width === width && current.height === height
                ? current
                : { width, height },
            );
          }}
          >{children}</View>
          {onPositionChange && controlsVisible ? (
            <Animated.View pointerEvents="none" accessible={false} style={[styles.hint, hintStyle]}>
              <Text style={styles.hintText}>{hintText}</Text>
            </Animated.View>
          ) : null}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { position: "absolute", top: 0, alignSelf: "center", maxWidth: "100%", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: "rgba(12,16,14,0.88)", borderWidth: 1, borderColor: HOME_AMBIENT_CHROME.border },
  hintText: { color: HOME_AMBIENT_CHROME.text, fontSize: 11, fontWeight: "500", textAlign: "center" },
  positionedQuote: {
    position: "absolute",
    left: 0,
    top: 0,
    paddingVertical: 48,
  },
});
