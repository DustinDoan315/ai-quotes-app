import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMemoryStore } from "@/appState";
import { MemoryCard } from "@/components/MemoryCard";
import { strings } from "@/theme/strings";

type Layer = "mine" | "friends" | "public";

export default function MemoriesDayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const dateParam = params.date;
  const dateKey =
    typeof dateParam === "string" && dateParam.length > 0
      ? dateParam
      : new Date().toISOString().split("T")[0];
  const [layer, setLayer] = useState<Layer>("mine");
  const hasHydrated = useMemoryStore((s) => s._hasHydrated);
  const memories = useMemoryStore((s) => s.memories);
  const mineMemories = useMemo(
    () => memories.filter((m) => m.date === dateKey),
    [memories, dateKey],
  );
  const title = new Date(dateKey).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const weekday = new Date(dateKey).toLocaleDateString(undefined, {
    weekday: "long",
  });

  const activeMemories = layer === "mine" ? mineMemories : [];

  if (!hasHydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#a78bfa" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <View className="bg-[#1e1b4b] px-4 pt-14 pb-5">
        <Pressable
          onPress={() => router.back()}
          className="mb-4 h-10 w-10 items-center justify-center rounded-full bg-white/10"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Text className="text-xs font-medium uppercase tracking-wider text-violet-300/90">
          {weekday}
        </Text>
        <Text className="mt-0.5 text-2xl font-bold text-white">{title}</Text>
        <View className="mt-4 flex-row rounded-xl bg-black/20 p-1">
          {(["mine", "friends", "public"] as Layer[]).map((key) => {
            const isActive = layer === key;
            const label =
              key === "mine"
                ? "Mine"
                : key === "friends"
                  ? "Friends"
                  : "Public";
            return (
              <Pressable
                key={key}
                onPress={() => setLayer(key)}
                className="flex-1 rounded-lg py-2.5"
                style={({ pressed }) => ({
                  backgroundColor: isActive ? "rgba(167, 139, 250, 0.4)" : "transparent",
                  opacity: pressed ? 0.9 : 1,
                })}>
                <Text
                  className="text-center text-sm font-semibold"
                  style={{
                    color: isActive ? "#fff" : "rgba(255,255,255,0.6)",
                  }}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        className="flex-1">
        {layer === "friends" || layer === "public" ? (
          <View className="mt-16 items-center px-6">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/20">
              <Ionicons name="people-outline" size={32} color="#a78bfa" />
            </View>
            <Text className="text-center text-base font-medium text-white/90">
              {layer === "friends"
                ? strings.memories.friendsPlaceholder
                : strings.memories.publicPlaceholder}
            </Text>
            <Text className="mt-2 text-center text-sm text-white/50">
              Coming soon
            </Text>
          </View>
        ) : activeMemories.length === 0 ? (
          <View className="mt-16 items-center px-6">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/20">
              <Ionicons name="calendar-outline" size={32} color="#a78bfa" />
            </View>
            <Text className="text-center text-base font-medium text-white/90">
              {strings.memories.emptyForDay}
            </Text>
            <Text className="mt-2 text-center text-sm text-white/50">
              Save a quote from the camera to see it here
            </Text>
          </View>
        ) : (
          activeMemories.map((memory) => (
            <MemoryCard
              key={memory.id}
              quote={memory.quoteText}
              author={memory.author}
              photoBackgroundUri={memory.photoBackgroundUri}
              photoOrientation={memory.photoOrientation}
              isFavorite={memory.isFavorite}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

