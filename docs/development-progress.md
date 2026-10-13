# Хөгжүүлэлтийн явц

Энэ файл бодитоор хэрэгжүүлсэн болон гаднын орчноор баталгаажаагүй ажлыг тусад нь тэмдэглэнэ.

## Phase 1 — Суурь

- Next.js App Router, strict TypeScript, Tailwind, shadcn хэв маягийн UI, Supabase SSR, session proxy.
- Supabase бүртгэл, нэвтрэх, гарах, нууц үг сэргээх, байгууллага үүсгэх, workspace сонгох.
- Өгөгдлийн schema, composite FK, RLS, эзэмшигч/ажилтны эрх, private Storage, public RPC.
- Dashboard layout, маркетингийн нүүр/боломж/үнэ/холбоо барих, light/dark theme.
- Локал шалгалт: TypeScript, lint (алдаагүй), production build амжилттай. Бодит migration дээр PGlite PostgreSQL 84 assertion амжилттай.
- Supabase cloud төсөл байхгүй. Auth имэйл, cloud Storage болон бодит account session хараахан баталгаажаагүй.

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
