create table if not exists public.ai_usage_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default (now() at time zone 'utc')::date,
  ai_count int not null default 0,
  primary key (user_id, usage_date)
);

alter table public.ai_usage_daily enable row level security;

drop policy if exists "users can read own ai usage" on public.ai_usage_daily;
create policy "users can read own ai usage" on public.ai_usage_daily
  for select using (auth.uid() = user_id);

drop policy if exists "service role manages ai usage" on public.ai_usage_daily;
create policy "service role manages ai usage" on public.ai_usage_daily
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Atomically inserts the first usage row for (user, date) or increments
-- the existing counter. Returns the new ai_count after the write so
-- the caller can enforce the daily limit in a single round trip.
create or replace function public.increment_ai_usage(p_user_id uuid, p_date date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into public.ai_usage_daily (user_id, usage_date, ai_count)
  values (p_user_id, p_date, 1)
  on conflict (user_id, usage_date)
  do update set ai_count = ai_usage_daily.ai_count + 1
  returning ai_count into new_count;
  return new_count;
end;
$$;
