# Хөгжүүлэлтийн явц

Энэ файл бодитоор хэрэгжүүлсэн болон гаднын орчноор баталгаажаагүй ажлыг тусад нь тэмдэглэнэ.

## Phase 1 — Суурь

- Next.js App Router, strict TypeScript, Tailwind, shadcn хэв маягийн UI, Supabase SSR, session proxy.
- Supabase бүртгэл, нэвтрэх, гарах, нууц үг сэргээх, байгууллага үүсгэх, workspace сонгох.
- Өгөгдлийн schema, composite FK, RLS, эзэмшигч/ажилтны эрх, private Storage, public RPC.
- Dashboard layout, маркетингийн нүүр/боломж/үнэ/холбоо барих, light/dark theme.
- Локал шалгалт: TypeScript, lint (алдаагүй), production build амжилттай. Бодит migration дээр PGlite PostgreSQL 84 assertion амжилттай.
- Supabase cloud төсөл байхгүй. Auth имэйл, cloud Storage болон бодит account session хараахан баталгаажаагүй.

## Дараагийн үе шатууд

2. Байгууллагын брэндинг, нийтийн хуудсууд, багийн эрх.
3. Дижитал меню, ангилал, барааны үнэ/эрэмбэ/нийтлэл.
4. NFC карт, тогтмол URL, динамик чиглүүлэлт, QR.
5. Админ, аналитик, интеграцийн тест, deployment заавар.

GitHub: https://github.com/B232270091/nfc-smart (private).
Vercel болон Supabase cloud deployment хийгдээгүй.
