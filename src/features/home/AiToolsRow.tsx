import type { ComponentProps } from "react";
import type { RewriteTone } from "@/services/ai/types";
import { strings } from "@/theme/strings";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, View, Platform } from "react-native";

type ActiveAiTool = RewriteTone;

type Props = {
  selectedAiTool: ActiveAiTool | null;
  pendingAiTool: ActiveAiTool | null;
  aiToolsLoading: boolean;
  onRewriteQuote: (tone: RewriteTone) => void;
};

const tones: RewriteTone[] = ["calm", "funny", "savage"];

const shadowStrong =
  Platform.OS === "ios"
    ? {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      }
    : { elevation: 8 };

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
  amber700: "#B45309",
  amber900: "#78350F",
  slate50: "#F8FAFC",
  slate300: "#CBD5E1",
  stone900: "#1C1917",
} as const;

const baseButton = {
  borderRadius: 16,
  paddingVertical: 14,
  paddingHorizontal: 18,
  minHeight: 56,
  justifyContent: "center" as const,
  alignItems: "center" as const,
};

function chipAppearance(isActive: boolean, isPending: boolean) {
  if (isActive) {
    return {
      wrap: {
        ...baseButton,
        ...shadowStrong,
        backgroundColor: T.amber500,
        borderWidth: 3,
        borderColor: T.amber900,
      },
      fg: T.stone900,
    };
  }
  if (isPending) {
    return {
      wrap: {
        ...baseButton,
        ...shadowSoft,
        backgroundColor: "rgba(245,158,11,0.28)",
        borderWidth: 2,
        borderColor: T.amber600,
      },
      fg: T.slate50,
    };
  }
  return {
    wrap: {
      ...baseButton,
      ...shadowSoft,
      backgroundColor: "rgba(15,23,42,0.94)",
      borderWidth: 2,
      borderColor: "rgba(148,163,184,0.5)",
    },
    fg: T.slate300,
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
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Ionicons name={icon} size={22} color={a.fg} />
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
}: Props) {
  return (
    <View className="w-full">
      <View className="mb-5 flex-row items-center gap-3 px-1">
        <Ionicons name="sparkles-outline" size={18} color={T.amber500} />
        <Text
          className="text-[12px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: "rgba(248,250,252,0.45)" }}>
          {strings.home.aiTools.title}
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
                  ? strings.home.aiTools.calm
                  : tone === "funny"
                    ? strings.home.aiTools.funny
                    : strings.home.aiTools.savage
              }
            />
          );
        })}
      </ScrollView>
    </View>
  );
}
