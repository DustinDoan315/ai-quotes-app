import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

interface CameraActionsBarProps {
  onGenerate: () => void;
  onCapture: () => void;
  onOpenGallery: () => void;
  onSave: () => void;
  isGenerating: boolean;
  isCapturing: boolean;
  cameraReady: boolean;
  hasImage: boolean;
  canSave: boolean;
  isSaving: boolean;
}

export function CameraActionsBar({
  onGenerate,
  onCapture,
  onOpenGallery,
  onSave,
  isGenerating,
  isCapturing,
  cameraReady,
  hasImage,
  canSave,
  isSaving,
}: CameraActionsBarProps) {
  const { t } = useTranslation();
  return (
    <View className="flex-row items-center justify-center gap-10">
      <View className="w-20 items-center">
        <Pressable
          onPress={onGenerate}
          className="h-14 w-14 items-center justify-center rounded-full bg-black/40"
          style={({ pressed }) => ({
            opacity: pressed ? 0.8 : 1,
          })}>
          <Ionicons name="calendar-outline" size={26} color="#ffffff" />
        </Pressable>
      </View>
      <View className="w-32 items-center">
        {hasImage ? (
          <Pressable
            onPress={onSave}
            disabled={!canSave || isSaving}
            className="h-14 w-32 flex-row items-center justify-center rounded-full border-2 border-white/80 bg-white/10"
            style={({ pressed }) => ({
              opacity: pressed || !canSave || isSaving ? 0.7 : 1,
            })}>
            {isSaving ? (
              <>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text className="ml-2 text-sm font-semibold text-white">
                  {t("camera.savingButton")}
                </Text>
              </>
            ) : (
              <Text className="text-sm font-semibold text-white">{t("camera.saveButton")}</Text>
            )}
          </Pressable>
        ) : (
          <Pressable
            onPress={onCapture}
            disabled={!cameraReady || isCapturing}
            className="h-20 w-20 items-center justify-center rounded-full border-4 border-white/80 bg-white/10"
            style={({ pressed }) => ({
              opacity: pressed ? 0.8 : 1,
            })}>
            {isCapturing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <View className="h-14 w-14 rounded-full bg-white" />
            )}
          </Pressable>
        )}
      </View>
      <View className="w-20 items-center">
        <Pressable
          onPress={onOpenGallery}
          className="h-14 w-14 items-center justify-center rounded-full bg-black/40"
          style={({ pressed }) => ({
            opacity: pressed ? 0.8 : 1,
          })}>
          <Ionicons name="images-outline" size={24} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  );
}

