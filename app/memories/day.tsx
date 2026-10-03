import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  RefreshControl,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS, useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOwnMemoriesSync } from "@/features/memories/useOwnMemoriesSync";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import { useMemoryStore, useUserStore } from "@/appState";
import type { MemoryState } from "@/appState/memoryStore";
import type { QuoteMemory } from "@/types/memory";
import { MemoryCard } from "@/components/MemoryCard";
import { useTranslation } from "react-i18next";
import {
  formatLocalDateKey,
  getTodayLocalDateKey,
  parseLocalDateKey,
} from "@/utils/dateKey";
import { goBackOrReplace } from "@/utils/goBackOrReplace";
import { useFriendsMemoriesForDay } from "@/features/memories/useFriendsMemoriesForDay";
import {
  updateUserPhotoFavorite,
  updateUserPhotoVisibility,
} from "@/services/media/userPhotosApi";
import { useUIStore } from "@/appState/uiStore";

type Layer = "mine" | "friends";

export default function MemoriesDayScreen() {
  const { i18n, t } = useTranslation();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { width: screenWidth } = useWindowDimensions();
  const [dayDirection, setDayDirection] = useState(0);
  const insets = useSafeAreaInsets();
  const ownSync = useOwnMemoriesSync();
  const mineScrollRef = useRef<ScrollView>(null);
  const friendScrollRef = useRef<ScrollView>(null);
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
  const setVisibility = useMemoryStore((s: MemoryState) => s.setVisibility);
  const profile = useUserStore((s) => s.profile);
  const authUserId = useUserStore((s) => s.authUserId);
  const guestId = useUserStore((s) => s.guestId);
  const showToast = useUIStore((s) => s.showToast);
  const [updatingVisibilityId, setUpdatingVisibilityId] = useState<string | null>(null);

  const todayKey = getTodayLocalDateKey();
  const isToday = dateKey >= todayKey;
  useEffect(() => {
    mineScrollRef.current?.scrollTo({ y: 0, animated: false });
    friendScrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [dateKey]);

  const prevDateKey = useMemo(() => {
    const d = parseLocalDateKey(dateKey);
    d.setDate(d.getDate() - 1);
    return formatLocalDateKey(d);
  }, [dateKey]);

  const nextDateKey = useMemo(() => {
    const d = parseLocalDateKey(dateKey);
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
  const pastYearMemories = getMemoriesOnSameDayPastYears(dateKey).filter(memory => {
    const userId = profile?.user_id ?? authUserId;
    return userId ? memory.ownerUserId === userId : Boolean(guestId && !memory.ownerUserId && memory.ownerGuestId === guestId);
  });

  const mineMemories = useMemo(() => {
    const userId = profile?.user_id ?? authUserId;
    const hasIdentity = Boolean(userId || guestId);
    const isMine = (m: QuoteMemory) => {
      if (!hasIdentity) {
        return m.visibility === "private";
      }
      return userId ? m.ownerUserId === userId : Boolean(guestId && !m.ownerUserId && m.ownerGuestId === guestId);
    };
    return dayMemories.filter((m) => isMine(m));
  }, [authUserId, dayMemories, guestId, profile?.user_id]);

  const {
    cards: friendCards,
    isLoading: friendsLoading,
    hasError: friendsError,
    errorMessage: friendsErrorMessage,
    refresh: refreshFriends,
  } = useFriendsMemoriesForDay(dateKey);

  function handlePrevDay() {
    void Haptics.selectionAsync();
    setDayDirection(-1);
    router.setParams({ date: prevDateKey });
  }

  function handleNextDay() {
    if (isToday) return;
    void Haptics.selectionAsync();
    setDayDirection(1);
    router.setParams({ date: nextDateKey });
  }

  const dayGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-12, 12])
    .onEnd((event) => {
      if (event.translationX > 60) runOnJS(handlePrevDay)();
      else if (event.translationX < -60 && !isToday) runOnJS(handleNextDay)();
    });
  const adjacentLabel = (key: string) => parseLocalDateKey(key).toLocaleDateString(i18n.language, { month: "short", day: "numeric" });

  const title = parseLocalDateKey(dateKey).toLocaleDateString(i18n.language, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const weekday = parseLocalDateKey(dateKey).toLocaleDateString(i18n.language, {
    weekday: "long",
  });

  const mineLabel = t("memories.mineTab", { count: mineMemories.length });
  const friendsLabel = friendsLoading
    ? t("memories.friendsTabLoading")
    : t("memories.friendsTab", { count: friendCards.length });

  const activeCount = layer === "mine" ? mineMemories.length : friendCards.length;
  const memoryCountLabel = t("memories.daySavedCount", {
    count: activeCount,
  });

  function handleToggleFavorite(memory: QuoteMemory) {
    const nextValue = !memory.isFavorite;
    toggleFavorite(memory.id);
    if (!memory.photoId) return;

    void updateUserPhotoFavorite(memory.photoId, nextValue).then((ok) => {
      if (ok) return;
      toggleFavorite(memory.id);
      showToast(t("memories.favoriteSaveError"), "error");
    });
  }

  function handleChangeVisibility(memory: QuoteMemory) {
    if (!memory.photoId || updatingVisibilityId) return;
    const nextVisibility = memory.visibility === "private" ? "friends" : "private";
    setVisibility(memory.id, nextVisibility);
    setUpdatingVisibilityId(memory.id);
    void updateUserPhotoVisibility(memory.photoId, nextVisibility).then((ok) => {
      setUpdatingVisibilityId((current) =>
        current === memory.id ? null : current,
      );
      if (ok) return;
      setVisibility(memory.id, memory.visibility);
      showToast(t("memories.visibilitySaveError"), "error");
    });
  }

  if (!hasHydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-transparent">
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <GestureDetector gesture={dayGesture}>
    <MotiView key={dateKey}
      from={{ translateX: reduceMotion ? 0 : dayDirection * screenWidth }}
      animate={{ translateX: 0 }}
      transition={{ type: "timing", duration: reduceMotion ? 0 : 260 }}
      className="flex-1 bg-transparent" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="border-b border-white/10 bg-transparent px-4 pt-3 pb-5">
        <Pressable
          onPress={() => goBackOrReplace(router, "/memories")}
          className="mb-4 h-10 w-10 items-center justify-center rounded-full bg-white/10"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <View className="mt-0.5 flex-row items-center justify-between">
          <Pressable
            onPress={handlePrevDay}
            accessibilityRole="button"
            className="min-h-11 items-center justify-center rounded-2xl bg-white/5 px-2"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <Ionicons name="chevron-back" size={20} color="#C4B5FD" />
            <Text className="mt-1 text-[10px] text-white/60">{adjacentLabel(prevDateKey)}</Text>
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
            accessibilityRole="button"
            className="min-h-11 items-center justify-center rounded-2xl bg-white/5 px-2"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={isToday ? "rgba(255,255,255,0.2)" : "#fff"}
            />
            <Text className="mt-1 text-[10px] text-white/60">{isToday ? t("memories.todayLabel") : adjacentLabel(nextDateKey)}</Text>
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

      {/* Mount only the selected list so hidden flex siblings cannot consume its viewport. */}
      {layer === "mine" && <ScrollView
        ref={mineScrollRef}
        refreshControl={<RefreshControl refreshing={ownSync.isLoading} onRefresh={ownSync.refresh} tintColor="#C4B5FD" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        style={{ flex: 1 }}>
        {ownSync.isLoading && mineMemories.length === 0 ? (
          <ActivityIndicator style={{ marginTop: 48 }} color="#C4B5FD" />
        ) : mineMemories.length === 0 ? (
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
              {ownSync.hasError ? t("memories.networkError") : t("memories.emptyForDayHint")}
            </Text>
          </View>
        ) : (
          mineMemories.map((memory: QuoteMemory) => (
            <View
              key={`mine-${dateKey}-${memory.id}`}>
              <MemoryCard
                quote={memory.quoteText}
                author={t("memories.meAuthor")}
                photoBackgroundUri={memory.photoBackgroundUri}
                photoStoragePath={memory.photoStoragePath}
                quotePosition={memory.quotePosition}
                isFavorite={memory.isFavorite}
                onToggleFavorite={() => handleToggleFavorite(memory)}
                visibility={memory.visibility}
                onChangeVisibility={() => handleChangeVisibility(memory)}
                isVisibilityUpdating={updatingVisibilityId === memory.id}
                createdAt={memory.createdAt}
                styleFontId={memory.styleFontId as "small" | "medium" | "large"}
                styleColorSchemeId={memory.styleColorSchemeId as "light" | "amber" | "pink"}
              />
            </View>
          ))
        )}
        {pastYearMemories.length > 0 && (
          <View className="mt-8">
            <View className="mb-3 flex-row items-center gap-2">
              <Ionicons name="time-outline" size={15} color="rgba(255,255,255,0.5)" />
              <Text className="text-xs font-semibold uppercase tracking-wider text-white/50">
                {t("memories.pastYearsTitle")}
              </Text>
            </View>
            {pastYearMemories.map((memory: QuoteMemory) => (
              <View
                key={`pastyear-${dateKey}-${memory.id}`}>
                <MemoryCard
                  quote={memory.quoteText}
                  author={t("memories.meAuthor")}
                photoBackgroundUri={memory.photoBackgroundUri}
                photoStoragePath={memory.photoStoragePath}
                  quotePosition={memory.quotePosition}
                  isFavorite={memory.isFavorite}
                  createdAt={memory.createdAt}
                  styleFontId={memory.styleFontId as "small" | "medium" | "large"}
                  styleColorSchemeId={memory.styleColorSchemeId as "light" | "amber" | "pink"}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>}

      {layer === "friends" && <ScrollView
        ref={friendScrollRef}
        refreshControl={<RefreshControl refreshing={friendsLoading} onRefresh={refreshFriends} tintColor="#C4B5FD" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        style={{ flex: 1 }}>
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
              {friendsErrorMessage ?? t("memories.friendsLoadError")}
            </Text>
            <Pressable
              onPress={refreshFriends}
              className="mt-5 rounded-xl bg-white/15 px-6 py-3"
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
              <Text className="text-sm font-semibold text-white">
                {t("memories.retryButton")}
              </Text>
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
          friendCards.map((card) => (
            <View
              key={`friend-${dateKey}-${card.id}`}>
              <MemoryCard
                quote={card.quote}
                author={card.authorDisplayName}
                photoBackgroundUri={card.imageUrl}
                photoStoragePath={card.storagePath}
                quotePosition={card.quotePosition}
                isFavorite={false}
                createdAt={card.createdAt}
                styleFontId={card.styleFontId}
                styleColorSchemeId={card.styleColorSchemeId}
              />
            </View>
          ))
        )}
      </ScrollView>}
    </MotiView>
    </GestureDetector>
  );
}
