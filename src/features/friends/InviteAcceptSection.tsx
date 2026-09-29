import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

import { useUIStore } from "@/appState/uiStore";
import { acceptInviteCode } from "@/services/inviteApi";
import { parseInviteCode } from "@/utils/invite";

type Props = {
  userId: string;
  onConnected: () => void;
};

type Busy = "clipboard" | "manual" | null;

/**
 * iOS 16+ exposes `UIPasteControl`, which hands the clipboard over without the
 * "Allow Paste?" system prompt that `getStringAsync` triggers. Expo surfaces it
 * as `ClipboardPasteButton`. It is `false` on every other platform, where the
 * prompt is either absent (Android) or unsupported.
 */
const PASTE_BUTTON_AVAILABLE = Clipboard.isPasteButtonAvailable;

/**
 * Deferred invite handoff.
 *
 * A friend's invite link carries its code through the web landing page onto
 * the clipboard, so a new install can still connect without the visitor
 * having kept the link. Reading the clipboard is deliberately behind an
 * explicit tap so the system paste prompt has visible context, with a typed
 * code as the always-available fallback.
 */
export function InviteAcceptSection({ userId, onConnected }: Props) {
  const { t } = useTranslation();
  const showToast = useUIStore((state) => state.showToast);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(
    async (rawValue: string, source: Exclude<Busy, null>) => {
      const parsed = parseInviteCode(rawValue);
      if (!parsed) {
        setError(t("friends.inviteCodeInvalid"));
        return;
      }

      setBusy(source);
      setError(null);
      try {
        const result = await acceptInviteCode(parsed, userId);
        if (result === "invalid") {
          setError(t("friends.inviteCodeInvalid"));
          return;
        }
        if (result === "self") {
          setError(t("friends.inviteCodeSelf"));
          return;
        }
        if (result === "error") {
          setError(t("friends.inviteCodeError"));
          return;
        }

        setCode("");
        showToast(t("friends.inviteCodeConnected"), "success", 4000);
        onConnected();
      } finally {
        setBusy(null);
      }
    },
    [onConnected, showToast, t, userId],
  );

  const handlePasteFromClipboard = useCallback(async () => {
    setBusy("clipboard");
    setError(null);
    try {
      const clipboardValue = await Clipboard.getStringAsync();
      if (!clipboardValue) {
        setError(t("friends.inviteCodeClipboardEmpty"));
        return;
      }
      await connect(clipboardValue, "clipboard");
    } catch (clipboardError) {
      console.warn("[invite] Clipboard read failed:", clipboardError);
      setError(t("friends.inviteCodeClipboardEmpty"));
    } finally {
      setBusy(null);
    }
  }, [connect, t]);

  /**
   * `UIPasteControl` delivers the clipboard contents straight to us on tap, so
   * this path never calls `getStringAsync` and never shows a paste prompt.
   */
  const handleNativePaste = useCallback(
    (data: Clipboard.PasteEventPayload) => {
      if (data.type !== "text") {
        setError(t("friends.inviteCodeClipboardEmpty"));
        return;
      }
      void connect(data.text, "clipboard");
    },
    [connect, t],
  );

  const isBusy = busy !== null;

  return (
    <View className="mb-6 overflow-hidden rounded-2xl border border-white/20 bg-white/5">
      <View className="px-4 pt-4">
        <View className="flex-row items-center">
          <Ionicons name="ticket-outline" size={18} color="rgba(255,255,255,0.7)" />
          <Text className="ml-2 text-base font-semibold text-white">
            {t("friends.inviteCodeTitle")}
          </Text>
        </View>
        <Text className="mt-1 text-sm text-white/60">
          {t("friends.inviteCodeBody")}
        </Text>
      </View>

      <View className="px-4 pb-4 pt-4">
        {isBusy ? (
          <View className="h-12 items-center justify-center rounded-2xl border border-white/20 bg-white/5">
            <ActivityIndicator size="small" color="#fff" />
          </View>
        ) : PASTE_BUTTON_AVAILABLE ? (
          // Apple restricts customisation of this control, so it keeps the
          // system look and needs an explicit width and height to render.
          <Clipboard.ClipboardPasteButton
            acceptedContentTypes={["plain-text", "url"]}
            cornerStyle="capsule"
            displayMode="iconAndLabel"
            style={{ width: "100%", height: 48 }}
            onPress={handleNativePaste}
          />
        ) : (
          <Pressable
            onPress={handlePasteFromClipboard}
            className="flex-row items-center justify-center rounded-2xl border border-white/20 bg-white/5 py-3"
            style={({ pressed }) => ({
              opacity: pressed ? 0.8 : 1,
            })}>
            <Ionicons name="clipboard-outline" size={18} color="#fff" />
            <Text className="ml-2 text-sm font-semibold text-white">
              {t("friends.inviteCodePasteButton")}
            </Text>
          </Pressable>
        )}

        <Text className="my-3 text-center text-xs uppercase tracking-widest text-white/40">
          {t("friends.inviteCodeOr")}
        </Text>

        <View className="flex-row items-center gap-2">
          <TextInput
            value={code}
            onChangeText={(next) => {
              setCode(next);
              if (error) setError(null);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={t("friends.inviteCodePlaceholder")}
            placeholderTextColor="rgba(255,255,255,0.35)"
            editable={!isBusy}
            className="flex-1 rounded-2xl border border-white/20 bg-black/20 px-4 py-3 text-white"
          />
          <Pressable
            onPress={() => connect(code, "manual")}
            disabled={isBusy || !code.trim()}
            className="rounded-2xl bg-white px-5 py-3"
            style={({ pressed }) => ({
              opacity: isBusy || !code.trim() ? 0.5 : pressed ? 0.9 : 1,
            })}>
            {busy === "manual" ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text className="text-sm font-semibold text-black">
                {t("friends.inviteCodeConnectButton")}
              </Text>
            )}
          </Pressable>
        </View>

        {error ? (
          <Text className="mt-3 text-sm text-amber-300">{error}</Text>
        ) : null}
      </View>
    </View>
  );
}
