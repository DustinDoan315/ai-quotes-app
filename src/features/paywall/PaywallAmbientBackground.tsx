import { View } from "react-native";

export const PaywallAmbientBackground = () => {
  return (
    <View className="absolute inset-0 overflow-hidden" pointerEvents="none">
      <View
        className="absolute -left-[20%] -top-[10%] h-[55%] w-[90%] rounded-full"
        style={{ backgroundColor: "rgba(251, 191, 36, 0.1)" }}
      />
      <View
        className="absolute -right-[30%] top-[15%] h-[45%] w-[75%] rounded-full"
        style={{ backgroundColor: "rgba(168, 85, 247, 0.08)" }}
      />
      <View
        className="absolute bottom-0 left-[10%] h-[40%] w-[80%] rounded-full"
        style={{ backgroundColor: "rgba(56, 189, 248, 0.06)" }}
      />
      <View
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(2, 6, 23, 0.88)" }}
      />
    </View>
  );
};
