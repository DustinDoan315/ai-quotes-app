create table if not exists public.user_photo_reactions (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.user_photos(id) on delete cascade,
  reactor_user_id uuid references auth.users(id) on delete cascade,
  reactor_guest_id text,
  type text not null,
  comment text,
  created_at timestamptz not null default now(),
  constraint user_photo_reactions_type_check
    check (type in ('love', 'clap', 'fire', 'pleading', 'sparkles', 'heart_hands', 'laugh', 'party', 'white_heart')),
  constraint user_photo_reactions_actor_type_key
    unique nulls not distinct (photo_id, reactor_user_id, reactor_guest_id, type)
);

do $$
declare
  constraint_name text;
  index_name text;
begin
  -- Keep comments intact if the old nullable guest key contains duplicates.
  if exists (
    select 1
    from public.user_photo_reactions
    group by photo_id, reactor_user_id, reactor_guest_id, type
    having count(*) > 1
  ) then
    raise exception 'Duplicate user_photo_reactions keys found; inspect rows before adding NULLS NOT DISTINCT uniqueness';
  end if;

  -- Replace any earlier reaction-type checks with the current curated set.
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public.user_photo_reactions'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%type%'
  loop
    execute format('alter table public.user_photo_reactions drop constraint %I', constraint_name);
  end loop;

  -- Remove older unique definitions on the same conflict key before installing
  -- one NULLS NOT DISTINCT key that treats legacy NULL guest ids consistently.
  for constraint_name in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.user_photo_reactions'::regclass
      and c.contype = 'u'
      and (
        select array_agg(a.attname::text order by k.ordinality)
        from unnest(c.conkey) with ordinality as k(attnum, ordinality)
        join pg_attribute a
          on a.attrelid = c.conrelid
         and a.attnum = k.attnum
      ) = array['photo_id', 'reactor_user_id', 'reactor_guest_id', 'type']::text[]
  loop
    execute format('alter table public.user_photo_reactions drop constraint %I', constraint_name);
  end loop;

  for index_name in
    select i.indexrelid::regclass::text
    from pg_index i
    where i.indrelid = 'public.user_photo_reactions'::regclass
      and i.indisunique
      and not i.indisprimary
      and not exists (
        select 1 from pg_constraint c where c.conindid = i.indexrelid
      )
      and (
        select array_agg(a.attname::text order by k.ordinality)
        from unnest(i.indkey) with ordinality as k(attnum, ordinality)
        join pg_attribute a
          on a.attrelid = i.indrelid
         and a.attnum = k.attnum
        where k.ordinality <= i.indnkeyatts
      ) = array['photo_id', 'reactor_user_id', 'reactor_guest_id', 'type']::text[]
  loop
    execute format('drop index %s', index_name);
  end loop;

  alter table public.user_photo_reactions
    add constraint user_photo_reactions_type_check
    check (type in ('love', 'clap', 'fire', 'pleading', 'sparkles', 'heart_hands', 'laugh', 'party', 'white_heart'));

  alter table public.user_photo_reactions
    add constraint user_photo_reactions_actor_type_key
    unique nulls not distinct (photo_id, reactor_user_id, reactor_guest_id, type);
end;
$$;

alter table public.user_photo_reactions enable row level security;

do $$
declare
  policy_name text;
begin
  for policy_name in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_photo_reactions'
  loop
    execute format('drop policy %I on public.user_photo_reactions', policy_name);
  end loop;
end;
$$;

revoke all on public.user_photo_reactions from public, anon, authenticated;
grant insert on public.user_photo_reactions to authenticated;

create policy "friends can react to shared photos"
  on public.user_photo_reactions
  for insert
  to authenticated
  with check (
    reactor_user_id = (select auth.uid())
    and reactor_guest_id is null
    and (select (auth.jwt()->>'is_anonymous')::boolean) is false
    and exists (
      select 1
      from public.user_photos
      where user_photos.id = user_photo_reactions.photo_id
        and user_photos.user_id is distinct from (select auth.uid())
        and user_photos.visibility in ('friends', 'public')
        and exists (
          select 1
          from public.friends
          where friends.user_id = (select auth.uid())
            and friends.friend_id = user_photos.user_id
        )
    )
  );
