import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getHomeMomentIndexWindow } from '@/domain/home/activeHomeMoment';
import { HOME_AMBIENT_CHROME as C, HOME_AMBIENT_LAYOUT as L } from '@/theme/homeAmbient';

export type HomeMomentToolbarProps = {
  context: 'mine' | 'friends' | 'draft'; index: number; count: number;
  heartMode: 'favorite' | 'reaction' | 'signin' | 'hidden'; isFavorite: boolean; isHeartBusy: boolean;
  canShare: boolean; isSharing: boolean; canPrevious: boolean; canNext: boolean;
  onHeart: () => void; onShare: () => void; onPrevious: () => void; onNext: () => void;
};
export function HomeMomentToolbar(p: HomeMomentToolbarProps) {
  const { t } = useTranslation();
  const window = getHomeMomentIndexWindow(p.index, p.count);
  const heartKey = p.heartMode === 'reaction' ? 'sendLove' : p.heartMode === 'signin' ? 'signIn' : p.isFavorite ? 'unfavorite' : 'favorite';
  return <View style={styles.row}>
    <View style={styles.context} accessible accessibilityLabel={`${t(`home.ambient.${p.context === 'friends' ? 'friendsMoments' : p.context === 'draft' ? 'newMoment' : 'yourMoments'}`)}${p.count > 1 ? `, ${t('home.ambient.momentIndex', { index: p.index + 1, count: p.count })}` : ''}`}
      accessibilityActions={[...(p.canPrevious ? [{ name: 'decrement', label: t('home.ambient.previous') }] : []), ...(p.canNext ? [{ name: 'increment', label: t('home.ambient.next') }] : [])]}
      onAccessibilityAction={e => { if (e.nativeEvent.actionName === 'decrement' && p.canPrevious) p.onPrevious(); if (e.nativeEvent.actionName === 'increment' && p.canNext) p.onNext(); }}>
      <Text style={styles.label}>{t(`home.ambient.${p.context === 'friends' ? 'friendsMoments' : p.context === 'draft' ? 'newMoment' : 'yourMoments'}`)}</Text>
      {p.count > 1 ? <View style={styles.segments}>{window.indices.map(i => <View key={i} style={[styles.segment, { backgroundColor: i === p.index ? C.text : C.inactiveSegment }]} />)}{window.label ? <Text style={styles.counter}>{window.label}</Text> : null}</View> : null}
    </View>
    {p.heartMode !== 'hidden' ? <Pressable onPress={p.onHeart} disabled={p.isHeartBusy || p.isSharing} accessibilityRole="button" accessibilityLabel={t(`home.ambient.${heartKey}`)} accessibilityState={{ disabled: p.isHeartBusy || p.isSharing, busy: p.isHeartBusy, ...(p.heartMode === 'favorite' ? { selected: p.isFavorite } : {}) }} style={styles.button}>
      {p.isHeartBusy ? <ActivityIndicator color={C.text} /> : <Ionicons name={p.heartMode === 'favorite' && p.isFavorite ? 'heart' : 'heart-outline'} size={27} color={C.text} />}
    </Pressable> : null}
    <Pressable onPress={p.onShare} disabled={!p.canShare || p.isSharing} accessibilityRole="button" accessibilityLabel={t('home.ambient.share')} accessibilityState={{ disabled: !p.canShare || p.isSharing, busy: p.isSharing }} style={[styles.button, { opacity: p.canShare ? 1 : 0.35 }]}>
      {p.isSharing ? <ActivityIndicator color={C.text} /> : <Ionicons name="share-outline" size={26} color={C.text} />}
    </Pressable>
  </View>;
}
const styles = StyleSheet.create({
  row: { minHeight: L.actionRowMinHeight, flexDirection: 'row', alignItems: 'center', paddingHorizontal: L.horizontalGutter },
  context: { flex: 1, paddingVertical: 8 }, label: { color: C.muted, fontSize: 14 },
  segments: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  segment: { height: 4, width: 28, borderRadius: 3 }, counter: { color: C.muted, fontSize: 11 },
  button: { width: L.hitArea, minHeight: L.hitArea, alignItems: 'center', justifyContent: 'center' },
});
