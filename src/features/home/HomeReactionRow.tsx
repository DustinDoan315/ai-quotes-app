import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PHOTO_REACTION_EMOJIS, type UserPhotoReactionType } from '@/services/media/userPhotoReactions';
export function HomeReactionRow({ disabled, onReact }: { disabled: boolean; onReact: (type: UserPhotoReactionType) => void }) {
  const { t } = useTranslation();
  return <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', paddingHorizontal: 12 }}>
    {(Object.entries(PHOTO_REACTION_EMOJIS) as [UserPhotoReactionType, string][]).map(([type, emoji]) => <Pressable key={type} disabled={disabled} accessibilityRole="button" accessibilityLabel={t('home.reactions.withEmoji', { emoji })} style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.4 : 1 }} onPress={() => onReact(type)}><Text style={{ fontSize: 25 }}>{emoji}</Text></Pressable>)}
  </View>;
}
