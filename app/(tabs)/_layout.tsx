import { Tabs } from "expo-router";

const screenOptions = {
  headerShown: false,
  tabBarStyle: { display: "none" as const },
  sceneContainerStyle: { backgroundColor: "transparent" },
};

export default function TabsLayout() {
  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen name="index" options={INDEX_OPTIONS} />
      <Tabs.Screen name="profile" options={PROFILE_OPTIONS} />
      <Tabs.Screen name="friends" options={FRIENDS_OPTIONS} />
    </Tabs>
  );
}

const INDEX_OPTIONS = { title: "Home" };
const PROFILE_OPTIONS = { title: "Profile" };
const FRIENDS_OPTIONS = { title: "Friends" };
