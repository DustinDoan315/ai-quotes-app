import { shareQuote } from "@/features/share/shareQuote";
import { useQuoteStore } from "@/appState/quoteStore";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, Text } from "react-native";

interface ShareQuoteButtonProps {
  quoteText: string | null;
}

export function ShareQuoteButton({ quoteText }: ShareQuoteButtonProps) {
  const { t } = useTranslation();
  const quoteId = useQuoteStore((s) => s.dailyQuote?.id ?? "");

  if (!quoteText) return null;

  return (
    <Pressable
      onPress={() => shareQuote(quoteText, quoteId)}
      className="flex-row items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2"
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <Ionicons name="share-outline" size={15} color="rgba(255,255,255,0.85)" />
      <Text className="text-sm font-medium text-white/85">{t("share.shareButton")}</Text>
    </Pressable>
  );
}
