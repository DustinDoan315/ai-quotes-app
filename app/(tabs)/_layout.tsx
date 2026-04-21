import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

const screenOptions = {
  headerShown: false,
  tabBarStyle: { display: "none" as const },
  sceneContainerStyle: { backgroundColor: "transparent" },
};

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen name="index" options={INDEX_OPTIONS} />
      <Tabs.Screen name="profile" options={{ title: t("profile.guestTitle") }} />
      <Tabs.Screen name="friends" options={FRIENDS_OPTIONS} />
    </Tabs>
  );
}

const INDEX_OPTIONS = { title: "Home" };
const FRIENDS_OPTIONS = { title: "Friends" };
