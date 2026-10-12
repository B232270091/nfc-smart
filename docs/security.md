# Аюулгүй байдал

## Итгэмжлэлийн хязгаар

Browser-оос organization ID, resource ID, role, permission ирсэн нь эрхийн нотолгоо болохгүй. Next.js mutation бүр authenticated хэрэглэгчийг server дээр баталгаажуулж, байгууллагын role/permission шалгана. Supabase client session-аар хийсэн query дээр database RLS давхар шалгана. `user_metadata` authorization-д ашиглахгүй.

Owner байгууллагын бүх resource-г удирдана. Staff-д `menu`, `pages`, `cards`, `analytics` эрхийг тус тус олгоно. Menu-only staff зөвхөн `menu` төрлийн page нийтэлж болно; cards permission нь destination сонгох зорилгоор байгууллагын page-уудыг унших боломжтой. Organization branding/settings өөрчлөх нь owner/admin эрхтэй. Staff-д membership role/permissions өөрчлөх API эсвэл table write grant байхгүй.

Membership mutation organization row lock ашиглаж last-owner invariant хадгална. Platform admin зөвхөн `private.platform_admins` trusted хүснэгтээс тодорхойлогдоно. Application signup, profile metadata, public API-аар өөртөө platform admin эрх олгох боломжгүй.

## Анхны platform admin

1. Тухайн хүн ердийн бүртгэл үүсгэж email-ээ баталгаажуулна.
2. Supabase Dashboard → Authentication → Users дээр зөв хүний UUID-г баталгаажуулна.
3. Зөвхөн trusted project operator SQL Editor дээр дараах параметрт UUID-г бодитоор солино:

```sql
insert into private.platform_admins(user_id)
values ('REPLACE_WITH_VERIFIED_USER_UUID'::uuid)
on conflict (user_id) do nothing;
```

Энэ эрхийг source code, seed, email suffix эсвэл client metadata-аар автоматаар олгохгүй. Цуцлахдаа тухайн UUID мөрийг SQL Editor-оос устгана. Application database row-г query хийдэг тул JWT metadata refresh хүлээхгүй. Production admin account-д Supabase account хамгаалалт, MFA, хамгийн бага шаардлагатай project access тохируул.

## Database ба public content

Бүх application table RLS-тэй. Anonymous role direct table access байхгүй. Нийтэд харагдах мэдээлэл зөвхөн `get_public_page`, `resolve_nfc_card`, `get_public_asset` нарийн projection-оор гарна. Public wrappers нь invoker; privilege шаардсан функцүүд API-д expose хийгдээгүй `private` schema-д байрлана. Функцүүд хоосон тогтмол search path, schema-qualified reference, role-specific execute grant ашиглана.

Inactive organization, disabled card, unpublished page нийтэд гарахгүй. Destination зөвхөн тухайн байгууллагын page бөгөөд external URL redirect хийхгүй. NFC code database trigger-ээр криптограф санамсаргүй 96 битээр үүсэж, давтагдахгүй, өөрчлөгдөхгүй. Redirect түр зуурынх байх ёстой; public data/redirect response-г байнгын cache хийж болохгүй.

Logo, cover, menu, page asset path тухайн organization UUID-ээр эхлэх constraint-тай. Public image gate нь path бодит нийтлэгдсэн content-д ашиглагдаж байгааг шалгана. Private bucket public болгож болохгүй. Upload JPEG/PNG/WebP хэлбэр, 5 MiB хэмжээтэй; SVG/HTML executable content зөвшөөрөхгүй. Server дээр magic bytes validation хэрэглэнэ. Upload file name-ийг хэрэглэгчээс шууд авахгүй.

## Нууц түлхүүрүүд

`NEXT_PUBLIC_SUPABASE_URL` болон `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` browser-д байж болно; RLS нь гол data authorization. `SUPABASE_SECRET_KEY`, `ANALYTICS_HMAC_SECRET` болон бусад secret зөвхөн server environment-д байрлана. `SUPABASE_SECRET_KEY` нь server secret эсвэл legacy service-role key; database дээр `service_role` түвшний эрхтэй. Эдгээрийг `NEXT_PUBLIC_` нэртэй болгож болохгүй, GitHub-д commit хийж болохгүй. `.env.local` ignored. Deployment тус бүр өөр secret хэрэглэх нь зөв.

Service-role client нь RLS-ийг тойрдог. Үүнийг зөвхөн publication шалгасан private image retrieval болон `record_scan` зэрэг нарийн server ажилд хэрэглэнэ. Owner CRUD-г service client-аар хийхгүй. Нууц задарвал Supabase/Vercel дээр rotate хийж, history болон logs-г шалгана.

## Нууцлал ба abuse control

DB-д raw IP, user-agent, user email болон persistent visitor ID-г scan event-тэй хамт хадгалахгүй. Analytics event нь card, organization, timestamp, `qr|unknown` source-той. `src=qr` нь QR link attribution; `unknown`-ийг батлагдсан NFC tap гэж тайлбарлахгүй. Тоолсон opens-ийг unique visitors гэж нэрлэхгүй.

Server bot filtering ба database atomic rate limit давхар ажиллана. HMAC fingerprint нь давтамж хязгаарлах зориулалттай бөгөөд богино настай. Distributed bot abuse-г бүрэн зогсоохгүй; hosting firewall/Auth rate limit/CAPTCHA production traffic-аас хамаарч тохируулна. Analytics алдаа нь зөв destination руу нэвтрэхийг хаах ёсгүй.

## Баталгаажуулалт ба production хязгаар

`npm run test:db` бодит production migration-ийг PostgreSQL/WASM дээр ажиллуулж cross-tenant access, staff escalation, immutable identifiers, last-owner lock rules, foreign keys, public restrictions, storage policy, service-only scan logging болон trusted admin transfer-ийг шалгана. PGlite тест нь cloud Auth/Storage HTTP service эсвэл сүлжээний concurrency load test биш.

Production-д шилжүүлэхдээ Supabase Security Advisor болон Performance Advisor, Auth redirect allowlist, email confirmation, SMTP, session configuration, backup/recovery, Vercel secret configuration-г шалгана. `.env`/cloud credentials байхгүй нөхцөлд live authentication, cloud migration, image serving болон deployed NFC routing-ийг амжилттай гэж үзэхгүй.

Supabase-ийн [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Storage access control](https://supabase.com/docs/guides/storage/security/access-control), [private definer function guidance](https://supabase.com/docs/guides/troubleshooting/do-i-need-to-expose-security-definer-functions-in-row-level-security-policies-iI0uOw) баримттай нийцүүлэн хэрэгжүүлсэн.
