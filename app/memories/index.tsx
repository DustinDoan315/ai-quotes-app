import { MemoriesCalendarScreen } from "@/features/memories/MemoriesCalendarScreen";
import { useRouter } from "expo-router";
import { useOwnMemoriesSync } from "@/features/memories/useOwnMemoriesSync";
import { View } from "react-native";

export default function MemoriesIndexScreen() {
  useOwnMemoriesSync();
  const router = useRouter();

  function handlePressDay(date: string) {
    router.push({
      pathname: "/memories/day",
      params: { date },
    } as never);
  }

  return (
    <View className="flex-1 bg-transparent">
      <MemoriesCalendarScreen onPressDay={handlePressDay} />
    </View>
  );
}
