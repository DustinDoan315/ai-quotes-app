import { useUserStore } from "@/appState/userStore";
import { ProfileLanguageSelector } from "@/features/profile/ProfileLanguageSelector";
import { strings } from "@/theme/strings";

export function ProfileAppLanguageSection() {
  const appLanguage = useUserStore((s) => s.appLanguage);
  const setAppLanguage = useUserStore((s) => s.setAppLanguage);

  return (
    <ProfileLanguageSelector
      title={strings.profile.appLanguage}
      description={strings.profile.appLanguageDescription}
      value={appLanguage}
      onChange={setAppLanguage}
    />
  );
}
