-- Keeps first-login profiles private and makes private photo storage enforce
-- the same owner/friend access model as the application feed.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (user_id, username, display_name)
  values (
    new.id,
    'user_' || substr(new.id::text, 1, 8),
    null
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

-- The old trigger populated display_name with the email address when a
-- provider supplied no display-name metadata. Remove that historic exposure.
update public.user_profiles as profile
set display_name = null
from auth.users as auth_user
where profile.user_id = auth_user.id
  and profile.display_name is not null
  and profile.display_name = auth_user.email;

drop policy if exists "Public profiles are viewable by everyone" on public.user_profiles;
drop policy if exists "Users can view own profile" on public.user_profiles;
drop policy if exists "Users can read own and friends profiles" on public.user_profiles;
drop policy if exists "Users can insert own profile" on public.user_profiles;
drop policy if exists "Users can update own profile" on public.user_profiles;
drop policy if exists "Users can delete own profile" on public.user_profiles;

create policy "Users can read own and friends profiles"
  on public.user_profiles for select to authenticated
  using (
    (select auth.uid()) = user_id
    or exists (
      select 1
      from public.friends
      where friends.user_id = (select auth.uid())
        and friends.friend_id = user_profiles.user_id
    )
  );

create policy "Users can insert own profile"
  on public.user_profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own profile"
  on public.user_profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can read own and friends photos" on public.user_photos;
drop policy if exists "allow_select_own_user_photos" on public.user_photos;

create policy "Users can read own and friends photos"
  on public.user_photos for select to authenticated
  using (
    (select auth.uid()) = user_id
    or exists (
      select 1
      from public.friends
      where friends.user_id = (select auth.uid())
        and friends.friend_id = user_photos.user_id
    )
  );

update storage.buckets
set public = false
where id = 'user-photos';

drop policy if exists "Public read user-photos" on storage.objects;
drop policy if exists "Public upload user-photos" on storage.objects;
drop policy if exists "Private user photo reads" on storage.objects;
drop policy if exists "Private user photo uploads" on storage.objects;

create policy "Private user photo reads"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'user-photos'
    and exists (
      select 1
      from public.user_photos
      where user_photos.storage_path = storage.objects.name
        and (
          user_photos.user_id = (select auth.uid())
          or exists (
            select 1
            from public.friends
            where friends.user_id = (select auth.uid())
              and friends.friend_id = user_photos.user_id
          )
        )
    )
  );

create policy "Private user photo uploads"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'user-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
