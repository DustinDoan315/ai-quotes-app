import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HomeBackground } from "@/features/home/HomeBackground";
import { getHomeBackgroundPaletteByKey } from "@/theme/homeBackgrounds";

export type StylePreference =
  | "dark-minimal"
  | "bold-expressive"
  | "soft-poetic"
  | "clean-bright";

export const STYLE_VIBE_MAP: Record<StylePreference, string> = {
  "dark-minimal": "midnight",
  "bold-expressive": "dawn",
  "soft-poetic": "sage",
  "clean-bright": "indigo",
};

const STYLE_EMOJIS: Record<StylePreference, string> = {
  "dark-minimal": "🌑",
  "bold-expressive": "⚡",
  "soft-poetic": "🌸",
  "clean-bright": "☀️",
};

const STYLE_I18N_KEY: Record<StylePreference, string> = {
  "dark-minimal": "option_darkMinimal",
  "bold-expressive": "option_boldExpressive",
  "soft-poetic": "option_softPoetic",
  "clean-bright": "option_cleanBright",
};

const STYLE_IDS: StylePreference[] = [
  "dark-minimal",
  "bold-expressive",
  "soft-poetic",
  "clean-bright",
];

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

type Props = {
  onContinue: (style: StylePreference) => void;
};

export function StyleStep({ onContinue }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<StylePreference | null>(null);

  return (
    <View
      className="flex-1 px-6"
      style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
      <Text className="mb-2 text-[28px] font-extrabold leading-[34px] text-white">
        {t("onboarding.style.title")}
      </Text>
      <Text className="mb-8 text-base leading-6 text-white/50">
        {t("onboarding.style.subtitle")}
      </Text>

      <View className="flex-1 flex-row flex-wrap gap-4">
        {STYLE_IDS.map((id) => {
          const palette = getHomeBackgroundPaletteByKey(STYLE_VIBE_MAP[id]);
          const isSelected = selected === id;
          const footerTone = palette.colors[palette.colors.length - 1] ?? "#000000";
          return (
            <Pressable
              key={id}
              onPress={() => setSelected(id)}
              className={`h-[140px] flex-1 basis-[45%] overflow-hidden rounded-2xl border ${
                isSelected ? "border-white" : "border-white/15"
              }`}
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
              <HomeBackground palette={palette} />
              {isSelected ? (
                <View className="absolute right-2 top-2 h-6 w-6 items-center justify-center rounded-full bg-white">
                  <Text className="text-[11px] font-bold text-black">✓</Text>
                </View>
              ) : null}
              <View
                className="absolute bottom-0 left-0 right-0 border-t p-3"
                style={{
                  backgroundColor: hexToRgba(footerTone, 0.42),
                  borderTopColor: "rgba(255,255,255,0.16)",
                }}>
                <Text className="text-xs font-semibold text-white">
                  {STYLE_EMOJIS[id]} {t(`onboarding.style.${STYLE_I18N_KEY[id]}`)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View className="pt-6">
        <Pressable
          onPress={() => selected && onContinue(selected)}
          disabled={!selected}
          className={`rounded-2xl py-4 ${selected ? "bg-white" : "bg-white/20"}`}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
          <Text
            className={`text-center text-base font-bold ${
              selected ? "text-black" : "text-white/40"
            }`}>
            {t("onboarding.style.cta")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
