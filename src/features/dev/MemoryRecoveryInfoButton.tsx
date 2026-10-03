import { useMemoryStore } from "@/appState/memoryStore";
import { useUserStore } from "@/appState/userStore";
import * as Clipboard from "expo-clipboard";
import { Alert, Pressable, Text } from "react-native";

/** Account IDs only: never copy sessions, tokens, or photo contents. */
export function MemoryRecoveryInfoButton() {
  if (!__DEV__) return null;
  return (
    <Pressable
      accessibilityRole="button"
      className="mt-4 min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4"
      onPress={() => {
        const user = useUserStore.getState();
        const guestMemories = useMemoryStore.getState().memories.filter(memory =>
          user.guestId && memory.ownerGuestId === user.guestId);
        void Clipboard.setStringAsync(JSON.stringify({
          signedInUserId: user.profile?.user_id ?? user.authUserId,
          previousGuestId: user.guestId,
          sourceUserIds: [...new Set(guestMemories.map(memory => memory.ownerUserId).filter(Boolean))],
          guestPhotoIds: guestMemories.map(memory => memory.photoId).filter(Boolean),
        })).then(() => Alert.alert("Recovery info copied", "Paste it into the chat to identify the previous guest photos."));
      }}>
      <Text className="text-sm text-white/70">Copy memory recovery info · DEV</Text>
    </Pressable>
  );
}
