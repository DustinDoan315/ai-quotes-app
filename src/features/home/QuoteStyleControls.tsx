import { Pressable, Text, View } from "react-native";

export type QuoteFontSize = "small" | "medium" | "large";
export type QuoteColor = "light" | "amber" | "pink";

const PANEL_HIGHLIGHT = "#FBBF24";

const FONT_CONTROLS: { key: QuoteFontSize; label: string; fontSize: number }[] = [
  { key: "small", label: "A", fontSize: 13 },
  { key: "medium", label: "A", fontSize: 16 },
  { key: "large", label: "A", fontSize: 19 },
];

const COLOR_CONTROLS: { key: QuoteColor; fill: string; ring: string }[] = [
  { key: "light", fill: "#FFFFFF", ring: "#F8FAFC" },
  { key: "amber", fill: "#FBBF24", ring: "#FBBF24" },
  { key: "pink", fill: "#F9A8D4", ring: "#F9A8D4" },
];

type Props = {
  quoteFontSize: QuoteFontSize;
  quoteColorScheme: QuoteColor;
  onChangeQuoteFontSize: (size: QuoteFontSize) => void;
  onChangeQuoteColorScheme: (color: QuoteColor) => void;
};

export function QuoteStyleControls({
  quoteFontSize,
  quoteColorScheme,
  onChangeQuoteFontSize,
  onChangeQuoteColorScheme,
}: Props) {
  return (
    <View
      className="rounded-[20px] px-2 py-2"
      style={{
        backgroundColor: "rgba(12,14,20,0.62)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
      }}>
      <View className="flex-row items-start gap-2">
        {/* Size controls */}
        <View
          className="w-[42%] rounded-[16px] px-2 py-1.5"
          style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
          <Text className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
            Size
          </Text>
          <View className="flex-row items-center gap-2">
            {FONT_CONTROLS.map((control) => {
              const isActive = quoteFontSize === control.key;
              return (
                <Pressable
                  key={control.key}
                  onPress={() => onChangeQuoteFontSize(control.key)}
                  className="h-8 min-w-[42px] flex-1 items-center justify-center rounded-2xl"
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.88 : 1,
                    backgroundColor: isActive
                      ? "rgba(251,191,36,0.10)"
                      : "rgba(255,255,255,0.025)",
                    borderWidth: isActive ? 1.5 : 1,
                    borderColor: isActive
                      ? "rgba(251,191,36,0.68)"
                      : "rgba(255,255,255,0.045)",
                  })}>
                  <Text
                    className="font-bold"
                    style={{
                      fontSize: control.fontSize,
                      color: isActive ? PANEL_HIGHLIGHT : "rgba(255,255,255,0.82)",
                    }}>
                    {control.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Color controls */}
        <View
          className="flex-1 rounded-[16px] px-2 py-1.5"
          style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
          <Text className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
            Color
          </Text>
          <View className="flex-row items-center justify-center gap-2.5">
            {COLOR_CONTROLS.map((control) => {
              const isActive = quoteColorScheme === control.key;
              return (
                <Pressable
                  key={control.key}
                  onPress={() => onChangeQuoteColorScheme(control.key)}
                  className="h-10 w-10 items-center justify-center rounded-2xl"
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.88 : 1,
                    backgroundColor: isActive
                      ? "rgba(255,255,255,0.18)"
                      : "rgba(255,255,255,0.025)",
                    borderWidth: isActive ? 2.5 : 1,
                    borderColor: isActive
                      ? control.ring
                      : "rgba(255,255,255,0.045)",
                  })}>
                  <View
                    style={{
                      width: isActive ? 20 : 18,
                      height: isActive ? 20 : 18,
                      borderRadius: 10,
                      backgroundColor: control.fill,
                      borderWidth: control.key === "light" ? 1 : 0,
                      borderColor: "rgba(15,23,42,0.18)",
                    }}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}
