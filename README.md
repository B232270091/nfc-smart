# NFC Smart

Одоогийн `nfc-smart-production` төсөлд зөвхөн унших шалгалт зөвшөөрөгдсөн. Production-д тестийн хэрэглэгч/байгууллага үүсгэхгүй, migration/reset ажиллуулахгүй. Бүрэн browser integration-д [тусдаа тестийн орчин](docs/test-environment.md) бэлтгэнэ. Энэ repository-д код болон migration бэлэн байгаа нь production-д хэрэгжсэн гэсэн үг биш.

Монгол бизнесүүдэд зориулсан олон байгууллагын NFC, QR болон дижитал хуудасны удирдлагын SaaS. Байгууллага менюгээ нийтлээд картын тогтмол `/t/[code]` холбоосыг NFC тагт бичнэ. Менюгийн үнэ, зураг эсвэл картын очих хуудсыг өөрчлөхөд тагийг дахин бичихгүй.

Repository: [B232270091/nfc-smart](https://github.com/B232270091/nfc-smart).

## Ажиллуулах

Node.js 22 буюу түүнээс шинэ тохирох LTS хувилбар, npm шаардлагатай. Доорх нь Windows PowerShell командууд; бусад орчинд `npm.cmd`-г `npm`, `npx.cmd`-г `npx` гэж хэрэглэнэ.

```powershell
npm.cmd ci
Copy-Item .env.example .env.local
npm.cmd run dev
```

`http://localhost:3000` нээнэ. Supabase тохируулаагүй үед танилцуулгын хуудсууд нээгдэнэ; жинхэнэ нэвтрэлт, өгөгдлийн сан шаардсан үйлдлүүдэд тохиргоо хийх шаардлагатай. Демо хэрэглэгч, хуурамч нэвтрэлт, нийтэд нээлттэй жишээ өгөгдөл үүсгэхгүй. Нүүр хуудасны меню бол тайлбартай маркетингийн загвар дүрслэл.

## Орчны хувьсагч

`.env.local`-д бодит утгууд оруулна. Энэ файлыг GitHub-д оруулахгүй.

| Хувьсагч | Зориулалт |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project API URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser/server session client-ийн publishable key |
| `NEXT_PUBLIC_APP_URL` | Сайтын canonical origin; local үед `http://localhost:3000`, production үед өөрийн HTTPS домэйн |
| `SUPABASE_SECRET_KEY` | Зөвхөн server: private зураг дамжуулах болон analytics бичих secret/service-role key |
| `ANALYTICS_HMAC_SECRET` | Зөвхөн server: дор хаяж 32 тэмдэгттэй санамсаргүй нууц утга |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Бодит, хянадаг support хаяг; байхгүй бол contact хуудас үүнийг ил тод харуулна |
| `E2E_ENABLED` | Disposable Supabase орчин дахь integration browser тестийг идэвхжүүлэх тохиргоо |

Нууц түлхүүрийг `NEXT_PUBLIC_` нэртэй болгож болохгүй. Analytics-д secret эсвэл hosting-ийн итгэмжлэгдсэн IP header байхгүй бол event бичихийг алгасана; амжилтгүй event-ийг хиймэл тоогоор нөхөхгүй.

## Supabase

Migration, RLS, RPC болон private storage bucket-ийн тодорхойлолт `supabase/migrations/` дотор байна. Local Supabase-д Docker шаардлагатай.

```powershell
npx.cmd supabase start
npx.cmd supabase db reset
```

`db reset` нь **local development database**-г шинээр үүсгэнэ. Бодит өгөгдөлтэй cloud орчинд хэрэглэх заавар биш. Local Supabase-ээс авсан URL/keys-ээ `.env.local`-д тохируулна. Cloud setup-ийг [deployment](docs/deployment.md), schema болон эрхийн дүрмийг [database](docs/database.md) тайлбарлана.

## Үндсэн боломжууд

- Монгол хэлтэй маркетинг, бүртгэл, нэвтрэлт, нууц үг сэргээх дэлгэц.
- Олон байгууллагын орон зай, branding болон owner/staff эрх.
- Ангилалтай меню, бүхэл төгрөгийн үнэ, зураг, дараалал, нийтлэх болон бэлэн байдлын төлөв.
- Меню, байгууллагын танилцуулга, нэрийн хуудас, холбоосын хуудас гэсэн дөрвөн public төрөл.
- Тогтмол NFC холбоос, картын идэвхтэй төлөв, очих хуудсыг өөрчлөх, QR татах.
- Нээгдсэн хуудасны analytics; бодит NFC tap эсвэл unique visitor гэж баталгаагүй тооллогыг нэрлэхгүй.
- Нийтэлсэн нэрийн хуудсаас UTF-8 vCard татах, private зурагт publication шалгалт.
- Light/dark theme, responsive дэлгэц, client/server validation, RLS болон серверийн эрх шалгалт.

Онлайн төлбөр, NFC картын борлуулалт/хүргэлт, бүтэн English UI нь энэ хувилбарын хамрах хүрээнд ороогүй. Англи орчуулгын dictionary суурь болон бүтээгдэхүүний англи нэрийн талбар бэлтгэсэн; интерфэйсийн үндсэн хэл Монгол.

## Шалгах

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run test:db
npm.cmd run build
```

`npm.cmd run check` дээрх шалгалтуудыг дарааллаар ажиллуулна. `test:db` бодит migration-ийг PGlite PostgreSQL/WASM дээр эрхийн өөр өөр role-оор шалгадаг; Docker эсвэл cloud credentials шаардахгүй. Энэ нь Supabase Auth HTTP, email, Storage HTTP болон production hosting баталгаажуулалт биш.

Browser тестийн команд `npm.cmd run test:e2e`. Playwright browser болон тестийн сонгосон Supabase орчны тохиргоог эхлээд бэлтгэнэ. Cloud болон биет NFC төхөөрөмжийн шалгалтыг [deployment checklist](docs/deployment.md#production-шалгалт) болон [NFC заавраар](docs/nfc-programming.md) тусад нь хийнэ.

## Баримт бичиг

- [Архитектур](docs/architecture.md)
- [Өгөгдлийн сан, RPC, Storage](docs/database.md)
- [Аюулгүй байдал, admin bootstrap](docs/security.md)
- [Supabase + Vercel deployment](docs/deployment.md)
- [Биет NFC таг бэлтгэх](docs/nfc-programming.md)
- [Тусдаа тестийн орчин](docs/test-environment.md)
- [Хөгжүүлэлтийн явц ба баталгаажуулалт](docs/development-progress.md)

Local build, автомат тест болон source code байгаа нь cloud migration, deployment эсвэл биет NFC tap амжилттай болсны нотолгоо биш. Тэдгээрийг бодит орчинд тусад нь баталгаажуулна.
