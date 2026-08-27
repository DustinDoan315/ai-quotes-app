import { Image, type ImageStyle, type StyleProp } from "react-native";

// Keep the in-app mark on a separate asset path from the native launcher icon.
// This also prevents development clients from retaining a stale `icon.png` asset.
const appIconSource = require("../../assets/images/splash-icon.png");

type AppIconProps = {
  size?: number;
  borderRadius?: number;
  style?: StyleProp<ImageStyle>;
};

export function AppIcon({
  size = 40,
  borderRadius = Math.round(size * 0.22),
  style,
}: AppIconProps) {
  return (
    <Image
      source={appIconSource}
      resizeMode="cover"
      accessibilityIgnoresInvertColors
      style={[
        {
          width: size,
          height: size,
          borderRadius,
        },
        style,
      ]}
    />
  );
}
