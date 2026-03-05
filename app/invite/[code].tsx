import { useUserStore } from "@/appState/userStore";
import { addFriend, resolveInviteCode } from "@/services/inviteApi";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type InviteStatus = "loading" | "success" | "error" | "invalid";

async function processInviteCode(
  rawCode: string,
  myUserId: string
): Promise<InviteStatus> {
  const inviterId = await resolveInviteCode(rawCode);
  if (!inviterId) return "invalid";
  if (inviterId === myUserId) return "invalid";
  const ok = await addFriend(myUserId, inviterId);
  return ok ? "success" : "error";
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
      setStatus("error");
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
    if (status === "success" || status === "invalid") {
      const t = setTimeout(() => router.replace("/(tabs)/friends" as never), 1500);
      return () => clearTimeout(t);
    }
    if (status === "error") {
      const t = setTimeout(() => router.replace("/(tabs)" as never), 2000);
      return () => clearTimeout(t);
    }
  }, [status, router]);

  return (
    <View
      className="flex-1 items-center justify-center bg-black px-6"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {status === "loading" && (
        <>
          <ActivityIndicator size="large" color="#fff" />
          <Text className="mt-4 text-center text-white/80">Connecting…</Text>
        </>
      )}
      {status === "success" && (
        <Text className="text-center text-lg text-white">
          You're now connected. Taking you to Friends…
        </Text>
      )}
      {status === "invalid" && (
        <Text className="text-center text-white/80">
          Invalid or expired invite. Going to Friends…
        </Text>
      )}
      {status === "error" && (
        <Text className="text-center text-white/80">
          Something went wrong. Going back home…
        </Text>
      )}
    </View>
  );
}
