import { useUserStore } from "@/appState/userStore";
import { useStreakStore } from "@/appState/streakStore";
import { useMemoryStore } from "@/appState";
import type { MemoryState } from "@/appState/memoryStore";
import { ProfileQuoteLanguageSection } from "@/features/profile/ProfileQuoteLanguageSection";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

interface ProfileGuestViewProps {
  onBack: () => void;
  onLogin: () => void;
  onInviteFriends: () => void;
}

export function ProfileGuestView({
  onBack,
  onLogin,
  onInviteFriends,
}: ProfileGuestViewProps) {
  const persona = useUserStore((s) => s.persona);
  const guestDisplayName = useUserStore((s) => s.guestDisplayName);
  const setGuestDisplayName = useUserStore((s) => s.setGuestDisplayName);
  const currentStreak = useStreakStore((s) => s.currentStreak);
  const memories = useMemoryStore((s: MemoryState) => s.memories);
  const identityTitle =
    persona && persona.traits.length > 0
      ? persona.traits.includes("disciplined")
        ? "The Disciplined One"
        : persona.traits.includes("quiet")
          ? "The Quiet Thinker"
          : "The Rebuilder"
      : "Growing Through Moments";

  return (
    <View className="flex-1 bg-transparent">
      <View className="flex-row items-center border-b border-white/10 px-4 py-3">
        <Pressable
          onPress={onBack}
          className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Text className="ml-3 text-lg font-semibold text-white">Profile</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        <View className="mb-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <Text className="mb-1 text-xs font-medium uppercase tracking-wide text-white/50">
            Identity
          </Text>
          <Text className="text-sm font-semibold text-white">
            {identityTitle}
          </Text>
          <Text className="mt-1 text-xs text-white/60">
            Streak: {currentStreak} day{currentStreak === 1 ? "" : "s"} · Memories:{" "}
            {memories.length}
          </Text>
        </View>
        {persona ? (
          <View className="mb-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <Text className="mb-1 text-xs font-medium uppercase tracking-wide text-white/50">
              Your style
            </Text>
            <Text className="text-sm text-white/80">
              {persona.traits?.length
                ? persona.traits.slice(0, 3).join(" · ")
                : "Personalized quotes"}
            </Text>
          </View>
        ) : null}

        <ProfileQuoteLanguageSection />

        <View className="mb-6">
          <Text className="mb-2 text-sm font-medium text-white/70">
            Display name (saved on this device)
          </Text>
          <TextInput
            value={guestDisplayName ?? ""}
            onChangeText={(t) => setGuestDisplayName(t.trim() || null)}
            placeholder="Add a name"
            placeholderTextColor="rgba(255,255,255,0.4)"
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-base text-white"
          />
        </View>

        <Pressable
          onPress={onLogin}
          className="mb-3 rounded-xl bg-white py-3"
          style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
          <Text className="text-center text-base font-semibold text-black">
            Sign in with phone
          </Text>
        </Pressable>

        <Text className="mb-4 text-center text-xs text-white/50">
          Sign in to save your profile and invite friends.
        </Text>

        <Pressable
          onPress={onInviteFriends}
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <Text className="text-center text-sm text-white/70">
            Invite friends
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

