# Хөгжүүлэлтийн явц

Энэ файл бодитоор хэрэгжүүлсэн болон гаднын орчноор баталгаажаагүй ажлыг тусад нь тэмдэглэнэ.

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

## Дараагийн үе шатууд

3. Дижитал меню, ангилал, барааны үнэ/эрэмбэ/нийтлэл.
4. NFC карт, тогтмол URL, динамик чиглүүлэлт, QR.
5. Админ, аналитик, интеграцийн тест, deployment заавар.

GitHub: https://github.com/B232270091/nfc-smart (private).
Vercel болон Supabase cloud deployment хийгдээгүй.
