alter table public.user_photos
  add column if not exists quote_position_x double precision not null default 0.5,
  add column if not exists quote_position_y double precision not null default 0.84;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.user_photos'::regclass
      and conname = 'user_photos_quote_position_x_check'
  ) then
    alter table public.user_photos
      add constraint user_photos_quote_position_x_check
      check (quote_position_x between 0 and 1);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.user_photos'::regclass
      and conname = 'user_photos_quote_position_y_check'
  ) then
    alter table public.user_photos
      add constraint user_photos_quote_position_y_check
      check (quote_position_y between 0 and 1);
  end if;
end;
$$;
