import { Image } from "expo-image";
import { Text, View } from "react-native";

type Props = {
  quote: string;
  author: string | null;
  photoBackgroundUri: string | null;
};

export function MemoryCard({ quote, author, photoBackgroundUri }: Props) {
  return (
    <View className="mx-4 mb-4 overflow-hidden rounded-3xl bg-black/80">
      <View className="aspect-[9/16] w-full max-w-md self-center">
        {photoBackgroundUri ? (
          <Image
            source={{ uri: photoBackgroundUri }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <View className="h-full w-full items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
            <Text className="px-6 text-center text-base font-semibold text-white">
              {quote}
            </Text>
            {author ? (
              <Text className="mt-3 text-center text-xs font-medium text-white/80">
                {author}
              </Text>
            ) : null}
          </View>
        )}
        {photoBackgroundUri ? (
          <View className="absolute inset-x-0 bottom-0 bg-black/55 px-5 pb-6 pt-4">
            <Text className="text-center text-base font-semibold text-white">
              {quote}
            </Text>
            {author ? (
              <Text className="mt-2 text-center text-xs font-medium text-white/85">
                {author}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

