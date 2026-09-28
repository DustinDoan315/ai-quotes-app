import { CameraActionsBar } from "@/components/CameraActionsBar";
import {
  PHOTO_REACTION_EMOJIS,
  type UserPhotoReactionType,
} from "@/services/media/userPhotoReactions";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

type Props = {
  shouldShowReactions: boolean;
  bottomInset: number;
  onOpenMemories: () => void;
  onCameraPress: () => void;
  onOpenGallery: () => void;
  onSavePhoto: () => void;
  onShareImage: () => void;
  onReact: (type: UserPhotoReactionType) => void;
  isGenerating: boolean;
  isCapturing: boolean;
  cameraReady: boolean;
  cameraPermissionGranted: boolean;
  hasImage: boolean;
  canSave: boolean;
  canShare: boolean;
  isSaving: boolean;
};

export function HomeActionBar({
  shouldShowReactions,
  bottomInset,
  onOpenMemories,
  onCameraPress,
  onOpenGallery,
  onSavePhoto,
  onShareImage,
  onReact,
  isGenerating,
  isCapturing,
  cameraReady,
  cameraPermissionGranted,
  hasImage,
  canSave,
  canShare,
  isSaving,
}: Props) {
  const { t } = useTranslation();
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  useEffect(() => {
    if (!shouldShowReactions) setIsEmojiPickerOpen(false);
  }, [shouldShowReactions]);

  return (
    <View
      className="border-t border-white/10 bg-black/20 px-4 pt-2"
      style={{ paddingBottom: bottomInset }}
      pointerEvents="box-none"
    >
      {shouldShowReactions ? (
        <>
          {isEmojiPickerOpen ? (
            <View
              className="flex-row flex-wrap justify-end gap-2 rounded-2xl bg-black/75 p-2"
              style={{
                position: "absolute",
                right: 16,
                bottom: 48,
                maxWidth: 300,
                zIndex: 20,
              }}
            >
              {(Object.entries(PHOTO_REACTION_EMOJIS) as [
                UserPhotoReactionType,
                string,
              ][]).map(([type, emoji]) => (
                <Pressable
                  key={type}
                  onPress={() => {
                    setIsEmojiPickerOpen(false);
                    onReact(type);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={t("home.reactions.withEmoji", { emoji })}
                  accessibilityHint={t("home.reactions.sendHint")}
                  className="h-10 min-w-10 items-center justify-center rounded-full bg-white/10 px-2"
                >
                  <Text className="text-xl">{emoji}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <View className="mb-2 flex-row items-center justify-end gap-2 rounded-full bg-white/10 px-3 py-2">
            <Pressable
              onPress={() => onReact("love")}
              accessibilityRole="button"
              accessibilityLabel={t("home.reactions.love")}
              accessibilityHint={t("home.reactions.sendHint")}
              className="rounded-full bg-white/15 px-3 py-1"
            >
              <Text className="text-base">❤️</Text>
            </Pressable>
            <Pressable
              onPress={() => onReact("fire")}
              accessibilityRole="button"
              accessibilityLabel={t("home.reactions.fire")}
              accessibilityHint={t("home.reactions.sendHint")}
              className="rounded-full bg-white/15 px-3 py-1"
            >
              <Text className="text-base">🔥</Text>
            </Pressable>
            <Pressable
              onPress={() => onReact("clap")}
              accessibilityRole="button"
              accessibilityLabel={t("home.reactions.clap")}
              accessibilityHint={t("home.reactions.sendHint")}
              className="rounded-full bg-white/15 px-3 py-1"
            >
              <Text className="text-base">👏</Text>
            </Pressable>
            <Pressable
              onPress={() => setIsEmojiPickerOpen((open) => !open)}
              accessibilityRole="button"
              accessibilityLabel={t("home.reactions.more")}
              accessibilityHint={t("home.reactions.moreHint")}
              accessibilityState={{ expanded: isEmojiPickerOpen }}
              className="h-8 w-8 items-center justify-center rounded-full bg-white/15"
            >
              <Text className="text-lg font-medium text-white">
                {isEmojiPickerOpen ? "×" : "+"}
              </Text>
            </Pressable>
          </View>
        </>
      ) : null}
      <CameraActionsBar
        onGenerate={onOpenMemories}
        onCapture={onCameraPress}
        onOpenGallery={onOpenGallery}
        onSave={onSavePhoto}
        onShare={onShareImage}
        isGenerating={isGenerating}
        isCapturing={isCapturing}
        cameraReady={cameraReady}
        cameraPermissionGranted={cameraPermissionGranted}
        hasImage={hasImage}
        canSave={canSave}
        canShare={canShare}
        isSaving={isSaving}
      />
    </View>
  );
}
