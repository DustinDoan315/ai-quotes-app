import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";

interface ProfileAvatarRowProps {
  avatarUrl: string | null;
  avatarSaving: boolean;
  displayLine: string;
  username: string | null;
  onPickAvatar: () => void;
}

export function ProfileAvatarRow({
  avatarUrl,
  avatarSaving,
  displayLine,
  username,
  onPickAvatar,
}: ProfileAvatarRowProps) {
  return (
    <View className="mb-6 flex-row items-center">
      <Pressable
        onPress={onPickAvatar}
        disabled={avatarSaving}
        className="h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-full border-2 border-white/25 bg-white/15"
        style={({ pressed }) => ({
          opacity: avatarSaving ? 0.5 : pressed ? 0.8 : 1,
        })}>
        {avatarSaving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            className="h-16 w-16 rounded-full"
          />
        ) : (
          <Ionicons name="person" size={32} color="#fff" />
        )}
      </Pressable>
      <View className="ml-4 flex-1">
        <Text className="text-lg font-medium text-white">{displayLine}</Text>
        {username ? (
          <Text className="text-sm text-white/60">@{username}</Text>
        ) : null}
        <Text className="mt-1 text-xs text-white/50">Tap the avatar to update.</Text>
      </View>
    </View>
  );
}
