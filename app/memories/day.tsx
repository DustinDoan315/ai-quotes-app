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
import { useMemoryStore, useUserStore } from "@/appState";
import type { MemoryState } from "@/appState/memoryStore";
import type { QuoteMemory } from "@/types/memory";
import { MemoryCard } from "@/components/MemoryCard";
import { strings } from "@/theme/strings";
import { getTodayLocalDateKey } from "@/utils/dateKey";
import { goBackOrReplace } from "@/utils/goBackOrReplace";
import { useFriendsMemoriesForDay } from "@/features/memories/useFriendsMemoriesForDay";

type Layer = "mine" | "friends";

export default function MemoriesDayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const dateParam = params.date;
  const dateKey =
    typeof dateParam === "string" && dateParam.length > 0
      ? dateParam
      : getTodayLocalDateKey();
  const [layer, setLayer] = useState<Layer>("mine");
  const hasHydrated = useMemoryStore((s: MemoryState) => s._hasHydrated);
  const memories = useMemoryStore((s: MemoryState) => s.memories);
  const profile = useUserStore((s) => s.profile);
  const guestId = useUserStore((s) => s.guestId);
  const dayMemories = useMemo(
    () => memories.filter((m: QuoteMemory) => m.date === dateKey),
    [memories, dateKey],
  );

  const mineMemories = useMemo(() => {
    const userId = profile?.user_id ?? null;
    const hasIdentity = Boolean(userId || guestId);
    const isMine = (m: QuoteMemory) => {
      if (!hasIdentity) {
        return m.visibility === "private";
      }
      return (
        (userId ? m.ownerUserId === userId : false) ||
        (guestId ? m.ownerGuestId === guestId : false)
      );
    };
    return dayMemories.filter((m) => isMine(m));
  }, [dayMemories, guestId, profile?.user_id]);

  const {
    cards: friendCards,
    isLoading: friendsLoading,
  } = useFriendsMemoriesForDay(dateKey);
  const title = new Date(dateKey).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const weekday = new Date(dateKey).toLocaleDateString(undefined, {
    weekday: "long",
  });

  const activeCount = layer === "mine" ? mineMemories.length : friendCards.length;
  const memoryCountLabel =
    activeCount === 0
      ? "No memories saved"
      : activeCount === 1
        ? "1 memory saved"
        : `${activeCount} memories saved`;

  if (!hasHydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-transparent">
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-transparent">
      <View className="border-b border-white/10 bg-transparent px-4 pt-14 pb-5">
        <Pressable
          onPress={() => goBackOrReplace(router, "/memories")}
          className="mb-4 h-10 w-10 items-center justify-center rounded-full bg-white/10"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Text className="text-xs font-medium uppercase tracking-wider text-white/70">
          {weekday}
        </Text>
        <Text className="mt-0.5 text-2xl font-bold text-white">{title}</Text>
        <View className="mt-4 flex-row rounded-xl bg-white/5 p-1">
          {(["mine", "friends"] as Layer[]).map((key) => {
            const isActive = layer === key;
            const label =
              key === "mine"
                ? "Mine"
                : "Friends";
            return (
              <Pressable
                key={key}
                onPress={() => setLayer(key)}
                className="flex-1 rounded-lg py-2.5"
                style={({ pressed }) => ({
                  backgroundColor: isActive ? "rgba(255,255,255,0.08)" : "transparent",
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
        <View className="mt-3 flex-row items-center justify-between">
          <Text className="text-xs font-medium uppercase tracking-wide text-white/70">
            {memoryCountLabel}
          </Text>
          <Text className="text-[11px] text-white/50">
            {dateKey}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        className="flex-1">
        {layer === "mine" ? (
          mineMemories.length === 0 ? (
            <View className="mt-16 items-center px-6">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                <Ionicons name="calendar-outline" size={32} color="#ffffff" />
              </View>
              <Text className="text-center text-base font-medium text-white/90">
                {strings.memories.emptyForDay}
              </Text>
              <Text className="mt-2 text-center text-sm text-white/50">
                Save a quote from the camera to see it here
              </Text>
            </View>
          ) : (
            mineMemories.map((memory: QuoteMemory) => (
              <MemoryCard
                key={memory.id}
                quote={memory.quoteText}
                author="Me"
                photoBackgroundUri={memory.photoBackgroundUri}
                photoOrientation={memory.photoOrientation}
                isFavorite={memory.isFavorite}
                createdAt={memory.createdAt}
                styleFontId={
                  memory.styleFontId as "small" | "medium" | "large"
                }
                styleColorSchemeId={
                  memory.styleColorSchemeId as "light" | "amber" | "pink"
                }
              />
            ))
          )
        ) : friendsLoading ? (
          <View className="mt-16 items-center">
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        ) : friendCards.length === 0 ? (
          <View className="mt-16 items-center px-6">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
              <Ionicons name="people-outline" size={32} color="#ffffff" />
            </View>
            <Text className="text-center text-base font-medium text-white/90">
              {strings.memories.friendsPlaceholder}
            </Text>
            <Text className="mt-2 text-center text-sm text-white/50">
              {strings.memories.emptyForDay}
            </Text>
          </View>
        ) : (
          friendCards.map((card) => (
            <MemoryCard
              key={card.id}
              quote={card.quote}
              author={card.authorDisplayName}
              photoBackgroundUri={card.imageUrl}
              isFavorite={false}
              createdAt={card.createdAt}
              styleFontId={card.styleFontId}
              styleColorSchemeId={card.styleColorSchemeId}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
