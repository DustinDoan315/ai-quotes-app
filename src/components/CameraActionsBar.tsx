import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

interface CameraActionsBarProps {
  onGenerate: () => void;
  onCapture: () => void;
  onOpenGallery: () => void;
  onSave: () => void;
  onShare: () => void;
  isGenerating: boolean;
  isCapturing: boolean;
  cameraReady: boolean;
  cameraPermissionGranted: boolean;
  hasImage: boolean;
  canSave: boolean;
  canShare: boolean;
  isSaving: boolean;
}

export function CameraActionsBar({
  onGenerate,
  onCapture,
  onOpenGallery,
  onSave,
  onShare,
  isGenerating,
  isCapturing,
  cameraReady,
  cameraPermissionGranted,
  hasImage,
  canSave,
  canShare,
  isSaving,
}: CameraActionsBarProps) {
  const { t } = useTranslation();
  return (
    <View className="flex-row items-center justify-center gap-10">
      <View className="w-20 items-center">
        <Pressable
          onPress={onGenerate}
          accessibilityRole="button"
          accessibilityLabel={t("home.accessibility.memories")}
          className="h-14 w-14 items-center justify-center rounded-full bg-black/40"
          style={({ pressed }) => ({
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Ionicons name="calendar-outline" size={26} color="#ffffff" />
        </Pressable>
      </View>
      <View className="w-32 items-center">
        {hasImage ? (
          <Pressable
            onPress={onSave}
            disabled={!canSave || isSaving}
            accessibilityRole="button"
            accessibilityLabel={t(isSaving ? "home.accessibility.saving" : "camera.saveButton")}
            accessibilityState={{ disabled: !canSave || isSaving, busy: isSaving || isGenerating }}
            className="h-14 w-32 items-center justify-center rounded-full border-2 border-white/80 bg-white/10"
            style={({ pressed }) => ({
              opacity: pressed || !canSave || isSaving ? 0.7 : 1,
            })}
          >
            {isSaving ? (
              <View className="w-full items-center justify-center">
                <ActivityIndicator size="small" color="#ffffff" />
              </View>
            ) : (
              <Text className="text-center text-sm font-semibold text-white">
                {t("camera.saveButton")}
              </Text>
            )}
          </Pressable>
        ) : (
          <Pressable
            onPress={onCapture}
            disabled={(cameraPermissionGranted && !cameraReady) || isCapturing}
            accessibilityRole="button"
            accessibilityLabel={t(isCapturing ? "home.accessibility.capturing" : "home.accessibility.capture")}
            accessibilityState={{ disabled: (cameraPermissionGranted && !cameraReady) || isCapturing, busy: isCapturing }}
            className="h-20 w-20 items-center justify-center rounded-full border-4 border-white/80 bg-white/10"
            style={({ pressed }) => ({
              opacity: pressed ? 0.8 : 1,
            })}
          >
            {isCapturing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <View className="h-14 w-14 rounded-full bg-white" />
            )}
          </Pressable>
        )}
      </View>
      <View className="w-20 items-center">
        {hasImage ? (
          <Pressable
            onPress={onShare}
            disabled={!canShare}
            accessibilityRole="button"
            accessibilityLabel={t("home.accessibility.shareImage")}
            accessibilityState={{ disabled: !canShare }}
            className="h-12 w-20 items-center justify-center rounded-2xl bg-black/45 px-2"
            style={({ pressed }) => ({
              opacity: !canShare ? 0.45 : pressed ? 0.8 : 1,
            })}
          >
            <Ionicons name="share-outline" size={21} color="#ffffff" />
          </Pressable>
        ) : (
          <Pressable
            onPress={onOpenGallery}
            accessibilityRole="button"
            accessibilityLabel={t("home.accessibility.gallery")}
            className="h-14 w-14 items-center justify-center rounded-full bg-black/40"
            style={({ pressed }) => ({
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Ionicons name="images-outline" size={24} color="#ffffff" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
