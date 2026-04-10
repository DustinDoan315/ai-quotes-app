import { useUserStore } from "@/appState/userStore";
import { Redirect } from "expo-router";

export default function Index() {
  const { persona } = useUserStore();

  if (!persona) {
    return <Redirect href="/(onboarding)" />;
  }

  return <Redirect href="/(tabs)" />;
}
