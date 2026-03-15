drop policy if exists "Users can read own profile" on public.user_profiles;
create policy "Users can read own and friends profiles"
  on public.user_profiles for select
  using (
    auth.uid() = user_id
    or user_id in (
      select friend_id from public.friends where user_id = auth.uid()
    )
  );
