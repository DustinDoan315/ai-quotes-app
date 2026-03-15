alter table public.user_photos enable row level security;

drop policy if exists "Users can read own and friends photos" on public.user_photos;
drop policy if exists "Users can read own photos" on public.user_photos;
drop policy if exists "Users can read own photo" on public.user_photos;
create policy "Users can read own and friends photos"
  on public.user_photos for select
  using (
    auth.uid() = user_id
    or user_id in (
      select friend_id from public.friends where user_id = auth.uid()
    )
    or (guest_id is not null and auth.uid() is null)
  );

drop policy if exists "Users can insert own photo" on public.user_photos;
create policy "Users can insert own photo"
  on public.user_photos for insert
  with check (
    auth.uid() = user_id
    or (user_id is null and guest_id is not null)
  );
