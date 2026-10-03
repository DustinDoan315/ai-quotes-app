import { Ionicons } from "@expo/vector-icons";
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
    <View className="flex-row items-center justify-between px-5 py-2" style={{ minHeight: 56 }}>
      <Pressable
        onPress={editing ? onCancelEdit : onBack}
        disabled={saving}
        accessibilityRole="button"
        accessibilityLabel={editing ? t("profile.cancelEditButton") : t("auth.login.back")}
        className="h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5"
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
        <Ionicons name={editing ? "close" : "chevron-back"} size={22} color="#fff" />
      </Pressable>
      <Text className="absolute left-[92px] right-[92px] text-center text-base font-semibold text-white" numberOfLines={1}>
        {titleName}
      </Text>
      <Pressable
        onPress={editing ? onSave : onStartEdit}
        disabled={saving || (editing && !canSave)}
        accessibilityRole="button"
        className="min-h-11 min-w-[64px] items-center justify-center rounded-full border border-white/10 bg-white/5 px-3"
        style={({ pressed }) => ({ opacity: saving || (editing && !canSave) ? 0.4 : pressed ? 0.7 : 1 })}>
        {saving ? <ActivityIndicator color="#fff" /> : (
          <Text className="text-sm font-semibold text-white">
            {t(editing ? "profile.saveProfileButton" : "profile.editProfileButton")}
          </Text>
        )}
      </Pressable>
    </View>
  );
}
