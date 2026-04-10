import { ProfileLegalLinks } from "@/features/profile/ProfileLegalLinks";
import { ProfileQuoteLanguageSection } from "@/features/profile/ProfileQuoteLanguageSection";
import { ProfileReminderSection } from "@/features/profile/ProfileReminderSection";
import { ProfileUiLanguageSection } from "@/features/profile/ProfileUiLanguageSection";
import { View } from "react-native";

export function ProfileAuthedSettingsSections() {
  return (
    <View>
      <ProfileUiLanguageSection />
      <ProfileQuoteLanguageSection />
      <ProfileReminderSection />
      <ProfileLegalLinks />
    </View>
  );
}
