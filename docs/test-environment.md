# NFC Smart — тусгаарласан Supabase E2E

Production: `nfc-smart-production` (`xcsnkvoulmrpxoxcjuvl`). Тестийн төсөл: `nfc-smart-test` (`khohnhjjyetwuzfsttkl`), URL: `https://khohnhjjyetwuzfsttkl.supabase.co`. Хоёул `NFC Smart` organization (`fsmtzwmlrfkqdhjxciww`)-д байгааг connector-оор баталсан. Production `.env.local` болон бодит өгөгдлийг өөрчлөхгүй. Тестийн өгөгдөл, migration, cleanup зөвхөн энэ тестийн төсөлд хийгдэнэ. `supabase db reset --linked` ашиглахгүй.

## Тохиргоо

Git-д орохгүй `.env.e2e.local` файлыг repo root-д үүсгэсэн. Доорх хоосон талбаруудад **зөвхөн nfc-smart-test** төслийн утгыг локал editor-оор оруулна. Түлхүүрийг чат, terminal command, Git, screenshot-д бүү оруул.

```dotenv
E2E_SUPABASE_PROJECT_NAME=nfc-smart-test
E2E_SUPABASE_PROJECT_REF=khohnhjjyetwuzfsttkl
NEXT_PUBLIC_SUPABASE_URL=https://khohnhjjyetwuzfsttkl.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3100
ANALYTICS_HMAC_SECRET=
SUPABASE_ACCESS_TOKEN=
```

- Project reference: тестийн Dashboard → Settings → General дахь ID. URL нь яг `https://<test-reference>.supabase.co` байна.
- API Keys: `sb_publishable_…`, `sb_secret_…` гэсэн шинэ түлхүүрүүд. Legacy JWT key энэ E2E runner-д зөвшөөрөгдөхгүй. Secret нь тестийн хэрэглэгчийг баталгаажуулах/цэвэрлэх, private Storage delivery-д хэрэгтэй; production-д нэмэхгүй.
- `SUPABASE_ACCESS_TOKEN` нь Management API-аас төслийн нэр/ID-г **унших** verification-д ашиглах optional локал token. Одоогоор шаардахгүй: connector-оор хоёр төслийг ID-аар шалгаж, credential агуулаагүй `.local/e2e-project-identity.json` metadata хадгалсан. Энэ 24 цагийн metadata байгаа үед `e2e:verify` нэмэлт Management token-гүйгээр test API keys-ийг шалгана. Metadata/receipt-ийг гараар зохиож болохгүй. Хугацаа дуусвал agent connector-оор дахин батална, эсвэл local Management token ашиглана; token browser болон Next серверт дамжихгүй.
- `ANALYTICS_HMAC_SECRET` optional. Local E2E нь Vercel-ийн trusted IP analytics-ийг батлахгүй.

`.env.e2e.local` файлыг Next.js өөрөө ачаална гэж тооцохгүй. `scripts/e2e-environment.mjs` файлыг explicitly parse хийж, test URL/key-г inherited shell production утгуудаас давуугаар онооно. Дутуу test key-г production-оос нөхөхгүй. Production-оос ирж болох service key, analytics key, Management token болон database environment-уудыг тестийн child process-д хоослоно. `.env.local` зөвхөн ялгаатай URL/key шалгахад уншигдана; өөрчлөгдөхгүй.

## Нэр болон ID баталгаажуулах

```powershell
npm.cmd run e2e:verify
```

Энэ команд өгөгдөл өөрчлөхгүй. Management token байвал хоёр төслийг ID-аар шууд уншина; үгүй бол connector-оор саяхан баталсан metadata ашиглана. Нэр, ID, ижил organization, test төслийн ACTIVE_HEALTHY төлөвийг шалгана. Test URL руу read-only Auth requests явуулж publishable/secret key тохирч буйг батална. Production URL/ref-ээс ялгаатайг шалгаж, зөвхөн нэр болон ID-г log-д хэвлэнэ. Key, user rows, API response body хэвлэхгүй. Guard нь зөвхөн `khohnhjjyetwuzfsttkl` reference-г зөвшөөрнө.

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

## 2026-10-15-ны энэ сессийн төлөв

Connector-ийн project list хоосон боловч user өгсөн ID-аар `get_project`, organization metadata, read-only SQL болон migration apply бүгд ажилласан. Иймээс дахин холбох шаардлага одоогоор алга; account-wide discovery-г төслийн хандалтгүй гэж дүгнэж болохгүй. CLI login token шаардах боловч connector migration-д CLI ашиглаагүй.

`nfc-smart-test` нэр/ID/URL, production-оос ялгаатай reference, ижил NFC Smart organization батлагдсан. Дөрвөн migration зөвхөн тестийн төсөлд хэрэгжсэн. MCP үүсгэсэн timestamp history-г яг хэрэгжсэн SQL файлын дөрвөн local version-той нэр/хуучин version-оор нарийвчлан тулгаж тааруулсан; remote history одоо дээрх дөрвөн version-той ижил. Schema-г дахин хэрэгжүүлээгүй, reset хийгээгүй.

Read-only шалгалт: application-ийн 9 хүснэгт бүгд RLS enabled; `organization-assets` private, 5 MiB, зөв MIME-тай, SELECT/INSERT/UPDATE/DELETE дөрвөн Storage policy байна. Application болон Storage test өгөгдөл одоогоор 0. Урьд байсан ашиглаагүй `menu-images` bucket-ийг өөрчлөөгүй. Security Advisor ERROR/WARN илрүүлээгүй; `private.platform_admins`, `private.scan_rate_limits` дээр зориудаар шууд хандалтыг хаасан RLS-no-policy INFO хоёр тэмдэглэл байна ([тайлбар](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)).

Test API keys локал файлд хараахан өгөөгүй тул read-only key verification болон бодит Auth/CRUD/NFC/Storage E2E/cleanup **ажиллаагүй**. Тестийн suite идэвхгүй хэвээр. Production `.env.local` hash өөрчлөгдөөгүй; production-д metadata уншихаас бусад үйлдэл хийгээгүй.

Cloud read-only privilege шалгалтаар anonymous хэрэглэгч organization/member/menu/private-admin хүснэгт уншихгүй, authenticated хэрэглэгч membership-д шууд INSERT хийхгүй, public page/NFC projection RPC нээлттэй, `record_scan` зөвхөн service role-д зөвшөөрөгдсөнийг баталсан. Энэ нь бодит хоёр tenant-ийн browser integration-ийг орлохгүй.

Эх сурвалж: [Supabase modern API keys](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys), [Management API project lookup](https://supabase.com/docs/reference/api/v1-get-project). Next.js environment load order болон testing зааврыг суусан package-ийн `node_modules/next/dist/docs/`-оос шалгасан.
