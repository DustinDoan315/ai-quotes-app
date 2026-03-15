drop policy if exists "Users can insert own friend row" on public.friends;

create policy "Users can insert own friend row"
  on public.friends for insert
  with check (auth.uid() = user_id OR auth.uid() = friend_id);
