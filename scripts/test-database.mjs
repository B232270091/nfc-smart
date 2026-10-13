import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// Executes the actual production migration against PostgreSQL compiled to WASM.
// Auth and Storage system tables are intentionally minimal fixtures. This is not
// a replacement for Supabase Auth, Storage HTTP, or browser integration tests.
const db = new PGlite();
let assertions = 0;
const eq = (actual, expected, label) => { assert.deepEqual(actual, expected, label); assertions++; };
const ok = (value, label) => { assert.ok(value, label); assertions++; };
const rejects = async (fn, pattern, label) => { await assert.rejects(fn, pattern, label); assertions++; };
const scalar = async (sql, args = []) => Object.values((await db.query(sql, args)).rows[0] ?? {})[0];
const ownerA = '11111111-1111-4111-8111-111111111111';
const ownerB = '22222222-2222-4222-8222-222222222222';
const staff = '33333333-3333-4333-8333-333333333333';
const admin = '44444444-4444-4444-8444-444444444444';
const as = async (role, userId, fn) => {
  assert.ok(['anon', 'authenticated', 'service_role'].includes(role));
  await db.exec(`set role ${role}`);
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId ?? '']);
  try { return await fn(); } finally { await db.exec('reset role'); }
};

try {
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create schema storage;
    create table auth.users (id uuid primary key, email text unique, created_at timestamptz default now());
    create function auth.uid() returns uuid language sql stable as
      $$select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid$$;
    grant usage on schema auth, public, storage to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
    create table storage.buckets (id text primary key, name text, public boolean default false, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text not null, unique(bucket_id,name));
    alter table storage.objects enable row level security;
    grant select,insert,update,delete on storage.objects to authenticated;
  `);
  const migrationNames = (await readdir(new URL('../supabase/migrations/', import.meta.url))).filter(n => n.endsWith('.sql')).sort();
  ok(migrationNames.length > 0, 'Production migration exists');
  for (const name of migrationNames) await db.exec(await readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8'));
  console.log(`Applied ${migrationNames.length} production migration(s) to PGlite PostgreSQL.`);

  for (const [id, email] of [[ownerA,'owner-a@example.test'],[ownerB,'owner-b@example.test'],[staff,'staff@example.test'],[admin,'admin@example.test']]) {
    await db.query('insert into auth.users(id,email) values ($1,$2)', [id,email]);
  }
  await db.query('insert into private.platform_admins(user_id) values ($1)', [admin]);

  const orgA = await as('authenticated', ownerA, () => scalar("select public.create_organization('Cafe A','cafe-a')"));
  const orgB = await as('authenticated', ownerB, () => scalar("select public.create_organization('Cafe B','cafe-b')"));
  eq(await scalar('select count(*)::int from public.organization_members where role = $1', ['owner']), 2, 'Atomic owner enrollment');
  await as('anon', null, () => rejects(() => db.query("select public.create_organization('Intruder','intruder')"), /permission denied/, 'Anonymous cannot create an organization'));
  await as('authenticated', ownerA, async () => {
    eq(await scalar('select count(*)::int from public.organizations'), 1, 'Owner A only sees own tenant');
    eq((await db.query('update public.organizations set name = $1 where id = $2 returning id',['Hijacked',orgB])).rows.length, 0, 'Cross-tenant update changes no rows');
    await rejects(() => db.query("insert into public.organizations(name,slug) values ('Bad','bad')"), /permission denied/, 'Direct organization insert cannot bypass owner enrollment');
    await rejects(() => db.query('insert into public.organization_members(organization_id,user_id,role) values ($1,$2,$3)',[orgB,ownerA,'owner']), /permission denied/, 'Cannot enroll self into another organization');
    await rejects(() => db.query('select public.remove_organization_member($1,$2)',[orgA,ownerA]), /at least one owner/, 'Cannot remove last owner');
    await rejects(() => db.query("select public.upsert_organization_member($1,'owner-a@example.test','staff','{}')",[orgA]), /at least one owner/, 'Cannot demote last owner');
    await db.query("select public.upsert_organization_member($1,'staff@example.test','staff',array['menu'])",[orgA]);
  });

  const pageA = await as('authenticated', ownerA, () => scalar("insert into public.pages(organization_id,slug,title,type) values ($1,'menu-a','Menu A','menu') returning id",[orgA]));
  const pageB = await as('authenticated', ownerB, () => scalar("insert into public.pages(organization_id,slug,title,type,is_published) values ($1,'menu-b','Menu B','menu',true) returning id",[orgB]));
  const companyA = await as('authenticated', ownerA, () => scalar("insert into public.pages(organization_id,slug,title,type,is_published,content) values ($1,'company-a','Company A','company',true,'{\"services\":[\"Coffee\"],\"internal_note\":\"never expose\"}') returning id",[orgA]));
  const categoryA = await as('authenticated', ownerA, () => scalar("insert into public.menu_categories(organization_id,name) values ($1,'Кофе') returning id",[orgA]));
  const categoryB = await as('authenticated', ownerB, () => scalar("insert into public.menu_categories(organization_id,name) values ($1,'Tea') returning id",[orgB]));
  const itemA = await as('authenticated', staff, () => scalar("insert into public.menu_items(organization_id,category_id,name_mn,price_mnt,is_published) values ($1,$2,'Латте',12000,true) returning id",[orgA,categoryA]));

  await as('authenticated', staff, async () => {
    eq(await scalar('select count(*)::int from public.menu_items'),1,'Explicit menu permission allows own menu data');
    eq(await scalar("select count(*)::int from public.pages where type = 'company'"),0,'Menu-only staff cannot read company drafts/private rows');
    eq((await db.query('update public.organizations set name = $1 where id = $2 returning id',['Not permitted',orgA])).rows.length,0,'Staff cannot modify branding');
    await rejects(() => db.query("update public.organization_members set role = 'owner' where user_id = $1",[staff]), /permission denied/, 'Staff cannot grant ownership directly');
    await rejects(() => db.query("select public.upsert_organization_member($1,'staff@example.test','owner','{}')",[orgA]), /Owner access required/, 'Staff cannot grant ownership through RPC');
    await rejects(() => db.query('select public.remove_organization_member($1,$2)',[orgA,ownerA]), /Owner access required/, 'Staff cannot remove owner');
    await rejects(() => db.query("insert into public.pages(organization_id,slug,title,type) values ($1,'staff-company','Company','company')",[orgA]), /row-level security/, 'Menu-only staff cannot create company pages');
    await rejects(() => db.query("update public.pages set type = 'company' where id = $1",[pageA]), /row-level security/, 'Menu-only staff cannot change menu into company page');
    await rejects(() => db.query("insert into public.nfc_cards(organization_id,page_id,name) values ($1,$2,'Card')",[orgA,pageA]), /row-level security/, 'Menu-only staff cannot create cards');
    await rejects(() => db.query("insert into public.menu_items(organization_id,category_id,name_mn,price_mnt) values ($1,$2,'Wrong tenant',100)",[orgB,categoryB]), /row-level security/, 'Staff cannot insert another tenant item');
    await rejects(() => db.query("insert into public.menu_items(organization_id,category_id,name_mn,price_mnt) values ($1,$2,'Wrong category',100)",[orgA,categoryB]), /foreign key constraint/, 'Composite category FK rejects cross-tenant relationships');
    await rejects(() => db.query('update public.menu_items set organization_id = $1 where id = $2',[orgB,itemA]), /Organization assignment is immutable/, 'Cannot reassign tenant records');
    await rejects(() => db.query('select public.list_platform_users()'), /Platform admin required/, 'Staff cannot list platform auth users');
    await rejects(() => db.query('insert into private.platform_admins(user_id) values ($1)',[staff]), /permission denied/, 'Staff cannot become a platform admin');
    eq(await scalar('select public.is_platform_admin()'),false,'Untrusted user metadata never grants admin');
  });

  const card = await as('authenticated', ownerA, async () => {
    await rejects(() => db.query("insert into public.nfc_cards(organization_id,page_id,name) values ($1,$2,'Foreign card')",[orgA,pageB]), /foreign key constraint/, 'Composite page FK rejects cross-tenant destinations');
    return (await db.query("insert into public.nfc_cards(organization_id,page_id,name,code) values ($1,$2,'Front counter','aaaaaaaaaaaaaaaaaaaaaaaa') returning id,code",[orgA,pageA])).rows[0];
  });
  ok(/^[a-f0-9]{24}$/.test(card.code),'Card code is a 24-char secure hex identifier');
  ok(card.code !== 'aaaaaaaaaaaaaaaaaaaaaaaa','Database overrides caller-supplied codes');
  await as('authenticated', ownerA, async () => {
    await rejects(() => db.query("update public.nfc_cards set code = 'bbbbbbbbbbbbbbbbbbbbbbbb' where id = $1",[card.id]), /NFC code is immutable/, 'NFC code cannot change');
    await rejects(() => db.query('update public.nfc_cards set organization_id = $1, page_id = $2 where id = $3',[orgB,pageB,card.id]), /Only platform administrators/, 'Owner cannot transfer cards between tenants');
    await rejects(() => db.query('select public.reassign_nfc_card($1,$2,$3)',[card.id,orgB,pageB]), /Platform admin required/, 'Transfer RPC enforces platform admin');
  });

  await as('anon', null, async () => {
    for (const table of ['organizations','organization_members','pages','menu_categories','menu_items','nfc_cards','scan_events']) {
      await rejects(() => db.query(`select * from public.${table}`), /permission denied/, `Anonymous cannot directly list ${table}`);
    }
    eq(await scalar("select public.get_public_page('menu-a')"),null,'Unpublished menu unavailable');
    eq(await scalar('select public.resolve_nfc_card($1)',[card.code]),null,'Card cannot resolve to draft page');
    const company = await scalar("select public.get_public_page('company-a')");
    eq(company.page.content,{ services: ['Coffee'] },'Public content projection omits unrecognized/private keys');
    eq(company.items,[],'Company page does not disclose organization menu items');
    eq(company.organization.created_at,undefined,'Public organization projection excludes private audit fields');
    await rejects(() => db.query('select public.record_scan($1,$2,$3)',[card.code,'qr','a'.repeat(64)]), /permission denied/, 'Anonymous cannot forge analytics');
  });

  await as('authenticated', ownerA, () => db.query('update public.pages set is_published = true where id = $1',[pageA]));
  await as('anon', null, async () => {
    eq(await scalar('select public.resolve_nfc_card($1)',[card.code]),'menu-a','Permanent NFC URL resolves published destination');
    const result = await scalar("select public.get_public_page('menu-a')");
    eq(result.items[0].price_mnt,12000,'Published menu includes integer price');
    eq(result.items[0].name_mn,'Латте','Mongolian text survives round trip');
  });
  await as('authenticated', staff, () => db.query('update public.menu_items set price_mnt = 15000, is_available = false where id = $1',[itemA]));
  await as('anon', null, async () => {
    eq(await scalar('select public.resolve_nfc_card($1)',[card.code]),'menu-a','Same code continues resolving after update');
    const result = await scalar("select public.get_public_page('menu-a')");
    eq(result.items[0].price_mnt,15000,'Public page immediately reads updated price');
    eq(result.items[0].is_available,false,'Unavailable items are displayed with explicit availability');
  });
  await as('authenticated', ownerA, async () => {
    await db.query('update public.nfc_cards set page_id = $1 where id = $2',[companyA,card.id]);
  });
  await as('anon', null, () => scalar('select public.resolve_nfc_card($1)',[card.code])).then(value => eq(value,'company-a','Same card code resolves newly assigned destination'));

  await as('service_role', null, async () => {
    eq(await scalar('select public.record_scan($1,$2,$3)',[card.code,'qr','a'.repeat(64)]),true,'Server records eligible event');
    eq(await scalar('select public.record_scan($1,$2,$3)',[card.code,'unknown','a'.repeat(64)]),false,'Atomic rate limit rejects repeated fingerprint');
    eq(await scalar('select public.record_scan($1,$2,$3)',[card.code,'unknown','b'.repeat(64)]),true,'Different fingerprint can record eligible open');
    eq(await scalar('select public.record_scan($1,$2,$3)',[card.code,'nfc','c'.repeat(64)]),false,'Unprovable NFC attribution rejected');
    eq(await scalar('select public.record_scan($1,$2,$3)',[card.code,'qr','192.0.2.1']),false,'Raw IP rejected as fingerprint');
  });
  await as('authenticated', ownerA, () => scalar('select count(*)::int from public.scan_events')).then(value => eq(value,2,'Owner analytics include recorded opens'));
  await as('authenticated', ownerB, () => scalar('select count(*)::int from public.scan_events')).then(value => eq(value,0,'Other tenant cannot read analytics'));
  await as('authenticated', staff, async () => {
    eq(await scalar('select count(*)::int from public.scan_events'),0,'Menu-only staff cannot read analytics');
    await rejects(() => db.query('select public.record_scan($1,$2,$3)',[card.code,'qr','c'.repeat(64)]), /permission denied/, 'Authenticated browser cannot forge analytics');
  });

  const imagePath = `${orgA}/menu/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp`;
  const draftPath = `${orgA}/pages/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.png`;
  await as('authenticated', ownerA, async () => {
    await db.query('update public.menu_items set image_path = $1 where id = $2',[imagePath,itemA]);
    await db.query("insert into storage.objects(bucket_id,name) values ('organization-assets',$1)",[draftPath]);
    await rejects(() => db.query('update public.organizations set logo_path = $1 where id = $2',[`${orgA}/branding/../../${orgB}/menu/private.png`,orgA]), /check constraint/, 'Database rejects traversal-shaped organization image references');
    await rejects(() => db.query('update public.menu_items set image_path = $1 where id = $2',[`${orgB}/menu/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp`,itemA]), /check constraint/, 'Database rejects another tenant image reference');
    await rejects(() => db.query('update public.pages set content = $1::jsonb where id = $2',[JSON.stringify({photo_path:`${orgA}/pages/../menu/private.png`}),companyA]), /check constraint/, 'Database rejects traversal-shaped page photo references');
  });
  await as('authenticated', staff, async () => {
    await db.query("insert into storage.objects(bucket_id,name) values ('organization-assets',$1)",[imagePath]);
    eq(await scalar('select count(*)::int from storage.objects'),1,'Menu staff can only read permitted asset scopes');
    await rejects(() => db.query("insert into storage.objects(bucket_id,name) values ('organization-assets',$1)",[`${orgB}/menu/cccccccc-cccc-4ccc-8ccc-cccccccccccc.webp`]), /row-level security/, 'Storage rejects cross-tenant uploads');
    await rejects(() => db.query("insert into storage.objects(bucket_id,name) values ('organization-assets',$1)",[`${orgA}/branding/cccccccc-cccc-4ccc-8ccc-cccccccccccc.webp`]), /row-level security/, 'Menu staff cannot modify branding assets');
    await rejects(() => db.query("insert into storage.objects(bucket_id,name) values ('organization-assets',$1)",[`${orgA}/menu/unsafe.svg`]), /row-level security/, 'Storage rejects SVG and unvalidated paths');
  });
  await as('anon', null, async () => {
    eq(await scalar('select public.get_public_asset($1)',[imagePath]),true,'Published active menu asset can be served');
    eq(await scalar('select public.get_public_asset($1)',[draftPath]),false,'Unreferenced private asset stays private');
    eq(await scalar('select public.get_public_asset($1)',[`${orgA}/menu/../private.png`]),false,'Public asset gate rejects noncanonical paths');
  });
  await as('authenticated', staff, () => db.query('update public.menu_categories set is_active = false where id = $1',[categoryA]));
  await as('anon', null, async () => {
    eq((await scalar("select public.get_public_page('menu-a')")).items,[],'Inactive category hides its items');
    eq(await scalar('select public.get_public_asset($1)',[imagePath]),false,'Inactive category hides its image assets');
  });
  await as('authenticated', ownerA, () => db.query('update public.organizations set is_active = false where id = $1',[orgA]));
  await as('anon', null, async () => {
    eq(await scalar("select public.get_public_page('company-a')"),null,'Inactive organization public page unavailable');
    eq(await scalar('select public.resolve_nfc_card($1)',[card.code]),null,'Inactive organization card cannot resolve');
  });
  await as('authenticated', ownerA, () => db.query('update public.organizations set is_active = true where id = $1',[orgA]));
  await as('authenticated', ownerA, () => db.query('update public.nfc_cards set is_active = false where id = $1',[card.id]));
  await as('anon', null, () => scalar('select public.resolve_nfc_card($1)',[card.code])).then(value => eq(value,null,'Disabled card cannot resolve'));
  await as('service_role', null, () => scalar('select public.record_scan($1,$2,$3)',[card.code,'qr','c'.repeat(64)])).then(value => eq(value,false,'Disabled card cannot record analytics'));

  await as('authenticated', admin, async () => {
    eq(await scalar('select public.is_platform_admin()'),true,'Trusted platform admin is recognized');
    eq(await scalar('select count(*)::int from public.organizations'),2,'Platform admin can manage all organizations');
    eq((await db.query('select * from public.list_platform_users()')).rows.length,4,'Admin-only users function works');
    await db.query('select public.reassign_nfc_card($1,$2,$3)',[card.id,orgB,pageB]);
    eq(await scalar('select code from public.nfc_cards where id = $1',[card.id]),card.code,'Admin transfer preserves permanent code');
    eq(await scalar('select organization_id from public.nfc_cards where id = $1',[card.id]),orgB,'Admin can transfer to authorized target organization/page');
  });
  await as('authenticated', ownerB, () => scalar('select count(*)::int from public.scan_events')).then(value => eq(value,0,'Card transfer does not expose previous tenant analytics'));
  await as('authenticated', ownerA, () => scalar('select count(*)::int from public.scan_events')).then(value => eq(value,2,'Historical analytics remain attributed to original tenant'));

  eq(await scalar("select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname in ('public','private') and c.relkind = 'r' and not c.relrowsecurity"),0,'Every application table has RLS enabled');
  eq(await scalar("select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prosecdef"),0,'No exposed-schema SECURITY DEFINER functions');
  // Phase 2: exercise the actual database as ordinary authenticated users.
  await as('authenticated', null, () => rejects(() => db.query("select public.create_organization('No session','no-session')"), /Authentication required/, 'Authenticated SQL role without a user cannot create a workspace'));
  const beforeDuplicate = await scalar('select count(*)::int from public.organizations');
  await as('authenticated', ownerA, () => rejects(() => db.query("select public.create_organization('Duplicate','cafe-a')"), /duplicate key/, 'Duplicate slug fails atomically'));
  eq(await scalar('select count(*)::int from public.organizations'), beforeDuplicate, 'Duplicate slug leaves no orphan organization');
  const secondOrg = await as('authenticated', ownerA, () => scalar("select public.create_organization('Second workspace','second-workspace')"));
  await as('authenticated', ownerA, async () => {
    eq(await scalar('select count(*)::int from public.organizations'), 2, 'One user can access multiple owned workspaces');
    eq(await scalar('select role from public.organization_members where organization_id=$1 and user_id=$2', [secondOrg,ownerA]), 'owner', 'Second workspace creator is its owner');
    await db.query("update public.organizations set name='Шинэ нэр',phone='+976 99112233',email='hello@example.test',address='Улаанбаатар',website_url='https://example.test',primary_color='#087f8c' where id=$1",[secondOrg]);
    eq(await scalar('select name from public.organizations where id=$1',[secondOrg]), 'Шинэ нэр', 'Owner can edit Mongolian organization branding/contact details');
    await rejects(() => db.query("update public.organizations set website_url='https://user:secret@example.test' where id=$1",[secondOrg]), /organizations_contact_urls/, 'Database rejects credentials in contact URLs');
    await rejects(() => db.query("update public.organizations set phone=repeat('1',41) where id=$1",[secondOrg]), /organizations_profile_lengths/, 'Database enforces profile lengths even outside Server Actions');
    await rejects(() => db.query("update public.organizations set slug='invalid--slug' where id=$1",[secondOrg]), /organizations_canonical_slug/, 'Database rejects noncanonical slugs');
    await rejects(() => db.query("update public.organizations set name='   ' where id=$1",[secondOrg]), /organizations_nonblank_name/, 'Whitespace name rejected');
    await rejects(() => db.query('update public.organizations set id=gen_random_uuid() where id=$1',[secondOrg]), /immutable/, 'Organization ID is immutable');
  });
  await as('authenticated', ownerB, async () => {
    eq(await scalar('select count(*)::int from public.organizations where id=$1',[secondOrg]), 0, 'Second tenant cannot inspect new workspace');
    eq(await scalar('select count(*)::int from public.organization_members where organization_id=$1',[secondOrg]), 0, 'Second tenant cannot inspect private membership roster');
    eq((await db.query("update public.organizations set name='Attack' where id=$1 returning id",[secondOrg])).rows.length, 0, 'Second tenant cannot edit new workspace');
    await rejects(() => db.query("select public.upsert_organization_member($1,'owner-b@example.test','owner','{}')",[secondOrg]), /Owner access required/, 'Cannot promote self in another tenant via RPC');
  });
  // Force membership failure to prove both inserts roll back together, not just success-path enrollment.
  await db.exec(`create function private.test_reject_owner() returns trigger language plpgsql set search_path='' as $$
    begin if exists(select 1 from public.organizations where id=new.organization_id and slug='atomic-failure') then raise exception 'test enrollment failure'; end if; return new; end $$;
    create trigger test_reject_owner before insert on public.organization_members for each row execute function private.test_reject_owner();`);
  await as('authenticated', ownerA, () => rejects(() => db.query("select public.create_organization('Atomic failure','atomic-failure')"), /test enrollment failure/, 'Forced owner insert failure reaches caller'));
  eq(await scalar("select count(*)::int from public.organizations where slug='atomic-failure'"), 0, 'Failed owner enrollment rolls back organization insert');
  await db.exec('drop trigger test_reject_owner on public.organization_members; drop function private.test_reject_owner();');
  console.log(`PASS: ${assertions} database integration/security assertions.`);
} finally {
  await db.close();
}
