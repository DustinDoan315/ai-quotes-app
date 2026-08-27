import { useUserStore } from "@/appState/userStore";
import { Redirect } from "expo-router";
import { useUserStoreHydrated } from "@/utils/useUserStoreHydrated";
import { selectBootstrapReady, useBootstrapStore } from "@/appState/bootstrapStore";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { persona } = useUserStore();
  const hydrated = useUserStoreHydrated();
  const bootstrapReady = useBootstrapStore(selectBootstrapReady);

  if (!hydrated || !bootstrapReady) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="#ffffff" />
      </View>
    );
  }

  if (!persona) {
    return <Redirect href="/(onboarding)" />;
  }

  return <Redirect href="/(tabs)" />;
}
