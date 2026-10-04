import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MotiView } from "moti";
import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";
import type { HomeBackgroundPalette } from "@/types/homeBackground";
import { getHomeAmbientPillColors, HOME_AMBIENT_CHROME as C } from "@/theme/homeAmbient";

type Props = {
  palette?: HomeBackgroundPalette;
  minHeight?: number;
  onRewrite: () => void; onSave: () => void; onShare: () => void;
  disabled: boolean; canRewrite: boolean; canSave: boolean; canShare: boolean;
  hasSavedPhoto: boolean; loading: boolean; isSaving: boolean; isSharing: boolean;
};
export function HomeDraftActions(p: Props) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotionPreference();
  const colors = p.palette ? getHomeAmbientPillColors(p.palette) : { background: "#111b18", border: C.border };
  const action = (type: "rewrite" | "save" | "share", enabled: boolean, callback: () => void, icon: "sparkles-outline" | "checkmark" | "share-outline", label: string) => <Pressable
    accessibilityRole="button" accessibilityLabel={label}
    accessibilityState={{ disabled: p.disabled || !enabled, busy: type === "save" ? p.isSaving : type === "share" ? p.isSharing : p.loading }}
    disabled={p.disabled || !enabled} onPress={callback}
    style={[styles.button, type === "save" && styles.save, { opacity: p.disabled || !enabled ? 0.55 : 1 }]}>
    <Ionicons name={icon} size={22} color={type === "save" ? "#171329" : C.text} />
    <Text style={[styles.label, type === "save" && styles.saveLabel]}>{label}</Text>
  </Pressable>;
  return <View style={[styles.container, { backgroundColor: colors.background, borderColor: colors.border, minHeight: Math.max(112, p.minHeight ?? 112) }]}>
    <MotiView key={p.loading ? "loading" : "actions"} from={{ opacity: reduceMotion ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ type: "timing", duration: reduceMotion ? 0 : 220 }} style={styles.row}>
    {p.loading ? <Text accessibilityLiveRegion="polite" style={styles.status}>{t("home.generating.findingWords")}</Text> : <>
      {action("rewrite", p.canRewrite, p.onRewrite, "sparkles-outline", t("home.aiTools.rewriteAction"))}
      {action("save", p.canSave && !p.hasSavedPhoto, p.onSave, "checkmark", t(p.hasSavedPhoto ? "home.ambient.saved" : "home.ambient.save"))}
      {action("share", p.canShare, p.onShare, "share-outline", t("home.generating.shareAction"))}
    </>}
    </MotiView>
  </View>;
}
const styles = StyleSheet.create({
  container: { marginHorizontal: 20, borderRadius: 32, borderWidth: 1, minHeight: 112, padding: 12 },
  row: { minHeight: 86, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  button: { flex: 1, minWidth: 0, minHeight: 64, paddingVertical: 10, paddingHorizontal: 4, borderRadius: 24, alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "transparent" },
  save: { backgroundColor: C.text, borderColor: C.text },
  label: { color: C.text, fontSize: 13, fontWeight: "600", textAlign: "center", flexShrink: 1 },
  saveLabel: { color: "#171329", fontWeight: "700" },
  status: { color: C.muted, fontSize: 13, textAlign: "center", paddingHorizontal: 16 },
});
