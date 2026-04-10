import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

export type SharingResult =
  | { ok: true }
  | { ok: false; reason: "unavailable" | "error"; error?: unknown };

export async function shareImageFile(
  uri: string,
  options?: { dialogTitle?: string },
): Promise<SharingResult> {
  if (Platform.OS === "web") {
    return { ok: false, reason: "unavailable" };
  }
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return { ok: false, reason: "unavailable" };
    }
    await Sharing.shareAsync(uri, {
      mimeType: "image/png",
      dialogTitle: options?.dialogTitle ?? "Share",
      UTI: "public.png",
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: "error", error };
  }
}
