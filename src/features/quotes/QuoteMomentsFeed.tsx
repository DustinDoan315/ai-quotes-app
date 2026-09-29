import { QuoteMomentCard } from "@/features/quotes/QuoteMomentCard";
import { QuotePhotoCard } from "@/services/media/userPhotosApi";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  function handleLayout(event: LayoutChangeEvent) {
    onFeedLayoutYChange(event.nativeEvent.layout.y);
  }

  if (items.length === 0) {
    return (
      <View
        style={{ height: screenHeight }}
        className="justify-center px-6"
        onLayout={handleLayout}
      >
        <View className="rounded-3xl border border-white/15 bg-black/30 px-6 py-8">
          <Text className="text-center text-xl font-semibold text-white">
            {t("home.momentsFeed.emptyTitle")}
          </Text>
          <Text className="mt-3 text-center text-sm leading-6 text-white/85">
            {t("home.momentsFeed.emptyBody")}
          </Text>
          <Text className="mt-4 text-center text-sm leading-6 text-white/75">
            {t("home.momentsFeed.emptyHint")}
          </Text>
        </View>
      </View>
    );
  }

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
