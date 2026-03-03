import { Text, View } from "react-native";

interface QuoteCardProps {
  text: string;
}

export function QuoteCard({ text }: QuoteCardProps) {
  return (
    <View className="mb-4 max-w-md rounded-2xl bg-black/60 p-3 mx-4">
      <Text className="text-center text-sm font-semibold text-white">
        {text}
      </Text>
    </View>
  );
}
