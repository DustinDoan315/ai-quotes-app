import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";

import type { RewriteTone } from "@/services/ai/types";
import type { HomeAiTool } from "@/features/home/useHomeAiReview";
import type { ComponentProps } from "react";

type Props = {
  selectedAiTool: HomeAiTool | null;
  pendingAiTool: HomeAiTool | null;
  aiToolsLoading: boolean;
  onRewriteQuote: (tone: RewriteTone) => void;
  onFutureQuotePress: () => void;
};

const tones: RewriteTone[] = ["calm", "funny", "savage"];

const shadowStrong =
  Platform.OS === "ios"
    ? {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
      }
    : { elevation: 4 };

const shadowSoft =
  Platform.OS === "ios"
    ? {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.22,
        shadowRadius: 4,
      }
    : { elevation: 3 };

const T = {
  amber500: "#F59E0B",
  amber600: "#D97706",
  amber200: "#FDE68A",
  zinc900: "#18181B",
  zinc800: "#27272A",
  slate50: "#F8FAFC",
  slate300: "#CBD5E1",
} as const;

const baseButton = {
  borderRadius: 18,
  paddingVertical: 14,
  paddingHorizontal: 34,
  minHeight: 56,
  minWidth: 148,
  justifyContent: "center" as const,
  alignItems: "center" as const,
  overflow: "hidden" as const,
};

function chipAppearance(isActive: boolean, isPending: boolean) {
  if (isActive) {
    return {
      wrap: {
        ...baseButton,
        ...shadowStrong,
        backgroundColor: T.amber500,
        borderWidth: 1,
        borderColor: T.amber200,
      },
      highlight: T.amber500,
      fg: T.slate50,
      iconBg: T.amber600,
    };
  }
  if (isPending) {
    return {
      wrap: {
        ...baseButton,
        ...shadowSoft,
        backgroundColor: "rgba(245,158,11,0.08)",
        borderWidth: 2,
        borderColor: T.amber600,
      },
      highlight: "rgba(245,158,11,0.12)",
      fg: T.slate50,
      iconBg: "rgba(245,158,11,0.16)",
    };
  }
  return {
    wrap: {
      ...baseButton,
      ...shadowSoft,
      backgroundColor: T.zinc900,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.12)",
    },
    highlight: "rgba(255,255,255,0.03)",
    fg: T.slate50,
    iconBg: "rgba(255,255,255,0.08)",
  };
}

function toneIcon(tone: RewriteTone) {
  if (tone === "calm") {
    return "leaf-outline" as const;
  }
  if (tone === "funny") {
    return "happy-outline" as const;
  }
  return "flame-outline" as const;
}

interface AiToolButtonProps {
  isActive: boolean;
  isPending: boolean;
  loading: boolean;
  onPress: () => void;
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
}

function AiToolButton({
  isActive,
  isPending,
  loading,
  onPress,
  icon,
  label,
}: AiToolButtonProps) {
  const a = chipAppearance(isActive, isPending);
  return (
    <Pressable
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => ({
        ...a.wrap,
        opacity: pressed || isPending ? 0.9 : 1,
      })}>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "100%",
          backgroundColor: a.highlight,
          borderRadius: 18,
        }}
      />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingEnd: 12,
        }}>
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: a.iconBg,
          }}>
          <Ionicons name={icon} size={17} color={a.fg} />
        </View>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "700",
            letterSpacing: 0.15,
            color: a.fg,
          }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export function AiToolsRow({
  selectedAiTool,
  pendingAiTool,
  aiToolsLoading,
  onRewriteQuote,
  onFutureQuotePress,
}: Props) {
  const { t } = useTranslation();
  return (
    <View className="w-full">
      <View className="mb-5 flex-row items-center gap-3 px-1">
        <Ionicons name="sparkles-outline" size={18} color={T.amber500} />
        <Text
          className="text-[12px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: "rgba(248,250,252,0.45)" }}>
          {t("home.aiTools.title")}
        </Text>
      </View>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          alignItems: "center",
          gap: 16,
          paddingVertical: 10,
          paddingHorizontal: 4,
          paddingRight: 20,
        }}
        style={{ width: "100%" }}>
        <AiToolButton
          isActive={selectedAiTool === "future"}
          isPending={pendingAiTool === "future"}
          loading={aiToolsLoading}
          onPress={onFutureQuotePress}
          icon="arrow-forward-circle-outline"
          label={t("home.aiTools.future")}
        />
        {tones.map((tone) => {
          const isActive = selectedAiTool === tone;
          const isPending = pendingAiTool === tone;
          return (
            <AiToolButton
              key={tone}
              isActive={isActive}
              isPending={isPending}
              loading={aiToolsLoading}
              onPress={() => onRewriteQuote(tone)}
              icon={toneIcon(tone)}
              label={
                tone === "calm"
                  ? t("home.aiTools.calm")
                  : tone === "funny"
                    ? t("home.aiTools.funny")
                    : t("home.aiTools.savage")
              }
            />
          );
        })}
      </ScrollView>
    </View>
  );
}
