begin;
select plan(10);

select has_table(
  'public',
  'user_photo_reactions',
  'reactions_table_exists'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.user_photo_reactions'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%pleading%'
      and pg_get_constraintdef(oid) like '%heart_hands%'
      and pg_get_constraintdef(oid) like '%white_heart%'
  ),
  'reaction_types_are_checked'
);

select ok(
  exists (
    select 1
    from pg_index i
    join pg_class c on c.oid = i.indexrelid
    where c.relname = 'user_photo_reactions_actor_type_key'
      and i.indnullsnotdistinct
  ),
  'unique_key_treats_nulls_as_equal'
);

select ok(
  exists (select 1 from pg_constraint where conrelid = 'public.user_photo_reactions'::regclass
    and conname = 'user_photo_reactions_type_check' and pg_get_constraintdef(oid) like '%emoji:%'),
  'custom_emoji_namespace_allowed'
);

insert into auth.users (id, aud, role, email)
values
  ('10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'reaction-actor@example.test'),
  ('10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'reaction-friend@example.test'),
  ('10000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'reaction-other@example.test'),
  ('10000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'reaction-anonymous@example.test')
on conflict (id) do nothing;

insert into public.friends (user_id, friend_id)
values ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002')
on conflict (user_id, friend_id) do nothing;

insert into public.user_photos (id, user_id, image_url, storage_path, visibility)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'https://example.test/self.jpg', 'self.jpg', 'friends'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'https://example.test/friend.jpg', 'friend.jpg', 'friends'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'https://example.test/other.jpg', 'other.jpg', 'public')
on conflict (id) do nothing;

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok(
  $$insert into public.user_photo_reactions (photo_id, reactor_user_id, reactor_guest_id, type)
    values ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', null, 'love')$$,
  '42501',
  null,
  'anon_cannot_insert'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000004","role":"authenticated","is_anonymous":true}', true);
select throws_ok(
  $$insert into public.user_photo_reactions (photo_id, reactor_user_id, reactor_guest_id, type)
    values ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', null, 'love')$$,
  '42501',
  null,
  'anonymous_auth_user_cannot_insert'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","is_anonymous":false}', true);
select throws_ok(
  $$insert into public.user_photo_reactions (photo_id, reactor_user_id, reactor_guest_id, type)
    values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', null, 'love')$$,
  '42501',
  null,
  'user_cannot_react_to_self'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","is_anonymous":false}', true);
select throws_ok(
  $$insert into public.user_photo_reactions (photo_id, reactor_user_id, reactor_guest_id, type)
    values ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', null, 'love')$$,
  '42501',
  null,
  'user_cannot_react_to_unrelated_photo'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","is_anonymous":false}', true);
select lives_ok(
  $$insert into public.user_photo_reactions (photo_id, reactor_user_id, reactor_guest_id, type)
    values ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', null, 'love')$$,
  'friend_can_insert'
);
reset role;

insert into public.user_photo_reactions (photo_id, reactor_user_id, reactor_guest_id, type, comment)
values ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', null, 'clap', 'legacy message')
on conflict (photo_id, reactor_user_id, reactor_guest_id, type) do nothing;

insert into public.user_photo_reactions (photo_id, reactor_user_id, reactor_guest_id, type, comment)
values ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', null, 'clap', 'replacement message')
on conflict (photo_id, reactor_user_id, reactor_guest_id, type) do nothing;

select ok(
  (
    select count(*) = 1 and bool_and(comment = 'legacy message')
    from public.user_photo_reactions
    where photo_id = '20000000-0000-0000-0000-000000000002'
      and reactor_user_id = '10000000-0000-0000-0000-000000000001'
      and reactor_guest_id is null
      and type = 'clap'
  ),
  'duplicate_null_guest_keeps_legacy_comment'
);

select * from finish();
rollback;
