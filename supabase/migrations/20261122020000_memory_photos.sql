-- Several photos per memory (up to 10), ordered.
--
-- Data safety: additive only. Nothing is dropped or rewritten except that existing
-- memories.photo_path values are COPIED into memory_photos as photo #0. photo_path is
-- kept and from now on mirrors the first photo (the "cover"), so rolling back is just
-- `drop function public.set_memory_photos; drop table public.memory_photos;`.
-- RLS: the same single rule as every other table — rows belong to the caller's space.

create table public.memory_photos (
  id         uuid primary key default gen_random_uuid(),
  memory_id  uuid not null,
  space_id   uuid not null,
  path       text not null,
  position   int  not null default 0 check (position between 0 and 9),
  created_at timestamptz not null default now(),
  foreign key (memory_id, space_id) references public.memories (id, space_id) on delete cascade,
  unique (memory_id, position),
  unique (path),
  -- a photo can only point into its own space's storage folder
  check (path ~ ('^' || space_id::text || '/[0-9a-f-]{36}\.(webp|jpg|png)$'))
);
create index memory_photos_memory_idx on public.memory_photos (memory_id, position);

-- At most 10 photos per memory.
create function private.limit_memory_photos()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.memory_photos where memory_id = new.memory_id) >= 10 then
    raise exception 'too_many_photos' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger memory_photos_limit
  before insert on public.memory_photos
  for each row execute function private.limit_memory_photos();

alter table public.memory_photos enable row level security;
revoke all on public.memory_photos from anon;
revoke truncate, references, trigger, update on public.memory_photos from authenticated;
grant select, insert, delete on public.memory_photos to authenticated;

create policy "memory_photos: members all" on public.memory_photos for all to authenticated
  using (space_id = (select private.my_space()))
  with check (space_id = (select private.my_space()));

-- Replace a memory's photo list in one transaction (order = array order).
-- security invoker: every read and write below goes through the caller's RLS.
create function public.set_memory_photos(p_memory uuid, p_paths text[])
returns void language plpgsql volatile security invoker set search_path = '' as $$
declare
  v_space uuid;
  v_paths text[] := coalesce(p_paths, '{}');
begin
  if cardinality(v_paths) > 10 then
    raise exception 'too_many_photos' using errcode = 'P0001';
  end if;
  select space_id into v_space from public.memories where id = p_memory;
  if v_space is null then
    raise exception 'memory_not_found' using errcode = 'P0002';
  end if;

  delete from public.memory_photos where memory_id = p_memory;
  insert into public.memory_photos (memory_id, space_id, path, position)
  select p_memory, v_space, p.path, (p.ord - 1)::int
  from unnest(v_paths) with ordinality as p(path, ord);

  update public.memories set photo_path = v_paths[1] where id = p_memory;
end;
$$;
revoke execute on function public.set_memory_photos(uuid, text[]) from public, anon;
grant execute on function public.set_memory_photos(uuid, text[]) to authenticated;

-- Backfill: every existing single photo becomes photo #0.
insert into public.memory_photos (memory_id, space_id, path, position)
select id, space_id, photo_path, 0 from public.memories
where photo_path is not null
  and photo_path ~ ('^' || space_id::text || '/[0-9a-f-]{36}\.(webp|jpg|png)$')
on conflict (path) do nothing;
