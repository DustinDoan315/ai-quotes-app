import data from 'emojibase-data/en/data.json';

type EmojiEntry = { emoji: string; group?: number; skins?: EmojiEntry[] };
const validEmoji = new Set<string>();
function collect(entries: EmojiEntry[]) {
  for (const entry of entries) {
    if (entry.group != null) validEmoji.add(entry.emoji);
    if (entry.skins) {
      for (const skin of entry.skins) validEmoji.add(skin.emoji);
    }
  }
}
collect(data as EmojiEntry[]);
export function parseCustomReactionEmoji(type: string): string | null {
  if (!type.startsWith('emoji:')) return null;
  const emoji = type.slice(6);
  return validEmoji.has(emoji) && [...emoji].length <= 32 ? emoji : null;
}
