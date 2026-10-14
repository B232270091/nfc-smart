-- Read-only administrative search with authorization inside the database.
-- A separate name preserves compatibility with existing list_platform_users callers.
create function private.search_platform_users(p_query text default '', p_offset integer default 0, p_limit integer default 50)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_result jsonb;
begin
  if auth.uid() is null or not private.is_platform_admin() then
    raise exception 'Platform admin required' using errcode = '42501';
  end if;
  if p_query is null or length(p_query) > 254 or p_offset is null or p_offset < 0 or p_offset > 5000000
    or p_limit is null or p_limit < 1 or p_limit > 100 then
    raise exception 'Invalid pagination' using errcode = '22023';
  end if;
  with matching as materialized (
    select u.id, u.email::text, u.created_at from auth.users u
    where strpos(lower(coalesce(u.email, '')), lower(btrim(p_query))) > 0
  )
  select jsonb_build_object(
    'count', (select count(*) from matching),
    'users', coalesce((select jsonb_agg(to_jsonb(u) order by u.created_at desc, u.id)
      from (select * from matching order by created_at desc, id limit p_limit offset p_offset) u), '[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

create function public.search_platform_users(p_query text default '', p_offset integer default 0, p_limit integer default 50)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select private.search_platform_users(p_query, p_offset, p_limit);
$$;
revoke execute on function private.search_platform_users(text,integer,integer), public.search_platform_users(text,integer,integer) from public,anon,authenticated,service_role;
grant execute on function private.search_platform_users(text,integer,integer), public.search_platform_users(text,integer,integer) to authenticated;
