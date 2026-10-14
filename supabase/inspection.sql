-- Read-only schema inspection; never creates or modifies production records.
begin read only;
select table_name, row_security
from (
  select n.nspname || '.' || c.relname as table_name, c.relrowsecurity as row_security
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname in ('public','private') and c.relkind='r'
) tables order by table_name;

select n.nspname as schema_name,p.proname as function_name,p.prosecdef as security_definer,
       pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname in ('public','private') and p.proname in
  ('create_organization','get_public_page','resolve_nfc_card','get_analytics','search_platform_users','record_scan')
order by schema_name,function_name;

select schemaname,tablename,policyname,cmd,roles from pg_policies
where schemaname in ('public','private','storage') order by schemaname,tablename,policyname;
select id,public,file_size_limit,allowed_mime_types from storage.buckets where id='organization-assets';
commit;
