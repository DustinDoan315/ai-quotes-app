create table if not exists public.home_backgrounds (
  vibe_key text primary key,
  rarity text not null,
  sort_order integer not null default 0
);

insert into public.home_backgrounds (vibe_key, rarity, sort_order) values
  ('dawn', 'common', 1),
  ('mist', 'common', 2),
  ('coral', 'common', 3),
  ('indigo', 'common', 4),
  ('forest', 'common', 5),
  ('ember', 'uncommon', 6),
  ('sage', 'uncommon', 7),
  ('midnight', 'rare', 8),
  ('aurora', 'superRare', 9),
  ('prism', 'superLegend', 10)
on conflict (vibe_key) do nothing;

alter table public.user_profiles
  add column if not exists home_vibe_key text references public.home_backgrounds (vibe_key);

alter table public.user_photos
  add column if not exists home_vibe_key text references public.home_backgrounds (vibe_key);

alter table public.home_backgrounds enable row level security;

drop policy if exists "Anyone can read home backgrounds" on public.home_backgrounds;
create policy "Anyone can read home backgrounds"
  on public.home_backgrounds for select
  using (true);
