import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { HOME_AMBIENT_CHROME as C } from "@/theme/homeAmbient";

type Props = {
  onRewrite: () => void; onSave: () => void; onShare: () => void;
  disabled: boolean; canRewrite: boolean; canSave: boolean; canShare: boolean;
  hasSavedPhoto: boolean; loading: boolean; isSaving: boolean; isSharing: boolean;
};
export function HomeDraftActions(p: Props) {
  const { t } = useTranslation();
  const action = (type: "rewrite" | "save" | "share", enabled: boolean, callback: () => void, icon: "sparkles-outline" | "checkmark" | "share-outline", label: string) => <Pressable
    accessibilityRole="button" accessibilityLabel={label}
    accessibilityState={{ disabled: p.disabled || !enabled, busy: type === "save" ? p.isSaving : type === "share" ? p.isSharing : p.loading }}
    disabled={p.disabled || !enabled} onPress={callback}
    style={({ pressed }) => [styles.button, type === "save" && styles.save, { opacity: p.disabled || !enabled ? 0.4 : pressed ? 0.75 : 1 }]}>
    <Ionicons name={icon} size={17} color={type === "save" ? "#171329" : C.text} />
    <Text style={[styles.label, type === "save" && styles.saveLabel]}>{label}</Text>
  </Pressable>;
  return <View style={styles.row}>
    {p.loading ? <Text accessibilityLiveRegion="polite" style={styles.status}>{t("home.generating.findingWords")}</Text> : <>
      {action("rewrite", p.canRewrite, p.onRewrite, "sparkles-outline", t("home.aiTools.rewriteAction"))}
      {action("save", p.canSave && !p.hasSavedPhoto, p.onSave, "checkmark", t(p.hasSavedPhoto ? "home.ambient.saved" : "home.ambient.save"))}
      {action("share", p.canShare, p.onShare, "share-outline", t("home.ambient.share"))}
    </>}
  </View>;
}
const styles = StyleSheet.create({
  row: { minHeight: 56, paddingTop: 8, flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 8 },
  button: { minHeight: 44, maxWidth: "100%", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 22, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, flexShrink: 0 },
  save: { backgroundColor: C.text, borderColor: C.text },
  label: { color: C.text, fontSize: 13, fontWeight: "600", textAlign: "center", flexShrink: 1 },
  saveLabel: { color: "#171329", fontWeight: "700" },
  status: { color: C.muted, fontSize: 13, textAlign: "center", paddingHorizontal: 16 },
});
