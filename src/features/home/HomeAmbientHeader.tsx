import { APP_BRAND_MARK } from "@/theme/appBrand";
import { Image, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { HomeBackgroundPalette } from '@/types/homeBackground';
import { getHomeAmbientPillColors, HOME_AMBIENT_CHROME as C, HOME_AMBIENT_LAYOUT as L } from '@/theme/homeAmbient';

export function HomeAmbientHeader({ palette, avatarUrl, onProfile, onMenu, onBack, disabled = false }: {
  palette: HomeBackgroundPalette; avatarUrl: string | null; onProfile: () => void; onMenu: () => void; onBack?: () => void; disabled?: boolean;
}) {
  const { t } = useTranslation();
  const pillColors = getHomeAmbientPillColors(palette);
  const { width, fontScale } = useWindowDimensions();
  const stackedPill = width < 360 || fontScale > 1.2;
  const vibePill = <View style={[styles.pill, { backgroundColor: pillColors.background, borderColor: pillColors.border }]} accessible accessibilityLabel={t(`home.vibes.${palette.vibeKey}`)}>
    <View style={styles.swatches}>{palette.colors.slice(0, 3).map((color, index) => <View key={index} style={[styles.swatch, { backgroundColor: color }]} />)}</View>
    <Text numberOfLines={stackedPill ? undefined : 1} maxFontSizeMultiplier={stackedPill ? undefined : 1.3} style={styles.vibe}>{t(`home.vibes.${palette.vibeKey}`)}</Text>
  </View>;
  return <View style={styles.header}>
    <View style={styles.row}>
      <View style={styles.sideSlot}>
        <Pressable onPress={onBack ?? onProfile} disabled={disabled} accessibilityRole="button" accessibilityLabel={t(onBack ? 'home.ambient.backToCamera' : 'home.ambient.profile')} style={[styles.avatarButton, disabled && styles.disabled]}>
          {onBack ? <Ionicons name="chevron-back" size={28} color={C.text} /> : avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatar} /> : <Ionicons name="person-circle-outline" size={42} color={C.text} />}
        </Pressable>
      </View>
      <Pressable onPress={onMenu} disabled={disabled} accessibilityRole="button" accessibilityLabel={t('home.ambient.menu')} style={[styles.brand, disabled && styles.disabled]}>
        <Text numberOfLines={1} maxFontSizeMultiplier={1.3} style={styles.wordmark}>{APP_BRAND_MARK}</Text>
        <Ionicons name="chevron-down" size={13} color={C.muted} />
      </Pressable>
      <View style={styles.sideSlot}>{!stackedPill && <View style={styles.pillSlot}>{vibePill}</View>}</View>
    </View>
    {stackedPill && <View style={styles.stackedPillSlot}>{vibePill}</View>}
  </View>;
}
const styles = StyleSheet.create({
  disabled: { opacity: C.disabledOpacity },
  header: { paddingHorizontal: L.horizontalGutter },
  row: { minHeight: L.headerMinHeight, flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatarButton: { width: L.hitArea, minWidth: L.hitArea, minHeight: L.hitArea, justifyContent: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  sideSlot: { flex: 1, minWidth: L.hitArea },
  stackedPillSlot: { alignItems: 'center', paddingBottom: 8 },
  brand: { minHeight: L.hitArea, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  wordmark: { color: C.text, fontSize: 32, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', flexShrink: 1 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 24, borderWidth: 1.25, maxWidth: '100%' },
  pillSlot: { maxWidth: '100%', alignItems: 'flex-end' },
  swatches: { flexDirection: 'row' }, swatch: { width: 12, height: 12, borderRadius: 6, marginRight: -2, borderWidth: 1, borderColor: C.swatchBorder },
  vibe: { color: C.text, fontSize: 12, fontWeight: '600', flexShrink: 1 },
});
