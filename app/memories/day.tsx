import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import { useMemoryStore, useUserStore } from "@/appState";
import type { MemoryState } from "@/appState/memoryStore";
import type { QuoteMemory } from "@/types/memory";
import { MemoryCard } from "@/components/MemoryCard";
import { useTranslation } from "react-i18next";
import { formatLocalDateKey, getTodayLocalDateKey } from "@/utils/dateKey";
import { goBackOrReplace } from "@/utils/goBackOrReplace";
import { useFriendsMemoriesForDay } from "@/features/memories/useFriendsMemoriesForDay";

type Layer = "mine" | "friends";

export default function MemoriesDayScreen() {
  const { t } = useTranslation();
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
  const toggleFavorite = useMemoryStore((s: MemoryState) => s.toggleFavorite);
  const profile = useUserStore((s) => s.profile);
  const guestId = useUserStore((s) => s.guestId);

  const todayKey = getTodayLocalDateKey();
  const isToday = dateKey === todayKey;

  const prevDateKey = useMemo(() => {
    const d = new Date(`${dateKey}T12:00:00`);
    d.setDate(d.getDate() - 1);
    return formatLocalDateKey(d);
  }, [dateKey]);

  const nextDateKey = useMemo(() => {
    const d = new Date(`${dateKey}T12:00:00`);
    d.setDate(d.getDate() + 1);
    return formatLocalDateKey(d);
  }, [dateKey]);
  const dayMemories = useMemo(
    () => memories.filter((m: QuoteMemory) => m.date === dateKey),
    [memories, dateKey],
  );
  const getMemoriesOnSameDayPastYears = useMemoryStore(
    (s: MemoryState) => s.getMemoriesOnSameDayPastYears,
  );
  const pastYearMemories = useMemo(
    () => getMemoriesOnSameDayPastYears(dateKey),
    [getMemoriesOnSameDayPastYears, dateKey],
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
    hasError: friendsError,
    errorMessage: friendsErrorMessage,
    refresh: refreshFriends,
  } = useFriendsMemoriesForDay(dateKey);

  function handlePrevDay() {
    void Haptics.selectionAsync();
    router.replace({
      pathname: "/memories/day",
      params: { date: prevDateKey },
    } as never);
  }

  function handleNextDay() {
    if (isToday) return;
    void Haptics.selectionAsync();
    router.replace({
      pathname: "/memories/day",
      params: { date: nextDateKey },
    } as never);
  }

  const title = new Date(dateKey).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const weekday = new Date(dateKey).toLocaleDateString(undefined, {
    weekday: "long",
  });

  const mineLabel = `Mine (${mineMemories.length})`;
  const friendsLabel = friendsLoading ? "Friends" : `Friends (${friendCards.length})`;

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
        <View className="mt-0.5 flex-row items-center justify-between">
          <Pressable
            onPress={handlePrevDay}
            className="h-9 w-9 items-center justify-center rounded-full bg-white/10"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </Pressable>
          <View className="flex-1 items-center px-2">
            <Text className="text-xs font-medium uppercase tracking-wider text-white/70">
              {weekday}
            </Text>
            <Text className="text-xl font-bold text-white text-center">{title}</Text>
          </View>
          <Pressable
            onPress={handleNextDay}
            disabled={isToday}
            className="h-9 w-9 items-center justify-center rounded-full bg-white/10"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={isToday ? "rgba(255,255,255,0.2)" : "#fff"}
            />
          </Pressable>
        </View>
        <View className="mt-4 flex-row rounded-xl bg-white/5 p-1">
          {(["mine", "friends"] as Layer[]).map((key) => {
            const isActive = layer === key;
            const label = key === "mine" ? mineLabel : friendsLabel;
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

      {/* Two persistent ScrollViews — toggled with display to preserve scroll position per tab */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        style={{ flex: 1, display: layer === "mine" ? "flex" : "none" }}>
        {mineMemories.length === 0 ? (
          <View className="mt-16 items-center px-6">
            <MotiView
              from={{ scale: 0.9, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "timing", duration: 400 }}>
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                <Ionicons name="calendar-outline" size={32} color="#ffffff" />
              </View>
            </MotiView>
            <Text className="text-center text-base font-medium text-white/90">
              {t("memories.emptyForDay")}
            </Text>
            <Text className="mt-2 text-center text-sm text-white/50">
              Save a quote from the camera to see it here
            </Text>
          </View>
        ) : (
          mineMemories.map((memory: QuoteMemory, index: number) => (
            <MotiView
              key={`mine-${dateKey}-${memory.id}`}
              from={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 280, delay: index * 60 }}>
              <MemoryCard
                quote={memory.quoteText}
                author="Me"
                photoBackgroundUri={memory.photoBackgroundUri}
                photoOrientation={memory.photoOrientation}
                isFavorite={memory.isFavorite}
                onToggleFavorite={() => toggleFavorite(memory.id)}
                createdAt={memory.createdAt}
                styleFontId={memory.styleFontId as "small" | "medium" | "large"}
                styleColorSchemeId={memory.styleColorSchemeId as "light" | "amber" | "pink"}
              />
            </MotiView>
          ))
        )}
        {pastYearMemories.length > 0 && (
          <View className="mt-8">
            <View className="mb-3 flex-row items-center gap-2">
              <Ionicons name="time-outline" size={15} color="rgba(255,255,255,0.5)" />
              <Text className="text-xs font-semibold uppercase tracking-wider text-white/50">
                On This Day in Past Years
              </Text>
            </View>
            {pastYearMemories.map((memory: QuoteMemory, index: number) => (
              <MotiView
                key={`pastyear-${dateKey}-${memory.id}`}
                from={{ opacity: 0, translateY: 16 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 280, delay: index * 60 }}>
                <MemoryCard
                  quote={memory.quoteText}
                  author="Me"
                  photoBackgroundUri={memory.photoBackgroundUri}
                  photoOrientation={memory.photoOrientation}
                  isFavorite={memory.isFavorite}
                  createdAt={memory.createdAt}
                  styleFontId={memory.styleFontId as "small" | "medium" | "large"}
                  styleColorSchemeId={memory.styleColorSchemeId as "light" | "amber" | "pink"}
                />
              </MotiView>
            ))}
          </View>
        )}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        style={{ flex: 1, display: layer === "friends" ? "flex" : "none" }}>
        {friendsLoading ? (
          <View className="mt-16 items-center">
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        ) : friendsError ? (
          <View className="mt-16 items-center px-6">
            <MotiView
              from={{ scale: 0.9, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "timing", duration: 400 }}>
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                <Ionicons name="cloud-offline-outline" size={32} color="#ffffff" />
              </View>
            </MotiView>
            <Text className="text-center text-base font-medium text-white/90">
              {friendsErrorMessage ?? "Couldn't load friends' memories"}
            </Text>
            <Pressable
              onPress={refreshFriends}
              className="mt-5 rounded-xl bg-white/15 px-6 py-3"
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
              <Text className="text-sm font-semibold text-white">Retry</Text>
            </Pressable>
          </View>
        ) : friendCards.length === 0 ? (
          <View className="mt-16 items-center px-6">
            <MotiView
              from={{ scale: 0.9, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "timing", duration: 400 }}>
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                <Ionicons name="people-outline" size={32} color="#ffffff" />
              </View>
            </MotiView>
            <Text className="text-center text-base font-medium text-white/90">
              {t("memories.friendsEmptyForDay")}
            </Text>
            <Text className="mt-2 text-center text-sm text-white/50">
              {t("memories.friendsPlaceholder")}
            </Text>
          </View>
        ) : (
          friendCards.map((card, index) => (
            <MotiView
              key={`friend-${dateKey}-${card.id}`}
              from={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 280, delay: index * 60 }}>
              <MemoryCard
                quote={card.quote}
                author={card.authorDisplayName}
                photoBackgroundUri={card.imageUrl}
                isFavorite={false}
                createdAt={card.createdAt}
                styleFontId={card.styleFontId}
                styleColorSchemeId={card.styleColorSchemeId}
              />
            </MotiView>
          ))
        )}
      </ScrollView>
    </View>
  );
}
