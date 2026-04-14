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
  const initials = displayLine.trim().charAt(0).toUpperCase() || "?";

  return (
    <View className="mb-6 flex-row items-center">
      <Pressable
        onPress={onPickAvatar}
        disabled={avatarSaving}
        className="h-[68px] w-[68px] items-center justify-center overflow-visible rounded-full"
        style={({ pressed }) => ({
          opacity: avatarSaving ? 0.5 : pressed ? 0.8 : 1,
        })}>
        <View className="h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-full border-2 border-white/25 bg-white/15">
          {avatarSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              className="h-16 w-16 rounded-full"
            />
          ) : (
            <Text style={{ fontSize: 26, fontWeight: "700", color: "#fff" }}>
              {initials}
            </Text>
          )}
        </View>
        {/* Camera badge */}
        {!avatarSaving ? (
          <View
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: "rgba(0,0,0,0.75)",
              borderWidth: 1.5,
              borderColor: "rgba(255,255,255,0.25)",
              alignItems: "center",
              justifyContent: "center",
            }}>
            <Ionicons name="camera" size={11} color="#fff" />
          </View>
        ) : null}
      </Pressable>
      <View className="ml-4 flex-1">
        <Text className="text-lg font-medium text-white">{displayLine}</Text>
        {username ? (
          <Text className="text-sm text-white/60">@{username}</Text>
        ) : null}
      </View>
    </View>
  );
}
