import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

// Offline rehearsal only: no env files, credentials, network or hosted database.
// These minimal Auth/Storage fixtures do not emulate the hosted services.
const db = new PGlite();
const manifest = JSON.parse(await readFile(new URL('../docs/deployment/migration-manifest-2026-10-17.json', import.meta.url), 'utf8'));
const directory = new URL('../supabase/migrations/', import.meta.url);
const names = (await readdir(directory)).filter(name => name.endsWith('.sql')).sort();
assert.deepEqual(names, manifest.map(entry => entry.name));
const report = { kind: 'offline-synthetic-migration-rehearsal', productionContacted: false, realBackupRestored: false, migrations: [], checks: [] };
const check = (value, expected, description) => { assert.deepEqual(value, expected, description); report.checks.push(description); };
const rows = async sql => (await db.query(sql)).rows;
const authSnapshot = async () => ({ users: await rows('select * from auth.users order by id'), identities: await rows('select * from auth.identities order by id'), sessions: await rows('select * from auth.sessions order by id') });
try {
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create schema storage;
    create table auth.users (id uuid primary key, email text unique, encrypted_password text, email_confirmed_at timestamptz, raw_user_meta_data jsonb, created_at timestamptz default now());
    create table auth.identities (id uuid primary key, user_id uuid references auth.users, provider text, identity_data jsonb);
    create table auth.sessions (id uuid primary key, user_id uuid references auth.users);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid$$;
    grant usage on schema auth,public,storage to anon,authenticated,service_role;
    grant execute on function auth.uid() to anon,authenticated,service_role;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid primary key, bucket_id text references storage.buckets, name text);
    alter table storage.objects enable row level security;
    grant select,insert,update,delete on storage.objects to authenticated;
    insert into auth.users(id,email,encrypted_password,email_confirmed_at,raw_user_meta_data) values
      ('11111111-1111-4111-8111-111111111111','synthetic-one@example.test','SYNTHETIC_HASH_ONE',now(),'{"name":"fixture one"}'),
      ('22222222-2222-4222-8222-222222222222','synthetic-two@example.test','SYNTHETIC_HASH_TWO',now(),'{"name":"fixture two"}');
    insert into auth.identities select id,id,'email',jsonb_build_object('sub',id) from auth.users;
    insert into auth.sessions values
      ('33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111'),
      ('44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111'),
      ('55555555-5555-4555-8555-555555555555','22222222-2222-4222-8222-222222222222');
    insert into storage.buckets values
      ('organization-assets','organization-assets',true,2097152,array['image/jpeg','image/png','image/webp']),
      ('menu-images','menu-images',true,5242880,array['image/jpeg','image/png','image/webp']);
  `);
  const before = await authSnapshot();
  const legacyBucket = await rows("select * from storage.buckets where id='menu-images'");
  for (const entry of manifest) {
    const bytes = await readFile(new URL(entry.name, directory));
    check(createHash('sha256').update(bytes).digest('hex'), entry.sha256, `${entry.name}: reviewed checksum matches`);
    await db.exec('begin');
    try { await db.exec(bytes.toString('utf8')); await db.exec('commit'); }
    catch (error) { await db.exec('rollback'); throw error; }
    check(await authSnapshot(), before, `${entry.name}: users/password placeholders/identities/sessions unchanged`);
    report.migrations.push({ ...entry, status: 'passed' });
  }
  const tables = await rows("select c.relname,c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private') and c.relkind='r'");
  check(tables.length, 9, 'Nine app tables created');
  check(tables.every(table => table.relrowsecurity), true, 'All app tables have RLS');
  check((await rows("select * from pg_policies where schemaname in ('public','private','storage')")).length, 24, 'Twenty app and four Storage policies created');
  check(await rows("select * from storage.buckets where id='menu-images'"), legacyBucket, 'Legacy bucket unchanged');
  const bucket = (await rows("select * from storage.buckets where id='organization-assets'"))[0];
  check(bucket.public, false, 'Existing organization-assets becomes private');
  check(Number(bucket.file_size_limit), 5242880, 'Existing organization-assets ceiling becomes 5 MiB');
  check((await rows('select * from storage.objects')).length, 0, 'Storage objects unchanged');
  check((await rows("select * from pg_constraint where conrelid='public.organizations'::regclass and not convalidated")).length, 4, 'Four NOT VALID profile constraints retained as reviewed');
  check((await rows('select * from private.platform_admins')).length, 0, 'No administrator enrolled');
  check((await rows('select * from public.organizations')).length, 0, 'No seed organizations inserted');
  await writeFile(new URL('../docs/deployment/migration-rehearsal-2026-10-17.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
  console.log(`PASS: ${report.migrations.length} migrations, ${report.checks.length} checks; synthetic Auth rows preserved. No production connection.`);
} finally { await db.close(); }
