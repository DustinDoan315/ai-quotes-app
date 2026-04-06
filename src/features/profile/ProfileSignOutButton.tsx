import { strings } from "@/theme/strings";
import { Pressable, Text } from "react-native";

interface ProfileSignOutButtonProps {
  onPress: () => void;
}

export function ProfileSignOutButton({ onPress }: ProfileSignOutButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mt-2 rounded-2xl border border-white/20 bg-white/5 py-3.5"
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      <Text className="text-center text-base font-medium text-white/85">
        {strings.profile.signOut}
      </Text>
    </Pressable>
  );
}
