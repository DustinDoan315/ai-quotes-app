import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getQuoteCardFrame } from "@/features/quotes/feedCardSizing";

/**
 * The device-sized square frame. Camera layout may reduce it to leave room
 * for its controls; onboarding uses the same aspect at the available width.
 */
export function useQuoteCardFrame() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return useMemo(
    () => getQuoteCardFrame(width, height, insets.top, insets.bottom),
    [width, height, insets.top, insets.bottom],
  );
}
