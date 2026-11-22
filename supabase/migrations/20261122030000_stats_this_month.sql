-- "This month" on the home page counts memories that happened this month (occurred_on),
-- not rows created this month: back-filling old memories no longer inflates it.
-- Rollback: re-run the space_stats definition from 20261122000000_init.sql.

create or replace function public.space_stats()
returns json language sql stable security invoker set search_path = '' as $$
  select json_build_object(
    'total',      (select count(*) from public.memories),
    'this_month', (select count(*) from public.memories
                   where occurred_on >= date_trunc('month', current_date)::date
                     and occurred_on <  (date_trunc('month', current_date) + interval '1 month')::date),
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
