alter table public.user_photos
  add column if not exists photo_orientation text;

update public.user_photos
set photo_orientation = 'portrait'
where photo_orientation is null;

alter table public.user_photos
  alter column photo_orientation set default 'portrait',
  alter column photo_orientation set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_photos_photo_orientation_check'
      and conrelid = 'public.user_photos'::regclass
  ) then
    alter table public.user_photos
      add constraint user_photos_photo_orientation_check
      check (photo_orientation in ('portrait', 'landscape'));
  end if;
end;
$$;

drop policy if exists "Users can insert own photo" on public.user_photos;
create policy "Users can insert own photo"
  on public.user_photos for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (
      photo_stack_id is null
      or exists (
        select 1
        from public.user_subscriptions
        where user_id = (select auth.uid())
          and is_pro = true
          and (expires_at is null or expires_at > now())
      )
    )
  );
