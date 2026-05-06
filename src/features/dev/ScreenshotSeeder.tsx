import { useMemoryStore } from "@/appState/memoryStore";
import { useStreakStore } from "@/appState/streakStore";
import type { QuoteMemory } from "@/types/memory";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

// Stable Unsplash photo URLs for calendar thumbnails
const THUMB_PHOTOS = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400", // mountain
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400", // forest
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400", // green hills
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400", // lake
  "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=400", // waterfall
  "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=400", // misty lake
  "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=400", // orange flowers
];

const QUOTES = [
  "The most powerful version of you shows up every single day.",
  "Patience unwraps the sweetest rewards; stay calm and trust the process.",
  "Every moment of stillness is a gift you give to your future self.",
  "Be grateful for every peaceful second, for there your soul finds strength.",
  "The river flows without stopping — your will can do the same.",
  "Small steps taken daily build mountains over time.",
  "Your vibe today shapes the story you tell tomorrow.",
  "Breathe in possibility. Breathe out everything that holds you back.",
  "The quieter you become, the more clearly you can hear your purpose.",
  "Growth is not loud. It is the silent work of showing up.",
  "Let your morning set the tone for the world you want to live in.",
  "You don't have to be fearless — just move forward anyway.",
  "The best thing you can do for yourself today is believe in tomorrow.",
  "Resilience is not about never falling. It's about rising differently.",
  "Your light doesn't dim by shining brighter for others.",
];

function buildSeedMemories(): QuoteMemory[] {
  const today = new Date(2026, 3, 21); // April 21, 2026 (month is 0-indexed)
  const memories: QuoteMemory[] = [];

  for (let i = 0; i < 15; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - (14 - i)); // day 0 = April 7, day 14 = April 21

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateKey = `${year}-${month}-${day}`;

    const hasPhoto = i % 2 === 0; // every other day has a thumbnail
    const isFavorite = i === 2 || i === 7 || i === 12; // 3 favorites

    memories.push({
      id: `seed-${dateKey}-${i}`,
      ownerUserId: null,
      ownerGuestId: "seed-guest",
      date: dateKey,
      quoteText: QUOTES[i % QUOTES.length],
      author: null,
      personaId: "calm",
      photoBackgroundUri: hasPhoto ? THUMB_PHOTOS[i % THUMB_PHOTOS.length] : null,
      photoOrientation: "portrait",
      styleFontId: "medium",
      styleColorSchemeId: "light",
      createdAt: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0, 0).toISOString(),
      visibility: "private",
      isFavorite,
    });
  }

  return memories;
}

export function ScreenshotSeeder() {
  const [seeded, setSeeded] = useState(false);
  const addMemory = useMemoryStore((s) => s.addMemory);
  const memoriesCount = useMemoryStore((s) => s.memories.length);

  function handleSeed() {
    Alert.alert(
      "Seed Screenshot Data",
      "This will add 15 days of memories + set a 15-day streak. Existing memories are kept.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Seed",
          onPress: () => {
            const memories = buildSeedMemories();
            memories.forEach((m) => addMemory(m));

            // Set streak directly on the store state
            useStreakStore.setState({
              currentStreak: 15,
              longestStreak: 15,
              lastQuoteDate: "2026-04-21",
            });

            setSeeded(true);
          },
        },
      ],
    );
  }

  function handleClear() {
    Alert.alert(
      "Clear Seed Data",
      "Remove all seeded memories and reset the streak?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            useMemoryStore.setState((s) => ({
              memories: s.memories.filter((m) => !m.id.startsWith("seed-")),
            }));
            useStreakStore.setState({
              currentStreak: 0,
              longestStreak: 0,
              lastQuoteDate: null,
            });
            setSeeded(false);
          },
        },
      ],
    );
  }

  return (
    <View className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-4">
      <Text className="mb-1 text-xs font-bold uppercase tracking-wider text-amber-400">
        Dev · Screenshot Seeder
      </Text>
      <Text className="mb-3 text-xs text-white/50">
        {memoriesCount} memories in store
      </Text>
      <View className="flex-row gap-3">
        <Pressable
          onPress={handleSeed}
          className="flex-1 items-center rounded-xl bg-amber-500 py-2.5"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <Text className="text-sm font-bold text-black">
            {seeded ? "Seed Again" : "Seed 15 Days"}
          </Text>
        </Pressable>
        <Pressable
          onPress={handleClear}
          className="flex-1 items-center rounded-xl border border-white/20 bg-white/5 py-2.5"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <Text className="text-sm font-semibold text-white/70">Clear Seeds</Text>
        </Pressable>
      </View>
    </View>
  );
}
