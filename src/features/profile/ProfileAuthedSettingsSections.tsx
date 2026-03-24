import { ProfileLegalLinks } from "@/features/profile/ProfileLegalLinks";
import { ProfileQuoteLanguageSection } from "@/features/profile/ProfileQuoteLanguageSection";
import { ProfileReminderSection } from "@/features/profile/ProfileReminderSection";
import { View } from "react-native";

export function ProfileAuthedSettingsSections() {
  return (
    <View>
      <ProfileQuoteLanguageSection />
      <ProfileReminderSection />
      <ProfileLegalLinks />
    </View>
  );
}
