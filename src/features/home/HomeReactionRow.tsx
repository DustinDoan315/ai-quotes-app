import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PHOTO_REACTION_EMOJIS, type UserPhotoReactionType } from '@/services/media/userPhotoReactions';
import { HOME_AMBIENT_CHROME as C, HOME_AMBIENT_LAYOUT as L } from '@/theme/homeAmbient';
import { HomeEmojiPicker } from './HomeEmojiPicker';

const quickTypes = ['love', 'clap', 'fire', 'laugh'] as const;
export function HomeReactionRow({ disabled, onReact, targetId }: { disabled: boolean; onReact: (type: UserPhotoReactionType) => void; targetId?: string | null }) {
  const { t } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);
  useEffect(() => { setPickerOpen(false); }, [disabled, targetId]);
  const selectEmoji = (emoji: string) => {
    setPickerOpen(false);
    if (disabled) return;
    const known = Object.entries(PHOTO_REACTION_EMOJIS).find(([, value]) => value.replace(/[\uFE0E\uFE0F]/g, '') === emoji.replace(/[\uFE0E\uFE0F]/g, ''))?.[0];
    onReact((known ?? `emoji:${emoji}`) as UserPhotoReactionType);
  };
  return <View style={styles.row}>
    {quickTypes.map(type => <Pressable key={type} disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled }} accessibilityLabel={t('home.reactions.withEmoji', { emoji: PHOTO_REACTION_EMOJIS[type] })} style={[styles.button, disabled && styles.disabled]} onPress={() => { if (!disabled) onReact(type); }}><Text style={styles.emoji}>{PHOTO_REACTION_EMOJIS[type]}</Text></Pressable>)}
    <Pressable disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled, expanded: pickerOpen }} accessibilityLabel={t('home.reactions.more')} style={[styles.button, disabled && styles.disabled]} onPress={() => { if (!disabled) setPickerOpen(true); }}><Text style={styles.more}>•••</Text></Pressable>
    <HomeEmojiPicker visible={pickerOpen && !disabled} onClose={() => setPickerOpen(false)} onSelect={selectEmoji} />
  </View>;
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 12 },
  button: { minWidth: L.hitArea, minHeight: L.hitArea, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 25 }, more: { color: C.text, fontSize: 19, letterSpacing: 2 }, disabled: { opacity: 0.4 },
});
