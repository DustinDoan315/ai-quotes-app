import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { QuotePhotoCard } from "@/services/media/userPhotosApi";
import { LayoutChangeEvent, Text, View } from "react-native";

type Props = {
  items: QuotePhotoCard[];
  screenHeight: number;
  onFeedLayoutYChange: (y: number) => void;
};

export const QuoteMomentsFeed = ({
  items,
  screenHeight,
  onFeedLayoutYChange,
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
            <View
              key={item.id}
              style={{ height: screenHeight }}
              className="items-center justify-center py-8">
              <View className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-lg shadow-black/40">
                <View style={{ aspectRatio: 3 / 4 }} className="relative">
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                  <View className="absolute inset-x-0 bottom-0 bg-black/60 px-4 py-3">
                    <View className="mb-1 flex-row items-center">
                      <Ionicons
                        name="sparkles-outline"
                        size={14}
                        color="#FFCC00"
                      />
                      <Text className="ml-1 text-[10px] font-semibold text-white/70">
                        Shared moment
                      </Text>
                    </View>
                    <Text
                      className="text-xs font-medium text-white"
                      numberOfLines={3}
                    >
                      {item.quote}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </>
      )}
    </View>
  );
};

