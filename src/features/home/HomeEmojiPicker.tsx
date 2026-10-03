import { useEffect, useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import emojiData from 'emojibase-data/en/data.json';
import { HOME_AMBIENT_CHROME as C, HOME_AMBIENT_LAYOUT as L } from '@/theme/homeAmbient';

type EmojiEntry = { emoji: string; label: string; tags?: string[]; group?: number; order?: number; skins?: EmojiEntry[] };
const entries: EmojiEntry[] = (emojiData as EmojiEntry[]).filter(entry => entry.group !== undefined && entry.group !== 2).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).flatMap(entry => [entry, ...(entry.skins ?? [])]);
const uniqueEntries = [...new Map(entries.map(entry => [entry.emoji, entry])).values()];

export function HomeEmojiPicker({ visible, onClose, onSelect }: { visible: boolean; onClose: () => void; onSelect: (emoji: string) => void }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const reduceMotion = useReducedMotionPreference();
  useEffect(() => { if (!visible) setQuery(''); }, [visible]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return normalized ? uniqueEntries.filter(entry => `${entry.emoji} ${entry.label} ${(entry.tags ?? []).join(' ')}`.toLocaleLowerCase().includes(normalized)) : uniqueEntries;
  }, [query]);
  const columns = Math.max(4, Math.floor((width - 32) / L.hitArea));
  const cellWidth = (width - 32) / columns;
  return <Modal visible={visible} transparent animationType={reduceMotion ? 'none' : 'slide'} onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel={t('home.ambient.close')} />
      <View accessibilityViewIsModal style={[styles.sheet, { height: Math.min(height * 0.65, height - insets.top - 24), paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.handle} />
        <Text accessibilityRole="header" style={styles.title}>{t('home.reactions.pickerTitle')}</Text>
        <TextInput value={query} onChangeText={setQuery} placeholder={t('home.reactions.search')} accessibilityLabel={t('home.reactions.search')} placeholderTextColor={C.muted} style={styles.search} autoCorrect={false} returnKeyType="search" />
        <FlatList key={columns} data={filtered} numColumns={columns} keyExtractor={entry => entry.emoji} keyboardShouldPersistTaps="handled" initialNumToRender={56} windowSize={5} style={styles.list} ListEmptyComponent={<Text style={styles.empty}>{t('home.reactions.empty')}</Text>} renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={item.label} onPress={() => onSelect(item.emoji)} style={[styles.cell, { width: cellWidth }]}><Text style={styles.emoji}>{item.emoji}</Text></Pressable>} />
        <View style={styles.footer}><Pressable onPress={onClose} accessibilityRole="button" style={styles.close}><Text style={styles.closeLabel}>{t('home.ambient.close')}</Text></Pressable></View>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { backgroundColor: '#171329', borderTopLeftRadius: L.radius, borderTopRightRadius: L.radius, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.inactiveSegment, alignSelf: 'center', marginTop: 10, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 12 },
  search: { minHeight: L.hitArea, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, color: C.text, fontSize: 16, marginBottom: 10 },
  list: { flex: 1 }, cell: { minHeight: L.hitArea, alignItems: 'center', justifyContent: 'center' }, emoji: { fontSize: 28 },
  empty: { color: C.muted, textAlign: 'center', paddingVertical: 24 },
  footer: { paddingTop: 12, alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: C.border },
  close: { minHeight: L.hitArea, minWidth: 96, paddingHorizontal: 22, borderRadius: 16, backgroundColor: C.text, justifyContent: 'center', alignItems: 'center' },
  closeLabel: { color: '#171329', fontWeight: '700', fontSize: 15 },
});
