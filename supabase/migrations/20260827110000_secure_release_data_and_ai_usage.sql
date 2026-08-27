-- Release hardening:
-- 1. Keep saved photos private unless the owner explicitly shares them.
-- 2. Persist memory state in the cloud so reinstall/device changes do not
--    discard saved reflections.
-- 3. Reserve free AI usage atomically before any model call.

alter table public.user_photos
  add column if not exists visibility text,
  add column if not exists is_favorite boolean;

update public.user_photos
set
  visibility = coalesce(nullif(visibility, ''), 'private'),
  is_favorite = coalesce(is_favorite, false)
where visibility is null
   or visibility = ''
   or is_favorite is null;

alter table public.user_photos
  alter column visibility set default 'private',
  alter column visibility set not null,
  alter column is_favorite set default false,
  alter column is_favorite set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_photos_visibility_check'
      and conrelid = 'public.user_photos'::regclass
  ) then
    alter table public.user_photos
      add constraint user_photos_visibility_check
      check (visibility in ('private', 'friends', 'public'));
  end if;
end;
$$;

create index if not exists user_photos_user_id_created_at_idx
  on public.user_photos (user_id, created_at desc);

alter table public.user_photos enable row level security;
revoke all on public.user_photos from anon;
grant select, insert, update, delete on public.user_photos to authenticated;

drop policy if exists "Users can read own and friends photos" on public.user_photos;
drop policy if exists "Users can read own photos" on public.user_photos;
drop policy if exists "Users can read own photo" on public.user_photos;
drop policy if exists "Users can insert own photo" on public.user_photos;
drop policy if exists "allow_insert_own_user_photos" on public.user_photos;
drop policy if exists "allow_select_own_user_photos" on public.user_photos;
drop policy if exists "Users can update own photo" on public.user_photos;
drop policy if exists "Users can delete own photo" on public.user_photos;

create policy "Users can read private own and explicitly shared photos"
  on public.user_photos for select
  to authenticated
  using (
    (select auth.uid()) = user_id
    or visibility = 'public'
    or (
      visibility = 'friends'
      and exists (
        select 1
        from public.friends
        where friends.user_id = (select auth.uid())
          and friends.friend_id = user_photos.user_id
      )
    )
  );

create policy "Users can insert own photo"
  on public.user_photos for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own photo"
  on public.user_photos for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own photo"
  on public.user_photos for delete
  to authenticated
  using ((select auth.uid()) = user_id);

update storage.buckets
set public = false
where id = 'user-photos';

drop policy if exists "Public read user-photos" on storage.objects;
drop policy if exists "Public upload user-photos" on storage.objects;
drop policy if exists "Private user photo reads" on storage.objects;
drop policy if exists "Private user photo uploads" on storage.objects;
drop policy if exists "Private user photo updates" on storage.objects;
drop policy if exists "Private user photo deletes" on storage.objects;

create policy "Private user photo reads"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'user-photos'
    and exists (
      select 1
      from public.user_photos
      where user_photos.storage_path = storage.objects.name
        and (
          user_photos.user_id = (select auth.uid())
          or user_photos.visibility = 'public'
          or (
            user_photos.visibility = 'friends'
            and exists (
              select 1
              from public.friends
              where friends.user_id = (select auth.uid())
                and friends.friend_id = user_photos.user_id
            )
          )
        )
    )
  );

create policy "Private user photo uploads"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'user-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Private user photo updates"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'user-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'user-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Private user photo deletes"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'user-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- This function is called only by the service-role Edge Functions client. It
-- increments only when the configured free-plan limit has not been reached,
-- so blocked requests never spend a quota unit and concurrent requests cannot
-- pass the limit together.
create or replace function public.reserve_ai_usage(p_user_id uuid, p_date date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  daily_limit integer;
  new_count integer;
begin
  select daily_ai_limit
    into daily_limit
    from public.subscription_plan_settings
   where plan_id = 'free';

  -- A null limit means unlimited free usage. Keep the response shape stable
  -- for the Edge Function even though no counter row is needed.
  if daily_limit is null then
    return jsonb_build_object(
      'allowed', true,
      'usage_count', null,
      'daily_limit', null
    );
  end if;

  insert into public.ai_usage_daily (user_id, usage_date, ai_count)
  values (p_user_id, p_date, 0)
  on conflict (user_id, usage_date) do nothing;

  update public.ai_usage_daily
     set ai_count = ai_count + 1
   where user_id = p_user_id
     and usage_date = p_date
     and ai_count < daily_limit
  returning ai_count into new_count;

  if found then
    return jsonb_build_object(
      'allowed', true,
      'usage_count', new_count,
      'daily_limit', daily_limit
    );
  end if;

  select ai_count
    into new_count
    from public.ai_usage_daily
   where user_id = p_user_id
     and usage_date = p_date;

  return jsonb_build_object(
    'allowed', false,
    'usage_count', coalesce(new_count, daily_limit),
    'daily_limit', daily_limit
  );
end;
$$;

revoke all on function public.reserve_ai_usage(uuid, date) from public;
revoke all on function public.reserve_ai_usage(uuid, date) from anon;
revoke all on function public.reserve_ai_usage(uuid, date) from authenticated;
grant execute on function public.reserve_ai_usage(uuid, date) to service_role;
