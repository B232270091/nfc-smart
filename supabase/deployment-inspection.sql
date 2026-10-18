begin read only;
select jsonb_build_object(
'tables',coalesce((select jsonb_agg(jsonb_build_object('schema',n.nspname,'name',c.relname,'rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity) order by n.nspname,c.relname) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private') and c.relkind in ('r','p')),'[]'),
'columns',coalesce((select jsonb_agg(jsonb_build_object('schema',table_schema,'table',table_name,'column',column_name,'type',udt_name,'nullable',is_nullable,'default',column_default) order by table_schema,table_name,ordinal_position) from information_schema.columns where table_schema in ('public','private')),'[]'),
'constraints',coalesce((select jsonb_agg(jsonb_build_object('schema',n.nspname,'table',c.relname,'name',p.conname,'definition',pg_get_constraintdef(p.oid),'validated',p.convalidated) order by n.nspname,c.relname,p.conname) from pg_constraint p join pg_class c on c.oid=p.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private')),'[]'),
'indexes',coalesce((select jsonb_agg(to_jsonb(i) order by schemaname,tablename,indexname) from pg_indexes i where schemaname in ('public','private')),'[]'),
'functions',coalesce((select jsonb_agg(jsonb_build_object('schema',n.nspname,'name',p.proname,'args',pg_get_function_identity_arguments(p.oid),'definer',p.prosecdef,'config',p.proconfig,'acl',p.proacl,'definition',pg_get_functiondef(p.oid)) order by n.nspname,p.proname,pg_get_function_identity_arguments(p.oid)) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.prokind='f'),'[]'),
'policies',coalesce((select jsonb_agg(to_jsonb(p) order by schemaname,tablename,policyname) from pg_policies p where schemaname in ('public','private','storage')),'[]'),
'grants',coalesce((select jsonb_agg(to_jsonb(g) order by table_schema,table_name,grantee,privilege_type) from information_schema.role_table_grants g where table_schema in ('public','private','storage') and grantee in ('anon','authenticated','service_role','PUBLIC')),'[]'),
'triggers',coalesce((select jsonb_agg(jsonb_build_object('schema',n.nspname,'table',c.relname,'definition',pg_get_triggerdef(t.oid)) order by n.nspname,c.relname,t.tgname) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private') and not t.tgisinternal),'[]'),
'buckets',coalesce((select jsonb_agg(jsonb_build_object('id',id,'public',public,'file_size_limit',file_size_limit,'allowed_mime_types',allowed_mime_types) order by id) from storage.buckets),'[]'),
'auth_user_count',(select count(*) from auth.users),
'storage_object_count',(select count(*) from storage.objects)
) as snapshot;
commit;
