alter table public.user_photos
  drop constraint user_photos_quote_scale_check;

alter table public.user_photos
  add constraint user_photos_quote_scale_check
  check (quote_scale >= 0.55 and quote_scale <= 1);
