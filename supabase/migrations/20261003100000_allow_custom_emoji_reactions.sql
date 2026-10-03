-- Keep curated reaction IDs compatible; custom emoji use a separate namespace.
-- Existing friend-only insert policy and per-actor uniqueness remain in force.
alter table public.user_photo_reactions
  drop constraint if exists user_photo_reactions_type_check;
alter table public.user_photo_reactions
  add constraint user_photo_reactions_type_check check (
    type in ('love', 'clap', 'fire', 'pleading', 'sparkles', 'heart_hands', 'laugh', 'party', 'white_heart')
    or (
      left(type, 6) = 'emoji:'
      and char_length(substring(type from 7)) between 1 and 32
      and substring(type from 7) ~ '[^ -~]'
      and substring(type from 7) !~ '[[:space:][:cntrl:]]'
    )
  );
