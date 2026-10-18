# NFC Smart — production нэвтрүүлэх бэлтгэл

Анхны Vercel Project-ийн бодит staging branch URL-ийг guard унтраахгүй авах дараалал: [vercel-staging-bootstrap.md](vercel-staging-bootstrap.md).

Шалгасан огноо: **2026-10-17**. Энэ нь бэлтгэлийн тайлан; production-д migration, өгөгдлийн бичилт, Auth/Storage тохиргооны өөрчлөлт, Vercel deployment хийгээгүй.

Backup/recovery-ийн шинэчилсэн Free Plan, Auth coverage болон dry-run нотолгоо: [production-backup-recovery.md](production-backup-recovery.md). Production migration approval хүлээгдэж байгаа; өмнөх conditional зөвшөөрлийн асуултад apply эрх олгогдоогүй.

## 1. Шийдвэр ба нэвтрүүлэх төлөв

Hosting: Vercel. Эхний үндсэн хаяг: `https://<VERCEL_PROJECT>.vercel.app` — бодит project alias хараахан сонгоогүй. SMTP: Resend; илгээгч болон баталгаажсан custom domain одоогоор placeholder.

**Нийтийн хэрэглээнд нээхэд хараахан бэлэн биш.** Доорх migration, Auth тохиргоо, backup сэргээх туршилт, бодит Vercel URL болон SMTP баталгаажуулалт шаардлагатай. Custom SMTP бэлэн болох хүртэл нийтэд signup/password reset ажиллана гэж үзэж болохгүй. Vercel дээр хаалттай шалгалт хийх боломжтой ч түүнийг public launch гэж тооцохгүй.

## 2. Production ба test-ийн харьцуулалт

Хоёр төсөл ACTIVE_HEALTHY, Seoul (`ap-northeast-2`), PostgreSQL `17.11.0.003`.

| Үзүүлэлт | nfc-smart-production | nfc-smart-test |
|---|---|---|
| Project ref | `xcsnkvoulmrpxoxcjuvl` | `khohnhjjyetwuzfsttkl` |
| Migration history | 0 | 4 |
| public/private app хүснэгт | 0 | 9, бүгд RLS ON |
| Багана / constraint / index | 0 / 0 / 0 | 71 / 61 / 23 |
| App function / trigger | 0 / 0 | 30 / 9 |
| App RLS policy | 0 | 20 |
| Storage policy | 0 | 4 |
| Auth хэрэглэгчийн тоо | 2 | 0 |
| Storage object metadata тоо | 0 | 0 |
| organization-assets | **public**, 2 MiB | **private**, 5 MiB |
| menu-images | public, 5 MiB | public, 5 MiB |
| Confirm email | ON | ON |
| Email signup | идэвхтэй | идэвхтэй |

Read-only SQL catalog-аар багана, constraint, index, function body/EXECUTE grant/search_path, trigger, policy, table grant болон bucket metadata-г харьцуулсан. Бүрэн metadata: [production snapshot](deployment/production-schema-2026-10-17.json), [test snapshot](deployment/test-schema-2026-10-17.json). Дахин шалгах query: [deployment-inspection.sql](../supabase/deployment-inspection.sql). Эдгээр нь **backup биш**, хэрэглэгчийн өгөгдөл, Auth нууц, Storage файлыг агуулахгүй.

Нэмэлт нотолгоо: [migration SHA-256 manifest](deployment/migration-manifest-2026-10-17.json), [migration/advisor/Auth шалгалт](deployment/verification-2026-10-17.json), [dependency audit](deployment/dependency-audit-2026-10-17.json).

Production-д app schema бүхэлдээ дутуу; test-ийн өгөгдлийг production руу хуулж болохгүй. Production-ийн 2 Auth хэрэглэгчийг хадгална. Test history нь repository дахь дөрвөн migration-ийн version/name-тай таарсан; remote history-ийн SQL bytes-ийг local файлын checksum-тэй тэнцүү гэж батлаагүй. Local migration-уудыг PGlite дээр дахин ажиллуулж шалгасан.

## 3. Хэрэгжүүлэх migration-ууд — зөвхөн зөвшөөрлийн дараа

| Дараалал | Migration | Үр дүн |
|---|---|---|
| 1 | `20261012111118_nfc_smart_initial.sql` | 9 хүснэгт, RLS, permission RPC, NFC resolver, Storage policy. Байгаа `organization-assets` bucket-ийг private болгож 5 MiB ceiling тогтооно. |
| 2 | `20261012154811_analytics_aggregates.sql` | Эрх шалгадаг analytics aggregation RPC. |
| 3 | `20261013164143_organization_profile_hardening.sql` | Profile хэмжээ, canonical slug, хоосон нэр, contact URL-ийн 4 constraint. |
| 4 | `20261013200319_platform_user_pagination.sql` | Admin эрх шалгадаг, хязгаартай хэрэглэгч хайх/хуудаслалтын RPC. |

Migration 3-ын constraint-ууд `NOT VALID`: шинэ/өөрчлөгдөх мөрөнд үйлчилнэ, өмнөх мөрүүдийг автоматаар шалгахгүй. Дараагийн validation нь тусдаа батлуулах ажиллагаа. Одоогийн production-д organizations хүснэгт байхгүй тул historical organization мөрийн асуудал илрээгүй.

Migration 1 нь `storage.buckets`-ийн тохиргоог upsert хийдэг. Энэ бол production өөрчлөлт мөн; зөвшөөрлийн хүрээнд **public → private, 2 → 5 MiB ceiling** гэдгийг тусгайлан багтаана. App upload-ийн шинэ 2 MB хязгаар нь bucket-ийн 5 MiB дээд хязгаараас тусдаа. `menu-images`-ийг эдгээр migration өөрчлөхгүй. Seed, test account, admin enrollment энэ ажиллагаанд орохгүй.

Хэрэгжүүлэх үед project ref, шинэ snapshot, migration hash-ийг дахин тулгаж, зөвхөн дээрх дөрвийг дарааллаар migration history-тэй хэрэгжүүлнэ. CLI ашиглавал суулгасан `2.120.0` хувилбарын `db push --help`-ийг шалгасан; Vault өөрчлөлтөөс сэргийлж `--skip-vault` хэрэглэнэ. Доорх командыг **одоогоор ажиллуулаагүй**:

```powershell
# Backup баталгаажиж, хэрэглэгч production өөрчлөлтийг зөвшөөрсний дараа:
npx supabase db push --project-ref xcsnkvoulmrpxoxcjuvl --skip-vault --dry-run
# Dry run зөвхөн дээрх 4 migration-ийг харуулсан үед:
npx supabase db push --project-ref xcsnkvoulmrpxoxcjuvl --skip-vault
```

`--include-seed`, `--include-roles`, `--include-all`, `db reset`, history repair, хүснэгт drop ашиглахгүй. Нэг migration бүтэлгүйтвэл дараагийнхыг үргэлжлүүлэхгүй; history/catalog-ийг уншиж, тусдаа forward fix бэлтгэнэ.

## 4. Аюулгүй байдлын шалгалт

| Хэсэг | Нотолгоо, дүгнэлт | Нэвтрүүлэхийн өмнөх ажил |
|---|---|---|
| Production RLS | App хүснэгт байхгүй тул app RLS хараахан суулгагдаагүй. | 4 migration-ийн дараа дахин advisor/catalog шалгах. |
| Test tenant isolation | 9 хүснэгт RLS ON. UPDATE-д USING + WITH CHECK; tenant/page/category холбоос composite FK; шууд membership write хаалттай. | Production дээр ижил policy/grant үүссэнийг батлах. |
| Private schema | Хоёр төслийн Data API `Accept-Profile: private` хүсэлтэд `406 PGRST106` өгсөн. | Private schema-г API exposed schemas-д нэмэхгүй. |
| Privileged RPC | Test-ийн SECURITY DEFINER функц private schema-д, `search_path=''`; public wrapper нь INVOKER. PUBLIC execute байхгүй. | Future function-ийг мөн explicit grant-тай review хийх. |
| Internal хүснэгт | `private.platform_admins`, `private.scan_rate_limits` RLS ON, client grant/policy байхгүй. Advisor-ийн 2 INFO нь зориудын deny-by-default загвартай нийцнэ. | INFO арилгахын тулд permissive policy бүү нэм. |
| Auth | Хоёр төсөлд Confirm email ON, email provider ON, signup enabled, phone provider OFF; `/auth/v1/settings` HTTP 200. | Confirm email ON хэвээр үлдээнэ. |
| Нууц үг | Production advisor: **Leaked Password Protection Disabled** WARN. | Боломжтой plan дээр ON болгох; боломжгүй бол эрсдэлийг эзэмшигч шийдвэрлэнэ. |
| Auth authorization | Server `getUser()`, DB membership болон admin RPC ашиглана; `user_metadata`-аар эрх олгодоггүй. | Auth URL, SMTP, CAPTCHA/rate limits, MFA/session тохиргоог dashboard дээр батлах. Эдгээрийг public settings API-аар бүрэн шалгаагүй. |
| Production Storage | objects/buckets RLS ON боловч policy 0; `organization-assets` public. Одоогийн object metadata 0. Public download нь private policy хамгаалалтыг орлоно гэж үзэж болохгүй. | Migration 1-ээр private болгох; дараа нь anonymous download хориглогдохыг шалгах. |
| Хуучин menu-images | Хоёр төсөлд public, app ашиглахгүй. Нийт object metadata 0. | Production дээр private болгохыг тусдаа зөвшөөрлийн хүрээнд санал болгоно; устгахгүй. |
| Asset endpoint | Path whitelist, MIME signature шалгалт, private bucket; зөвхөн published asset-ийг шалгасны дараа service client; бусад нь session RLS. Cache no-store. | Hosted deployment дээр draft зураг public URL-аар гарахгүйг шалгах. |
| NFC routing | 96-bit random code, immutable; active card + published page + active org л resolve хийнэ. Slug whitelist, canonical origin дотор 307; arbitrary external redirect байхгүй. CDN/browser no-store. | Ижил NFC URL-аар үнэ солих, card disable, draft холбоосыг staging дээр дахин шалгах. |
| Analytics | Server-only secret, daily/card HMAC, raw IP DB-д хадгалахгүй; Vercel-ийн trusted forwarded IP, 1 минутын dedup, RPC service_role-only. | Энэ нь бүх HTTP traffic-ийн rate limiter биш. Vercel traffic/error хэмжээг хянах. |
| Session/cache | Auth/dashboard proxy private no-store; public page force-dynamic/revalidate 0. | CDN rewrite/cache override нэмэхгүй. |

Advisor-ийн тайлбар: [Leaked password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection), [RLS without policies](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

## 5. Development dependency-ийн 5 high advisory

2026-10-17-ны registry audit: runtime **0**, full audit **5 high**. Энэ нь таван бие даасан CVE биш; нэг advisory дараах dependency chain-д дамжсан:

`eslint-config-next@16.4.0 → @next/eslint-plugin-next@16.4.0 → fast-glob@3.3.1 → micromatch@4.0.8 → braces@3.0.3`.

| Audit entry | Үндсэн шалтгаан |
|---|---|
| braces | Deep nested brace pattern нь stack exhaustion/DoS үүсгэнэ. |
| micromatch | braces dependency |
| fast-glob | micromatch dependency |
| @next/eslint-plugin-next | fast-glob dependency |
| eslint-config-next | Next ESLint plugin dependency |

[GHSA-vfj7-8cjw-p6xm / CVE-2026-93687](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)-д `<=3.0.3` өртсөн, **patched version байхгүй** гэж заасан. Registry-ийн latest braces мөн 3.0.3; latest Next ESLint plugin 16.4.2 нь fast-glob 3.3.1-ээс хараат хэвээр. `npm audit fix --force`-ийн санал болгосон eslint-config-next 14.2.35 downgrade нь Next 16 toolchain-тай нийцэх найдвартай засвар биш тул хийгээгүй.

Local call-site review: Next plugin-ийн `get-root-dirs.js` нь зөвхөн `settings.next.rootDir` string/array ирэхэд fast-glob дуудна. Одоогийн config rootDir glob тохируулаагүй; хэрэглэгчийн HTTP/form өгөгдөл lint glob болдог зам илрээгүй. Эмзэг dependency нь build/dev орчинд үлдэж байгаа тул үүнийг бүрэн зассан гэж үзэхгүй.

Хийсэн хамгаалалт: runtime audit-ийг CI-д fail gate болгосон (`npm run audit:runtime`), version/lockfile pin-ийг хадгалсан, GitHub checks read-only token ба 15 минутын timeout-тай. Untrusted PR-д production secret бүхий job ажиллуулахгүй; Vercel Preview-д test key л өгнө. Repo/config өөрчилж чаддаг оролцогчийн build code-г review хийх шаардлага хэвээр.

**Нээлттэй шийдвэр:** public launch-аас өмнө эзэмшигч энэ dev-only үлдэгдэл эрсдэлийг түр зөвшөөрөх эсвэл patched dependency гарах хүртэл хүлээнэ. Өөрөө зөвшөөрсөн гэж бүртгээгүй. Дараагийн release бүрийн өмнө, хамгийн орой 2026-10-24-нд full audit-ийг дахин шалгана; шинэ advisory/runtime finding гарвал түр exception үйлчлэхгүй.

## 6. Vercel тохиргоо

Бэлтгэсэн: [vercel.json](../vercel.json), [.vercelignore](../.vercelignore), Node `24.x`, `npm ci`, build `npm run check`, Seoul `icn1`. Next dynamic server deployment хэрэглэнэ. Static export, database migration hook нэмээгүй. [Node хувилбар](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), [region](https://vercel.com/docs/regions).

| Variable | Production scope | Preview scope |
|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | `https://xcsnkvoulmrpxoxcjuvl.supabase.co` | `https://khohnhjjyetwuzfsttkl.supabase.co` |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Production publishable key | Test publishable key |
| NEXT_PUBLIC_APP_URL | `https://<VERCEL_PROJECT>.vercel.app` | Тогтвортой test preview alias-ийн HTTPS origin |
| SUPABASE_SECRET_KEY | Production secret; server-only | Test secret; server-only |
| ANALYTICS_HMAC_SECRET | Random ≥32 тэмдэгт, тусдаа нууц | Production-оос өөр random нууц |
| NEXT_PUBLIC_SUPPORT_EMAIL | Мониторинг хийдэг хаяг сонгосны дараа; одоогоор хоосон | Сонголтоор |
| E2E_ENABLED | `0` | `0` |

`VERCEL`, `VERCEL_ENV`-ийг Vercel өөрөө өгнө. E2E credential, PAT, DB password, Resend API key-г web app env-д хийхгүй. Resend SMTP нууц нь Supabase Auth тохиргоонд л хэрэгтэй. Шинэ opaque Supabase key-ийн project ownership-ийг build validator дотроос тайлж шалгах боломжгүй тул dashboard-аас зөв төслийн key сонгож hosted connectivity-г батална.

Build guard нь Vercel дээр local `.env` fallback ашиглахгүй; production/preview DB ref зөрөх, canonical URL буруу, шаардлагатай key/HMAC дутуу, public variable-д service secret хийх, E2E идэвхжүүлэхэд build-ийг зогсооно. `.vercelignore` local secret/report-уудыг upload-аас хасна. NEXT_PUBLIC утга өөрчлөхөд дахин build шаардлагатай.

Vercel import хийхдээ repository root, Production branch `main`, дээрх env scope-уудыг сонгоно. Эхний production deploy болон alias promotion-ийг зөвшөөрлийн дараа гүйцэтгэнэ. Preview protection ашиглаж, production key-г Preview-д өвлүүлэхгүй. Нийтийн NFC хэрэглээнд нээх үед production alias дээр login protection шаардлагагүй байх ёстой.

**Upload засвар:** Vercel Function request/response 4.5 MB хязгаартай. App зураг тус бүр 2,000,000 byte, нэг form-д хамгийн их 2 branding зураг; server action body limit 4 MiB. Browser file validity ба server validation нэмсэн, Монгол тайлбарыг шинэчилсэн. Bucket-ийн 5 MiB ceiling-ийг remote дээр өөрчлөөгүй. Шууд Storage API-аар тавьсан хуучин том asset байвал hosted response-ийн хязгаарыг тусад нь турших шаардлагатай. [Vercel limit](https://vercel.com/docs/functions/limitations).

`vercel.app` project alias-ийг NFC картанд бичсэн бол project нэр/alias-ийг хадгална. Дараа custom domain авсан ч өмнөх `/t/<code>` хаягуудыг үргэлж ажиллуулна; deployment hash бүхий түр URL-г картанд бичихгүй.

## 7. Authentication URL ба Resend SMTP заавар

Бодит Vercel alias сонгосны дараа production Supabase → Authentication → URL Configuration:

| Талбар | Тохируулах утга |
|---|---|
| Site URL | `https://<VERCEL_PROJECT>.vercel.app` |
| Redirect allowlist — signup | `https://<VERCEL_PROJECT>.vercel.app/auth/callback` |
| Redirect allowlist — reset | `https://<VERCEL_PROJECT>.vercel.app/auth/callback?next=/reset-password` |

Эдгээр нь app-ийн бодит `emailRedirectTo` / `redirectTo`-тай таарна. Allowlist-д query string бүхий reset URL-ийг UI хүлээж авсныг, reset mail эцсийн зөв origin/route-д бууж байгааг бодитоор шалгана. Production-д localhost, `https://**.vercel.app/**` wildcard оруулахгүй; preview redirect-ийг test Supabase дээр тохируулна. Confirm email ON хэвээр. [Supabase redirect заавар](https://supabase.com/docs/guides/auth/redirect-urls).

Resend бэлтгэл:

1. Өөрийн хянадаг mail domain худалдаж авсны дараа Resend-д domain нэмнэ. `vercel.app`-ийн DNS-ийг эзэмшдэггүй тул түүгээр sender баталгаажуулахгүй.
2. Resend-ийн үзүүлсэн DNS бичлэгүүдийг domain provider дээр нэмж Verified болгоно. Sender: `<SENDER_EMAIL_ON_VERIFIED_DOMAIN>`, display name: `NFC Smart`.
3. Supabase production → Authentication → Email / SMTP settings дотор custom SMTP-г дараах байдлаар тохируулна. Энэ шат мөн хэрэглэгчийн зөвшөөрөл шаардсан production өөрчлөлт.

| SMTP талбар | Утга |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` (TLS) |
| Username | `resend` |
| Password | `<RESEND_API_KEY>` — secret field-д л оруулах |
| Sender email | `<SENDER_EMAIL_ON_VERIFIED_DOMAIN>` |
| Sender name | `NFC Smart` |

4. Signup confirmation, forgot-password, email change template-уудын холбоосыг шалгана; app PKCE code exchange callback ашиглаж байгаа тул default confirmation URL flow-г эвдэж token-hash route болгон дур мэдэн солихгүй.
5. Зөвшөөрсөн хаягуудаар signup → email confirmation → login; reset → шинэ password → дахин login; expiry/reuse болон logout-ийг шалгана. Token/password-ийг log/trace-д хадгалахгүй. SMTP rate limits, sender reputation, delivery/bounce-ийг шалгана.

Одоогоор SMTP илгээгээгүй, sender domain баталгаажаагүй. Supabase default SMTP нь нийтэд production email хүргэлтийн шийдэл биш, team-ийн зөвшөөрөгдсөн хаягт хязгаарлагддаг. [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [Resend SMTP](https://resend.com/docs/send-with-smtp).

## 8. Backup ба rollback төлөвлөгөө

Одоогоор backup татаж аваагүй, restore drill хийгээгүй; project-ийн төлбөрийн plan/PITR эрхийг баталгаажуулаагүй. **Schema snapshot-ийг сэргээх backup гэж тооцохгүй.**

Migration-ийн өмнө:

1. Оператор, UTC timestamp, release commit, migration SHA-256, өмнөх deployment ID/alias болон env хувилбаруудыг бүртгэнэ. Write traffic-ийг хаалттай байлгана.
2. Supabase Database → Backups дээр хамгийн сүүлийн recoverable backup, retention, restore эрхийг батална. Боломжгүй бол manual logical export хийнэ. Auth-ийн байгаа 2 хэрэглэгч, `public/private`, roles/grants, migration history, Storage metadata багтсаныг manifest-аар батална.
3. CLI logical export ашиглавал `db dump --help`-ийн schema/data-only/role-only сонголтыг тухайн environment дээр шалгаж, Supabase-ийн restore guide-ийн дагуу Auth/Storage-ийн хамрах хүрээг батална. Default dump-ийг бүх managed schema-г бүрэн хамарсан гэж таамаглахгүй. DB password/connection string-ийг shell history/log-д тавихгүй. Шифрлэсэн, хандалт хязгаарласан off-site backup байршил хэрэглэнэ.
4. Storage-ийн binary object-уудыг API/S3 хэрэгслээр тусад нь хувилбартай backup хийнэ; object count/path/size/hash manifest авна. Одоогийн metadata count 0 ч cutover-ийн өмнө дахин шалгана. Bucket visibility/policy-г бас бүртгэнэ.
5. Auth Site URL/redirect, SMTP, provider/rate-limit/MFA тохиргоо болон Vercel env/alias-ийг тусад нь бүртгэнэ; secret утгуудыг password manager-д хадгална.
6. Production-оос тусдаа, гаднаас хаалттай recovery project дээр restore drill хийнэ. Энэ нь одоогийн test төслийг overwrite хийх ажиллагаа биш. Mail хүргэлтийг хязгаарлаж, Auth count, schema/policy, tenant isolation, asset download-ийг шалгана. Backup-ийн integrity ба сэргээх хугацааг нотолсны дараа migration approval-ийг ашиглана.

Төлөвлөсөн зорилт: анхны cutover үед writes хаалттай, pre-migration backup хүртэл алдагдалгүй; цааш daily backup бол RPO ≤24 цаг, RTO зорилт ≤2 цаг (drill-ээр батлаагүй). Үүнээс бага алдагдал шаардвал plan/PITR-ийг тусдаа шийднэ. DB backup нь Storage binary файл агуулахгүй; restore хийх үед downtime үүснэ. [Supabase backups](https://supabase.com/docs/guides/platform/backups), [CLI restore guide](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore).

Rollback trigger: tenant data алдагдах/өөр tenant-д харагдах, auth callback/login тасрах, NFC inactive/draft нээлттэй болох, тогтвортой 5xx эсвэл Storage permission алдаа.

| Нөхцөл | Авах арга хэмжээ |
|---|---|
| App regression, DB хэвийн | Vercel-ийн өмнөх баталгаажсан deployment руу alias rollback. Эхний deploy бол өмнөх хувилбаргүй тул public traffic-ийг хааж staging хувилбар руу буцна. |
| Migration дундаас зогсох | Дараагийн migration-ийг зогсоож history/catalog шалгана. Өмнө амжилттай болсон migration-ийг сохроор давтаж ажиллуулахгүй; additive forward fix сонгоно. |
| Schema/data гэмтэх | Writes зогсоож ослын дараах backup авна. Алдагдах интервал, restore target-ийг танилцуулж **тусдаа restore зөвшөөрөл** авна. Тусгаарласан restore-ийг шалгасны дараа cutover. |
| Auth/SMTP/env алдаа | Өмнөх тохиргоо/secret version-ийг сэргээж шаардлагатай rebuild хийнэ. DB restore эдгээр external тохиргоог автоматаар сэргээнэ гэж үзэхгүй. |
| Storage алдаа | DB metadata ба binary backup-ийг ижил үеийнхээр тулгана; Storage хүснэгтээс SQL DELETE хийхгүй. |

Production app хүснэгтүүдийг drop хийх down migration бэлтгээгүй. Vercel rollback нь DB/Auth/Storage rollback биш. Migration 1 буцсан тохиолдолд `organization-assets`-ийг public болгохыг автомат rollback-д оруулахгүй; хувийн файлын эрсдэлийг тусад нь шийднэ. Restore-ийн дараа NFC code болон хуучин hostname-ийг хадгалж, migration history, RLS, Auth, Storage, E2E smoke-ийг дахин батална.

## 9. Баталгаажуулалт ба зөвшөөрөл авах хүрээ

- Local `npm run check`: lint, TypeScript, **94 unit test**, **131 PGlite DB assertion**, production build амжилттай.
- Өөрчлөлтийн дараах Edge/Playwright public smoke: **5/5**, `.last-run.json` = passed, failedTests = []. Windows runner-ийн эхний teardown-ийн эцсийн төлөв тасалдсан тул local server-ийг тусад нь удирдаж smoke suite-ийг дахин ажиллуулсан.
- `npm run audit:runtime`: **0 vulnerabilities**. Full audit-ийн **5 high dev entry үлдсэн**.
- Өмнөх бодит test Supabase E2E: **6/6**; Confirm email сэргэсэн. Энэ удаа full integration дахин ажиллуулаагүй, Auth тохиргоо бууруулаагүй.
- Production/test catalog болон Auth GET шалгалтууд read-only. Production `.env.local` hash өөрчлөгдөөгүй.
- Vercel cloud build, SMTP delivery, production post-migration шалгалт, backup restore drill **хийгдээгүй**.

Дараагийн production change request нь: backup/restore нотолгоог эхэлж бүрдүүлээд, `xcsnkvoulmrpxoxcjuvl` дээр дээрх **4 migration** болон тэдгээрт багтсан `organization-assets` private тохиргоог хэрэгжүүлэх. Delete/reset/seed, Auth хэрэглэгч өөрчлөх, admin нэмэх, `menu-images` өөрчлөх, SMTP/domain өөрчлөх, public launch нь энэ migration approval-д орохгүй. Эдгээрийг бодит URL/утга/нөлөөлөлтэй нь тусад нь танилцуулна.

Хэрэглэгч зөвшөөрөх хүртэл production өөрчлөлт хийхгүй. Нийтийн launch-аас өмнө dev advisory-ийн эрсдэлийн шийдвэр, leaked password protection, Resend баталгаажсан sender, Auth URLs, backup drill болон hosted smoke бүгд шийдэгдсэн байх ёстой.
