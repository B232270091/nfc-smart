# Өгөгдлийн сан

Supabase PostgreSQL 17 ашиглана. Бодит schema болон бүх эрхийн дүрэм `supabase/migrations/20261012111118_nfc_smart_initial.sql` дотор байна. Migration-ийг Supabase CLI-ээр үүсгэсэн. Docker болон cloud credentials-гүй үед ч уг SQL-ийг PostgreSQL/WASM PGlite дээр `npm run test:db` командаар шалгана.

## Бүтэц

| Table | Үүрэг, хамгаалалт |
| --- | --- |
| `public.organizations` | Байгууллагын мэдээлэл, branding; slug давтагдахгүй |
| `public.organization_members` | `(organization_id,user_id)` түлхүүр, owner/staff, тодорхой permissions |
| `public.pages` | Дөрвөн page type, дэлхийд давтагдахгүй slug, нийтлэх төлөв |
| `public.menu_categories` | Байгууллагын ангилал, дараалал, идэвхтэй төлөв |
| `public.menu_items` | Нэр, зураг, availability, publication, бүхэл MNT үнэ |
| `public.nfc_cards` | Өөрчлөгдөхгүй нууцлаг код, сольж болох destination |
| `public.scan_events` | Нээлтийн timestamp, байгууллага, карт, `qr` эсвэл `unknown` |
| `private.platform_admins` | Зөвхөн итгэмжлэгдсэн SQL-аар олгох платформын эрх |
| `private.scan_rate_limits` | Түр хугацааны HMAC fingerprint, нэг картын давтамж хязгаарлалт |

Бүх application table RLS-тэй. `private` schema-г Data API-д **нэмж expose хийж болохгүй**. Local config зөвхөн `public` schema-г expose хийж, шинэ table-ийн автомат эрхийг унтраасан. Migration бүх шаардлагатай эрхийг ил тод олгоно.

Үнэ `bigint`, 0–1,000,000,000,000 MNT. Хөвөгч таслалтай тоо ашиглахгүй. Menu item/category болон card/page хооронд `(organization_id,id)` нийлмэл foreign key байгууллага хоорондын буруу холбоосыг хориглоно. Category дотор item байвал устгахын өмнө тэдгээрийг шилжүүлэх эсвэл устгана. Card ашиглаж буй page-г эхлээд card destination-оос салгана.

Organization, page, category, item, card шинэчлэхэд `updated_at` автоматаар өөрчлөгдөнө; `id` болон `created_at` өөрчлөгдөхгүй. Page/category/item-ийн байгууллага өөрчлөгдөхгүй.

## RPC гэрээ

| Function | Эрх | Буцаах утга |
| --- | --- | --- |
| `create_organization(p_name,p_slug)` | Нэвтэрсэн хэрэглэгч | Байгууллагын UUID; owner enrollment нэг transaction |
| `is_platform_admin()` | Нэвтэрсэн хэрэглэгч | Өөрийн trusted admin төлөв |
| `upsert_organization_member(p_organization_id,p_email,p_role,p_permissions)` | Owner/admin | Бүртгэлтэй хэрэглэгчийн UUID |
| `remove_organization_member(p_organization_id,p_user_id)` | Owner/admin | Void |
| `get_public_page(p_slug)` | Anonymous/authenticated | `{organization,page,categories,items}` JSON эсвэл null |
| `resolve_nfc_card(p_code)` | Anonymous/authenticated | Зөвхөн internal published page slug эсвэл null |
| `get_public_asset(p_path)` | Anonymous/authenticated | Нийтлэгдсэн идэвхтэй content-д ашиглагдаж байгаа эсэх |
| `record_scan(p_code,p_source,p_fingerprint)` | Зөвхөн `service_role` | Үйл явдал хадгалсан бол true |
| `list_platform_users()` | Platform admin | ID, email, created_at; хамгийн сүүлийн 1000 хэрэглэгч |
| `reassign_nfc_card(p_card_id,p_org_id,p_page_id)` | Platform admin | Void, картын код хэвээр |

Public RPC нь `SECURITY INVOKER` wrapper. Хязгаарласан SQL projection болон authorization-тай `SECURITY DEFINER` хэрэгжилт нь API-д expose хийгдээгүй `private` schema-д байна. Function бүр тогтмол хоосон `search_path`-тай, объектыг schema-аар тодорхойлно. Default `PUBLIC EXECUTE` эрхийг цуцалж, зөвхөн шаардлагатай role-д grant хийсэн.

`get_public_page` зөвхөн идэвхтэй байгууллагын нийтлэгдсэн page буцаана. Menu item нь нийтлэгдсэн, category нь идэвхтэй байх ёстой. Худалдаанд байхгүй item `is_available=false` төлөвтэй харагдаж болно. Menu бус page menu dataset авахгүй. `content`-оос зөвхөн `person_name`, `position`, `phone`, `email`, `website`, `services`, `links`, `photo_path` гаргана. Draft/audit/membership өгөгдөл буцаахгүй.

Membership table-д client шууд insert/update/delete эрхгүй. Owner RPC organization row-г lock хийж, сүүлийн owner-ийг устгах эсвэл staff болгохыг хориглоно. `auth.users`-ийн membership-тэй хэрэглэгчийг устгахын өмнө ownership/membership-ийг шийдвэрлэх шаардлагатай (`ON DELETE RESTRICT`).

## NFC ба analytics

Картын `code` нь database trigger-ээр үүсэх 24 hex тэмдэгт. Хоёр бие даасан cryptographic `gen_random_uuid()`-ийн эхний 12 hex тэмдэгтийг нийлүүлнэ: тус бүр 48 санамсаргүй бит, нийт 96 бит. UUID version/variant бит эдгээр prefix-д орохгүй. Database unique constraint давхардал хамгаална. Client код илгээсэн ч trigger дахин үүсгэнэ. Дараа нь кодыг өөрчлөх боломжгүй.

Platform admin байгууллага хооронд шилжүүлэхэд destination нь шинэ байгууллагын page байх ёстой. Хуучин scan event-үүд өмнөх байгууллагад хэвээр үлдэнэ; шинэ эзэмшигч хуучин байгууллагын analytics-ийг харахгүй. `scan_events.card_id` нь энгийн FK, event-ийн байгууллага immutable historical attribution болно. Шинэ event зөвхөн trusted `record_scan` дотор картын одоогийн байгууллагаар бичигдэнэ. Client scan table-д бичих эрхгүй.

`record_scan` нь идэвхтэй card/org, нийтлэгдсэн page-г дахин шалгана. `(card_id,fingerprint)` unique key + conditional `ON CONFLICT` нэг fingerprint-ийг нэг минутад нэг удаа бүртгэнэ. Fingerprint нь server дээр өдөр бүр өөрчлөгдөх оролттой HMAC-SHA256; raw IP/UA DB-д хадгалахгүй. 24 цагаас хуучин fingerprint-ийг дараагийн зөвшөөрөгдсөн event үеэр цэвэрлэнэ. Траффик зогсвол дараагийн event хүртэл үлдэж болно. Энэ нь basic abuse control болохоос bot-proof/unique-visitor тоолуур биш.

## Storage

`organization-assets` bucket нь private; 5 MiB, JPEG/PNG/WebP. Path: `<organization UUID>/<branding|menu|pages>/<random UUID>.<jpg|jpeg|png|webp>`. Owner branding болон бүх resource; staff зөвхөн олгосон `menu`/`pages` scope-д upload/update/delete хийнэ. Branding унших эрх нь байгууллагын гишүүдэд, бусад scope унших эрх нь тохирох permission-тэй гишүүдэд нээлттэй.

Public image route `get_public_asset`-аар publication болон organization status шалгасны дараа server credential ашиглан private object-ийг дамжуулна. Unreferenced/draft assets нийтэд гарахгүй. Bucket-ийг public болгож болохгүй. Client upload validation-тай зэрэгцэн server upload route magic bytes болон хэмжээ шалгах ёстой.

## Local ажиллуулах

```powershell
npm ci
npx supabase --help
npx supabase start
npx supabase db reset
npm run test:db
```

`supabase start` нь Docker шаарддаг; `db reset` зөвхөн тухайн local development database-г дахин үүсгэнэ. Local Auth email confirmation унтраалттай, захиа local SMTP inbox `http://localhost:54324` дээр ирнэ. Production дээр confirmation болон өөрийн SMTP тохируулна. Local site URL `http://localhost:3000`; callback/reset allowlist `supabase/config.toml` дотор байна.

Cloud migration-г [deployment.md](deployment.md) заавраар apply хийнэ. Cloud DB-д migrate хийсэн эсэхийг local tests батлахгүй.

## Баталгаажуулалт

`npm run test:db` нь бодит migration-ийг шинэ PostgreSQL instance-д хэрэгжүүлж, тусдаа owner A, owner B, menu-only staff, platform admin, anon, service_role эрхээр query гүйцэтгэнэ. Tenant data access, staff escalation, last owner, composite FK, menu үнэ өөрчлөлт, тогтмол NFC code/destination change, draft/inactive restrictions, analytics permission/rate limiting, private image access, admin transfer шалгана.

Auth/Storage system table-ууд test fixture; Supabase HTTP Auth, mail delivery, signed URL, Docker service болон production integration-ийг тусад нь шалгана. Cloud security/performance advisors-ийг deployment үед ажиллуулж үр дүнг хяна.
