import { useUserStore } from "@/appState/userStore";
import { addFriend, resolveInviteCode } from "@/services/inviteApi";
import { captureMessage } from "@/services/analytics/sentry";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type InviteStatus = "loading" | "success" | "error" | "invalid" | "need_login" | "self";

async function processInviteCode(
  rawCode: string,
  myUserId: string
): Promise<InviteStatus> {
  const inviterId = await resolveInviteCode(rawCode);
  if (!inviterId) {
    captureMessage("Invite resolve returned no inviter", "warning", {
      feature: "invite",
      codePrefix: rawCode?.slice(0, 8),
    });
    return "invalid";
  }
  if (inviterId === myUserId) return "self";
  const ok = await addFriend(myUserId, inviterId);
  if (!ok) {
    captureMessage("addFriend failed after resolve", "error", {
      feature: "invite",
      codePrefix: rawCode?.slice(0, 8),
      myUserId,
      inviterId,
    });
    return "error";
  }
  return "success";
}

export default function InviteByCodeScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useUserStore((s) => s.profile);
  const [status, setStatus] = useState<InviteStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    const rawCode = code?.trim();
    if (!rawCode) {
      setStatus("invalid");
      return;
    }
    const myUserId = profile?.user_id ?? null;
    if (!myUserId) {
      setStatus("need_login");
      return;
    }
    processInviteCode(rawCode, myUserId).then((result) => {
      if (!cancelled) setStatus(result);
    });
    return () => {
      cancelled = true;
    };
  }, [code, profile?.user_id]);

  useEffect(() => {
    if (status === "success" || status === "invalid" || status === "self") {
      const t = setTimeout(() => router.replace("/(tabs)/friends" as never), 1500);
      return () => clearTimeout(t);
    }
    if (status === "error") {
      const t = setTimeout(() => router.replace("/(tabs)" as never), 2000);
      return () => clearTimeout(t);
    }
  }, [status, router]);

  const returnTo = code ? `/invite/${code}` : "/(tabs)";

  return (
    <View
      className="flex-1 items-center justify-center bg-transparent px-6"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {status === "loading" && (
        <>
          <ActivityIndicator size="large" color="#fff" />
          <Text className="mt-4 text-center text-white/80">Connecting…</Text>
        </>
      )}
      {status === "success" && (
        <Text className="text-center text-lg text-white">
          You’re now connected. Taking you to Friends…
        </Text>
      )}
      {status === "invalid" && (
        <Text className="text-center text-white/80">
          Invalid or expired invite. Going to Friends…
        </Text>
      )}
      {status === "self" && (
        <Text className="text-center text-white/80">
          That’s your invite code. Share it with a friend to connect.
        </Text>
      )}
      {status === "error" && (
        <Text className="text-center text-white/80">
          Something went wrong. Going back home…
        </Text>
      )}
      {status === "need_login" && (
        <>
          <Text className="mb-6 text-center text-white/80">
            Sign in to accept this invite and connect with your friend.
          </Text>
          <Pressable
            onPress={() => router.push({ pathname: "/login", params: { returnTo } } as never)}
            className="rounded-xl bg-white px-8 py-3"
            style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
            <Text className="text-base font-semibold text-black">Sign in with phone</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
