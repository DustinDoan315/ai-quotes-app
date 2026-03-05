create table if not exists public.invite_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invite_links_user_id_idx on public.invite_links(user_id);
create unique index if not exists invite_links_code_idx on public.invite_links(code);

alter table public.invite_links enable row level security;

create policy "Users can read own invite link"
  on public.invite_links for select
  using (auth.uid() = user_id);

create policy "Users can insert own invite link"
  on public.invite_links for insert
  with check (auth.uid() = user_id);

create policy "Users can update own invite link"
  on public.invite_links for update
  using (auth.uid() = user_id);

create table if not exists public.friends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, friend_id)
);

create index if not exists friends_user_id_idx on public.friends(user_id);
create index if not exists friends_friend_id_idx on public.friends(friend_id);

alter table public.friends enable row level security;

create policy "Users can read own friends"
  on public.friends for select
  using (auth.uid() = user_id);

create policy "Users can insert own friend row"
  on public.friends for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own friend row"
  on public.friends for delete
  using (auth.uid() = user_id);
