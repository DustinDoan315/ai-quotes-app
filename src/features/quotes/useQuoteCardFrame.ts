import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getQuoteCardFrame } from "@/features/quotes/feedCardSizing";

/**
 * The canonical moment-card frame for the current device. Every card surface
 * consumes this so the camera, feed, memories, and onboarding all match.
 */
export function useQuoteCardFrame() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return useMemo(
    () => getQuoteCardFrame(width, height, insets.top, insets.bottom),
    [width, height, insets.top, insets.bottom],
  );
}
