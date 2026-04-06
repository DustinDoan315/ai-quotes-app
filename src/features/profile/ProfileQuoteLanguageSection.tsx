import { useUserStore } from "@/appState/userStore";
import { ProfileLanguageSelector } from "@/features/profile/ProfileLanguageSelector";
import { strings } from "@/theme/strings";

export function ProfileQuoteLanguageSection() {
  const quoteLanguage = useUserStore((s) => s.quoteLanguage) ?? "vi";
  const setQuoteLanguage = useUserStore((s) => s.setQuoteLanguage);

  return (
    <ProfileLanguageSelector
      title={strings.profile.quoteLanguage}
      description={strings.profile.quoteLanguageDescription}
      value={quoteLanguage}
      onChange={setQuoteLanguage}
    />
  );
}
