# NFC Smart — migration-ийн өмнөх backup ба recovery

Огноо: **2026-10-17**. Зөвхөн production read-only шалгалт, local simulation хийсэн. Production database, Auth, Storage тохиргоо/өгөгдөлд бичилт хийгээгүй.

**Дүгнэлт: backup/recovery аргачлал бэлэн; бодит backup export болон restore баталгаа хараахан байхгүй. Production migration NO-GO хэвээр.**

Энэ тайлан нь [өмнөх deployment тайлангийн](production-deployment-preparation.md) backup plan тодорхойгүй байсан хэсгийг шинэчилнэ. Нотолгоо: [read-only baseline](deployment/recovery-baseline-2026-10-17.json), [migration rehearsal](deployment/migration-rehearsal-2026-10-17.json), [migration SHA-256](deployment/migration-manifest-2026-10-17.json).

## 1. Free Plan ба бодит боломж

Supabase organization API `NFC Smart / fsmtzwmlrfkqdhjxciww`-ийн `plan=free`, `tier=tier_free` гэж буцаасан. Production ref: **`xcsnkvoulmrpxoxcjuvl`**. Test ref: `khohnhjjyetwuzfsttkl`.

| Боломж | Энэ төсөлд хэрэглэх дүгнэлт |
|---|---|
| Dashboard-аас удирдах автомат daily backup | Free-ийн баталгаатай recoverable backup гэж найдахгүй. Албан ёсны daily backup эрх нь paid plan-д хамаарна. |
| PITR | Free-д байхгүй; paid plan болон нэмэлт тохиргоо/төлбөр шаарддаг. Upgrade хийгээгүй. |
| Manual logical export | Free дээр database connection эрхээр боломжтой; энэ төслийн сонгосон үндсэн арга. |
| Storage binary backup | Database dump-аас тусдаа шаардлагатай. |
| Recovery cloud project | Free нь 2 active project хязгаартай; production/test хоёр байгаа тул гурав дахь үнэгүй active project боломжтой гэж тооцохгүй. |
| Inactivity | Free project нэг долоо хоног идэвхгүй бол pause болж болох тул тасралтгүй production availability-г үүгээр батлахгүй. |

[Supabase backup нөхцөл](https://supabase.com/docs/guides/platform/backups), [Free Plan хязгаар](https://supabase.com/pricing).

Төслийн backend дотор Supabase өөрийн internal backup хадгалдаг эсэхийг хэрэглэгч ашиглаж болох restore эрхтэй андуурахгүй. Одоогийн tool-д backup-list endpoint байхгүй, Management PAT байхгүй тул яг энэ төслийн snapshot жагсаалтыг хараагүй. Гараар [Production Dashboard](https://supabase.com/dashboard/project/xcsnkvoulmrpxoxcjuvl) → Database → Backups дээр available/upgrade шаардсан төлөвийг тулгана. Үүнийг manual export-ийг орлуулах нотолгоо гэж үзэхгүй.

## 2. Одоо хадгалах ёстой өгөгдөл

Read-only SQL-аар, email/UUID/password hash/token-ийг гаргалгүйгээр дараах агрегатыг шалгасан:

| Объект | Одоогийн байдал |
|---|---|
| Auth users | 2 |
| Email identities | 2 |
| Email confirmed users | 2 |
| Password hash-тай users | 2 |
| Auth sessions | 3; export хүртэл өөрчлөгдөж болно |
| Auth refresh tokens | 4; утгуудыг уншиж гаргаагүй |
| MFA factors | 0 |
| Auth schema-ийн хүснэгт | 27 |
| App public/private хүснэгт | 0 |
| Migration history | 0; `supabase_migrations.schema_migrations` хүснэгт одоогоор байхгүй |
| Storage buckets | 2 |
| Storage object metadata | 0 |
| Vector bucket/index, multipart upload/part | бүгд 0 |
| Storage policies | 0 |
| Vault secrets | 0 |

Нэвтрэх боломжийг хадгалах гол зүйл нь `auth.users`-ийн **анхны UUID, encrypted_password, email confirmation, metadata** болон `auth.identities`-ийн холбоос. Зөвхөн email CSV эсвэл Auth Admin `listUsers()` JSON нь password hash-ийг бүрэн сэргээх backup биш. Хэрэглэгчийг шинэ UUID-тай дахин signup хийх арга сонгохгүй. [Auth шилжүүлэх тайлбар](https://supabase.com/docs/guides/self-hosting/restore-from-platform).

## 3. Backup coverage

Суулгасан Supabase CLI **2.120.0**-ийн `db dump --dry-run`-ийг **бодит credential-гүй localhost fixture URL** дээр шалгасан. Тэнд хэвлэгдсэн pg_dump filter-ээс:

- Default schema dump нь `auth`, `storage`, `supabase_migrations`, `vault` DDL-ийг хасна.
- Default `--data-only --use-copy` нь Auth болон Storage data-г хамруулна. `auth.schema_migrations`, `storage.migrations` зэрэг platform migration хүснэгтүүдийг хасна.
- `--schema auth --data-only --use-copy` нь Auth data-г тусад нь авна; managed `auth.schema_migrations` хасагдана.
- Default data dump-д app migration history болон Vault орохгүй.

**Анхаарах бодит зан төлөв:** `db dump --dry-run` нь connection script дотор `PGPASSWORD`-ийг хэвлэдэг. Жинхэнэ password-тай энэ dry-run-ийг chat/tool log/CI output-д бүү ажиллуул. Энд зөвхөн `fixture` гэсэн хиймэл password хэрэглэсэн.

| Backup хэсэг | Авах artifact | Баталгаажуулах зүйл |
|---|---|---|
| App schema/RLS/function/trigger/index/default privilege | `schema.sql` + catalog snapshot + migration файлууд | Production app хүснэгт 0 байсан ч role/default privilege мэдээлэл шаардлагатай. |
| Auth users/password hashes/identities | `data.sql` | COPY хэсэгт users/identities багтсан, restore дараа 2/2 болон UUID/hash equality таарсан байх. |
| Session/refresh token/MFA/бусад Auth state | `data.sql` | 27 хүснэгтийн coverage-г managed migration exclusion-тай тулгана. Хоосон хүснэгтүүдийг орхигдуулсан гэж буруу тооцохгүй. |
| Storage buckets/objects metadata | `data.sql` | 2 bucket visibility, MIME/size тохиргоо; 0 object. |
| Auth/Storage managed DDL | Source schema catalog/version reference | Target дээр Supabase service өөрөө compatible schema-г үүсгэсэн байх; default schema.sql үүнийг сэргээхгүй. |
| Auth/Storage custom DDL | Нэмэлт review/export | Одоогоор app Storage policy 0, Auth custom trigger илрээгүй. Storage-ийн 7 trigger нь platform функцүүдийг дууддаг; бүгдийг app trigger гэж хуулж болохгүй. Migration-ийн дараа Storage custom policy нэмэгдэх тул цааш тусад нь хадгална. |
| Roles/grants | `roles.sql` + catalog grants | Reserved role болон custom role password-уудыг автоматаар бүрэн сэргээнэ гэж үзэхгүй. |
| App migration history | Одоогоор empty baseline; дараа `history_schema.sql`, `history_data.sql` | Одоо байхгүй schema-г export хийх гэж хүчээр үүсгэхгүй. |
| Storage binary | Object manifest + тусдаа file backup | Одоо 0; export мөчид дахин тоолно. DB dump нь binary-г агуулахгүй. |
| Vault/encryption root key | Тусдаа secret recovery журам | Vault 0, pgsodium extension илрээгүй. Шинээр encryption нэмэгдвэл энэ дүгнэлт хүчингүй. |
| Auth Site URL/redirect/SMTP/OAuth/MFA/rate limits | Non-secret settings record + secret-manager reference | SQL dump-ийн хэсэг биш. Local `supabase/config.toml` нь hosted тохиргооны backup биш. |
| JWT signing/API keys | Шинэ target key + cutover төлөвлөгөө | Recovery target-д production signing key-г хуулж live token-ийг хүчинтэй болгохгүй. Дахин login шаардлагатай байж болно. |
| Vercel env/alias, Resend DNS/sender, Edge Functions | Тусдаа inventory | Web app backup, Supabase DB backup хоёр өөр хамрах хүрээтэй. Edge Function бүртгэлийг энэ шатанд бүрэн тоолоогүй. |

`data.sql` нь password hash болон token агуулж болох **нууц backup**. Git, cloud share link, чат, test report-д оруулахгүй. Шифрлэсэн локал volume/folder болон хандалт хязгаарласан шифрлэсэн off-site хоёр хувь хадгална. SHA-256 нь integrity шалгалт болохоос encryption биш.

## 4. Таны гараар бэлтгэх зүйл

1. **Одоо байгаа production DB password-ийг** password manager-аас олно. API publishable/secret key нь DB password биш. Password мартсан бол энэ шатанд reset хийхгүй — тэр нь production өөрчлөлт тул тусдаа зөвшөөрөл хэрэгтэй.
2. Production Dashboard → **Connect → Session pooler**-ийн host, port, username-ийг авна. IPv4 орчинд session pooler ашиглаж, transaction pooler-ийн 6543 портыг dump-д хэрэглэхгүй. Exact host-ийг dashboard-аас авна; тааж оруулахгүй.
3. PostgreSQL 17 client (`psql`, `pg_dump`, `pg_dumpall`, `pg_restore`) бэлтгэнэ. Local full-stack restore drill-д Docker Desktop мөн хэрэгтэй. Энэ компьютерт PATH болон түгээмэл install location-д эдгээр илрээгүй. Supabase CLI binary байгаа. Installer/setup-ийг одоо ажиллуулаагүй.
4. BitLocker зэрэг encryption-тэй хадгалалтын байршил сонгоно; off-site encrypted copy-ийн байршил, эзэмшигчийг тогтооно. Backup файлыг repository дотор бүү хадгал.
5. Hosted Auth/Storage/API settings-ийг dashboard-аас non-secret талбаруудаар тэмдэглэнэ. SMTP/OAuth нууцын утгыг зураг авахын оронд password-manager item reference хадгална. `private` schema exposed биш, Confirm email ON байгааг тэмдэглэнэ.
6. Доорх export-ийг existing DB credentials-ээр гүйцэтгэнэ. Token/password/dump файлыг чатанд илгээхгүй; зөвхөн **амжилттай эсэх, artifact нэр, хэмжээ, SHA-256, export timestamp**-ийг хуваалцана.

### Export ажиллагааны загвар — зөвхөн унших

Энэ нь операторын ажиллуулах загвар; энд production export **ажиллуулаагүй**. Native PostgreSQL 17 client ашиглана. Supabase CLI-ийн generated dump script-д fixture URL-ийн `sslmode` болон `default_transaction_read_only` option гараагүй тул тэдгээрийг автоматаар дамжсан гэж найдаагүй. Native client-д PGOPTIONS/TLS-ийг шууд өгч шалгана.

Existing password-ийг access-restricted password file-д secret manager/editor-оор байрлуулж `$env:PGPASSFILE`-аар заана. Password file нь libpq host:port:database:user:password форматтай, colon/backslash escape шаарддаг; зөвхөн тухайн Windows хэрэглэгч унших ACL-тай байна. Password-ийг URI, command argument, output-д оруулахгүй. Supabase-ийн албан ёсны server CA/trust тохиргоог ашиглаж TLS hostname verification-ийг идэвхжүүлнэ. [libpq тохиргоо](https://www.postgresql.org/docs/17/libpq-envars.html).

```powershell
# Fresh PowerShell session; $backupDir нь өмнө бэлтгэсэн encrypted directory.
# Dashboard Connect-оос хуулсан утгууд; password-ийг prompt-д ч хэвлэхгүй.
$env:PGHOST = Read-Host 'Production session pooler host'
$env:PGPORT = '5432'
$env:PGUSER = 'postgres.xcsnkvoulmrpxoxcjuvl'
$env:PGDATABASE = 'postgres'
$env:PGPASSFILE = Read-Host 'Restricted password file absolute path'
$env:PGSSLROOTCERT = Read-Host 'Trusted server CA file absolute path'
$env:PGSSLMODE = 'verify-full'
$env:PGOPTIONS = '-c default_transaction_read_only=on'
$readOnly = & psql -X -A -t --no-password --command 'show transaction_read_only'
if ($LASTEXITCODE -ne 0 -or $readOnly.Trim() -ne 'on') { throw 'Read-only connection not verified' }
& pg_dumpall --roles-only --no-role-passwords --no-password --file "$backupDir\roles.sql"
if ($LASTEXITCODE -ne 0) { throw 'Roles export failed' }
& pg_dump --schema-only --schema public --schema private --no-password --file "$backupDir\schema.sql"
if ($LASTEXITCODE -ne 0) { throw 'Schema export failed' }
& pg_dump --data-only --schema public --schema private --schema auth --schema storage --exclude-table auth.schema_migrations --exclude-table storage.migrations --exclude-table storage.buckets_vectors --exclude-table storage.vector_indexes --no-password --file "$backupDir\data.sql"
if ($LASTEXITCODE -ne 0) { throw 'Data export failed' }
& pg_dump --schema-only --schema auth --schema storage --no-password --file "$backupDir\managed-schema-reference.sql"
if ($LASTEXITCODE -ne 0) { throw 'Managed schema reference export failed' }
Get-FileHash -Algorithm SHA256 -LiteralPath "$backupDir\roles.sql","$backupDir\schema.sql","$backupDir\data.sql","$backupDir\managed-schema-reference.sql"
```

Командууд existing role-оор уншина; remote login role bootstrap, password reset, шинэ DB role үүсгэх, production settings өөрчлөх алхам байхгүй. Direct connection ашиглавал host/username-ийг dashboard дахь exact утгаар солино. `$backupDir`-ийг давтагдахгүй timestamp-тай шинэ хавтас болгон урьдчилан үүсгэж, хуучин backup дээр overwrite хийхгүй. Алхам бүр exit code 0, файл non-empty байгааг шалгана. TLS эсвэл permission алдаа гарвал хамгаалалтыг бууруулахгүй; шалтгааныг шийдсэний дараа export-ийг дахин эхлүүлнэ.

Native dump нь Supabase CLI-ийн reserved role/managed DDL шүүлтүүрийг хэрэгжүүлэхгүй. Тиймээс `roles.sql` дахь reserved role statement-уудыг target дээр автоматаар ажиллуулахгүй; target-specific review хийсэн restore copy хэрэглэнэ. `managed-schema-reference.sql` нь version/diff харьцуулах нотолгоо бөгөөд live managed Auth/Storage schema дээр сохроор replay хийх файл биш. Global role password энэ export-д орохгүй, харин Auth хэрэглэгчдийн password hash `data.sql`-д орно. [pg_dump хамрах хүрээ](https://www.postgresql.org/docs/17/app-pgdump.html).

`roles/schema/data` export-ууд тусдаа snapshot-тай: export үеэр зэрэгцээ schema/admin өөрчлөлт хийхгүй, богино цонх сонгоно. **Auth болон Storage data нь нэг data.sql dump-ийн consistent snapshot-д** байна. 3 session нь дараа өөрчлөгдөж болох тул timestamp-тай baseline болон dump доторх count-оор харьцуулна. Нууц hash/token-ийг console-д харуулахгүйгээр dump reader/restore target дотор шалгана.

Одоогийн migration history schema байхгүй тул history export алгасна. Migration хэрэгжсэний дараах цаашдын backup-д `--schema supabase_migrations`-тай schema/data export тусад нь авна. Auth/Storage managed migration хүснэгтийг app history-тэй андуурахгүй.

Vector bucket/index хоёрын count 0 гэдгийг дахин уншиж баталсан тул дээрх template тэдгээрийг хассан. Export эхлэхийн өмнө vector болон multipart/object count-ийг дахин шалгана; vector count нэмэгдсэн бол тэдгээрийг үлдээсэн backup-ийг бүрэн гэж үзэхгүй, тухайн Storage төрлийн recovery арга нэмж бэлтгэнэ.

Restore бүтэц болон Supabase managed-schema хязгаарын үндэс: [Supabase backup/restore guide](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore). Export fail болсон бол partial файлыг complete backup гэж тэмдэглэхгүй. Нууц SQL-ийг ChatGPT-д үзүүлэлгүйгээр шалгаж, decrypted temporary хуулбарыг байгууллагын хадгалалтын журмаар цэвэрлэнэ. Export дуусмагц зөвхөн backup-д ашигласан PowerShell session-ийг хааж connection env-ийг цэвэрлэнэ.

## 5. Production-д нөлөөлөхгүй restore drill

**Санал болгож буй орчин:** тусдаа directory/project ID, loopback-only порттой local Supabase Docker stack. Одоогийн `nfc-smart-test`-ийг overwrite хийхгүй. Free-ийн гурав дахь project-ийн эрхэд найдахгүй. Docker боломжгүй бол тусдаа cloud recovery project-ийн organization, cost болон access-ийг эхэлж зөвшөөрүүлнэ; production/test-ийг pause/delete хийж зай гаргахгүй.

1. Target-ийн PostgreSQL 17, Auth/Storage schema version/column list-ийг source catalog-тай тулгана. Source Auth 27 хүснэгттэй; хуучин target дээр шинэ хүснэгт/багана дутвал **сэргээхийг зогсооно**. Account/identity мөрийг алгасаж амжилт гэж тэмдэглэхгүй.
2. Target нь шинэ, хоосон байх ёстой. Production/test URL/ref нь target config, env болон app URL-д байхгүйг шалгана. Production credential-ийг target runtime-д тавихгүй.
3. Зөвхөн local email sink ашиглаж, SMTP/OAuth/webhook/cron/Edge Function outbound ажлыг унтраасан байлгана. Backup оруулсны дараа Internet-ээс нэвтрэх боломжгүй, development team нийтээр ашигладаг test instance биш байна.
4. Supabase platform нь managed auth/storage DDL-ээ target дээр урьдчилан үүсгэсэн байна. `roles.sql` дахь reserved-role conflict-ийг review хийнэ; custom DDL-г тусад нь хянана. Backup-ийн original файлыг өөрчлөхгүй, шаардлагатай restore copy-д хийсэн diff-ийг хадгална.
5. Roles → app schema → data дарааллаар target-only `psql --single-transaction --variable ON_ERROR_STOP=1` хэрэглэнэ. Оператор `$recoveryUrl`-ийг зөвхөн localhost recovery endpoint гэж шалгасны дараа restore хийнэ. Trigger behavior-ийг Supabase guide-ийн дагуу тухайн restore session-д тохируулж, дуусмагц reset хийнэ; foreign key equality/orphan шалгалтыг дараа нь заавал гүйцэтгэнэ.
6. Baseline restore **амжилттай болсон хойно** дөрвөн app migration-ийг recovery target дээр ажиллуулна. Migration-уудыг baseline restore-оос өмнө автоматаар хэрэгжүүлэхгүй.
7. User login-ийг зөвхөн account owner өөрөө local target дээр хийж шалгана; password-ийг агент/логт өгөхгүй. Production session-ийг туршилтын instance рүү хуулсан token-оор ашиглахгүй. Шинэ JWT keys-ээс шалтгаалан relogin шаардах нь user account алдагдсан гэсэн үг биш.

### Restore амжилттай гэж хүлээн авах шалгуур

| Шалгуур | Хүлээгдэж буй үр дүн |
|---|---|
| Dump файлын integrity | Хадгалсан SHA-256 таарсан; decrypt/read амжилттай |
| Users/identities | 2/2; original UUID болон user_id холбоос яг адил |
| Password/confirmation | Хоёр password hash-ийн байтын утга source backup-тай адил; confirmation болон metadata хадгалагдсан. Log-д утга гаргахгүй. |
| Sessions/refresh data | Export snapshot-ийн мөр/холбоосууд таарсан; live production token ашиглаагүй |
| Storage baseline | 2 bucket, visibility/limit/MIME яг адил; object count 0; шинэ object гарвал binary manifest-тай таарсан |
| Migration дараах Auth | UUID/hash/identity/confirmation өөрчлөгдөөгүй |
| Migration дараах app | 9 RLS table, 20 app + 4 Storage policy, private organization-assets, seed/admin enrollment байхгүй |
| Functional | Local email/password login, tenant isolation, draft/public asset/NFC behavior батлагдсан |
| Production read-only recheck | Migration history 0, app table 0 хэвээр; Auth/Storage-д энэ ажлаас өөрчлөлт ороогүй |
| Recovery time | Бодит хугацааг хэмжиж RTO тогтоосон; өмнөх 2 цагийн зорилтыг баталгаагүй гэж үлдээхгүй |

Restore log нь secret/token/email/password hash-ийг агуулахгүй. Drill дууссаны дараах real-data copy-ийн хадгалах хугацаа/хандалт/устгалын эзэмшигчийг тэмдэглэнэ; автоматаар production устгал хийхгүй.

## 6. Дөрвөн migration-ийн dry-run ба нөлөөлөл

Гурван өөр шалгалтыг салгаж ойлгоно:

| Шалгалт | Төлөв |
|---|---|
| Remote read-only pending list | History 0; repository-ийн reviewed 4 migration бүгд pending. |
| Offline execution rehearsal | **4/4 migration, 18/18 assertion PASS**, synthetic 2 users/2 identities/3 sessions хадгалагдсан. |
| Production CLI `db push --dry-run` | **Хийгдээгүй** — existing DB connection credential байхгүй. |
| Жинхэнэ production backup restore | **Хийгдээгүй** — export болон full recovery environment бэлэн биш. |

Давтах local команд: `node scripts/rehearse-production-migrations.mjs`. Script нь env/credential уншдаггүй, network хэрэглэдэггүй, PGlite in-memory fixture л ашиглана. Minimal fixture нь managed Storage triggers болон Auth service compatibility-г батлахгүй. Бодит test Supabase дээр дөрвөн migration өмнө амжилттай хэрэгжсэн нь нэмэлт нотолгоо боловч production backup restore-ийн оронд тооцохгүй.

| Migration | Production-д үзүүлэх нөлөө | Auth-д үзүүлэх нөлөө |
|---|---|---|
| `20261012111118_nfc_smart_initial` | App 9 table, functions/triggers/RLS/grants; private schema; default function EXECUTE privilege өөрчилнө. Байгаа organization-assets public→private, size ceiling 2 MiB→5 MiB. menu-images өөрчлөгдөхгүй. | auth.users руу FK нэмнэ; хэрэглэгчийн мөрийг insert/update/delete хийхгүй. |
| `20261012154811_analytics_aggregates` | Authorization-тай analytics RPC ба execute grant. | Мөр өөрчлөхгүй. |
| `20261013164143_organization_profile_hardening` | organizations-д 4 NOT VALID constraint, table comments. Шинэ/updated row шалгагдана; historical validation хийгдэхгүй. | Нөлөөгүй. |
| `20261013200319_platform_user_pagination` | Read-only admin search RPC; query/offset/limit хязгаарлана. | Зөвхөн admin-д зөвшөөрөгдсөн read; хэрэглэгч өөрчлөхгүй. |

Файлуудын SHA-256 өмнөх reviewed manifest-тай яг таарсан. Function body доторх DELETE/UPDATE нь runtime ажиллагааны тодорхойлолт; migration ажиллуулахад тэдгээр function-ийг дуудаж өгөгдөл устгахгүй. Migration 1-ийн bucket upsert нь бодит metadata өөрчлөлт учир production approval-д тусгайлан орно.

Remote CLI dry-run хийх дараагийн арга: **existing DB role бүхий explicit DB URL**, `--dry-run --skip-vault`, connection нь default transaction read-only. Login role bootstrap/Vault update/history write гэсэн оролдлого байвал read-only алдаагаар зогсоож, read-only хамгаалалтыг сулруулахгүй. `--project-ref`-ийн автомат credential/bootstrap замыг энэ шатанд хэрэглэхгүй. Dry-run нь SQL файлын бүх statement-ийг бодитоор execute хийж баталдаггүй, pending жагсаалт шалгадаг.

```powershell
# Зөвхөн credential болон read-only холболт батлагдсаны дараа:
node '.\node_modules\supabase\dist\supabase.js' db push --db-url $prodReadOnlyUrl --dry-run --skip-vault
```

Windows `.cmd` wrapper нь URL-ийн `&` query separator-ийг shell command гэж задлах боломж илэрсэн тул дээр Node entrypoint-ийг шууд дуудсан. Энэ командад real credential оруулахаас өмнө CLI connection option хэрэгжилт/secret log-ийг тусгаарласан fixture дээр шалгана. Шалгалт дуусаагүй бол remote CLI dry-run-ийг ажиллуулахгүй; read-only catalog pending list нь бэлэн хэвээр.

Энэ тайланд production apply команд зориуд ажиллуулаагүй. Backup/restore нотолгоо, бодит dry-run үр дүн бэлэн болсны дараа scope/hash-ийг дахин танилцуулж зөвшөөрөл авна.

## 7. Development advisory-ийн үлдэгдэл эрсдэл

Энэ шатанд registry audit дахин хийсэн: runtime **0**, development **5 high**. Нэг үндсэн [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) нь дараах 5 package entry-д дамжсан:

`eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces@3.0.3`.

Deep nested brace pattern нь recursive AST walker-ийн stack-ийг дүүргэж Node process-ийг унагаах **DoS** эрсдэлтэй. Энэ advisory нь өөрөө database data хулгайлах эсвэл arbitrary code execution нотолгоо биш. Upstream patched хувилбар байхгүй; audit-ийн санал болгосон Next ESLint 14 downgrade-ийг Next 16 project дээр хэрэгжүүлээгүй.

Одоогийн app HTTP input-ээс lint glob руу өгөгдөл дамжих зам илрээгүй, Next rootDir glob тохируулаагүй. Иймээс нийтэд ажиллах NFC endpoint-д энэ dependency-ээр шууд нөлөөлөх зам тогтоогдоогүй. Харин хөгжүүлэлтийн config/CI-д хортой glob оруулбал lint/build унаж deployment саатах боломж үлдэнэ. Dev-only гэдэг нь эрсдэлгүй гэсэн үг биш; build орчинд secret байдаг бол untrusted code ажиллуулахгүй.

Одоогийн хамгаалалт: pinned lockfile, runtime audit CI fail gate, read-only GitHub token, job timeout, production/test credential isolation. Шинэ version/advisory бүрийг release-ийн өмнө, хамгийн орой **2026-10-24**-нд дахин шалгана. Production launch-аас өмнө эзэмшигч dev-only эрсдэлийн түр exception-ийг тусад нь зөвшөөрөх эсвэл patched dependency-г хүлээнэ. Энэ тайлан эрсдэлийг таны өмнөөс зөвшөөрөөгүй.

## 8. Дараагийн зөвшөөрлийн босго

Одоо дууссан: Free Plan баталгаа, aggregate coverage, CLI dump filter шалгалт, reviewed migration hash check, offline migration rehearsal, manual backup/restore заавар, advisory дахин үнэлгээ.

Дараах зүйлс бүрдээгүй тул migration approval-г одоо хэрэгжүүлэхгүй:

- Existing DB password болон session-pooler connection-аар read-only access.
- Шифрлэсэн roles/schema/data backup, coverage manifest, хоёр хадгалалтын хувь.
- Compatible recovery орчинд бодит restore, Auth хоёр хэрэглэгчийн equality/login баталгаа.
- Production CLI pending dry-run болон шинэ read-only baseline.

Эдгээр нотолгоо бүрдсэний дараа **танаас шинээр зөвшөөрөл авна**: `xcsnkvoulmrpxoxcjuvl` дээр reviewed дөрвөн migration болон organization-assets private тохиргоо. Энэ approval-д data deletion/reset/seed, Auth user өөрчлөлт, SMTP/URL өөрчлөлт, menu-images өөрчлөлт, public deployment орохгүй. Одоогийн хүсэлт эсвэл өмнөх яриаг production apply зөвшөөрөл гэж үзэхгүй.
