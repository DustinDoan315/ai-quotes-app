import { QuoteMomentCard } from "@/features/quotes/QuoteMomentCard";
import { QuotePhotoCard } from "@/services/media/userPhotosApi";
import { Ionicons } from "@expo/vector-icons";
import { LayoutChangeEvent, Pressable, Text, View } from "react-native";

type Props = {
  items: QuotePhotoCard[];
  screenHeight: number;
  onFeedLayoutYChange: (y: number) => void;
  authorName: string;
  authorAvatarUrl: string | null;
  onGeneratePress?: () => void;
};

export const QuoteMomentsFeed = ({
  items,
  screenHeight,
  onFeedLayoutYChange,
  authorName,
  authorAvatarUrl,
  onGeneratePress,
}: Props) => {
  function handleLayout(event: LayoutChangeEvent) {
    onFeedLayoutYChange(event.nativeEvent.layout.y);
  }

  return (
    <View className="px-4" onLayout={handleLayout}>
      {items.length === 0 ? (
        <View className="mt-4 items-center rounded-2xl border border-white/10 bg-white/5 px-6 py-10">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
            <Ionicons name="camera-outline" size={32} color="rgba(255,255,255,0.7)" />
          </View>
          <Text className="text-center text-base font-semibold text-white/90">
            Your moments feed
          </Text>
          <Text className="mt-1 text-center text-sm text-white/50">
            Capture a photo with today's quote to see it here.
          </Text>
          {onGeneratePress ? (
            <Pressable
              onPress={onGeneratePress}
              className="mt-5 flex-row items-center rounded-xl bg-white px-5 py-3"
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
              <Ionicons name="sparkles-outline" size={16} color="#000" />
              <Text className="ml-2 text-sm font-semibold text-black">
                Generate my first quote
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <>
          {items.map((item) => (
            <QuoteMomentCard
              key={item.id}
              item={item}
              screenHeight={screenHeight}
              authorName={authorName}
              authorAvatarUrl={authorAvatarUrl}
            />
          ))}
        </>
      )}
    </View>
  );
};
