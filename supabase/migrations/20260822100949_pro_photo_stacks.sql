alter table public.user_photos
  add column if not exists photo_stack_id uuid;

create index if not exists user_photos_photo_stack_id_created_at_idx
  on public.user_photos (photo_stack_id, created_at desc)
  where photo_stack_id is not null;

drop policy if exists "Users can insert own photo" on public.user_photos;
drop policy if exists "allow_insert_own_user_photos" on public.user_photos;
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
