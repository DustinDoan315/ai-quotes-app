import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";

interface ProfileAvatarRowProps {
  avatarUrl: string | null;
  avatarSaving: boolean;
  displayLine: string;
  username: string | null;
  onPickAvatar: () => void;
  showDetails?: boolean;
}

export function ProfileAvatarRow({
  avatarUrl,
  avatarSaving,
  displayLine,
  username,
  onPickAvatar,
  showDetails = true,
}: ProfileAvatarRowProps) {
  const initials = displayLine.trim().charAt(0).toUpperCase() || "?";

  return (
    <View className="mb-5 flex-col items-center">
      <Pressable
        onPress={onPickAvatar}
        disabled={avatarSaving}
        className="h-[104px] w-[104px] items-center justify-center overflow-visible rounded-full"
        style={({ pressed }) => ({
          opacity: avatarSaving ? 0.5 : pressed ? 0.8 : 1,
        })}>
        <View className="h-[104px] w-[104px] items-center justify-center overflow-hidden rounded-full border-2 border-white/25 bg-white/15">
          {avatarSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              className="h-[100px] w-[100px] rounded-full"
            />
          ) : (
            <Text style={{ fontSize: 38, fontWeight: "700", color: "#fff" }}>
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
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: "rgba(0,0,0,0.75)",
              borderWidth: 1.5,
              borderColor: "rgba(255,255,255,0.25)",
              alignItems: "center",
              justifyContent: "center",
            }}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        ) : null}
      </Pressable>
      {showDetails && <View className="mt-3 w-full items-center">
        <Text className="text-center text-2xl font-semibold text-white" numberOfLines={2}>{displayLine}</Text>
        {username ? (
          <Text className="text-sm text-white/60">@{username}</Text>
        ) : null}
      </View>}
    </View>
  );
}
