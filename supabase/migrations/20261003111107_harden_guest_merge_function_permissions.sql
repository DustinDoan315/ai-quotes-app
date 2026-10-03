-- Trigger functions are internal; Supabase defaults grant explicit API-role access.
revoke all on function public.guard_merging_guest_photos() from public,anon,authenticated;
revoke all on function public.guard_merging_guest_upgrade() from public,anon,authenticated;
revoke all on function public.guest_merge_in_progress() from public,anon;
-- The status helper is intentionally callable only by authenticated Storage RLS.
grant execute on function public.guest_merge_in_progress() to authenticated;
