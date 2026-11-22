-- Explicit table privileges for signed-in users.
-- Newer Supabase projects no longer grant anon/authenticated access to new public tables
-- automatically, so 20261122000000_init.sql left `authenticated` with no table privileges
-- (every query failed with 42501 before RLS was even evaluated).
-- RLS policies from the init migration still decide WHICH rows are visible/writable;
-- these grants only decide which operations are possible at all. `anon` gets nothing.
-- Additive only: no data is changed. Rollback = the matching REVOKE statements.

grant select on public.profiles      to authenticated;   -- update (display_name) granted in init
grant select on public.spaces        to authenticated;   -- update (name, together_since) granted in init
grant select on public.space_members to authenticated;   -- writes only via create_space / join_space

grant select, insert, delete on public.categories  to authenticated;  -- update (name, position) granted in init
grant select, insert, delete on public.tags        to authenticated;  -- update (name) granted in init
grant select, insert, delete on public.memory_tags to authenticated;
grant select, insert, delete on public.favorites   to authenticated;

grant select, insert, delete on public.memories to authenticated;
-- Only content columns are editable; space_id / author_id / timestamps are not
-- (the memories_guard trigger also enforces this).
grant update (title, quote, story, occurred_on, category_id, photo_path) on public.memories to authenticated;
