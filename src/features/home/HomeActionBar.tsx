import { CameraActionsBar } from "@/components/CameraActionsBar";
import { strings } from "@/theme/strings";
import {
  KeyboardAvoidingView,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

type Props = {
  isComposerOpen: boolean;
  shouldShowMessageBar: boolean;
  canSendMessage: boolean;
  composerText: string;
  isSendingMessage: boolean;
  lastSentLabel: string | null;
  bottomInset: number;
  onOpenComposer: () => void;
  onCloseComposer: () => void;
  onChangeComposerText: (value: string) => void;
  onSendMessage: () => void;
  onOpenMemories: () => void;
  onCameraPress: () => void;
  onOpenGallery: () => void;
  onSavePhoto: () => void;
  onReact: (type: "love" | "fire" | "clap") => void;
  isGenerating: boolean;
  isCapturing: boolean;
  cameraReady: boolean;
  hasImage: boolean;
  canSave: boolean;
  isSaving: boolean;
};

export function HomeActionBar({
  isComposerOpen,
  shouldShowMessageBar,
  canSendMessage,
  composerText,
  isSendingMessage,
  lastSentLabel,
  bottomInset,
  onOpenComposer,
  onCloseComposer,
  onChangeComposerText,
  onSendMessage,
  onOpenMemories,
  onCameraPress,
  onOpenGallery,
  onSavePhoto,
  onReact,
  isGenerating,
  isCapturing,
  cameraReady,
  hasImage,
  canSave,
  isSaving,
}: Props) {
  return (
    <>
      {!isComposerOpen ? (
        <View
          className="border-t border-white/10 bg-black/20 px-4 pt-2"
          style={{ paddingBottom: bottomInset }}
          pointerEvents="box-none">
          {shouldShowMessageBar ? (
            <View className="mb-2 flex-row items-center justify-between rounded-full bg-white/10 px-3 py-2">
              <Pressable onPress={onOpenComposer} className="flex-1">
                <Text className="text-xs text-white/70">
                  {strings.home.messagePlaceholder}
                </Text>
              </Pressable>
              <View className="ml-2 flex-row items-center gap-2">
                <Pressable
                  onPress={() => onReact("love")}
                  className="rounded-full bg-white/15 px-3 py-1">
                  <Text className="text-base">❤️</Text>
                </Pressable>
                <Pressable
                  onPress={() => onReact("fire")}
                  className="rounded-full bg-white/15 px-3 py-1">
                  <Text className="text-base">🔥</Text>
                </Pressable>
                <Pressable
                  onPress={() => onReact("clap")}
                  className="rounded-full bg-white/15 px-3 py-1">
                  <Text className="text-base">👏</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
          <CameraActionsBar
            onGenerate={onOpenMemories}
            onCapture={onCameraPress}
            onOpenGallery={onOpenGallery}
            onSave={onSavePhoto}
            isGenerating={isGenerating}
            isCapturing={isCapturing}
            cameraReady={cameraReady}
            hasImage={hasImage}
            canSave={canSave}
            isSaving={isSaving}
          />
        </View>
      ) : null}
      {isComposerOpen ? (
        <>
          <Pressable
            className="absolute inset-0 bg-black/60"
            onPress={onCloseComposer}
          />
          <KeyboardAvoidingView
            behavior="padding"
            keyboardVerticalOffset={bottomInset}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
            }}>
            <View
              className="px-4 pt-2"
              style={{ paddingBottom: bottomInset }}
              pointerEvents="box-none">
              {canSendMessage ? (
                <View className="flex-row items-center justify-between rounded-full bg-gray-500/90 px-3 py-2">
                  <TextInput
                    autoFocus
                    placeholder="Reply…"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    value={composerText}
                    onChangeText={onChangeComposerText}
                    onSubmitEditing={onSendMessage}
                    onBlur={onCloseComposer}
                    className="flex-1 text-xs text-white"
                    returnKeyType="send"
                  />
                  <Pressable
                    onPress={onSendMessage}
                    disabled={isSendingMessage}
                    className="ml-2 rounded-full bg-white px-3 py-1"
                    style={{ opacity: isSendingMessage ? 0.6 : 1 }}>
                    <Text className="text-xs font-semibold text-black">
                      {isSendingMessage ? "Sending…" : "Send"}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </KeyboardAvoidingView>
        </>
      ) : null}
      {lastSentLabel !== null && !isComposerOpen ? (
        <View className="absolute inset-x-0 bottom-[72px] items-center">
          <View className="rounded-full bg-black/80 px-3 py-1">
            <Text className="text-[10px] font-medium text-white/80">
              {lastSentLabel}
            </Text>
          </View>
        </View>
      ) : null}
    </>
  );
}
