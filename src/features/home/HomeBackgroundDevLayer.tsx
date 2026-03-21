import { useHomeBackgroundStore } from "@/appState/homeBackgroundStore";
import { HomeBackgroundDevControl } from "@/features/home/HomeBackgroundDevControl";
import { View } from "react-native";

export function HomeBackgroundDevLayer() {
  const devBgIndex = useHomeBackgroundStore((s) => s.devBgIndex);
  const cycleDevBg = useHomeBackgroundStore((s) => s.cycleDevBg);
  if (!__DEV__) {
    return null;
  }
  return (
    <View
      className="absolute inset-0 z-[90]"
      pointerEvents="box-none"
      style={{ elevation: 90 }}>
      <HomeBackgroundDevControl index={devBgIndex} onPress={cycleDevBg} />
    </View>
  );
}
