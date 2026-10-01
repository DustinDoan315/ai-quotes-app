alter table public.user_photos
  add column if not exists quote_scale double precision not null default 1
    check (quote_scale >= 0.875 and quote_scale <= 1),
  add column if not exists quote_rotation double precision not null default 0
    check (quote_rotation > '-Infinity'::double precision and quote_rotation < 'Infinity'::double precision);
