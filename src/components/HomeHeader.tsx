import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface HomeHeaderProps {
  currentStreak: number;
  onPressProfile?: () => void;
}

export function HomeHeader({ currentStreak, onPressProfile }: HomeHeaderProps) {
  return (
    <View className="px-4 pt-2">
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={onPressProfile}
          className="h-10 w-10 items-center justify-center rounded-full bg-black/30"
          style={({ pressed }) => ({
            opacity: pressed ? 0.8 : 1,
          })}>
          <Ionicons name="person-circle-outline" size={26} color="#ffffff" />
        </Pressable>
        <View className="flex-row items-center rounded-full bg-black/40 px-3 py-1.5">
          <Ionicons name="flame-outline" size={20} color="#ffb100" />
          <Text className="ml-1.5 text-sm font-semibold text-white">
            {currentStreak}
          </Text>
        </View>
      </View>
    </View>
  );
}

