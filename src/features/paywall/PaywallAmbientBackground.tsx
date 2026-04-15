import { MotiView } from "moti";
import { View } from "react-native";

export const PaywallAmbientBackground = () => {
  return (
    <View className="absolute inset-0 overflow-hidden" pointerEvents="none">
      <MotiView
        from={{ opacity: 0.07, scale: 1 }}
        animate={{ opacity: 0.13, scale: 1.08 }}
        transition={{
          type: "timing",
          duration: 3800,
          loop: true,
          repeatReverse: true,
        }}
        className="absolute -left-[20%] -top-[10%] h-[55%] w-[90%] rounded-full"
        style={{ backgroundColor: "rgba(139, 92, 246, 1)" }}
      />
      <MotiView
        from={{ opacity: 0.05, scale: 1 }}
        animate={{ opacity: 0.1, scale: 1.1 }}
        transition={{
          type: "timing",
          duration: 4600,
          loop: true,
          repeatReverse: true,
        }}
        className="absolute -right-[30%] top-[15%] h-[45%] w-[75%] rounded-full"
        style={{ backgroundColor: "rgba(217, 70, 239, 1)" }}
      />
      <MotiView
        from={{ opacity: 0.04, scale: 1 }}
        animate={{ opacity: 0.08, scale: 1.06 }}
        transition={{
          type: "timing",
          duration: 5200,
          loop: true,
          repeatReverse: true,
        }}
        className="absolute bottom-0 left-[10%] h-[40%] w-[80%] rounded-full"
        style={{ backgroundColor: "rgba(249, 115, 22, 1)" }}
      />
      <View
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(2, 6, 23, 0.88)" }}
      />
    </View>
  );
};
