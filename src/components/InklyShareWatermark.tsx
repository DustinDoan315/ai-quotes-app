import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

const logoSource = require("../../assets/images/icon.png");

export function InklyShareWatermark({ visible }: { visible: boolean }) {
  const { t } = useTranslation();

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? "auto" : "no-hide-descendants"}
      style={[styles.watermark, { opacity: visible ? 1 : 0 }]}>
      <Image source={logoSource} style={styles.logo} contentFit="cover" />
      <View style={styles.copy}>
        <Text style={styles.brand} numberOfLines={1}>
          {t("home.momentsFeed.watermarkBrand")}
        </Text>
        <Text style={styles.tagline} numberOfLines={1}>
          {t("home.momentsFeed.watermarkTagline")}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  watermark: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(0,0,0,0.48)",
    maxWidth: "70%",
  },
  logo: { width: 28, height: 28, borderRadius: 8 },
  copy: { flexShrink: 1 },
  brand: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  tagline: { color: "rgba(255,255,255,0.8)", fontSize: 9, marginTop: 1 },
});
