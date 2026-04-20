create table if not exists public.user_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  guest_id text,
  image_url text not null,
  storage_path text not null,
  quote text,
  style_font_id text,
  style_color_scheme_id text,
  home_vibe_key text,
  created_at timestamptz not null default now()
);
