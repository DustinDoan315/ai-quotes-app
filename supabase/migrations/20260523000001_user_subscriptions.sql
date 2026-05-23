create table if not exists public.user_subscriptions (
  user_id uuid not null primary key references auth.users(id) on delete cascade,
  is_pro boolean not null default false,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.user_subscriptions enable row level security;

drop policy if exists "users can read own subscription" on public.user_subscriptions;
create policy "users can read own subscription" on public.user_subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists "service role manages subscriptions" on public.user_subscriptions;
create policy "service role manages subscriptions" on public.user_subscriptions
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
