-- Цитатник — initial schema
-- A private memory book shared by exactly two partners.
-- Every table is protected by RLS; membership in a space is the single access rule.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 40),
  created_at   timestamptz not null default now()
);

create table public.spaces (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (char_length(btrim(name)) between 1 and 60),
  invite_code    text not null unique check (invite_code ~ '^[A-Z2-9]{8}$'),
  together_since date,
  created_by     uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now()
);

create table public.space_members (
  space_id  uuid not null references public.spaces (id) on delete cascade,
  user_id   uuid not null unique references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (space_id, user_id)
);

-- Default categories carry a stable `key` (translated in the UI);
-- custom ones carry a user-given `name`.
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  space_id   uuid not null references public.spaces (id) on delete cascade,
  key        text check (key in ('funny','inside_jokes','quotes','embarrassing','conversations','unforgettable','adventures','other')),
  name       text check (char_length(btrim(name)) between 1 and 32),
  position   int  not null default 100,
  created_at timestamptz not null default now(),
  check ((key is null) <> (name is null)),
  unique (id, space_id),
  unique (space_id, key)
);
create unique index categories_space_name_uniq on public.categories (space_id, lower(name)) where name is not null;

create table public.memories (
  id          uuid primary key default gen_random_uuid(),
  space_id    uuid not null references public.spaces (id) on delete cascade,
  author_id   uuid default auth.uid() references auth.users (id) on delete set null,
  category_id uuid,
  title       text not null check (char_length(btrim(title)) between 1 and 120),
  quote       text not null check (char_length(btrim(quote)) between 1 and 2000),
  story       text check (char_length(story) <= 10000),
  occurred_on date not null,
  photo_path  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- one column to search title, quote and story together (a couple's book is small: no FTS index needed)
  search_text text generated always as (title || ' ' || quote || ' ' || coalesce(story, '')) stored,
  unique (id, space_id),
  -- category must belong to the same space; deleting a category only clears category_id
  foreign key (category_id, space_id) references public.categories (id, space_id) on delete set null (category_id),
  -- photos must live in the space's own storage folder
  check (photo_path is null or photo_path ~ ('^' || space_id::text || '/[0-9a-f-]{36}\.(webp|jpg|png)$'))
);
create index memories_space_date_idx          on public.memories (space_id, occurred_on desc, created_at desc);
create index memories_space_category_date_idx on public.memories (space_id, category_id, occurred_on desc, created_at desc);
create index memories_category_idx            on public.memories (category_id);
create index memories_author_idx              on public.memories (author_id);

create table public.tags (
  id       uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  name     text not null check (char_length(btrim(name)) between 1 and 32),
  unique (id, space_id)
);
create unique index tags_space_name_uniq on public.tags (space_id, lower(name));

create table public.memory_tags (
  memory_id uuid not null,
  tag_id    uuid not null,
  space_id  uuid not null,
  primary key (memory_id, tag_id),
  foreign key (memory_id, space_id) references public.memories (id, space_id) on delete cascade,
  foreign key (tag_id, space_id)    references public.tags (id, space_id)     on delete cascade
);
create index memory_tags_tag_idx on public.memory_tags (tag_id, memory_id);

create table public.favorites (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  memory_id  uuid not null references public.memories (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, memory_id)
);
create index favorites_memory_idx on public.favorites (memory_id);

-- ─────────────────────────────────────────────────────────────
-- Helpers (private schema is not exposed through the API)
-- ─────────────────────────────────────────────────────────────

-- The caller's space (a user belongs to at most one). Used as `(select private.my_space())`
-- in policies so it is evaluated once per query and gives the planner an index-usable equality.
create function private.my_space()
returns uuid language sql stable security definer set search_path = '' as $$
  select space_id from public.space_members where user_id = (select auth.uid());
$$;

create function private.shares_space_with(p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.space_members
    where user_id = p_user and space_id = (select private.my_space())
  );
$$;

create function private.new_invite_code()
returns text language sql volatile set search_path = '' as $$
  -- 256 is divisible by 32, so `% 32` is unbiased.
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + get_byte(b, i) % 32, 1), '' order by i)
  from (select extensions.gen_random_bytes(8) as b) r, generate_series(0, 7) as i;
$$;

-- ─────────────────────────────────────────────────────────────
-- Triggers
-- ─────────────────────────────────────────────────────────────

-- Profile row for every new auth user.
create function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''), nullif(split_part(new.email, '@', 1), ''), 'Me'), 40)
  );
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Users who signed up before this migration get a profile too (insert-only, idempotent).
insert into public.profiles (id, display_name)
select u.id,
       left(coalesce(nullif(btrim(u.raw_user_meta_data ->> 'display_name'), ''), nullif(split_part(u.email, '@', 1), ''), 'Me'), 40)
from auth.users u
on conflict (id) do nothing;

-- A space never has more than two members (row lock serialises concurrent joins).
create function private.enforce_two_members()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.spaces where id = new.space_id for update;
  if (select count(*) from public.space_members where space_id = new.space_id) >= 2 then
    raise exception 'space_full' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger space_members_max_two
  before insert on public.space_members
  for each row execute function private.enforce_two_members();

-- When the last member is gone (both accounts deleted), the book goes with them,
-- so its invite code can never hand old memories to someone else.
create function private.drop_empty_space()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.space_members where space_id = old.space_id) then
    delete from public.spaces where id = old.space_id;
  end if;
  return null;
end;
$$;
create trigger space_members_drop_empty
  after delete on public.space_members
  for each row execute function private.drop_empty_space();

-- Memories: author is always the caller; space and author are immutable for users.
-- Updates without a user session (FK actions such as author ON DELETE SET NULL) pass through.
create function private.memories_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.author_id  := auth.uid();
    new.created_at := now();
    new.updated_at := now();
  elsif auth.uid() is null then
    new.updated_at := now();
  else
    new.space_id   := old.space_id;
    new.author_id  := old.author_id;
    new.created_at := old.created_at;
    new.updated_at := now();
  end if;
  return new;
end;
$$;
create trigger memories_guard
  before insert or update on public.memories
  for each row execute function private.memories_guard();

-- ─────────────────────────────────────────────────────────────
-- Privileges
-- ─────────────────────────────────────────────────────────────

-- Nothing is reachable without a session, now or for future tables.
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;

-- Writes go only to the columns the app edits.
revoke insert, update, delete on public.profiles      from authenticated;
revoke insert, update, delete on public.spaces        from authenticated;
revoke insert, update, delete on public.space_members from authenticated;
revoke update on public.categories, public.tags, public.favorites, public.memory_tags from authenticated;
grant update (display_name)         on public.profiles   to authenticated;
grant update (name, together_since) on public.spaces     to authenticated;
grant update (name, position)       on public.categories to authenticated;
grant update (name)                 on public.tags       to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────

alter table public.profiles      enable row level security;
alter table public.spaces        enable row level security;
alter table public.space_members enable row level security;
alter table public.categories    enable row level security;
alter table public.memories      enable row level security;
alter table public.tags          enable row level security;
alter table public.memory_tags   enable row level security;
alter table public.favorites     enable row level security;

create policy "profiles: self or partner" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or private.shares_space_with(id));
create policy "profiles: update self" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "spaces: members read" on public.spaces for select to authenticated
  using (id = (select private.my_space()));
create policy "spaces: members update" on public.spaces for update to authenticated
  using (id = (select private.my_space())) with check (id = (select private.my_space()));

create policy "members: read own space" on public.space_members for select to authenticated
  using (space_id = (select private.my_space()));

create policy "categories: members read" on public.categories for select to authenticated
  using (space_id = (select private.my_space()));
create policy "categories: members add custom" on public.categories for insert to authenticated
  with check (space_id = (select private.my_space()) and key is null);
create policy "categories: members rename custom" on public.categories for update to authenticated
  using (space_id = (select private.my_space()) and key is null)
  with check (space_id = (select private.my_space()) and key is null);
create policy "categories: members delete custom" on public.categories for delete to authenticated
  using (space_id = (select private.my_space()) and key is null);

create policy "memories: members read" on public.memories for select to authenticated
  using (space_id = (select private.my_space()));
create policy "memories: members add" on public.memories for insert to authenticated
  with check (space_id = (select private.my_space()));
create policy "memories: members edit" on public.memories for update to authenticated
  using (space_id = (select private.my_space())) with check (space_id = (select private.my_space()));
create policy "memories: members delete" on public.memories for delete to authenticated
  using (space_id = (select private.my_space()));

create policy "tags: members all" on public.tags for all to authenticated
  using (space_id = (select private.my_space())) with check (space_id = (select private.my_space()));
create policy "memory_tags: members all" on public.memory_tags for all to authenticated
  using (space_id = (select private.my_space())) with check (space_id = (select private.my_space()));

create policy "favorites: members read" on public.favorites for select to authenticated
  using (exists (select 1 from public.memories m
                 where m.id = memory_id and m.space_id = (select private.my_space())));
create policy "favorites: own add" on public.favorites for insert to authenticated
  with check (user_id = (select auth.uid())
    and exists (select 1 from public.memories m
                where m.id = memory_id and m.space_id = (select private.my_space())));
create policy "favorites: own remove" on public.favorites for delete to authenticated
  using (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- RPCs
-- ─────────────────────────────────────────────────────────────

create function public.create_space(p_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid   uuid := auth.uid();
  v_space uuid;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = 'P0001'; end if;
  if exists (select 1 from public.space_members where user_id = v_uid) then
    raise exception 'already_member' using errcode = 'P0001';
  end if;

  loop
    begin
      insert into public.spaces (name, invite_code, created_by)
      values (btrim(p_name), private.new_invite_code(), v_uid)
      returning id into v_space;
      exit;
    exception when unique_violation then
      -- invite code collision: retry with a fresh code
    end;
  end loop;

  insert into public.space_members (space_id, user_id) values (v_space, v_uid);

  insert into public.categories (space_id, key, position)
  select v_space, k, ord::int * 10
  from unnest(array['funny','inside_jokes','quotes','embarrassing','conversations','unforgettable','adventures','other'])
       with ordinality as t(k, ord);

  return v_space;
end;
$$;

create function public.join_space(p_code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid   uuid := auth.uid();
  v_space uuid;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = 'P0001'; end if;
  if exists (select 1 from public.space_members where user_id = v_uid) then
    raise exception 'already_member' using errcode = 'P0001';
  end if;

  select id into v_space from public.spaces
  where invite_code = upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  if v_space is null then raise exception 'invalid_code' using errcode = 'P0001'; end if;

  insert into public.space_members (space_id, user_id) values (v_space, v_uid);  -- trigger caps at 2
  return v_space;
end;
$$;

-- "Remember this?" — prefers memories older than a week; runs under the caller's RLS.
create function public.random_memory(p_exclude uuid default null)
returns uuid language sql volatile security invoker set search_path = '' as $$
  select id from public.memories
  where p_exclude is null or id <> p_exclude
  order by (occurred_on < current_date - 7) desc, random()
  limit 1;
$$;

-- Small, meaningful numbers — computed under the caller's RLS.
create function public.space_stats()
returns json language sql stable security invoker set search_path = '' as $$
  select json_build_object(
    'total',      (select count(*) from public.memories),
    'this_month', (select count(*) from public.memories where created_at >= date_trunc('month', now())),
    'favorites',  (select count(distinct memory_id) from public.favorites),
    'first_date', (select min(occurred_on) from public.memories),
    'top_categories', coalesce((
      select json_agg(row_to_json(c)) from (
        select category_id, count(*)::int as count
        from public.memories where category_id is not null
        group by category_id order by count(*) desc limit 3
      ) c), '[]'::json)
  );
$$;

-- Replace a memory's tags in one transaction; runs under the caller's RLS.
create function public.set_memory_tags(p_memory uuid, p_names text[])
returns void language plpgsql volatile security invoker set search_path = '' as $$
declare
  v_space uuid;
  v_names text[];
begin
  select space_id into v_space from public.memories where id = p_memory;
  if v_space is null then raise exception 'not_found' using errcode = 'P0001'; end if;

  select coalesce(array_agg(n), '{}') into v_names
  from (select distinct on (lower(n)) n
        from (select btrim(x) as n from unnest(coalesce(p_names, '{}')) as x) s
        where n <> '') d;
  if cardinality(v_names) > 8 then raise exception 'too_many_tags' using errcode = 'P0001'; end if;

  insert into public.tags (space_id, name)
  select v_space, n from unnest(v_names) as n
  on conflict (space_id, lower(name)) do nothing;

  delete from public.memory_tags where memory_id = p_memory;

  insert into public.memory_tags (memory_id, tag_id, space_id)
  select p_memory, t.id, v_space
  from public.tags t
  where t.space_id = v_space and lower(t.name) in (select lower(n) from unnest(v_names) as n);
end;
$$;

-- Tags nobody uses any more disappear (covers edits and memory deletion cascades).
create function private.drop_orphan_tags()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.tags t
  where t.id in (select distinct tag_id from old_rows)
    and not exists (select 1 from public.memory_tags mt where mt.tag_id = t.id);
  return null;
end;
$$;
create trigger memory_tags_drop_orphans
  after delete on public.memory_tags
  referencing old table as old_rows
  for each statement execute function private.drop_orphan_tags();

-- Function execution: helpers and RPCs only for signed-in users.
revoke all on all functions in schema private from public, anon;
grant execute on function private.my_space(), private.shares_space_with(uuid) to authenticated;

revoke all on function public.create_space(text), public.join_space(text),
  public.random_memory(uuid), public.space_stats(), public.set_memory_tags(uuid, text[]) from public, anon;
grant execute on function public.create_space(text), public.join_space(text),
  public.random_memory(uuid), public.space_stats(), public.set_memory_tags(uuid, text[]) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Storage: private photo bucket, one folder per space
-- ─────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('memory-photos', 'memory-photos', false, 5242880, array['image/webp','image/jpeg','image/png'])
on conflict (id) do nothing;

create policy "photos: members read" on storage.objects for select to authenticated
  using (bucket_id = 'memory-photos' and (storage.foldername(name))[1] = (select private.my_space())::text);
create policy "photos: members upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'memory-photos' and (storage.foldername(name))[1] = (select private.my_space())::text);
create policy "photos: members delete" on storage.objects for delete to authenticated
  using (bucket_id = 'memory-photos' and (storage.foldername(name))[1] = (select private.my_space())::text);
