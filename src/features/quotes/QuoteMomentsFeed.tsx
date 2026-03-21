import { QuoteMomentCard } from "@/features/quotes/QuoteMomentCard";
import { QuotePhotoCard } from "@/services/media/userPhotosApi";
import { LayoutChangeEvent, Text, View } from "react-native";

type Props = {
  items: QuotePhotoCard[];
  screenHeight: number;
  onFeedLayoutYChange: (y: number) => void;
  authorName: string;
  authorAvatarUrl: string | null;
};

export const QuoteMomentsFeed = ({
  items,
  screenHeight,
  onFeedLayoutYChange,
  authorName,
  authorAvatarUrl,
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
