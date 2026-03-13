import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useMemoryStore } from "@/appState";
import { MemoryCard } from "@/components/MemoryCard";
import { strings } from "@/theme/strings";

type Layer = "mine" | "friends" | "public";

export default function MemoriesDayScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const dateParam = params.date;
  const dateKey =
    typeof dateParam === "string" && dateParam.length > 0
      ? dateParam
      : new Date().toISOString().split("T")[0];
  const [layer, setLayer] = useState<Layer>("mine");
  const hasHydrated = useMemoryStore((s) => s._hasHydrated);
  const mineMemories = useMemoryStore((s) => s.getMemoriesForDate(dateKey));
  const title = new Date(dateKey).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const activeMemories = layer === "mine" ? mineMemories : [];

  if (!hasHydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black px-4 pt-12">
      <Text className="mb-2 text-lg font-semibold text-white">{title}</Text>
      <View className="mb-4 flex-row items-center rounded-full bg-white/10 p-1">
        {(["mine", "friends", "public"] as Layer[]).map((key) => {
          const isActive = layer === key;
          const label =
            key === "mine" ? "Mine" : key === "friends" ? "Friends" : "Public";
          return (
            <Pressable
              key={key}
              onPress={() => setLayer(key)}
              className="flex-1 rounded-full px-3 py-1.5"
              style={({ pressed }) => ({
                backgroundColor: isActive
                  ? "rgba(255,255,255,0.18)"
                  : "transparent",
                opacity: pressed ? 0.85 : 1,
              })}>
              <Text
                className="text-center text-xs font-semibold"
                style={{ color: isActive ? "#ffffff" : "rgba(255,255,255,0.6)" }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}>
        {layer === "friends" || layer === "public" ? (
          <View className="mt-12 items-center">
            <Text className="text-sm text-white/70">
              {layer === "friends"
                ? strings.memories.friendsPlaceholder
                : strings.memories.publicPlaceholder}
            </Text>
          </View>
        ) : activeMemories.length === 0 ? (
          <View className="mt-12 items-center">
            <Text className="text-sm text-white/70">
              {strings.memories.emptyForDay}
            </Text>
          </View>
        ) : (
          activeMemories.map((memory) => (
            <MemoryCard
              key={memory.id}
              quote={memory.quoteText}
              author={memory.author}
              photoBackgroundUri={memory.photoBackgroundUri}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

