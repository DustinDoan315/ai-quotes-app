import { QuoteMomentCard } from "@/features/quotes/QuoteMomentCard";
import { QuotePhotoCard } from "@/services/media/userPhotosApi";
import { LayoutChangeEvent, View } from "react-native";

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

  if (items.length === 0) return null;

  return (
    <View className="px-4" onLayout={handleLayout}>
      {items.map((item) => (
        <QuoteMomentCard
          key={item.id}
          item={item}
          screenHeight={screenHeight}
          authorName={authorName}
          authorAvatarUrl={authorAvatarUrl}
        />
      ))}
    </View>
  );
};
