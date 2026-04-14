import { ProfileLanguageSection } from "@/features/profile/ProfileLanguageSection";
import { ProfileLegalLinks } from "@/features/profile/ProfileLegalLinks";
import { ProfileReminderSection } from "@/features/profile/ProfileReminderSection";
import { ProfileStreakSection } from "@/features/profile/ProfileStreakSection";
import { View } from "react-native";

export function ProfileAuthedSettingsSections() {
  return (
    <View>
      <ProfileStreakSection />
      <ProfileLanguageSection />
      <ProfileReminderSection />
      <ProfileLegalLinks />
    </View>
  );
}
