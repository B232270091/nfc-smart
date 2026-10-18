# Хөгжүүлэлтийн явц

Энэ файл бодитоор хэрэгжүүлсэн болон гаднын орчноор баталгаажаагүй ажлыг тусад нь тэмдэглэнэ.

## 2026-10-17 — Backup/recovery бэлтгэл

- [Дэлгэрэнгүй заавар](production-backup-recovery.md): organization Free Plan батлагдсан; production 2 confirmed/password-hash бүхий Auth user, 2 email identity, 3 session, Storage object 0. Нууц утгуудыг гаргаагүй.
- CLI fixture dry-run-аар schema/data backup-ийн ялгааг шалгасан. Read-only/TLS option forwarding батлагдаагүй тул native PostgreSQL 17 client-ийн explicit read-only export арга бэлтгэсэн.
- Offline production-like migration rehearsal 4/4, 18/18 check PASS; synthetic Auth өгөгдөл хадгалагдсан. Remote CLI migration dry-run, real backup/export/restore хараахан хийгдээгүй.
- Production өөрчлөлт хийгээгүй. Existing DB credential, client tools, encrypted backup, recovery drill-ийн нотолгооны дараа хэрэглэгчээс migration зөвшөөрөл шинээр авна.

## 2026-10-17 — Production deployment preparation

- [Монгол тайлан, migration жагсаалт, Vercel/Auth/Resend заавар, backup/rollback төлөвлөгөө](production-deployment-preparation.md) бэлэн. Production өөрчлөлт хийгээгүй.
- Production/test catalog snapshot авсан: production app schema 0, test 9 хүснэгт/4 migration; production 2 Auth хэрэглэгчтэй. Production organization-assets public байгаа тул migration 1-ийн private өөрчлөлтийг approval scope-д оруулсан.
- Vercel config, Node 24, build environment isolation guard, CI runtime audit gate бэлтгэсэн. Upload тус бүр 2 MB, body limit 4 MiB болгосон.
- Lint, TypeScript, 94 unit test, 131 DB assertion, production build тэнцсэн. Runtime audit 0; patched release байхгүй braces advisory-оос дамжсан 5 dev high entry нээлттэй.
- Нийтийн launch-ийн өмнө SMTP sender/domain, бодит Vercel alias, production Auth URLs, leaked-password protection болон backup restore drill-ийг баталгаажуулна.

## 2026-10-17 — Бодит E2E баталгаажуулалт ба release бэлтгэл

- Тусдаа `nfc-smart-test (khohnhjjyetwuzfsttkl)` төсөлд 4 migration хэрэгжсэн; орчны URL, publishable/secret key болон production-оос тусгаарлалтыг баталгаажуулсан.
- Edge/Playwright-ийн эцсийн suite **6/6 тэнцсэн**: 5 public smoke болон 1 бодит Auth → organization/Storage → menu/publication → NFC/QR → price update → tenant isolation → disable/delete/logout workflow. Дэлгэрэнгүй нь [тестийн тайлан](test-environment.md#2026-10-17-ны-эцсийн-шалгалт).
- Streamed Next.js not-found хуудасны HTTP 200/404 ялгааг E2E-д зөв тооцож, denial heading, noindex, edit form болон хувийн item нэр байхгүйг заавал шалгадаг болгосон. Authorization/RLS өөрчлөөгүй.
- Reporter нь raw error/call logs хэвлэхгүйгээр source coordinates харуулна; integration үед explicit smoke screenshot мөн унтарна. Тестийн зааврыг modern keys болон verified runner-тэй нийцүүлсэн.
- Cleanup дараа Auth users, organizations/members, categories/items, pages, cards болон private Storage objects бүгд 0. Түр унтраасан Confirm Email-ийг хэрэглэгч сэргээж, Auth API HTTP 200 / `mailer_autoconfirm=false` гэж дахин баталсан.
- 2026-10-17-ны `npm.cmd run check` **exit 0**: ESLint, TypeScript, **74 unit тест**, **131 PostgreSQL integration/security assertion**, optimized production build бүгд тэнцсэн.
- Runtime dependency audit **0 vulnerability**. Development tooling-ийн `braces` dependency chain-д **5 high advisory** хэвээр; санал болгосон force-fix нь Next ESLint-ийг 14.x руу буулгах breaking change тул хэрэгжүүлээгүй.
- Production read-only inspection: migration history хоосон; `organizations`, `menu_items`, `pages`, `nfc_cards`, `get_public_page(text)`, `resolve_nfc_card(text)` байхгүй. Production schema/data болон `.env.local` өөрчлөгдөөгүй.

### Үлдсэн release acceptance

1. Production migration-ийн 4 файлыг review хийж, тусад нь зөвшөөрсний дараа хэрэгжүүлэх; RLS/RPC/private bucket-ийг шалгах. Одоогийн production-only-read хязгаарлалт хүчинтэй.
2. Vercel environment болон тогтмол HTTPS domain, server-only secret/analytics тохиргоо, Auth redirect allowlist бэлтгэж deployment баталгаажуулах.
3. Бодит SMTP email confirmation/password recovery callback, hosted analytics, admin/staff UI, public зураг болон vCard-ийн төхөөрөмжийн шалгалтыг гүйцээх. Local SQL/unit coverage нь эдгээр hosted/browser/device шалгалтыг орлохгүй.
4. Хоёр өөр утсан дээр биет NFC tap болон QR fallback турших.

Доорх хуучин огноотой тэмдэглэлүүд нь тухайн үеийн төлөв; cloud E2E хүлээгдэж байсан тэмдэглэлүүдийг дээрх үр дүн шинэчилнэ.

## 2026-10-14 — Phase 2: байгууллагын удирдлага

- Хэрэглэгч Supabase registration/login/logout/protected pages ажиллаж байгааг баталгаажуулсан. Auth action, SSR client, session proxy, callback кодыг энэ өөрчлөлтөөр солиогүй.
- Existing `organizations` / `organization_members`, atomic owner RPC, tenant RLS-ийг хадгалж нэмэлт versioned migration `20261013164143_organization_profile_hardening.sql` үүсгэв. Contact урт, canonical slug, хоосон нэр, URL credential хамгаалалт нь хуучин мөрийг өөрчлөхгүй `NOT VALID` constraint ашиглана.
- Байгууллага үүсгэх/засах validation нэгтгэв. Workspace сонгох үйлдэл membership шалгаж, алдааг inline үзүүлнэ. Нэг хэрэглэгч олон байгууллагатай байж болно; stale cookie эрх олгохгүй бөгөөд зөвшөөрөгдсөн workspace руу fallback хийнэ.
- Dashboard sidebar болон байгууллагын карт, үүсгэх формыг navy/white/teal, mobile болон dark mode-д тохируулсан. Loading/error/empty/success төлөвтэй.
- Локал lint, TypeScript, production build амжилттай. 45 unit/server-action тест, migration-уудыг PostgreSQL/PGlite дээр хэрэгжүүлсэн 101 integration/security assertion амжилттай. Үүнд forced owner-enrollment failure rollback болон tenant хоорондын унших/засах хориг багтсан.
- Edge браузераар 390px/1440px нийтийн болон нэвтрэх дэлгэцүүд overflow-гүй, light/dark сонголт refresh дараа хадгалагдах, баталгаажаагүй session-ээр organization route нээгдэхгүйг шалгасан. Нэвтэрсэн dashboard-ийн browser E2E гэж үзээгүй.
- Live cloud migration, authenticated browser organization E2E-г энэ сессэд ажиллуулаагүй. `.env.local` файл энэ сессийн filesystem-д харагдаагүй, холбогдсон tool project list хоосон байсан; хэрэглэгчийн ажилладаг тохиргоог өөрчлөөгүй.
- Хэрэгжүүлэх заавар: [Phase 2 migration ба шалгалт](phase-2-organizations.md).

## Phase 1 — Суурь

- Next.js App Router, strict TypeScript, Tailwind, shadcn хэв маягийн UI, Supabase SSR, session proxy.
- Supabase бүртгэл, нэвтрэх, гарах, нууц үг сэргээх, байгууллага үүсгэх, workspace сонгох.
- Өгөгдлийн schema, composite FK, RLS, эзэмшигч/ажилтны эрх, private Storage, public RPC.
- Dashboard layout, маркетингийн нүүр/боломж/үнэ/холбоо барих, light/dark theme.
- Локал шалгалт: TypeScript, lint (алдаагүй), production build амжилттай. Бодит migration дээр PGlite PostgreSQL 84 assertion амжилттай.
- Анхны үе шатны үед cloud төсөл харагдаагүй. 2026-10-14-ний хэрэглэгчийн мэдээллээр нэвтрэлт холбогдож ажиллаж байгаа; энэ сессийн cloud access тусад нь баталгаажаагүй.

## Phase 2 — Байгууллага, нийтийн хуудсууд

- Байгууллагын нэр, холбоо барих мэдээлэл, өнгө, logo/cover өөрчлөх.
- Private Storage upload (file signature, MIME, 5 MiB), зөвхөн нийтлэгдсэн зурагт anonymous access.
- Company, business card, links, menu page CRUD болон publication controls.
- Published RPC ашигласан динамик public renderer, vCard таталт.
- Owner-only багийн гишүүн болон explicit staff permission удирдлага.
- TypeScript/build амжилттай; public helper/vCard болон core unit тест нийлээд 22 амжилттай (commit-уудын дагуу тестүүд нэмэгдэнэ).
- Cloud upload/session E2E хараахан шалгаагүй.

## 2026-10-14 — Phase 3–5 болон production хамгаалалт

- **Phase 3:** ангилал болон хоолны CRUD, зураг upload, бүхэл MNT үнэ, эрэмбэ, availability/publication, хайлт/шүүлт, 50 мөрөөр хуудаслах dashboard хэрэгжсэн. Ангилал нэмэх dialog, устгах confirmation ашиглана. Public menu нь database-аас шинэ мэдээлэл уншина.
- **Phase 4:** database-generated immutable 96-bit картын код, NFC бүртгэл/нэр/чиглэл/төлөв, байнгын URL, 307 no-store redirect, QR preview/copy/PNG download хэрэгжсэн. Draft/inactive/cross-tenant destination хаагдана. HEAD, bot, preview/prefetch хүсэлт analytics-д тоологдохгүй; analytics initialization/network алдаа redirect-ийг таслахгүй.
- **Phase 5:** private platform_admins эрхтэй admin dashboard, байгууллага/гишүүний удирдлага, карт шилжүүлэх, paginated user search, organization filters, SQL analytics, өдрийн график ба хүртээмжтэй хүснэгт хэрэгжсэн. 1,005 event-ийн нийлбэр, timezone болон transfer history privacy-г бодит SQL тестээр баталсан.
- Dashboard болон admin sidebar хураагдана; account dropdown, loading/error, native accessible dialog, light/dark, mobile navigation байна. 253 бичвэрийг `src/lib/messages/mn.ts`-д төвлөрүүлсэн. `getMessages('en')` нь хэсэгчилсэн орчуулга + Mongolian fallback; бүтэн English UI гэж тайлагнахгүй. Auth үйлдлийн логикийг сольсонгүй; зөвхөн display/error strings dictionary руу шилжсэн.
- Тусдаа test project E2E бэлтгэсэн. Production project reference-г test guard хориглоно. Mutating тест нь production `.env.local`-ийг уншихгүй, өөрийн test env-тэй шинэ local server эхлүүлнэ; existing app server-ийг дахин ашиглахгүй.
- CI нь credentials-гүй lint/type/unit/PGlite/build/public smoke ажиллуулах тохиргоотой. GitHub runner дээр бодитоор амжилттай болсон эсэх нь push дараах CI үр дүнгээр батлагдана.

### Production төлөв

- Хэрэглэгч `nfc-smart-production` (`xcsnkvoulmrpxoxcjuvl`)-ийг **зөвхөн унших** гэж заасан. Production-д schema/migration, хэрэглэгч, байгууллага, тестийн өгөгдөл өөрчлөөгүй. `SUPABASE_SECRET_KEY` нэмээгүй; `E2E_ENABLED=1` болгоогүй.
- Нийтийн key ашигласан read-only `resolve_nfc_card` болон `get_public_page` readiness request хоёр `PGRST202` (RPC schema cache-д олдсонгүй) буцаасан. Энэ нь authentication ажиллахгүй гэсэн дүгнэлт биш. Migration history/full schema-г project operator [inspection.sql](../supabase/inspection.sql)-аар шалгаж болно.
- Дөрвөн versioned migration бэлэн. Production-д хэрэгжүүлээгүй. Тусдаа тестийн орчны заавар: [test-environment.md](test-environment.md).
- Live Auth/Storage/menu/NFC integration, нэвтэрсэн dashboard-ийн browser E2E, Vercel/custom domain, биет NFC тагийн уншуулалтыг баталгаажаагүй. Эдгээр нь гаднын орчны үлдсэн acceptance шалгалтууд.
- Dependency audit: `braces` → `micromatch` → `fast-glob` → Next ESLint tooling гинжин хэлхээнд 5 high development-only advisory байна. Шийдэл нэрээр Next ESLint-ийг 14.x руу буулгаагүй. Production runtime audit-ийн дүнг final verification-д тусгана.

### Эцсийн локал шалгалт

- `npm.cmd run check` **амжилттай**: ESLint, TypeScript, 7 файл дахь **68 unit/server/guard тест**, дөрвөн migration хэрэгжүүлсэн **131 PostgreSQL integration/security assertion**, production build.
- Edge/Playwright public smoke **5/5 амжилттай**: 390px/1440px бүх public/auth/setup дэлгэц overflow-гүй, mobile navigation, invalid NFC URL, signed-out dashboard/admin хамгаалалт, light/dark refresh persistence. Desktop home болон mobile login screenshot-ийг нүдээр хянасан.
- Бодит Supabase E2E **ажиллуулаагүй**; disabled suite run-д нэг тест `skipped` гэж бүртгэгдсэн. Нэвтэрсэн dashboard/core flow production дээр туршигдсан гэж тайлагнахгүй.
- `npm audit --omit=dev`: **0 vulnerability**. Dev-only 5 advisory дээр patched `braces` release байхгүй (registry latest 3.0.3).
- `.env.local`, `.env.e2e.local` Git ignored; commit хийх source/docs/tests/migrations дотор credential-like token scan **0**. `.env.example` зөвхөн placeholder-той.

GitHub: https://github.com/B232270091/nfc-smart (private).
Vercel болон Supabase cloud deployment хийгдээгүй.

## 2026-10-14 — Тусгаарласан E2E runner

- `.env.e2e.local` Git ignored загвар үүсгэсэн; production `.env.local`-ийн өмнөх/дараах SHA-256 ижил. Production secret нэмээгүй, өгөгдөл өөрчлөөгүй.
- Explicit test env loader, production reference denylist, modern key validation, Management API-аар test нэр/ID/organization баталгаажуулах read-only команд, 24 цагийн credential-bound verification receipt нэмсэн. Буруу/хоосон target-тай runner сервер эхлүүлэхээс өмнө зогсоно.
- Тестийн сервер шинэ port 3100 процесс, `.next-e2e` build ашиглана. Inherited production API/analytics/database credentials болон Management token тестийн app-д орохгүй. Auth trace, screenshot, raw credential-bearing error logs integration үед унтарсан.
- Бодит E2E workflow-д private bucket readiness, cross-tenant Storage download/upload/delete хориг, QR PNG signature/600px шалгалт, owner menu delete UI, logout, cleanup дараах exact test resource үлдэгдлийн шалгалт нэмсэн.
- `npm run check` амжилттай: lint, TypeScript, **74 unit тест**, **131 PostgreSQL assertion**, production build. Public Playwright smoke **5/5**, exit 0; Windows sandbox-ийн teardown гацалтыг зөвхөн тухайн тестийн verified server process tree-г хааж шийдсэн.
- **Cloud үлдсэн:** connector `projects: []`, CLI `AccessTokenRequiredError`; тестийн ID/URL/API keys локал файлд хараахан өгөөгүй. Иймээс test identity болон production/test URL ялгааг cloud-аар батлаагүй, migration/Storage setup хэрэгжүүлээгүй, бодит Auth/CRUD/NFC/tenant E2E/cleanup ажиллуулаагүй. Guard-ийн хоригийг integration pass гэж тооцоогүй.
- Үргэлжлүүлэх тохиргоо болон migration дараалал: [test-environment.md](test-environment.md).

### Test project ID өгсний дараах cloud шалгалт

- `nfc-smart-test` = `khohnhjjyetwuzfsttkl`, `nfc-smart-production` = `xcsnkvoulmrpxoxcjuvl`, organization = `NFC Smart` / `fsmtzwmlrfkqdhjxciww` гэдгийг connector-ийн direct lookup-аар батлав. List хоосон байсан ч project-ID access болон migration эрх ажиллаж байна; reconnect одоогоор шаардахгүй.
- Дөрвөн existing migration **зөвхөн test project-д хэрэгжсэн**. Remote migration history-г local versions-той тааруулж дахин уншсан. Production schema/data өөрчлөөгүй.
- Test-ийн 9 application table бүгд RLS enabled, private 5 MiB `organization-assets` bucket болон дөрвөн Storage policy батлагдсан. Security Advisor ERROR/WARN байхгүй; хоёр private deny-by-default хүснэгтэд зөвхөн INFO байна. Тестийн application/Storage rows одоогоор 0.
- Test URL/ref local `.env.e2e.local`-д хадгалсан; guard exact test ID-г pin хийсэн. Connector identity metadata 24 цаг хүчинтэй. Publishable/secret test keys байхгүй тул credential verification, бодит browser integration болон cleanup хүлээгдэж байна.
