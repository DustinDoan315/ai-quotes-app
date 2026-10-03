import { APP_BRAND_MARK } from "@/theme/appBrand";
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { HomeBackgroundPalette } from '@/types/homeBackground';
import { HOME_AMBIENT_CHROME as C, HOME_AMBIENT_LAYOUT as L } from '@/theme/homeAmbient';

export function HomeAmbientHeader({ palette, avatarUrl, onProfile, onMenu }: {
  palette: HomeBackgroundPalette; avatarUrl: string | null; onProfile: () => void; onMenu: () => void;
}) {
  const { t } = useTranslation();
  return <View style={styles.row}>
    <Pressable onPress={onProfile} accessibilityRole="button" accessibilityLabel={t('home.ambient.profile')} style={styles.avatarButton}>
      {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatar} /> : <Ionicons name="person-circle-outline" size={42} color={C.text} />}
    </Pressable>
    <Pressable onPress={onMenu} accessibilityRole="button" accessibilityLabel={t('home.ambient.menu')} style={styles.brand}>
      <Text numberOfLines={1} maxFontSizeMultiplier={1.3} style={styles.wordmark}>{APP_BRAND_MARK}</Text>
      <Ionicons name="chevron-down" size={13} color={C.muted} />
    </Pressable>
    <View style={styles.pillSlot}><View style={styles.pill} accessible accessibilityLabel={t(`home.vibes.${palette.vibeKey}`)}>
      <View style={styles.swatches}>{palette.colors.slice(0, 3).map((color, index) => <View key={index} style={[styles.swatch, { backgroundColor: color }]} />)}</View>
      <Text numberOfLines={1} maxFontSizeMultiplier={1.3} style={styles.vibe}>{t(`home.vibes.${palette.vibeKey}`)}</Text>
    </View></View>
  </View>;
}
const styles = StyleSheet.create({
  row: { minHeight: L.headerMinHeight, paddingHorizontal: L.horizontalGutter, flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatarButton: { flex: 1, minWidth: L.hitArea, minHeight: L.hitArea, justifyContent: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  brand: { flex: 1, minHeight: L.hitArea, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  wordmark: { color: C.text, fontSize: 32, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', flexShrink: 1 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 24, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, maxWidth: '100%' },
  pillSlot: { flex: 1, alignItems: 'flex-end' },
  swatches: { flexDirection: 'row' }, swatch: { width: 11, height: 11, borderRadius: 6, marginRight: -1 },
  vibe: { color: C.text, fontSize: 12, flexShrink: 1 },
});
