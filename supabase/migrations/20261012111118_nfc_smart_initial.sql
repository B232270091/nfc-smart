-- NFC Smart: run as the migration owner (postgres). Application roles never own tables.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;
alter default privileges in schema private revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from public;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$'),
  description text not null default '' check (char_length(description) <= 4000),
  logo_path text, cover_path text,
  phone text not null default '', email text not null default '', address text not null default '',
  maps_url text not null default '', facebook_url text not null default '',
  instagram_url text not null default '', website_url text not null default '',
  primary_color text not null default '#2563eb' check (primary_color ~ '^#[0-9a-fA-F]{6}$'),
  secondary_color text not null default '#06b6d4' check (secondary_color ~ '^#[0-9a-fA-F]{6}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (logo_path is null or logo_path ~ ('^' || id::text || '/branding/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$')),
  check (cover_path is null or cover_path ~ ('^' || id::text || '/branding/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$')),
  check (maps_url = '' or maps_url ~ '^https://'),
  check (facebook_url = '' or facebook_url ~ '^https://'),
  check (instagram_url = '' or instagram_url ~ '^https://'),
  check (website_url = '' or website_url ~ '^https://')
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  role text not null check (role in ('owner', 'staff')),
  permissions text[] not null default '{}' check (permissions <@ array['menu','pages','cards','analytics']::text[]),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);
create index organization_members_user_idx on public.organization_members(user_id, organization_id);

create table private.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$'),
  title text not null check (char_length(title) between 1 and 160),
  type text not null check (type in ('menu','company','business_card','links')),
  description text not null default '' check (char_length(description) <= 4000),
  content jsonb not null default '{}' check (jsonb_typeof(content) = 'object' and octet_length(content::text) <= 50000),
  is_published boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (organization_id, id),
  check (not (content ? 'photo_path') or content->>'photo_path' is null or content->>'photo_path' ~ ('^' || organization_id::text || '/pages/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'))
);
create index pages_org_idx on public.pages(organization_id, created_at desc);

create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  sort_order integer not null default 0 check (sort_order between 0 and 1000000),
  is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (organization_id, id)
);
create index menu_categories_org_sort_idx on public.menu_categories(organization_id, sort_order);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category_id uuid not null,
  name_mn text not null check (char_length(name_mn) between 1 and 160),
  name_en text not null default '' check (char_length(name_en) <= 160),
  description text not null default '' check (char_length(description) <= 2000),
  price_mnt bigint not null check (price_mnt between 0 and 1000000000000),
  image_path text,
  is_available boolean not null default true,
  is_published boolean not null default false,
  sort_order integer not null default 0 check (sort_order between 0 and 1000000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (organization_id, category_id) references public.menu_categories(organization_id, id) on delete restrict,
  check (image_path is null or image_path ~ ('^' || organization_id::text || '/menu/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'))
);
create index menu_items_org_category_sort_idx on public.menu_items(organization_id, category_id, sort_order);

create table public.nfc_cards (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  page_id uuid not null,
  code text not null unique check (code ~ '^[0-9a-f]{24}$'),
  name text not null check (char_length(name) between 1 and 120),
  is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (organization_id, page_id) references public.pages(organization_id, id) on delete restrict
);
create index nfc_cards_org_page_idx on public.nfc_cards(organization_id, page_id);

create table public.scan_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  card_id uuid not null references public.nfc_cards(id) on delete cascade,
  source text not null check (source in ('qr', 'unknown')),
  created_at timestamptz not null default now()
);
create index scan_events_org_created_idx on public.scan_events(organization_id, created_at desc);
create index scan_events_card_created_idx on public.scan_events(card_id, created_at desc);

-- Short-lived HMAC digests only. Never put raw IP or user-agent data here.
create table private.scan_rate_limits (
  card_id uuid not null references public.nfc_cards(id) on delete cascade,
  fingerprint text not null check (fingerprint ~ '^[0-9a-f]{64}$'),
  last_seen_at timestamptz not null default now(),
  primary key (card_id, fingerprint)
);
create index scan_rate_limits_expiry_idx on private.scan_rate_limits(last_seen_at);

create function private.is_platform_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (select 1 from private.platform_admins where user_id = (select auth.uid()));
$$;
create function private.is_member(p_organization_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and (private.is_platform_admin() or exists (
    select 1 from public.organization_members where organization_id = p_organization_id and user_id = (select auth.uid())
  ));
$$;
create function private.has_permission(p_organization_id uuid, p_permission text default null) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and (private.is_platform_admin() or exists (
    select 1 from public.organization_members where organization_id = p_organization_id and user_id = (select auth.uid())
      and (role = 'owner' or (p_permission is not null and p_permission = any(permissions)))
  ));
$$;
create function public.is_platform_admin() returns boolean language sql stable security invoker set search_path = '' as $$
  select private.is_platform_admin();
$$;

create function private.touch_row() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.id is distinct from old.id then raise exception 'Record IDs are immutable' using errcode = '42501'; end if;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;
create function private.keep_tenant() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.organization_id is distinct from old.organization_id then
    raise exception 'Organization assignment is immutable' using errcode = '42501';
  end if;
  return new;
end;
$$;
create function private.guard_card() returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    -- Each independent prefix contains 48 random bits; version/variant bits occur later.
    new.code := substr(replace(gen_random_uuid()::text, '-', ''), 1, 12) || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  else
    if new.code is distinct from old.code then raise exception 'NFC code is immutable' using errcode = '42501'; end if;
    if new.organization_id is distinct from old.organization_id and not private.is_platform_admin() then
      raise exception 'Only platform administrators can transfer cards' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

do $$ declare t text; begin
  foreach t in array array['organizations','pages','menu_categories','menu_items','nfc_cards'] loop
    execute format('create trigger touch_row before update on public.%I for each row execute function private.touch_row()', t);
  end loop;
  foreach t in array array['pages','menu_categories','menu_items'] loop
    execute format('create trigger keep_tenant before update on public.%I for each row execute function private.keep_tenant()', t);
  end loop;
end $$;
create trigger guard_card before insert or update on public.nfc_cards for each row execute function private.guard_card();

-- Membership mutations are only available via checked functions; no direct writes.
create function private.create_organization(p_name text, p_slug text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_user uuid := auth.uid();
begin
  if v_user is null or not exists (select 1 from auth.users where id = v_user) then raise exception 'Authentication required' using errcode = '42501'; end if;
  insert into public.organizations(name, slug) values (btrim(p_name), lower(btrim(p_slug))) returning id into v_id;
  insert into public.organization_members(organization_id, user_id, role) values (v_id, v_user, 'owner');
  return v_id;
end;
$$;
create function public.create_organization(p_name text, p_slug text) returns uuid
language sql security invoker set search_path = '' as $$ select private.create_organization(p_name, p_slug); $$;

create function private.upsert_organization_member(p_organization_id uuid, p_email text, p_role text, p_permissions text[]) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_user uuid; v_old_role text;
begin
  -- Row lock serializes all membership operations and preserves the last owner.
  perform 1 from public.organizations where id = p_organization_id for update;
  if not private.has_permission(p_organization_id) then raise exception 'Owner access required' using errcode = '42501'; end if;
  select id into v_user from auth.users where lower(email) = lower(btrim(p_email));
  if v_user is null then raise exception 'User must register first' using errcode = '22023'; end if;
  if p_role not in ('owner','staff') or p_permissions is null or not (p_permissions <@ array['menu','pages','cards','analytics']::text[]) then
    raise exception 'Invalid role or permissions' using errcode = '22023';
  end if;
  select role into v_old_role from public.organization_members where organization_id = p_organization_id and user_id = v_user;
  if v_old_role = 'owner' and p_role <> 'owner' and (select count(*) from public.organization_members where organization_id = p_organization_id and role = 'owner') <= 1 then
    raise exception 'Organization requires at least one owner' using errcode = '23514';
  end if;
  insert into public.organization_members(organization_id, user_id, role, permissions)
    values (p_organization_id, v_user, p_role, case when p_role = 'owner' then '{}'::text[] else p_permissions end)
    on conflict (organization_id, user_id) do update set role = excluded.role, permissions = excluded.permissions;
  return v_user;
end;
$$;
create function public.upsert_organization_member(p_organization_id uuid, p_email text, p_role text, p_permissions text[]) returns uuid
language sql security invoker set search_path = '' as $$ select private.upsert_organization_member(p_organization_id,p_email,p_role,p_permissions); $$;

create function private.remove_organization_member(p_organization_id uuid, p_user_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.organizations where id = p_organization_id for update;
  if not private.has_permission(p_organization_id) then raise exception 'Owner access required' using errcode = '42501'; end if;
  if exists (select 1 from public.organization_members where organization_id = p_organization_id and user_id = p_user_id and role = 'owner')
    and (select count(*) from public.organization_members where organization_id = p_organization_id and role = 'owner') <= 1 then
    raise exception 'Organization requires at least one owner' using errcode = '23514';
  end if;
  delete from public.organization_members where organization_id = p_organization_id and user_id = p_user_id;
end;
$$;
create function public.remove_organization_member(p_organization_id uuid, p_user_id uuid) returns void
language sql security invoker set search_path = '' as $$ select private.remove_organization_member(p_organization_id,p_user_id); $$;

create function private.reassign_nfc_card(p_card_id uuid, p_org_id uuid, p_page_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_platform_admin() then raise exception 'Platform admin required' using errcode = '42501'; end if;
  update public.nfc_cards set organization_id = p_org_id, page_id = p_page_id where id = p_card_id;
  if not found then raise exception 'Card not found' using errcode = '22023'; end if;
  delete from private.scan_rate_limits where card_id = p_card_id;
end;
$$;
create function public.reassign_nfc_card(p_card_id uuid, p_org_id uuid, p_page_id uuid) returns void
language sql security invoker set search_path = '' as $$ select private.reassign_nfc_card(p_card_id,p_org_id,p_page_id); $$;

create function private.list_platform_users() returns table(id uuid,email text,created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_platform_admin() then raise exception 'Platform admin required' using errcode = '42501'; end if;
  return query select u.id, u.email::text, u.created_at from auth.users u order by u.created_at desc limit 1000;
end;
$$;
create function public.list_platform_users() returns table(id uuid,email text,created_at timestamptz)
language sql stable security invoker set search_path = '' as $$ select * from private.list_platform_users(); $$;

-- Explicit public field projection; draft rows and membership data never leave these RPCs.
create function private.get_public_page(p_slug text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'organization', jsonb_build_object('id',o.id,'name',o.name,'slug',o.slug,'description',o.description,
      'logo_path',o.logo_path,'cover_path',o.cover_path,'phone',o.phone,'email',o.email,'address',o.address,
      'maps_url',o.maps_url,'facebook_url',o.facebook_url,'instagram_url',o.instagram_url,'website_url',o.website_url,
      'primary_color',o.primary_color,'secondary_color',o.secondary_color),
    'page', jsonb_build_object('id',p.id,'slug',p.slug,'title',p.title,'type',p.type,'description',p.description,
      'content',coalesce((select jsonb_object_agg(k,v) from jsonb_each(p.content) as x(k,v)
        where k in ('person_name','position','phone','email','website','services','links','photo_path')), '{}'::jsonb)),
    'categories',case when p.type = 'menu' then coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'sort_order',c.sort_order) order by c.sort_order,c.name)
      from public.menu_categories c where c.organization_id = o.id and c.is_active), '[]'::jsonb) else '[]'::jsonb end,
    'items',case when p.type = 'menu' then coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'category_id',i.category_id,
      'name_mn',i.name_mn,'name_en',i.name_en,'description',i.description,'price_mnt',i.price_mnt,'image_path',i.image_path,
      'is_available',i.is_available,'sort_order',i.sort_order) order by i.sort_order,i.name_mn)
      from public.menu_items i join public.menu_categories c on c.id = i.category_id and c.organization_id = i.organization_id
      where i.organization_id = o.id and i.is_published and c.is_active), '[]'::jsonb) else '[]'::jsonb end
  ) from public.pages p join public.organizations o on o.id = p.organization_id
    where p.slug = p_slug and p.is_published and o.is_active;
$$;
create function public.get_public_page(p_slug text) returns jsonb
language sql stable security invoker set search_path = '' as $$ select private.get_public_page(p_slug); $$;

create function private.resolve_nfc_card(p_code text) returns text
language sql stable security definer set search_path = '' as $$
  select p.slug from public.nfc_cards c join public.pages p on p.id = c.page_id and p.organization_id = c.organization_id
    join public.organizations o on o.id = c.organization_id
    where c.code = p_code and c.is_active and p.is_published and o.is_active;
$$;
create function public.resolve_nfc_card(p_code text) returns text
language sql stable security invoker set search_path = '' as $$ select private.resolve_nfc_card(p_code); $$;

create function private.get_public_asset(p_path text) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_path is not null and p_path ~ '^[0-9a-f-]{36}/(branding|menu|pages)/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$' and exists (
    select 1 from public.organizations o join public.pages p on p.organization_id = o.id
    where o.is_active and p.is_published and (
      p_path in (o.logo_path,o.cover_path)
      or (p.content->>'photo_path' = p_path and p_path like o.id::text || '/pages/%')
      or (p.type = 'menu' and exists (select 1 from public.menu_items i
        join public.menu_categories c on c.id = i.category_id and c.organization_id = i.organization_id
        where i.organization_id = o.id and i.image_path = p_path and i.is_published and c.is_active))
    )
  );
$$;
create function public.get_public_asset(p_path text) returns boolean
language sql stable security invoker set search_path = '' as $$ select private.get_public_asset(p_path); $$;

create function private.record_scan(p_code text, p_source text, p_fingerprint text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_card uuid; v_org uuid; v_allowed boolean;
begin
  if p_source not in ('qr','unknown') or p_fingerprint is null or p_fingerprint !~ '^[0-9a-f]{64}$' then return false; end if;
  select c.id, c.organization_id into v_card, v_org from public.nfc_cards c
    join public.pages p on p.id = c.page_id and p.organization_id = c.organization_id
    join public.organizations o on o.id = c.organization_id
    where c.code = p_code and c.is_active and o.is_active and p.is_published for share of c, p, o;
  if v_card is null then return false; end if;
  insert into private.scan_rate_limits(card_id, fingerprint, last_seen_at) values (v_card, p_fingerprint, clock_timestamp())
    on conflict (card_id, fingerprint) do update set last_seen_at = excluded.last_seen_at
    where private.scan_rate_limits.last_seen_at < clock_timestamp() - interval '1 minute'
    returning true into v_allowed;
  if not coalesce(v_allowed,false) then return false; end if;
  insert into public.scan_events(organization_id,card_id,source) values (v_org,v_card,p_source);
  -- Opportunistic cleanup bounds retention without requiring the cron extension.
  delete from private.scan_rate_limits where last_seen_at < now() - interval '1 day';
  return true;
end;
$$;
create function public.record_scan(p_code text, p_source text, p_fingerprint text) returns boolean
language sql security invoker set search_path = '' as $$ select private.record_scan(p_code,p_source,p_fingerprint); $$;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.pages enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.nfc_cards enable row level security;
alter table public.scan_events enable row level security;
alter table private.platform_admins enable row level security;
alter table private.scan_rate_limits enable row level security;

create policy organizations_read on public.organizations for select to authenticated using (private.is_member(id));
create policy organizations_update on public.organizations for update to authenticated using (private.has_permission(id)) with check (private.has_permission(id));
create policy members_read on public.organization_members for select to authenticated using (user_id = (select auth.uid()) or private.has_permission(organization_id));
create policy pages_read on public.pages for select to authenticated using (private.has_permission(organization_id,'pages') or private.has_permission(organization_id,'cards') or (type = 'menu' and private.has_permission(organization_id,'menu')));
create policy pages_insert on public.pages for insert to authenticated with check (private.has_permission(organization_id,'pages') or (type = 'menu' and private.has_permission(organization_id,'menu')));
create policy pages_update on public.pages for update to authenticated using (private.has_permission(organization_id,'pages') or (type = 'menu' and private.has_permission(organization_id,'menu'))) with check (private.has_permission(organization_id,'pages') or (type = 'menu' and private.has_permission(organization_id,'menu')));
create policy pages_delete on public.pages for delete to authenticated using (private.has_permission(organization_id,'pages') or (type = 'menu' and private.has_permission(organization_id,'menu')));

do $$ declare t text; v_permission text; begin
  foreach t in array array['menu_categories','menu_items','nfc_cards'] loop
    v_permission := case when t = 'nfc_cards' then 'cards' else 'menu' end;
    execute format('create policy tenant_read on public.%I for select to authenticated using (private.has_permission(organization_id,%L))', t,v_permission);
    execute format('create policy tenant_insert on public.%I for insert to authenticated with check (private.has_permission(organization_id,%L))',t,v_permission);
    execute format('create policy tenant_update on public.%I for update to authenticated using (private.has_permission(organization_id,%L)) with check (private.has_permission(organization_id,%L))',t,v_permission,v_permission);
    execute format('create policy tenant_delete on public.%I for delete to authenticated using (private.has_permission(organization_id,%L))',t,v_permission);
  end loop;
end $$;
create policy scans_read on public.scan_events for select to authenticated using (private.has_permission(organization_id,'analytics'));

revoke all on public.organizations, public.organization_members, public.pages, public.menu_categories, public.menu_items, public.nfc_cards, public.scan_events from anon, authenticated;
grant select, update on public.organizations to authenticated;
grant select on public.organization_members, public.scan_events to authenticated;
grant select, insert, update, delete on public.pages, public.menu_categories, public.menu_items, public.nfc_cards to authenticated;
grant all on public.organizations, public.organization_members, public.pages, public.menu_categories, public.menu_items, public.nfc_cards, public.scan_events to service_role;
revoke all on all tables in schema private from public, anon, authenticated;

-- Never expose the private schema in Supabase API settings. Public wrappers are invoker functions.
revoke execute on all functions in schema private from public, anon, authenticated, service_role;
revoke execute on function public.is_platform_admin(), public.create_organization(text,text),
  public.upsert_organization_member(uuid,text,text,text[]), public.remove_organization_member(uuid,uuid),
  public.reassign_nfc_card(uuid,uuid,uuid), public.list_platform_users(), public.get_public_page(text),
  public.resolve_nfc_card(text), public.get_public_asset(text), public.record_scan(text,text,text) from public, anon, authenticated, service_role;
grant execute on function private.is_platform_admin(), private.is_member(uuid), private.has_permission(uuid,text) to authenticated;
grant execute on function public.is_platform_admin(), public.create_organization(text,text), private.create_organization(text,text),
  public.upsert_organization_member(uuid,text,text,text[]), private.upsert_organization_member(uuid,text,text,text[]),
  public.remove_organization_member(uuid,uuid), private.remove_organization_member(uuid,uuid),
  public.reassign_nfc_card(uuid,uuid,uuid), private.reassign_nfc_card(uuid,uuid,uuid),
  public.list_platform_users(), private.list_platform_users() to authenticated;
grant execute on function public.get_public_page(text), private.get_public_page(text), public.resolve_nfc_card(text),
  private.resolve_nfc_card(text), public.get_public_asset(text), private.get_public_asset(text) to anon, authenticated, service_role;
grant execute on function public.record_scan(text,text,text), private.record_scan(text,text,text) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('organization-assets','organization-assets',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false,file_size_limit = excluded.file_size_limit,allowed_mime_types = excluded.allowed_mime_types;

create function private.can_access_asset(p_name text, p_write boolean) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare v_org uuid; v_scope text;
begin
  if p_name !~ '^[0-9a-f-]{36}/(branding|menu|pages)/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$' then return false; end if;
  begin v_org := split_part(p_name,'/',1)::uuid; exception when invalid_text_representation then return false; end;
  v_scope := split_part(p_name,'/',2);
  if not p_write and v_scope = 'branding' then return private.is_member(v_org); end if;
  return private.has_permission(v_org,case when v_scope = 'branding' then null else v_scope end);
end;
$$;
revoke execute on function private.can_access_asset(text,boolean) from public, anon;
grant execute on function private.can_access_asset(text,boolean) to authenticated;
create policy organization_assets_read on storage.objects for select to authenticated using (bucket_id = 'organization-assets' and private.can_access_asset(name,false));
create policy organization_assets_insert on storage.objects for insert to authenticated with check (bucket_id = 'organization-assets' and private.can_access_asset(name,true));
create policy organization_assets_update on storage.objects for update to authenticated using (bucket_id = 'organization-assets' and private.can_access_asset(name,true)) with check (bucket_id = 'organization-assets' and private.can_access_asset(name,true));
create policy organization_assets_delete on storage.objects for delete to authenticated using (bucket_id = 'organization-assets' and private.can_access_asset(name,true));
