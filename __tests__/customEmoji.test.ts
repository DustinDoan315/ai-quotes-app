import { parseCustomReactionEmoji } from '@/domain/reactions/customEmoji';
it.each(['🐱', '🫶🏽', '🇻🇳', '👨‍👩‍👧‍👦', '1️⃣'])('accepts a single catalog emoji %s', emoji => {
  expect(parseCustomReactionEmoji(`emoji:${emoji}`)).toBe(emoji);
});
it.each(['emoji:', 'emoji:hello', 'emoji:🐱🐱', 'emoji:🐱 hello', 'love'])('rejects non emoji reactions %s', value => {
  expect(parseCustomReactionEmoji(value)).toBeNull();
});
