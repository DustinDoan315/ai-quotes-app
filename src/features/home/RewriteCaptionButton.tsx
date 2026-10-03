import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { HOME_AMBIENT_CHROME } from "@/theme/homeAmbient";

type Props = {
  onRewriteQuote: () => void;
  aiToolsLoading: boolean;
  disabled?: boolean;
};

/** A single optional action keeps the moment itself in focus. */
export function RewriteCaptionButton({ onRewriteQuote, aiToolsLoading, disabled = false }: Props) {
  const { t } = useTranslation();
  const unavailable = aiToolsLoading || disabled;
  return <Pressable
    accessibilityRole="button"
    accessibilityLabel={t("home.aiTools.rewriteAction")}
    accessibilityState={{ disabled: unavailable, busy: aiToolsLoading }}
    disabled={unavailable}
    onPress={onRewriteQuote}
    style={({ pressed }) => [styles.button, { opacity: unavailable ? 0.45 : pressed ? 0.75 : 1 }]}>
    {aiToolsLoading ? <ActivityIndicator size="small" color={HOME_AMBIENT_CHROME.text} /> : <Ionicons name="sparkles-outline" size={16} color={HOME_AMBIENT_CHROME.text} />}
    <Text style={styles.label}>{t("home.aiTools.rewriteAction")}</Text>
  </Pressable>;
}
const styles = StyleSheet.create({
  button: { alignSelf: "center", minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1, borderColor: HOME_AMBIENT_CHROME.border, backgroundColor: HOME_AMBIENT_CHROME.surface },
  label: { color: HOME_AMBIENT_CHROME.text, fontSize: 13, fontWeight: "600" },
});
