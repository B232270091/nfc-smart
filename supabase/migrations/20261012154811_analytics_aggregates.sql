-- Aggregate in PostgreSQL so REST row limits cannot truncate analytics totals.
create index scan_events_created_idx on public.scan_events(created_at desc);

create function private.get_analytics(p_organization_id uuid, p_from date, p_to date) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_result jsonb;
begin
  if auth.uid() is null or (not private.is_platform_admin() and
      (p_organization_id is null or not private.has_permission(p_organization_id,'analytics'))) then
    raise exception 'Analytics permission required' using errcode = '42501';
  end if;
  if p_from is null or p_to is null or p_to < p_from or p_to - p_from > 365 then
    raise exception 'Date range must contain 1 to 366 days' using errcode = '22023';
  end if;
  with events as materialized (
    select e.* from public.scan_events e
    where (p_organization_id is null or e.organization_id = p_organization_id)
      and e.created_at >= (p_from::timestamp at time zone 'Asia/Ulaanbaatar')
      and e.created_at < ((p_to + 1)::timestamp at time zone 'Asia/Ulaanbaatar')
  ), card_totals as (
    select organization_id,card_id,count(*) as opens,
      count(*) filter (where source = 'qr') as qr,
      count(*) filter (where source = 'unknown') as unknown
    from events group by organization_id,card_id
  ), current_cards as (
    select c.* from public.nfc_cards c where p_organization_id is null or c.organization_id = p_organization_id
  ), cards as (
    select coalesce(c.id,t.card_id) as id,coalesce(c.organization_id,t.organization_id) as organization_id,
      c.name,c.code,c.is_active,coalesce(t.opens,0) as opens,coalesce(t.qr,0) as qr,coalesce(t.unknown,0) as unknown
    from current_cards c full join card_totals t on t.card_id = c.id and t.organization_id = c.organization_id
  ), daily as (
    select (created_at at time zone 'Asia/Ulaanbaatar')::date as day,count(*) as opens,
      count(*) filter (where source = 'qr') as qr,count(*) filter (where source = 'unknown') as unknown
    from events group by 1
  ), organizations as (
    select o.id,o.name,count(e.id) as opens,count(e.id) filter (where e.source = 'qr') as qr,
      count(e.id) filter (where e.source = 'unknown') as unknown
    from public.organizations o left join events e on e.organization_id = o.id
    where p_organization_id is null or o.id = p_organization_id group by o.id,o.name
  )
  select jsonb_build_object(
    'totals',jsonb_build_object('opens',(select count(*) from events),'qr',(select count(*) from events where source = 'qr'),
      'unknown',(select count(*) from events where source = 'unknown'),
      'active_cards',(select count(*) from current_cards where is_active),
      'inactive_cards',(select count(*) from current_cards where not is_active)),
    'days',(select jsonb_agg(jsonb_build_object('date',d.day::date,'opens',coalesce(t.opens,0),'qr',coalesce(t.qr,0),'unknown',coalesce(t.unknown,0)) order by d.day)
      from generate_series(p_from::timestamp,p_to::timestamp,interval '1 day') d(day) left join daily t on t.day = d.day::date),
    'cards',coalesce((select jsonb_agg(to_jsonb(c) order by c.opens desc,c.id) from (select * from cards order by opens desc,id limit 100) c),'[]'::jsonb),
    'card_count',(select count(*) from cards),
    'organizations',coalesce((select jsonb_agg(to_jsonb(o) order by o.opens desc,o.id) from (select * from organizations order by opens desc,id limit 100) o),'[]'::jsonb),
    'organization_count',(select count(*) from organizations)
  ) into v_result;
  return v_result;
end;
$$;
create function public.get_analytics(p_organization_id uuid, p_from date, p_to date) returns jsonb
language sql stable security invoker set search_path = '' as $$ select private.get_analytics(p_organization_id,p_from,p_to); $$;
revoke execute on function private.get_analytics(uuid,date,date), public.get_analytics(uuid,date,date) from public,anon,authenticated,service_role;
grant execute on function private.get_analytics(uuid,date,date), public.get_analytics(uuid,date,date) to authenticated;
