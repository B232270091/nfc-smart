# Тусдаа тестийн Supabase орчин

`nfc-smart-production` (`xcsnkvoulmrpxoxcjuvl`) бол бодит өгөгдөлтэй production төсөл. Түүнд тестийн хэрэглэгч, байгууллага, меню үүсгэх/устгахгүй. Production дээр `E2E_ENABLED=1`, `db reset`, тестийн cleanup ажиллуулахгүй. E2E guard нь энэ project reference-г шууд хориглодог.

## Одоо аюулгүй ажиллуулах шалгалтууд

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run test:db
npm.cmd run build
$env:E2E_ENABLED = '0'
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npm.cmd run test:e2e -- tests/e2e/public-smoke.spec.ts
```

`test:db` нь санах ой дахь PGlite PostgreSQL-д schema болон тестийн өгөгдөл үүсгэдэг; Supabase руу огт холбогдохгүй. Unit тестүүд мөн production өгөгдөл өөрчилдөггүй. Public smoke нь хуудсуудыг нээж, layout/navigation шалгана; бүртгэл болон mutation form submit хийхгүй.

## Тестийн төсөл бэлтгэх

1. Supabase Dashboard → New project ашиглан `nfc-smart-test` нэртэй **тусдаа** төсөл үүсгэнэ. Шинэ төсөл төлбөртэй байж болох тул өөрийн plan/quota-г шалгана. Production өгөгдөл хуулж оруулах шаардлагагүй. Эсвэл Docker суулгасан орчинд local Supabase ашиглаж болно.
2. Тестийн project reference production-оос өөр болохыг шалгана. Зөвхөн шинэ тестийн төсөлд `supabase/migrations/` доторх дөрвөн migration-ийг дарааллаар хэрэгжүүлнэ. [Migration заавар](phase-2-organizations.md)-ын preview алхмыг ашиглана; production руу link хийсэн CLI-аар санамсаргүй push хийхгүй.
3. Тестийн Auth URL Configuration-д `http://127.0.0.1:3100` болон callback `http://127.0.0.1:3100/auth/callback` тохируулна. Sign-up enabled байх ёстой. Зөвхөн disposable тестийн төсөлд email confirmation-ийг унтраах эсвэл тестэд тохирох SMTP ашиглана. Production Auth тохиргоог өөрчлөхгүй.
4. Git-д орохгүй `.env.e2e.local` файл үүсгэнэ. Production `.env.local`-ийг солихгүй.

```dotenv
E2E_SUPABASE_PROJECT_REF=YOUR_TEST_PROJECT_REF
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_TEST_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_TEST_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY=YOUR_TEST_SERVER_KEY
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3100
```

Эндэх server key нь **зөвхөн тестийн төсөлд**, тестийн бүртгэлийг баталгаажуулах болон тухайн тестийн үүсгэсэн resource-уудыг цэвэрлэхэд хэрэгтэй. Production key нэмэх шаардлагагүй. Secret key нь browser-д дамжихгүй. Local Supabase ашиглавал reference-г `local` гэж, URL-ийг local endpoint-оор өгнө.

5. Тестийн орчин бэлэн, mutation зөвшөөрөгдсөн үед:

```powershell
$env:E2E_ENABLED = '1'
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npm.cmd run test:e2e
Remove-Item Env:E2E_ENABLED
```

Playwright зөвхөн opt-in үед `.env.e2e.local`-ийг уншина. Shell-д өмнө export хийсэн production URL/key байвал эхлээд тухайн terminal-ийг хааж, цэвэр terminal ашиглана. Guard нь project reference/URL таарахгүй, production төсөл, эсвэл remote app URL үед тест эхлэхээс **өмнө** алдаа гаргана. Integration тестэд E2E_BASE_URL тохируулахгүй, өмнө ажиллаж буй app server ашиглахгүй. Локал тест серверт test env дамжих тул Next.js production `.env.local`-аас тэдгээрийг давхар дарж солихгүй.

Тест register → байгууллага/лого → ангилал/хоол → нийтлэх → NFC/QR → үнэ өөрчлөх → ижил URL → өөр tenant-ийн хориг → карт идэвхгүй болгох урсгалыг шалгана. Зөвхөн өөрөө үүсгэсэн UUID-тай resource-уудыг цэвэрлэнэ. `E2E_ENABLED=0` үед энэ тест `skipped` гэж гарна; үүнийг интеграц амжилттай болсон гэж тайлагнахгүй.
