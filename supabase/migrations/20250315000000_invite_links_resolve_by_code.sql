create policy "Anyone can read invite_links to resolve code"
  on public.invite_links for select
  to authenticated
  using (true);
