# Phase 2 — Байгууллага ба multi-tenant хамгаалалт

## Одоогийн нэвтрэлтийг хадгалах

Таны баталгаажуулсан registration/login/logout, Supabase SSR client, cookie session, proxy болон auth callback-ийг солих шаардлагагүй. Энэ ажил `auth.users` болон session хүснэгтэд migration хийдэггүй. `requireOrg` нь одоогийн `requireUser()` дээр тулгуурлан **байгууллагын** membership шалгана. Cookie нь зөвхөн сонголт; хандах эрх биш.

## Хэрэглэгчийн урсгал

1. Одоогийн бүртгэлээр нэвтэрнэ.
2. `/dashboard/organizations` дээр нэр, латин slug оруулж байгууллага үүсгэнэ.
3. `create_organization` RPC байгууллага болон үүсгэгчийн owner membership-ийг **нэг transaction**-д бичнэ. Membership үүсэхгүй бол байгууллага ч үүсэхгүй.
4. Байгууллагын «Тохиргоо»-оор нэр, танилцуулга, холбоо барих, сошиал холбоос, өнгө, logo/cover шинэчилнэ.
5. Өөр байгууллага үүсгээд header-ийн сонголтоор сольж ажиллана. Сервер сонголт бүрт тухайн хэрэглэгчийн membership-ийг дахин шалгана.
6. Owner багийн гишүүдийн эрхийг удирдана. Staff брэндинг/ownership өөрчлөхгүй. Сүүлийн owner-ийг устгах эсвэл staff болгох боломжгүй.

`organizations` нь UUID, unique slug, брэндинг, contact, status, timestamps хадгална. `organization_members` нь `(organization_id,user_id)` primary key, `owner|staff` role болон тусгай permission-уудтай. Гишүүнчлэлгүй хэрэглэгч байгууллагын private record болон гишүүдийг уншихгүй. Шууд membership INSERT/UPDATE/DELETE хийх эрх client-д байхгүй.

## Одоо байгаа Supabase төсөлд аюулгүй хэрэгжүүлэх

**Шинэ Supabase төсөл үүсгэхгүй. `.env.local`, Auth email/password, SMTP, callback тохиргоогоо солихгүй.** Нууц түлхүүр, database password-ийг чат эсвэл Git-д бүү оруул.

Эхлээд одоогийн schema, migration history болон backup-аа шалгана. SQL Editor дээр дараах нь зөвхөн унших query:

```sql
select to_regclass('public.organizations') as organizations,
       to_regclass('public.organization_members') as organization_members;
select tablename, policyname, cmd, roles
from pg_policies
where schemaname='public' and tablename in ('organizations','organization_members');
```

Төслийн versioned migrations:

| Файл | Үүрэг |
| --- | --- |
| `20261012111118_nfc_smart_initial.sql` | Урьд нь бэлтгэсэн foundation: organizations, memberships, атомик RPC, RLS, Storage, мөн menu/pages/cards зэрэг бусад үндсэн schema. |
| `20261012154811_analytics_aggregates.sql` | Урьд нь бэлтгэсэн analytics schema. Phase 2 байгууллагын удирдлагад шууд шаардлагагүй боловч энэ checkout-д байвал CLI pending жагсаалтад орно. |
| `20261013164143_organization_profile_hardening.sql` | Энэ Phase 2-ын нэмэлт: contact урт, хоосон нэр, canonical slug, credential агуулаагүй HTTPS URL constraint. |
| `20261013200319_platform_user_pagination.sql` | Phase 5: зөвхөн trusted admin-д хэрэглэгчийг хайх, хуудаслах RPC; Auth өгөгдөл өөрчлөхгүй. |

**Хүснэгтүүд байхгүй бол:** эхний migration нь хүснэгт болон owner RPC/RLS-ийг үүсгэнэ. Түүний бүрэн хүрээг эхлээд review хийнэ; зөвхөн нэг хэсгийг хуулж ажиллуулаад migration-ийг бүрэн applied гэж тэмдэглэж болохгүй.

**Foundation аль хэдийн applied бол:** түүнийг дахин ажиллуулахгүй. Зөвхөн pending migrations-ийг review хийнэ. `organizations` ижил нэртэй боловч өөр бүтэцтэй бол автоматаар overwrite/drop хийхгүй; schema diff гаргаж тусгай migration бэлтгэх шаардлагатай. SQL Editor-оор урьд нь ажиллуулсан schema-гийн history байхгүй бол бүрэн таарч байгааг баталгаажуулах хүртэл history-г хүчээр repair хийхгүй.

CLI 2.120.0 дээр шалгасан PowerShell командууд:

```powershell
npx.cmd supabase login
npx.cmd supabase link --project-ref YOUR_EXISTING_PROJECT_REF
npx.cmd supabase migration list --linked
npx.cmd supabase db push --linked --dry-run --skip-vault
# Зөв төсөл болон pending файлуудыг шалгасны дараа:
npx.cmd supabase db push --linked --skip-vault
npx.cmd supabase migration list --linked
```

`--skip-vault` нь одоогийн Vault нууцуудыг local config-оор шинэчлэхээс сэргийлнэ. Password шаардвал CLI-ийн prompt ашиглана. Remote `db reset`, хүснэгт DROP, `--include-all`, `--include-seed` хэрэглэхгүй. Local `config.toml`-ийн Auth defaults-ийг cloud дээр бөөнөөр хуулж тохиргоо солихгүй.

Шинэ constraint-ууд `NOT VALID`: өмнөх мөрүүдийг устгах, өөрчлөхгүй; шинэ INSERT/UPDATE бүрт үйлчилнэ. Өмнөх мөрүүдээ review хийж нийцүүлсний дараа доорх validation-ийг хийх боломжтой (өөрөө мөр засахгүй):

```sql
alter table public.organizations validate constraint organizations_profile_lengths;
alter table public.organizations validate constraint organizations_canonical_slug;
alter table public.organizations validate constraint organizations_nonblank_name;
alter table public.organizations validate constraint organizations_contact_urls;
```

`private` schema-г Data API exposed schemas-д нэмж болохгүй. Existing publishable key + session нь organization CRUD-д хангалттай; service-role client ашиглаж RLS тойрохгүй. Logo/cover upload нь private `organization-assets` bucket руу owner session-аар бичигдэнэ.

## Баталгаажуулах

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run test:db
npm.cmd run build
```

`test:db` нь **бодит migration SQL**-ийг PGlite PostgreSQL дээр ажиллуулна: atomic owner creation + forced rollback, олон байгууллага, owner update, cross-tenant SELECT/UPDATE, staff escalation, сүүлийн owner хамгаалалт, constraint-уудыг шалгана. Auth/Storage system tables нь зөвхөн тусгаарлагдсан тестийн fixture. Production app-д mock data/API байхгүй.

Migration-ийг cloud-д хэрэглэсний дараа хоёр тусдаа бодит test account-аар A/B байгууллага үүсгэж, B account нь A-ийн URL/id-г ашиглан унших/засах боломжгүйг шалгана. Supabase SQL Editor нь postgres эрхтэй тул тэнд энгийн SELECT хийж RLS ажиллаж байна гэж дүгнэж болохгүй. Owner шинэчилсний дараа refresh хийж мэдээлэл хадгалагдсан, workspace солих, logout/login хэвээр ажиллаж байгааг баталгаажуулна. Production account-ын нууц үгийг тестэд хадгалахгүй.

Энэ сессэд live project харагдахгүй байсан тул cloud migration болон cloud organization E2E ажиллуулаагүй. Таны нэвтрэлт ажиллаж байгааг хэрэглэгчийн баталгаажуулалт гэж тэмдэглэсэн; локал SQL тестийг cloud Auth тест гэж тайлагнахгүй.

Эрхийн зарчим: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
