import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

interface ProfileAuthedHeaderProps {
  titleName: string;
  editing: boolean;
  saving: boolean;
  canSave: boolean;
  onBack: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onStartEdit: () => void;
}

export function ProfileAuthedHeader({
  titleName,
  editing,
  saving,
  canSave,
  onBack,
  onCancelEdit,
  onSave,
  onStartEdit,
}: ProfileAuthedHeaderProps) {
  return (
    <View className="flex-row items-center justify-between border-b border-white/10 px-4 py-3">
      <View className="min-w-0 flex-1 flex-row items-center">
        <Pressable
          onPress={onBack}
          className="h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/30"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Text
          className="ml-2 mr-2 shrink text-lg font-semibold text-white"
          numberOfLines={1}>
          {titleName}
        </Text>
      </View>

      {editing ? (
        <View className="shrink-0 flex-row gap-3">
          <Pressable
            onPress={onCancelEdit}
            disabled={saving}
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
            <Text className="text-base text-white/60">Cancel</Text>
          </Pressable>
          <Pressable
            onPress={onSave}
            disabled={!canSave}
            style={({ pressed }) => ({
              opacity: canSave ? (pressed ? 0.8 : 1) : 0.4,
            })}>
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-base font-medium text-white">Save</Text>
            )}
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={onStartEdit}
          className="shrink-0"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <Text className="text-base text-white/80">Edit</Text>
        </Pressable>
      )}
    </View>
  );
}
