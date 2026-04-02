create table if not exists public.subscription_plan_settings (
  plan_id text primary key check (plan_id in ('free', 'pro')),
  daily_ai_limit integer,
  daily_export_limit integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_plan_settings_daily_ai_limit_check
    check (daily_ai_limit is null or daily_ai_limit >= 0),
  constraint subscription_plan_settings_daily_export_limit_check
    check (daily_export_limit is null or daily_export_limit >= 0)
);

alter table public.subscription_plan_settings enable row level security;

drop policy if exists "Anyone can read subscription plan settings"
  on public.subscription_plan_settings;
create policy "Anyone can read subscription plan settings"
  on public.subscription_plan_settings
  for select
  using (true);

drop policy if exists "Service role manages subscription plan settings"
  on public.subscription_plan_settings;
create policy "Service role manages subscription plan settings"
  on public.subscription_plan_settings
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create or replace function public.set_updated_at_subscription_plan_settings()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_subscription_plan_settings
  on public.subscription_plan_settings;
create trigger set_updated_at_subscription_plan_settings
before update on public.subscription_plan_settings
for each row
execute function public.set_updated_at_subscription_plan_settings();

insert into public.subscription_plan_settings (
  plan_id,
  daily_ai_limit,
  daily_export_limit
)
values
  ('free', 2, 2),
  ('pro', null, null)
on conflict (plan_id) do update
set
  daily_ai_limit = excluded.daily_ai_limit,
  daily_export_limit = excluded.daily_export_limit,
  updated_at = now();
