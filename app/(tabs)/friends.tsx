import { useUserStore } from "@/appState/userStore";
import {
  getOrCreateMyInvite,
  listMyFriends,
  type FriendWithProfile,
} from "@/services/inviteApi";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

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
      await Share.share({
        message: `Add me on AI Quotes – ${inviteUrl}`,
        url: inviteUrl,
        title: "Invite to AI Quotes",
      });
    } finally {
      setSharing(false);
    }
  }, [inviteUrl]);

  if (!userId) {
    return (
      <View
        className="flex-1 items-center justify-center bg-black px-6"
        style={{ paddingTop: insets.top }}>
        <Text className="text-center text-white/80">
          Sign in to add and invite friends.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-black"
        style={{ paddingTop: insets.top }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-black"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-row items-center justify-between border-b border-white/10 px-4 py-3">
        <Pressable
          onPress={() => router.replace("/(tabs)" as never)}
          className="h-10 w-10 items-center justify-center rounded-full bg-black/30"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Text className="text-lg font-semibold text-white">Friends</Text>
        <View className="h-10 w-10" />
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        <Pressable
          onPress={handleInviteShare}
          disabled={sharing || !inviteUrl}
          className="mb-6 flex-row items-center justify-center rounded-2xl border border-white/20 bg-white/5 py-4"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <Ionicons name="share-social-outline" size={22} color="#fff" />
          <Text className="ml-2 text-base font-medium text-white">
            {sharing ? "Opening share…" : "Invite friends"}
          </Text>
        </Pressable>

        {inviteUrl ? (
          <View className="mb-6 items-center rounded-2xl border border-white/20 bg-white/5 py-4">
            <Text className="mb-2 text-sm font-medium text-white/70">
              Or show this QR in person
            </Text>
            <View className="rounded-xl bg-white p-2">
              <QRCode value={inviteUrl} size={160} />
            </View>
          </View>
        ) : null}

        <View className="mb-2 flex-row items-center">
          <Ionicons name="people-outline" size={18} color="rgba(255,255,255,0.7)" />
          <Text className="ml-2 text-sm font-medium text-white/70">
            Your friends ({friends.length})
          </Text>
        </View>
        {friends.length === 0 ? (
          <View className="rounded-xl border border-white/10 bg-white/5 px-4 py-8">
            <Text className="text-center text-sm text-white/60">
              No friends yet. Share your invite link so friends can add you.
            </Text>
          </View>
        ) : (
          friends.map((f) => (
            <View
              key={f.id}
              className="mb-2 flex-row items-center rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <Text className="text-sm font-semibold text-white">
                  {(f.display_name ?? f.username ?? "?")[0].toUpperCase()}
                </Text>
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
    </View>
  );
}
