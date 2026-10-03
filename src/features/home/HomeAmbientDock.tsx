import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { HOME_AMBIENT_CHROME as C, HOME_AMBIENT_LAYOUT as L } from '@/theme/homeAmbient';

export type HomeAmbientDockProps = {
  mode: 'capture' | 'feed' | 'draft' | 'busy'; canCapture: boolean; canSave: boolean; busyLabel: string | null;
  onGallery: () => void; onPrimary: () => void; onMemories: () => void;
};
export function HomeAmbientDock(p: HomeAmbientDockProps) {
  const { t } = useTranslation();
  const busy = p.mode === 'busy';
  const disabled = busy || (p.mode === 'draft' ? !p.canSave : !p.canCapture);
  const primaryLabel = busy ? p.busyLabel ?? t('home.ambient.working') : t(`home.ambient.${p.mode === 'draft' ? 'save' : p.mode === 'feed' ? 'returnCamera' : 'capture'}`);
  return <View style={styles.dock}>
    <Pressable onPress={p.onGallery} disabled={busy} accessibilityRole="button" accessibilityLabel={t('home.ambient.gallery')} accessibilityState={{ disabled: busy }} style={[styles.side, busy && styles.disabled]}>
      <Ionicons name="image-outline" size={27} color={C.text} /><Text style={styles.label}>{t('home.ambient.gallery')}</Text>
    </Pressable>
    <View style={styles.center}>
      <Pressable onPress={p.onPrimary} disabled={disabled} accessibilityRole="button" accessibilityLabel={primaryLabel} accessibilityState={{ disabled, busy }} style={[styles.shutter, disabled && styles.disabled]}>
        <View style={styles.inner}>{busy ? <ActivityIndicator color="#171329" /> : p.mode === 'draft' ? <Ionicons name="checkmark" size={32} color="#171329" /> : null}</View>
      </Pressable>
      {busy || p.mode === 'draft' ? <Text style={styles.primaryLabel}>{primaryLabel}</Text> : null}
    </View>
    <Pressable onPress={p.onMemories} disabled={busy} accessibilityRole="button" accessibilityLabel={t('home.ambient.memories')} accessibilityState={{ disabled: busy }} style={[styles.side, busy && styles.disabled]}>
      <Ionicons name="albums-outline" size={27} color={C.text} /><Text style={styles.label}>{t('home.ambient.memories')}</Text>
    </Pressable>
  </View>;
}
const styles = StyleSheet.create({
  dock: { minHeight: L.dockMinHeight, marginHorizontal: L.horizontalGutter, paddingHorizontal: 8, paddingVertical: 12, borderRadius: L.radius + 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, flexDirection: 'row', alignItems: 'center' },
  side: { flex: 1, minHeight: L.hitArea, justifyContent: 'center', alignItems: 'center', gap: 7, paddingVertical: 6 },
  label: { fontSize: 13, color: C.text, textAlign: 'center', flexShrink: 1 },
  center: { alignItems: 'center', width: L.shutterSize + 16 },
  shutter: { width: L.shutterSize, height: L.shutterSize, borderRadius: L.shutterSize / 2, borderWidth: 3, borderColor: C.text, padding: 4 },
  inner: { flex: 1, borderRadius: L.shutterSize / 2, backgroundColor: C.text, alignItems: 'center', justifyContent: 'center' },
  primaryLabel: { color: C.muted, fontSize: 11, textAlign: 'center', marginTop: 5 }, disabled: { opacity: 0.4 },
});
