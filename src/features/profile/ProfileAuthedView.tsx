import { useUIStore } from "@/appState/uiStore";
import { useUserStore } from "@/appState/userStore";
import { useAuth } from "@/hooks/useSupabaseAuth";
import { ProfileAuthedHeader } from "@/features/profile/ProfileAuthedHeader";
import { ProfileAvatarRow } from "@/features/profile/ProfileAvatarRow";
import { ProfileIdentityCard } from "@/features/profile/ProfileIdentityCard";
import { ProfilePhoneCard } from "@/features/profile/ProfilePhoneCard";
import { ProfileAuthedSettingsSections } from "@/features/profile/ProfileAuthedSettingsSections";
import { ProfileSignOutButton } from "@/features/profile/ProfileSignOutButton";
import { useProfileAuthedPhone } from "@/features/profile/useProfileAuthedPhone";
import { saveUserAvatar } from "@/services/media/saveUserAvatar";
import * as ImagePicker from "expo-image-picker";
import { MotiView } from "moti";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  ActivityIndicator,
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
  const { t } = useTranslation();
  const showToast = useUIStore((s) => s.showToast);
  const profile = useUserStore((s) => s.profile);
  const { updateProfile, signOut, refreshProfile } = useAuth();
  const { phoneDisplay, phoneVerified } = useProfileAuthedPhone();

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarUrlLocal, setAvatarUrlLocal] = useState<string | null>(
    profile?.avatar_url ?? null,
  );

  useEffect(() => {
    if (!editing) {
      setDisplayName(profile?.display_name ?? "");
      setBio(profile?.bio ?? "");
    }
  }, [editing, profile?.display_name, profile?.bio]);

  useEffect(() => {
    setAvatarUrlLocal(profile?.avatar_url ?? null);
  }, [profile?.avatar_url]);

  const trimmedName = displayName.trim();
  const nameError = useMemo(() => {
    if (trimmedName.length === 0) return t("profile.nameRequired");
    if (trimmedName.length > 40) return t("profile.nameTooLong");
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
          String((error as { message?: string }).message ?? t("profile.failedToSave")),
          "error",
        );
        return;
      }
      await refreshProfile();
      setEditing(false);
      showToast(t("profile.profileUpdated"), "success");
    } finally {
      setSaving(false);
    }
  };

  const handlePickAvatar = async () => {
    if (!profile?.user_id || avatarSaving) return;

    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showToast(t("profile.photoAccessRequired"), "info");
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
        showToast(t("profile.failedToUploadAvatar"), "error");
        return;
      }
      const { error } = await updateProfile({ avatar_url: saved.publicUrl });
      if (error && typeof error === "object" && error && "message" in error) {
        showToast(
          String(
            (error as { message?: string }).message ?? t("profile.failedToUploadAvatar"),
          ),
          "error",
        );
        return;
      }
      await refreshProfile();
      showToast(t("profile.avatarUpdated"), "success");
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error && typeof error === "object" && error && "message" in error) {
      showToast(
        String((error as { message?: string }).message ?? t("profile.failedToSignOut")),
        "error",
      );
      return;
    }
    onSignedOut();
  };

  const avatarUrl = avatarUrlLocal ?? profile?.avatar_url ?? null;
  const titleName = profile?.display_name || profile?.username || "Profile";

  return (
    <View className="flex-1 bg-transparent">
      {(saving || avatarSaving) && (
        <View className="absolute inset-0 z-10 items-center justify-center bg-black/30">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
      <ProfileAuthedHeader
        titleName={titleName}
        editing={editing}
        saving={saving}
        canSave={canSave}
        onBack={onBack}
        onCancelEdit={() => setEditing(false)}
        onSave={handleSave}
        onStartEdit={() => setEditing(true)}
      />

      <ScrollView className="flex-1 px-4 py-6" contentContainerClassName="pb-10">
        <ProfileIdentityCard />
        <ProfileAvatarRow
          avatarUrl={avatarUrl}
          avatarSaving={avatarSaving}
          displayLine={profile?.display_name || profile?.username || t("profile.noName")}
          username={profile?.username ?? null}
          onPickAvatar={handlePickAvatar}
        />

        {phoneDisplay ? (
          <ProfilePhoneCard
            phoneDisplay={phoneDisplay}
            phoneVerified={Boolean(phoneVerified)}
          />
        ) : null}

        {editing ? (
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}>
            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-white/70">
                {t("profile.displayNameLabel")}
              </Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder={t("profile.displayNamePlaceholder")}
                placeholderTextColor="rgba(255,255,255,0.4)"
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3.5 text-base text-white"
              />
              {nameError ? (
                <Text className="mt-1 text-xs text-red-400">{nameError}</Text>
              ) : null}
            </View>

            <View className="mb-6">
              <Text className="mb-2 text-sm font-medium text-white/70">{t("profile.bioLabel")}</Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder={t("profile.bioPlaceholder")}
                placeholderTextColor="rgba(255,255,255,0.4)"
                multiline
                className="min-h-[96px] rounded-2xl border border-white/20 bg-white/10 px-4 py-3.5 text-base text-white"
              />
              <Text className="mt-1 text-right text-[10px] text-white/35">
                {bio.length}/200
              </Text>
            </View>
          </MotiView>
        ) : profile?.bio ? (
          <View className="mb-6 overflow-hidden rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5">
            <Text className="text-left text-sm leading-5 text-white/85">
              {profile.bio}
            </Text>
          </View>
        ) : null}

        <ProfileAuthedSettingsSections />

        <ProfileSignOutButton onPress={handleSignOut} />
      </ScrollView>
    </View>
  );
}
