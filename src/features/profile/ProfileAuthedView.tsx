import { useUIStore } from "@/appState/uiStore";
import { useUserStore } from "@/appState/userStore";
import { useAuth } from "@/hooks/useSupabaseAuth";
import { ProfileQuoteLanguageSection } from "@/features/profile/ProfileQuoteLanguageSection";
import { saveUserAvatar } from "@/services/media/saveUserAvatar";
import { getCurrentUser } from "@/services/supabase-auth";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

interface ProfileAuthedViewProps {
  onBack: () => void;
  onSignedOut: () => void;
}

export function ProfileAuthedView({
  onBack,
  onSignedOut,
}: ProfileAuthedViewProps) {
  const showToast = useUIStore((s) => s.showToast);
  const profile = useUserStore((s) => s.profile);
  const { updateProfile, signOut, refreshProfile } = useAuth();

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarUrlLocal, setAvatarUrlLocal] = useState<string | null>(
    profile?.avatar_url ?? null,
  );
  const [phoneDisplay, setPhoneDisplay] = useState<string | null>(null);
  const [phoneVerified, setPhoneVerified] = useState<boolean | null>(null);

  useEffect(() => {
    if (!editing) {
      setDisplayName(profile?.display_name ?? "");
      setBio(profile?.bio ?? "");
    }
  }, [editing, profile?.display_name, profile?.bio]);

  useEffect(() => {
    setAvatarUrlLocal(profile?.avatar_url ?? null);
  }, [profile?.avatar_url]);

  useEffect(() => {
    let cancelled = false;
    const loadPhone = async () => {
      const user = await getCurrentUser();
      if (!user || cancelled) {
        setPhoneDisplay(null);
        setPhoneVerified(null);
        return;
      }
      const raw = (user.phone ?? "").trim();
      if (!raw) {
        setPhoneDisplay(null);
        setPhoneVerified(null);
        return;
      }
      const last4 = raw.slice(-4);
      const masked =
        raw.startsWith("+") && raw.length > 4
          ? `+*** *** ${last4}`
          : `*** *** ${last4}`;
      setPhoneDisplay(masked);
      setPhoneVerified(
        Boolean(
          (user as { phone_confirmed_at?: string | null }).phone_confirmed_at,
        ),
      );
    };
    loadPhone();
    return () => {
      cancelled = true;
    };
  }, []);

  const trimmedName = displayName.trim();
  const nameError = useMemo(() => {
    if (trimmedName.length === 0) return "Name is required.";
    if (trimmedName.length > 40) return "Name must be 40 characters or less.";
    return null;
  }, [trimmedName]);

  const canSave = useMemo(() => {
    if (!profile?.user_id) return false;
    if (saving) return false;
    if (nameError) return false;
    const nameChanged = trimmedName !== (profile.display_name ?? "");
    const bioChanged = bio !== (profile.bio ?? "");
    return nameChanged || bioChanged;
  }, [
    profile?.user_id,
    profile?.display_name,
    profile?.bio,
    trimmedName,
    bio,
    saving,
    nameError,
  ]);

  const handleSave = async () => {
    if (!profile?.user_id || !canSave) return;
    setSaving(true);
    try {
      const { error } = await updateProfile({
        display_name: trimmedName || undefined,
        bio: bio || undefined,
      });
      if (error && typeof error === "object" && error && "message" in error) {
        showToast(
          String((error as { message?: string }).message ?? "Failed to save"),
          "error",
        );
        return;
      }
      await refreshProfile();
      setEditing(false);
      showToast("Profile updated", "success");
    } finally {
      setSaving(false);
    }
  };

  const handlePickAvatar = async () => {
    if (!profile?.user_id || avatarSaving) return;

    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showToast("Please allow photo access to update your avatar.", "info");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
      selectionLimit: 1,
    });
    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0];
    if (!asset.uri) return;

    setAvatarUrlLocal(asset.uri);
    setAvatarSaving(true);
    try {
      const saved = await saveUserAvatar({
        localUri: asset.uri,
        userId: profile.user_id,
      });
      if (!saved) {
        showToast("Failed to upload avatar.", "error");
        return;
      }
      const { error } = await updateProfile({ avatar_url: saved.publicUrl });
      if (error && typeof error === "object" && error && "message" in error) {
        showToast(
          String(
            (error as { message?: string }).message ?? "Failed to save avatar",
          ),
          "error",
        );
        return;
      }
      await refreshProfile();
      showToast("Avatar updated", "success");
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error && typeof error === "object" && error && "message" in error) {
      showToast(
        String((error as { message?: string }).message ?? "Failed to sign out"),
        "error",
      );
      return;
    }
    onSignedOut();
  };

  const avatarUrl = avatarUrlLocal ?? profile?.avatar_url ?? null;
  const titleName = profile?.display_name || profile?.username || "Profile";

  return (
    <View className="flex-1 bg-black">
      {(saving || avatarSaving) && (
        <View className="absolute inset-0 z-10 items-center justify-center bg-black/40">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
      <View className="flex-row items-center justify-between border-b border-white/10 px-4 py-3">
        <View className="flex-row items-center">
          <Pressable
            onPress={onBack}
            className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Text className="ml-3 text-lg font-semibold text-white">
            {titleName}
          </Text>
        </View>

        {editing ? (
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => setEditing(false)}
              disabled={saving}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
              <Text className="text-base text-white/60">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!canSave}
              style={({ pressed }) => ({
                opacity: canSave ? (pressed ? 0.8 : 1) : 0.4,
              })}>
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-base font-medium text-white">Save</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => setEditing(true)}
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
            <Text className="text-base text-white/80">Edit</Text>
          </Pressable>
        )}
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        <View className="mb-6 flex-row items-center">
          <Pressable
            onPress={handlePickAvatar}
            disabled={avatarSaving}
            className="h-16 w-16 items-center justify-center rounded-full bg-white/20"
            style={({ pressed }) => ({
              opacity: avatarSaving ? 0.5 : pressed ? 0.8 : 1,
            })}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                className="h-16 w-16 rounded-full"
              />
            ) : (
              <Ionicons name="person" size={32} color="#fff" />
            )}
          </Pressable>
          <View className="ml-4 flex-1">
            <Text className="text-lg font-medium text-white">
              {profile?.display_name || profile?.username || "No name"}
            </Text>
            {profile?.username ? (
              <Text className="text-sm text-white/60">@{profile.username}</Text>
            ) : null}
            <Text className="mt-1 text-xs text-white/50">
              Tap the avatar to update.
            </Text>
          </View>
        </View>

        {phoneDisplay ? (
          <View className="mb-6 flex-row items-center justify-between rounded-xl border border-white/15 bg-white/5 px-4 py-3">
            <View>
              <Text className="text-xs font-medium uppercase tracking-wide text-white/50">
                Phone
              </Text>
              <Text className="mt-0.5 text-sm text-white">{phoneDisplay}</Text>
            </View>
            <Text
              className={
                phoneVerified
                  ? "text-xs font-semibold text-emerald-400"
                  : "text-xs text-white/60"
              }>
              {phoneVerified ? "Verified" : "Not verified"}
            </Text>
          </View>
        ) : null}

        {editing ? (
          <>
            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-white/70">
                Display name
              </Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your name"
                placeholderTextColor="rgba(255,255,255,0.4)"
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-base text-white"
              />
              {nameError ? (
                <Text className="mt-1 text-xs text-red-400">{nameError}</Text>
              ) : null}
            </View>

            <View className="mb-6">
              <Text className="mb-2 text-sm font-medium text-white/70">
                Bio
              </Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="A short bio"
                placeholderTextColor="rgba(255,255,255,0.4)"
                multiline
                className="min-h-[96px] rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-base text-white"
              />
            </View>
          </>
        ) : profile?.bio ? (
          <View className="mb-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <Text className="text-sm text-white/80 text-left">
              {profile.bio}
            </Text>
          </View>
        ) : null}

        <ProfileQuoteLanguageSection />

        <Pressable
          onPress={handleSignOut}
          className="mt-4 rounded-xl border border-white/20 py-3"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <Text className="text-center text-base text-white/80">Sign out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
