import { useUserStore } from "@/appState/userStore";
import { ProfileIdentityCard } from "@/features/profile/ProfileIdentityCard";
import { ProfileLegalLinks } from "@/features/profile/ProfileLegalLinks";
import { ProfileQuoteLanguageSection } from "@/features/profile/ProfileQuoteLanguageSection";
import { ProfileReminderSection } from "@/features/profile/ProfileReminderSection";
import { ProfileUiLanguageSection } from "@/features/profile/ProfileUiLanguageSection";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const persona = useUserStore((s) => s.persona);
  const guestDisplayName = useUserStore((s) => s.guestDisplayName);
  const setGuestDisplayName = useUserStore((s) => s.setGuestDisplayName);

  return (
    <View className="flex-1 bg-transparent">
      <View className="flex-row items-center justify-between border-b border-white/10 px-4 py-3">
        <Pressable
          onPress={onBack}
          className="h-10 w-10 items-center justify-center rounded-full bg-black/30"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Text className="text-lg font-semibold text-white">Profile</Text>
        <View className="h-10 w-10" />
      </View>

      <ScrollView className="flex-1 px-4 py-6" contentContainerClassName="pb-10">
        <ProfileIdentityCard />
        {persona ? (
          <View className="mb-6 overflow-hidden rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5">
            <Text className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
              Your style
            </Text>
            <Text className="text-sm leading-5 text-white/85">
              {persona.traits?.length
                ? persona.traits.slice(0, 3).join(" · ")
                : t("profile.personalizedQuotes")}
            </Text>
          </View>
        ) : null}

        <ProfileUiLanguageSection />

        <ProfileQuoteLanguageSection />

        <ProfileReminderSection />

        <View className="mb-6">
          <Text className="mb-2 text-sm font-medium text-white/70">
            Display name (saved on this device)
          </Text>
          <TextInput
            value={guestDisplayName ?? ""}
            onChangeText={(t) => setGuestDisplayName(t.trim() || null)}
            placeholder={t("profile.addAName")}
            placeholderTextColor="rgba(255,255,255,0.4)"
            className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3.5 text-base text-white"
          />
        </View>

        <Pressable
          onPress={onLogin}
          className="mb-3 rounded-2xl bg-white py-3.5"
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

        <ProfileLegalLinks />
      </ScrollView>
    </View>
  );
}

