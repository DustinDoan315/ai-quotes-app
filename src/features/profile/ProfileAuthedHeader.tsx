import { Ionicons } from "@expo/vector-icons";
import { AnimatePresence, MotiView } from "moti";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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

      <View style={{ minWidth: 80, alignItems: "flex-end" }}>
        <AnimatePresence>
          {editing ? (
            <MotiView
              key="editing"
              from={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: "timing", duration: 180 }}
              style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                onPress={onCancelEdit}
                disabled={saving}
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                <Text className="text-base text-white/60">{t("profile.cancelEditButton")}</Text>
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
                  <Text className="text-base font-medium text-white">{t("profile.saveProfileButton")}</Text>
                )}
              </Pressable>
            </MotiView>
          ) : (
            <MotiView
              key="view"
              from={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: "timing", duration: 180 }}>
              <Pressable
                onPress={onStartEdit}
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                <Text className="text-base text-white/80">{t("profile.editProfileButton")}</Text>
              </Pressable>
            </MotiView>
          )}
        </AnimatePresence>
      </View>
    </View>
  );
}
