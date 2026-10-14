# NFC Smart — тусгаарласан Supabase E2E

Production: `nfc-smart-production` (`xcsnkvoulmrpxoxcjuvl`). Тестийн төсөл: `nfc-smart-test`. Production `.env.local` болон бодит өгөгдлийг өөрчлөхгүй. Тестийн өгөгдөл, migration, cleanup зөвхөн нэр болон ID нь баталгаажсан тестийн төсөлд хийгдэнэ. `supabase db reset --linked` ашиглахгүй.

## Тохиргоо

Git-д орохгүй `.env.e2e.local` файлыг repo root-д үүсгэсэн. Доорх хоосон талбаруудад **зөвхөн nfc-smart-test** төслийн утгыг локал editor-оор оруулна. Түлхүүрийг чат, terminal command, Git, screenshot-д бүү оруул.

```dotenv
E2E_SUPABASE_PROJECT_NAME=nfc-smart-test
E2E_SUPABASE_PROJECT_REF=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3100
ANALYTICS_HMAC_SECRET=
SUPABASE_ACCESS_TOKEN=
```

- Project reference: тестийн Dashboard → Settings → General дахь ID. URL нь яг `https://<test-reference>.supabase.co` байна.
- API Keys: `sb_publishable_…`, `sb_secret_…` гэсэн шинэ түлхүүрүүд. Legacy JWT key энэ E2E runner-д зөвшөөрөгдөхгүй. Secret нь тестийн хэрэглэгчийг баталгаажуулах/цэвэрлэх, private Storage delivery-д хэрэгтэй; production-д нэмэхгүй.
- `SUPABASE_ACCESS_TOKEN` нь Management API-аас төслийн нэр/ID-г **унших** verification-д ашиглах optional локал token. Shell environment-д өгч болно; browser болон Next серверт дамжуулахгүй. Supabase connector хоёр төслийг хардаг бол агент энэ token-гүйгээр project identity-г баталгаажуулж болно. Verification receipt-ийг гараар зохиож болохгүй.
- `ANALYTICS_HMAC_SECRET` optional. Local E2E нь Vercel-ийн trusted IP analytics-ийг батлахгүй.

`.env.e2e.local` файлыг Next.js өөрөө ачаална гэж тооцохгүй. `scripts/e2e-environment.mjs` файлыг explicitly parse хийж, test URL/key-г inherited shell production утгуудаас давуугаар онооно. Дутуу test key-г production-оос нөхөхгүй. Production-оос ирж болох service key, analytics key, Management token болон database environment-уудыг тестийн child process-д хоослоно. `.env.local` зөвхөн ялгаатай URL/key шалгахад уншигдана; өөрчлөгдөхгүй.

## Нэр болон ID баталгаажуулах

```powershell
npm.cmd run e2e:verify
```

Энэ команд өгөгдөл өөрчлөхгүй. Management API-аас хоёр төслийн нэр, ID, ижил organization, test төслийн ACTIVE_HEALTHY төлөвийг шалгана. Test URL руу read-only Auth requests явуулж publishable/secret key тохирч буйг батална. Production URL/ref-ээс ялгаатайг шалгаж, зөвхөн нэр болон ID-г log-д хэвлэнэ. Key, user rows, API response body хэвлэхгүй.

Амжилттай бол Git ignored `.local/e2e-target.json` дотор нэр/ID, verification timestamp болон key fingerprint хадгална; raw credential хадгалахгүй. Энэ нь локал operator-ийн итгэмжлэгдсэн тохиргоо бөгөөд cryptographic remote attestation биш. 24 цагийн дараа эсвэл test URL/key өөрчлөгдвөл дахин verify хийнэ. Хоосон, хуучирсан, буруу нэртэй receipt-ээр тест эхлэхгүй. Verification дангаараа E2E suite асаахгүй.

## Migration ба Storage бэлтгэх

**Төслийн бодит ID баталгаажаагүй байхад энэ алхмыг хийхгүй.** Mutation бүрийн өмнө зорилтот `nfc-smart-test (<verified ID>)` нэр/ID-г харуулж дахин шалгана. Production руу CLI link/push/reset хийхгүй.

Тестийн migration history-г эхлээд уншина. Зөвхөн хэрэгжээгүй version-уудыг доорх дарааллаар, explicit test project ID-тай Supabase migration tool-оор хэрэгжүүлнэ:

1. `supabase/migrations/20261012111118_nfc_smart_initial.sql`
2. `supabase/migrations/20261012154811_analytics_aggregates.sql`
3. `supabase/migrations/20261013164143_organization_profile_hardening.sql`
4. `supabase/migrations/20261013200319_platform_user_pagination.sql`

Эхний migration нь `organization-assets` private bucket (5 MiB, PNG/JPEG/WebP) болон байгууллага тус бүрийн Storage RLS-ийг хамтад нь үүсгэнэ. Bucket-ийг public болгох шаардлагагүй. Migration-ийг давхар хэрэгжүүлэхгүй; tool-ийн remote history дахь name/version-г local file-тай тулгана. Дараа нь `supabase/inspection.sql`-аар schema/RLS/grants/bucket-ийг read-only шалгаж, Supabase Security Advisor ажиллуулна. Production schema-г өөрчлөхгүй.

Тестийн Auth URL Configuration:

- Site URL: `http://127.0.0.1:3100`
- Redirect URL: `http://127.0.0.1:3100/auth/callback`
- Email signup enabled. Тестийн төслийн email confirmation-ийг унтраах эсвэл тестэд тохирох SMTP ашиглана. Default SMTP нь `example.com` хаяг руу захиа явуулахыг зөвшөөрөхгүй байж болно. CAPTCHA ашиглаж байвал автомат тестэд зориулсан тохиргоог зөвхөн тестийн төсөлд хийнэ.

## Бодит E2E ажиллуулах

```powershell
$env:PLAYWRIGHT_CHANNEL = 'msedge' # Windows; Chromium суулгасан бол шаардлагагүй
npm.cmd run test:e2e:integration
```

Runner эхлээд file + verification guard-ийг шалгаад дараа нь **child process дотор** `E2E_ENABLED=1` өгнө. Shell болон production dotenv-д энэ утгыг нэмэхгүй. Playwright мөн дахин guard шалгана. Өмнө ажиллаж буй сервер ашиглахгүй, `E2E_BASE_URL` хүлээн авахгүй; port 3100 сул байх ёстой. Тестийн app `.next-e2e` build directory ашиглаж, ердийн `.next` build-ээс тусгаарлагдана.

Бодит workflow: register/login → organization/branding upload → menu category/item → draft/public page → NFC redirect → QR PNG preview/download → үнэ өөрчлөгдсөн ч ижил NFC URL → өөр байгууллагын read/update/delete/cross-link болон Storage access хориг → NFC disable → owner menu delete confirmation → logout/protected access → cleanup.

Тест бүр UUID-тай email/slug ашиглана. Cleanup өөрийн exact organization ID/slug болон user ID/email-ээр шүүж, өөр run-ийн өгөгдөлд хүрэхгүй. Устгалын өмнө guard-ийг дахин шалгаж target нэр/ID-г хэвлэнэ. Storage objects → хүүхэд хүснэгтүүд → organization → test users дарааллаар цэвэрлээд үлдэгдлийг шалгана. Тестийг process kill хийвэл finally cleanup ажиллахгүй байж болно; ийм үед бүх төсөл reset хийхгүй, тухайн run-ийн exact ID-г оператор шалгаж цэвэрлэнэ.

Integration trace, screenshot, raw API error/call logs хадгалахгүй. Safe reporter зөвхөн test title/status, source location, target нэр/ID-г хэвлэнэ; credential агуулж болох Playwright call logs-ийг хэвлэхгүй. Тестийн artifacts-ийг run дуусмагц арилгана.

## Credentials-гүй локал шалгалт

```powershell
npm.cmd run check
$env:E2E_ENABLED = '0'
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npm.cmd run test:e2e -- tests/e2e/public-smoke.spec.ts
```

Unit болон PGlite PostgreSQL нь Supabase руу холбогдохгүй. Smoke нь mutation form submit хийхгүй. Disabled/blocked integration-ийг pass гэж тайлагнахгүй.

## 2026-10-14-ний энэ сессийн төлөв

User хоёр төслийг үүсгэсэн гэж мэдээлсэн. Connector `projects: []` буцаасан; CLI `AccessTokenRequiredError` өгсөн. Test project reference болон API keys локал файлд хараахан байхгүй. Иймээс test нэр/ID, хоёр cloud URL-ийн ялгаа, cloud migrations, Auth/Storage болон бодит cleanup **хараахан баталгаажаагүй / ажиллаагүй**. Хоосон тохиргоотой verify/integration command сервер болон mutation эхлэхээс өмнө амжилттай хориглогдсон. Production `.env.local` hash хэвээр.

Эх сурвалж: [Supabase modern API keys](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys), [Management API project list](https://supabase.com/docs/reference/api/v1-list-all-projects). Next.js environment load order болон testing зааврыг суусан package-ийн `node_modules/next/dist/docs/`-оос шалгасан.