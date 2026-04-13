import { useUserStore } from "@/appState/userStore";
import { APP_DISPLAY_NAME } from "@/theme/appBrand";
import { analyticsEvents } from "@/services/analytics/events";
import { useTranslation } from "react-i18next";
import {
  getOrCreateMyInvite,
  listMyFriends,
  type FriendWithProfile,
} from "@/services/inviteApi";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";

export default function FriendsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ autoShare?: string }>();
  const profile = useUserStore((s) => s.profile);
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [autoShareConsumed, setAutoShareConsumed] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const userId = profile?.user_id ?? null;

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [inviteData, list] = await Promise.all([
        getOrCreateMyInvite(userId),
        listMyFriends(userId),
      ]);
      setInviteUrl(inviteData?.url ?? null);
      setFriends(list);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleInviteShare = useCallback(async () => {
    if (!inviteUrl) return;
    setSharing(true);
    try {
      const result = await Share.share({
        message: t("friends.inviteMessage", { appName: APP_DISPLAY_NAME, url: inviteUrl }),
        url: inviteUrl,
        title: t("friends.inviteSectionTitle"),
      });
      if (result.action === Share.sharedAction) {
        analyticsEvents.inviteShared();
      }
    } finally {
      setSharing(false);
    }
  }, [inviteUrl, t]);

  useEffect(() => {
    if (params.autoShare !== "1") return;
    if (autoShareConsumed) return;
    if (!inviteUrl) return;
    if (loading) return;
    setAutoShareConsumed(true);
    handleInviteShare().finally(() => {
      router.setParams({ autoShare: undefined } as never);
    });
  }, [autoShareConsumed, handleInviteShare, inviteUrl, loading, params.autoShare, router]);

  if (!userId) {
    return (
      <View
        className="flex-1 items-center justify-center bg-transparent px-6"
        style={{ paddingTop: insets.top }}>
        <Text className="mb-6 text-center text-white/80">
          {t("friends.signInPrompt")}
        </Text>
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/login",
              params: { returnTo: "/(tabs)/friends?autoShare=1" },
            } as never)
          }
          className="rounded-xl bg-white px-8 py-3"
          style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
          <Text className="text-base font-semibold text-black">{t("friends.signInButton")}</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-transparent"
        style={{ paddingTop: insets.top }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-transparent"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-row items-center justify-between border-b border-white/10 px-4 py-3">
        <Pressable
          onPress={() => router.replace("/(tabs)" as never)}
          className="h-10 w-10 items-center justify-center rounded-full bg-black/30"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Text className="text-lg font-semibold text-white">{t("friends.title")}</Text>
        <View className="h-10 w-10" />
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        <View className="mb-6 overflow-hidden rounded-2xl border border-white/20 bg-white/5">
          <View className="px-4 pt-4">
            <Text className="text-base font-semibold text-white">{t("friends.inviteSectionTitle")}</Text>
            <Text className="mt-1 text-sm text-white/60">
              {t("friends.inviteSectionBody")}
            </Text>
          </View>
          <View className="mt-4 flex-row gap-3 px-4 pb-4">
            <Pressable
              onPress={handleInviteShare}
              disabled={sharing || !inviteUrl}
              className="flex-1 flex-row items-center justify-center rounded-2xl bg-white py-3"
              style={({ pressed }) => ({
                opacity: sharing || !inviteUrl ? 0.5 : pressed ? 0.9 : 1,
              })}>
              <Ionicons name="share-social-outline" size={20} color="#000" />
              <Text className="ml-2 text-base font-semibold text-black">
                {sharing ? t("friends.sharingButton") : t("friends.shareLinkButton")}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/modal/scan-qr" as never)}
              className="h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/5"
              style={({ pressed }) => ({
                opacity: pressed ? 0.8 : 1,
              })}>
              <Ionicons name="scan-outline" size={20} color="#fff" />
            </Pressable>
            <Pressable
              onPress={() => setQrOpen(true)}
              disabled={!inviteUrl}
              className="h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/5"
              style={({ pressed }) => ({
                opacity: inviteUrl ? (pressed ? 0.8 : 1) : 0.5,
              })}>
              <Ionicons name="qr-code-outline" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>

        <View className="mb-2 flex-row items-center">
          <Ionicons name="people-outline" size={18} color="rgba(255,255,255,0.7)" />
          <Text className="ml-2 text-sm font-medium text-white/70">
            {t("friends.friendsCountLabel", { count: friends.length })}
          </Text>
        </View>
        {friends.length === 0 ? (
          <View className="items-center rounded-xl border border-white/10 bg-white/5 px-4 py-10">
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
              <Ionicons name="people-outline" size={28} color="rgba(255,255,255,0.7)" />
            </View>
            <Text className="text-center text-base font-semibold text-white/80">
              {t("friends.noFriendsPlaceholder")}
            </Text>
            <Text className="mt-1 text-center text-sm text-white/50">
              {t("friends.noFriendsSubtitle", "Invite friends to share daily vibes together.")}
            </Text>
            <Pressable
              onPress={handleInviteShare}
              disabled={!inviteUrl || sharing}
              className="mt-5 rounded-xl bg-white px-6 py-3"
              style={({ pressed }) => ({ opacity: pressed || !inviteUrl ? 0.75 : 1 })}>
              <Text className="text-center text-sm font-semibold text-black">
                {t("friends.inviteButtonLabel", "Invite a Friend")}
              </Text>
            </Pressable>
          </View>
        ) : (
          friends.map((f) => (
            <View
              key={f.id}
              className="mb-2 flex-row items-center rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <View className="h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/10">
                {f.avatar_url ? (
                  <Image
                    source={{ uri: f.avatar_url }}
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <Text className="text-sm font-semibold text-white">
                    {(f.display_name ?? f.username ?? "?")[0].toUpperCase()}
                  </Text>
                )}
              </View>
              <View className="ml-3 flex-1">
                <Text className="font-medium text-white">
                  {f.display_name ?? f.username ?? "Friend"}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={qrOpen && !!inviteUrl}
        transparent
        animationType="fade"
        presentationStyle={
          Platform.OS === "ios" ? "overFullScreen" : undefined
        }
        statusBarTranslucent
        onRequestClose={() => setQrOpen(false)}>
        <View
          className="flex-1 items-center justify-center px-4"
          style={{ backgroundColor: "transparent" }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("friends.qrModalClose")}
            onPress={() => setQrOpen(false)}
            style={StyleSheet.absoluteFillObject}
          />
          {inviteUrl ? (
            <View className="z-10 w-full max-w-sm overflow-hidden rounded-3xl border border-white/25 bg-black/35">
              <View className="flex-row items-center justify-between border-b border-white/10 px-4 py-3">
                <Text className="text-base font-semibold text-white">{t("friends.qrModalTitle")}</Text>
                <Pressable
                  onPress={() => setQrOpen(false)}
                  className="h-9 w-9 items-center justify-center rounded-full bg-white/10"
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                  <Ionicons name="close" size={18} color="#fff" />
                </Pressable>
              </View>
              <View className="items-center px-6 py-6">
                <View className="rounded-2xl bg-white p-3">
                  <QRCode value={inviteUrl} size={220} />
                </View>
                <Text className="mt-4 text-center text-sm text-white/60">
                  {t("friends.qrModalBody")}
                </Text>
                <Pressable
                  onPress={handleInviteShare}
                  disabled={sharing}
                  className="mt-5 w-full flex-row items-center justify-center rounded-2xl bg-white py-3"
                  style={({ pressed }) => ({
                    opacity: sharing ? 0.5 : pressed ? 0.9 : 1,
                  })}>
                  <Ionicons name="share-social-outline" size={20} color="#000" />
                  <Text className="ml-2 text-base font-semibold text-black">
                    {sharing ? t("friends.sharingButton") : t("friends.shareLinkButton")}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}
