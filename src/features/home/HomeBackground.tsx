import { useId, useMemo } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import type { HomeBackgroundPalette } from "@/types/homeBackground";

interface HomeBackgroundProps {
  readonly palette: HomeBackgroundPalette;
  readonly width?: number;
  readonly height?: number;
}

export function HomeBackground({
  palette,
  width: widthProp,
  height: heightProp,
}: HomeBackgroundProps) {
  const { width: winW, height: winH } = useWindowDimensions();
  const width = widthProp ?? winW;
  const height = heightProp ?? winH;
  const reactId = useId();
  const gradientId = useMemo(
    () => `home-bg-${reactId.replaceAll(":", "")}`,
    [reactId],
  );
  const stops = palette.colors.map((c, i) => (
    <Stop
      key={`${i}-${c}`}
      offset={`${(i / Math.max(1, palette.colors.length - 1)) * 100}%`}
      stopColor={c}
    />
  ));
  const fillStyle =
    widthProp != null && heightProp != null
      ? { position: "absolute" as const, left: 0, top: 0, width, height }
      : StyleSheet.absoluteFillObject;
  return (
    <Svg
      width={width}
      height={height}
      style={fillStyle}
      pointerEvents="none">
      <Defs>
        <LinearGradient
          id={gradientId}
          x1={palette.start.x * width}
          y1={palette.start.y * height}
          x2={palette.end.x * width}
          y2={palette.end.y * height}
          gradientUnits="userSpaceOnUse">
          {stops}
        </LinearGradient>
      </Defs>
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={`url(#${gradientId})`}
      />
    </Svg>
  );
}
