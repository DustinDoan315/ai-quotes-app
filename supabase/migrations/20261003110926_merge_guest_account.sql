-- Durable proof is created by the Edge Function only after verifying both JWTs.
create table public.guest_account_merges (
  source_user_id uuid primary key,
  target_user_id uuid not null,
  completed boolean not null default false,
  lease_id uuid,
  lease_until timestamptz,
  created_at timestamptz not null default now(),
  check (source_user_id <> target_user_id)
);
alter table public.guest_account_merges enable row level security;
revoke all on public.guest_account_merges from anon, authenticated;
grant all on public.guest_account_merges to service_role;

create function public.claim_guest_merge(source_id uuid, target_id uuid, worker_id uuid, proven boolean)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if proven then
    perform 1 from auth.users where id=source_id and is_anonymous for update;
    if not found then raise exception 'Source is not anonymous'; end if;
    insert into guest_account_merges(source_user_id,target_user_id)
      values(source_id,target_id) on conflict do nothing;
  end if;
  update guest_account_merges set lease_id=worker_id,lease_until=now()+interval '20 minutes'
    where source_user_id=source_id and target_user_id=target_id
      and (lease_until is null or lease_until < now() or lease_id=worker_id);
  return found;
end $$;

create function public.transfer_guest_photo(source_id uuid,target_id uuid,worker_id uuid,photo_id uuid,new_path text,new_url text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform 1 from guest_account_merges where source_user_id=source_id and target_user_id=target_id
    and lease_id=worker_id and lease_until>now() for update;
  if not found then raise exception 'Merge lease unavailable'; end if;
  if split_part(new_path,'/',1)<>target_id::text then raise exception 'Invalid target path'; end if;
  update user_photos set user_id=target_id,guest_id=null,storage_path=new_path,image_url=new_url,visibility='private'
    where id=photo_id and user_id=source_id;
end $$;

create function public.guard_merging_guest_photos() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(),'') <> 'service_role' and exists (
    select 1 from guest_account_merges where source_user_id=coalesce(new.user_id,old.user_id)
  ) then raise exception 'Guest account is being merged'; end if;
  return coalesce(new,old);
end $$;
create trigger guard_merging_guest_photos before insert or update or delete on public.user_photos
  for each row execute function public.guard_merging_guest_photos();
revoke all on function public.claim_guest_merge(uuid,uuid,uuid,boolean) from public,anon,authenticated;
revoke all on function public.transfer_guest_photo(uuid,uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.claim_guest_merge(uuid,uuid,uuid,boolean) to service_role;
grant execute on function public.transfer_guest_photo(uuid,uuid,uuid,uuid,text,text) to service_role;

-- Deny fresh anonymous uploads/mutations once a merge has durable proof.
create function public.guest_merge_in_progress() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from guest_account_merges where source_user_id=auth.uid())
$$;
revoke all on function public.guest_merge_in_progress() from public;
grant execute on function public.guest_merge_in_progress() to authenticated;
create policy "No storage writes during guest merge" on storage.objects
  as restrictive for all to authenticated
  using (not public.guest_merge_in_progress())
  with check (not public.guest_merge_in_progress());
-- A source cannot be upgraded after proof was recorded. Otherwise cleanup could
-- race a second social login and remove a newly permanent account.
create function public.guard_merging_guest_upgrade() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.is_anonymous and not new.is_anonymous and exists (
    select 1 from guest_account_merges where source_user_id=old.id
  ) then raise exception 'Guest account merge is in progress'; end if;
  return new;
end $$;
create trigger guard_merging_guest_upgrade before update of is_anonymous on auth.users
  for each row execute function public.guard_merging_guest_upgrade();

create function public.assert_guest_merge_cleanup(source_id uuid,target_id uuid,worker_id uuid)
returns void language plpgsql security definer set search_path = public,storage as $$
begin
  perform 1 from guest_account_merges where source_user_id=source_id and target_user_id=target_id
    and lease_id=worker_id and lease_until>now() for update;
  if not found then raise exception 'Merge lease unavailable'; end if;
  if exists(select 1 from user_photos where user_id=source_id or storage_path like source_id::text||'/%')
    or exists(select 1 from storage.objects where owner_id=source_id::text or name like source_id::text||'/%')
    then raise exception 'Guest storage or records remain'; end if;
end $$;
revoke all on function public.assert_guest_merge_cleanup(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.assert_guest_merge_cleanup(uuid,uuid,uuid) to service_role;
