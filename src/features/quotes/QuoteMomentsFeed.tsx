import { Image } from "expo-image";
import { QuotePhotoCard } from "@/services/media/userPhotosApi";
import { LayoutChangeEvent, Pressable, Text, View } from "react-native";

type Props = {
  items: QuotePhotoCard[];
  screenHeight: number;
  onFeedLayoutYChange: (y: number) => void;
  authorName: string;
  authorAvatarUrl: string | null;
  currentUserId: string | null;
  currentGuestId: string | null;
  onReact: (photoId: string, type: "love" | "clap" | "fire") => void;
};

export const QuoteMomentsFeed = ({
  items,
  screenHeight,
  onFeedLayoutYChange,
  authorName,
  authorAvatarUrl,
  currentUserId,
  currentGuestId,
  onReact,
}: Props) => {
  function handleLayout(event: LayoutChangeEvent) {
    onFeedLayoutYChange(event.nativeEvent.layout.y);
  }

  return (
    <View className="px-4" onLayout={handleLayout}>
      {items.length === 0 ? (
        <View className="py-8">
          <Text className="mb-2 text-xs font-medium text-white/70">
            Your moments feed
          </Text>
          <Text className="text-xs text-white/60">
            Save a photo with a quote to see it here.
          </Text>
        </View>
      ) : (
        <>
          {items.map((item) => {
            const isOwn =
              item.userId === currentUserId || item.guestId === currentGuestId;
            return (
              <View
                key={item.id}
                style={{ height: screenHeight }}
                className="items-center justify-center py-6">
                <View className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-lg shadow-black/40">
                  <View style={{ aspectRatio: 3 / 4 }} className="relative">
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                    <View className="absolute inset-x-0 bottom-0 bg-black/65 px-5 py-4">
                      <View className="mb-3 flex-row items-center">
                        <View className="h-8 w-8 overflow-hidden rounded-full bg-white/10">
                          {authorAvatarUrl ? (
                            <Image
                              source={{ uri: authorAvatarUrl }}
                              style={{ width: "100%", height: "100%" }}
                              contentFit="cover"
                            />
                          ) : (
                            <View className="h-full w-full items-center justify-center">
                              <Text className="text-xs font-semibold text-white/80">
                                {authorName.trim().slice(0, 1).toUpperCase()}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text
                          className="ml-2 flex-1 text-xs font-semibold text-white/90"
                          numberOfLines={1}
                        >
                          {authorName}
                        </Text>
                      </View>
                      <Text
                        className="mb-3 text-sm font-semibold leading-snug text-white"
                        numberOfLines={4}
                      >
                        {item.quote}
                      </Text>
                      <View className="flex-row items-center justify-end gap-3">
                          <Pressable
                            onPress={() => onReact(item.id, "love")}
                            className="rounded-full bg-white/10 px-3 py-1">
                            <Text className="text-sm">❤️</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => onReact(item.id, "clap")}
                            className="rounded-full bg-white/10 px-3 py-1">
                            <Text className="text-sm">👏</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => onReact(item.id, "fire")}
                            className="rounded-full bg-white/10 px-3 py-1">
                            <Text className="text-sm">🔥</Text>
                          </Pressable>
                        {isOwn && (
                          <Text className="ml-1 text-[10px] text-white/60">
                            Dev: reacting to your own moment
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </>
      )}
    </View>
  );
};

