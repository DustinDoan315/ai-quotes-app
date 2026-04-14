import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

interface ProfileSignOutButtonProps {
  onPress: () => void;
}

export function ProfileSignOutButton({ onPress }: ProfileSignOutButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mt-2 rounded-2xl border border-red-500/25 bg-white/5 py-3.5"
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      <View className="flex-row items-center justify-center gap-2">
        <Ionicons name="log-out-outline" size={17} color="#f87171" />
        <Text className="text-base font-medium text-red-400">Sign out</Text>
      </View>
    </Pressable>
  );
}
