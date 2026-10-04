import {
  clampQuotePosition,
  MIN_QUOTE_SCALE,
  resizeQuoteScale,
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
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { HOME_AMBIENT_CHROME } from "@/theme/homeAmbient";

type Props = {
  position: QuotePosition;
  children: ReactNode;
  onPositionChange?: (position: QuotePosition) => void;
  controlsVisible?: boolean;
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
  const [isTransforming, setIsTransforming] = useState(false);
  const resizeActive = useSharedValue(false);
  const resizeStartScale = useSharedValue(position.scale ?? 1);
  const resizeControlsBelow = useSharedValue(false);
  const notifyInteraction = useCallback(() => onInteraction?.(), [onInteraction]);
  const startInteraction = useCallback(() => { setIsTransforming(true); onInteraction?.(); }, [onInteraction]);
  const finishInteraction = useCallback(() => { onInteraction?.(); setIsTransforming(false); }, [onInteraction]);
  const showControls = (controlsVisible || isTransforming) && Boolean(onPositionChange);

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

  const resizeGesture = useMemo(() => Gesture.Pan()
    .enabled(Boolean(onPositionChange))
    .minDistance(1)
    .onStart(() => {
      "worklet";
      resizeActive.value = true;
      resizeStartScale.value = scale.value;
      const bounded = clampQuotePosition({ x: x.value, y: y.value, scale: scale.value, rotation: rotation.value }, frame, quote);
      resizeControlsBelow.value = bounded.y * frame.height - quote.height * scale.value / 2 < 52;
      activeGestures.value += 1;
      interactionStarted.value = true;
      scheduleOnRN(startInteraction);
    })
    .onUpdate(event => {
      "worklet";
      const cos = Math.cos(rotation.value);
      const sin = Math.sin(rotation.value);
      const localX = event.translationX * cos + event.translationY * sin;
      const localY = -event.translationX * sin + event.translationY * cos;
      scale.value = resizeQuoteScale(resizeStartScale.value, localX, resizeControlsBelow.value ? localY : -localY, quote);
    })
    .onFinalize(() => {
      "worklet";
      if (!resizeActive.value) return;
      resizeActive.value = false;
      activeGestures.value = Math.max(0, activeGestures.value - 1);
      if (activeGestures.value !== 0) return;
      interactionStarted.value = false;
      scheduleOnRN(finishInteraction);
      const bounded = clampQuotePosition({ x: x.value, y: y.value, scale: scale.value, rotation: rotation.value }, frame, quote);
      x.value = bounded.x;
      y.value = bounded.y;
      scheduleOnRN(reportPosition, x.value, y.value, scale.value, rotation.value);
    }), [onPositionChange, resizeActive, resizeStartScale, resizeControlsBelow, scale, activeGestures, interactionStarted, startInteraction, finishInteraction, quote, rotation, frame, x, y, reportPosition]);

  const transformGesture = useMemo(() => {
    const begin = () => {
      "worklet";
      activeGestures.value += 1;
    };
    const interact = () => {
      "worklet";
      interactionStarted.value = true;
      scheduleOnRN(startInteraction);
    };
    const finish = () => {
      "worklet";
      activeGestures.value = Math.max(0, activeGestures.value - 1);
      if (activeGestures.value !== 0) return;
      if (interactionStarted.value) { interactionStarted.value = false; scheduleOnRN(finishInteraction); }
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
        .requireExternalGestureToFail(...(onPositionChange ? [resizeGesture] : []))
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
        .requireExternalGestureToFail(...(onPositionChange ? [resizeGesture] : []))
        .onBegin(begin)
        .onStart(interact)
        .onChange(event => {
          scale.value = Math.min(1, Math.max(MIN_QUOTE_SCALE, scale.value * event.scaleChange));
        })
        .onFinalize(finish),
      Gesture.Rotation()
        .enabled(enabled)
        .requireExternalGestureToFail(...(onPositionChange ? [resizeGesture] : []))
        .onBegin(begin)
        .onStart(interact)
        .onChange(event => { rotation.value += event.rotationChange; })
        .onFinalize(finish),
    );
  }, [activeGestures, frame, onPositionChange, quote, reportPosition, rotation, scale, x, y, resizeGesture, startInteraction, finishInteraction, interactionStarted]);

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

  // Counter-scale the entire control so both its visible surface and touch area stay 44 points.
  // Keep its horizontal edge inside the caption; flip below near the top of the photo.
  const resizeControlStyle = useAnimatedStyle(() => {
    const inverse = 1 / Math.max(MIN_QUOTE_SCALE, scale.value);
    const bounded = clampQuotePosition({ x: x.value, y: y.value, scale: scale.value, rotation: rotation.value }, frame, quote);
    const below = resizeActive.value ? resizeControlsBelow.value : bounded.y * frame.height - quote.height * scale.value / 2 < 52;
    return {
      top: below ? quote.height + 52 : 0,
      transform: [{ translateX: -22 * (inverse - 1) }, { translateY: (below ? 22 : -22) * (inverse - 1) }, { scale: inverse }],
    };
  });
  const editControlStyle = useAnimatedStyle(() => {
    const inverse = 1 / Math.max(MIN_QUOTE_SCALE, scale.value);
    const bounded = clampQuotePosition({ x: x.value, y: y.value, scale: scale.value, rotation: rotation.value }, frame, quote);
    const below = resizeActive.value ? resizeControlsBelow.value : bounded.y * frame.height - quote.height * scale.value / 2 < 52;
    return {
      top: below ? quote.height + 52 : 0,
      transform: [{ translateX: 22 * (inverse - 1) }, { translateY: (below ? 22 : -22) * (inverse - 1) }, { scale: inverse }],
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
          {onPositionChange ? <>
            <View pointerEvents="none" style={[styles.selectionOutline, { top: 48, bottom: 48, opacity: showControls ? 1 : 0 }]} />
            <GestureDetector gesture={resizeGesture}>
              <Animated.View
                pointerEvents={showControls ? "auto" : "none"}
                accessible={showControls}
                accessibilityElementsHidden={!showControls}
                importantForAccessibility={showControls ? "auto" : "no-hide-descendants"}
                accessibilityRole="adjustable"
                accessibilityLabel={resizeAccessibilityLabel}
                accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
                onAccessibilityAction={event => {
                  const direction = event.nativeEvent.actionName === "increment" ? 1 : event.nativeEvent.actionName === "decrement" ? -1 : 0;
                  if (!direction) return;
                  notifyInteraction();
                  scale.value = Math.min(1, Math.max(MIN_QUOTE_SCALE, scale.value + direction * 0.05));
                  reportPosition(x.value, y.value, scale.value, rotation.value);
                }}
                style={[styles.resizeHandle, resizeControlStyle, { opacity: showControls ? 1 : 0 }]}>
                <View style={styles.controlIcon}><Ionicons name="resize-outline" size={22} color={HOME_AMBIENT_CHROME.text} /></View>
              </Animated.View>
            </GestureDetector>
            {onEditText ? <Animated.View pointerEvents={showControls ? "auto" : "none"} accessibilityElementsHidden={!showControls} importantForAccessibility={showControls ? "auto" : "no-hide-descendants"} style={[styles.editHandle, editControlStyle, { opacity: showControls ? 1 : 0 }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={editAccessibilityLabel}
                onPress={() => { notifyInteraction(); onEditText(); }}
                style={styles.editButton}>
                <View style={styles.controlIcon}><Ionicons name="pencil-outline" size={21} color={HOME_AMBIENT_CHROME.text} /></View>
              </Pressable>
            </Animated.View> : null}
          </> : null}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  selectionOutline: { ...StyleSheet.absoluteFillObject, borderWidth: 1, borderColor: HOME_AMBIENT_CHROME.muted, borderRadius: 18 },
  resizeHandle: { position: "absolute", right: 0, width: 44, height: 44, alignItems: "center", justifyContent: "center", zIndex: 2 },
  editHandle: { position: "absolute", left: 0, width: 44, height: 44, zIndex: 2 },
  editButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  controlIcon: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: HOME_AMBIENT_CHROME.swatchBorder, backgroundColor: "#202522", alignItems: "center", justifyContent: "center" },
  positionedQuote: {
    position: "absolute",
    left: 0,
    top: 0,
    paddingVertical: 48,
  },
});
