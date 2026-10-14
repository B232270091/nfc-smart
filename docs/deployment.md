# Deployment

**Одоогийн production хамгаалалт:** `nfc-smart-production` дээр зөвхөн унших inspection зөвшөөрөгдсөн. Доорх migration/deployment алхмууд нь бэлтгэсэн заавар; production-д одоо ажиллуулах зөвшөөрөл биш. Schema-г [read-only inspection](../supabase/inspection.sql)-аар шалгаж болно. Бүрэн урсгалыг [тусдаа тестийн төсөл](test-environment.md) дээр баталсны дараа production өөрчлөлтийг тусад нь төлөвлөнө.

Source code болон local verification бэлэн байх нь production үйлчилгээ нийтлэгдсэн гэсэн үг биш. Доорх алхмыг бодит Supabase, GitHub, Vercel эрхтэй оператор гүйцэтгэж, үр дүнг шалгана. Жишээнд `https://YOUR_DOMAIN` болон project reference нь заавал өөрийн утгаар солих тэмдэглэгээ.

## 1. Supabase төсөл

Шинэ эсвэл NFC Smart-д зориулагдсан Supabase project сонгоно. Бусад application-ийн schema бүхий production төсөлд migration-ийг шалгалтгүй хэрэгжүүлэхгүй.

1. Project URL, publishable key-гээ Supabase Dashboard-оос авна. Server secret key нь зөвхөн private public-image delivery болон analytics бичилтийн батлагдсан server ажиллагаанд шаардлагатай. Одоогийн production `.env.local`-д ийм түлхүүр нэмээгүй; тусдаа зөвшөөрөлгүй нэмэхгүй.
2. `supabase/migrations/` дахь SQL-ийг staging дээр хэрэгжүүлнэ. Supabase CLI хэрэглэх бол тухайн pinned CLI-ийн `--help`-ээр command/flags-ийг эхлээд шалгана; `login`, `link`, `db push` урсгалаар зөв project руу холбож migration хийнэ. SQL Editor-оор хэрэгжүүлбэл CLI migration history-г дараа нь зөв бүртгэж, давхар migration хийхгүй.
3. Migration-ийн дараа table, RLS, RPC болон `organization-assets` **private** bucket үүссэн эсэхийг шалгана.
4. Data API-д `public` schema-г expose хийнэ; `private` schema-г expose хийхгүй.
5. Supabase Security Advisor болон Performance Advisor ажиллуулж, өөрийн project-тэй холбоотой үр дүнг хянана.

Migration файл өөрөө schema болон bucket-ийг тодорхойлдог. Application-д зориулж Storage bucket-ийг public болгож болохгүй. Schema/RPC гэрээ [database.md](database.md)-д бий.

## 2. Auth болон и-мэйл

Supabase Auth URL configuration:

- Site URL: `https://YOUR_DOMAIN`
- Allowed redirect: `https://YOUR_DOMAIN/auth/callback`
- Password recovery callback: `https://YOUR_DOMAIN/auth/callback?next=/reset-password`
- Reset page: `https://YOUR_DOMAIN/reset-password`

Production дээр email confirmation, өөрийн SMTP provider болон тохирох Auth rate limits-ийг тохируулна. Local `supabase/config.toml`-д email confirmation унтраалттай байдаг нь local development-д зориулагдсан. Staging болон production-ийг тусдаа project/domain ашиглан ялгана. Preview deployment-үүдэд зөвшөөрөл өгөхдөө шаардлагагүй бүх домэйны wildcard allowlist үүсгэхгүй.

Бүртгэл баталгаажуулах захиа, нууц үг сэргээх захиа, callback session exchange болон logout-ийг бодит browser-оор шалгана. Нууц үг сэргээх холбоосын тохиргоог query string-тэй нь туршина.

## 3. Vercel

1. [GitHub repository](https://github.com/B232270091/nfc-smart)-г Vercel-д import хийнэ.
2. Framework preset: Next.js. Repository root нь application root.
3. Install command `npm ci`, build command `npm run build`; output directory-г Next.js default хэвээр үлдээнэ.
4. Node.js хувилбарыг project dependencies-тэй тохирох дэмжигдсэн LTS хувилбараар сонгоно.
5. `.env.example`-ийн бүх шаардлагатай хувьсагчийг Vercel environment settings-д тохируулна. Production/staging тус бүрийн Supabase keys болон `NEXT_PUBLIC_APP_URL` зөв байх ёстой.
6. Deploy хийгээд runtime logs, login, public image route, callback-ийг шалгана.
7. Тогтмол custom HTTPS домэйн холбоод `NEXT_PUBLIC_APP_URL`-ийг тэр origin-оор шинэчилж дахин deploy хийнэ. Үүний дараа л биет NFC тагт production холбоос бичнэ.

Server secret нь `SUPABASE_SECRET_KEY`; publishable key нь `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Эдгээрийн үүргийг сольж болохгүй. `ANALYTICS_HMAC_SECRET`-д 32+ тэмдэгтийн криптограф санамсаргүй нууц утга хэрэглэнэ. Local PowerShell дээр утгыг үүсгэх нэг арга:

```powershell
node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"
```

Гарсан утгыг зөвхөн secret settings-д хадгална. Энэ repository-д бодит key эсвэл generated secret commit хийхгүй.

## 4. Analytics ба өөр hosting

NFC redirect нь analytics байхгүй үед ч ажиллах ёстой. Event бичихэд server key, HMAC secret болон итгэмжлэгдсэн source IP шаардлагатай. Одоогийн implementation зөвхөн Vercel-ийн `x-vercel-forwarded-for` ingress header-ийг trusted гэж үздэг; ерөнхий `x-forwarded-for` утгад итгэхгүй.

Иймээс local эсвэл өөр hosting дээр analytics event алгасагдаж болно. Өөр hosting-д шилжүүлэх бол тухайн provider-ийн trusted ingress нөхцөлийг тодорхойлж, spoofing болон rate-limit тест нэмсний дараа integration хийнэ. Empty analytics нь хэрэглэгчийн хандалт байгаагүй гэдгийг автоматаар нотлохгүй; тохиргоогоо шалгана.

## 5. Admin bootstrap

Эхний admin хэрэглэгчийг ердийн auth урсгалаар бүртгэнэ. Project operator хэрэглэгчийн UUID-г баталгаажуулж `private.platform_admins` руу trusted SQL-ээр оруулна. Яг SQL болон эрхийн тайлбар [security.md](security.md#анхны-platform-admin)-д бий. Owner signup эсвэл email domain-аар admin автоматаар үүсгэхгүй.

## Production шалгалт

Доорхыг staging дээр амжилттай болгоод production-д өөрийн test organization ашиглан дахин баталгаажуулна.

1. Шинэ account бүртгэх, email баталгаажуулах, нэвтрэх, гарах, нууц үг сэргээх.
2. Байгууллага үүсгэх, нэр/лого/cover/contact өнгөө хадгалах.
3. Категори, зурагтай бүтээгдэхүүн, бүхэл MNT үнэ үүсгээд menu page-г нийтлэх.
4. Нэвтрээгүй browser public menu болон зургуудыг харах.
5. NFC карт үүсгэж холбоос болон QR-г нээх; зөв public menu рүү очих.
6. Үнэ өөрчлөөд яг тэр NFC холбоосоор дахин нээх; шинэ үнэ харагдах.
7. Картын destination-г өөр нийтлэгдсэн page рүү солих; код өөрчлөгдөхгүй байх.
8. Карт идэвхгүй болгох, page unpublish хийх, байгууллага идэвхгүй болгох тус бүрд public access хаагдах.
9. Нийтлэлээс авсан зураг anonymous-д нээгдэхээ болих; draft зураг нийтэд харагдахгүй байх.
10. Owner A нь owner B-ийн UUID-г ашиглан private record унших, шинэчлэх боломжгүй байх; staff role escalation хийх боломжгүй байх.
11. Бизнес картын vCard-ийг утсанд импортлоход Монгол үсэг, утас, и-мэйл зөв байх.
12. Vercel production analytics event бүртгэгдэх; тоог unique visitor эсвэл батлагдсан NFC tap гэж тайлбарлахгүй байх.
13. Биет NFC тагийг хоёр өөр тохирох утсаар турших, QR fallback-ийг шалгах.

Local unit болон PostgreSQL тестүүд cloud Auth/SMTP/Storage provisioning-ийг орлохгүй. Physical NFC programming болон mobile device behavior-ийг төхөөрөмжөөр шалгана.

## Буцаах ба засварлах

Application алдаа гарвал Vercel-ийн өмнөх ажиллаж байсан deployment руу буцаж болно. Schema өөрчлөлт production data-тай бол энгийн deployment rollback database-г буцаахгүй; backup болон урьдчилан төлөвлөсөн засах migration шаардлагатай. Production database-д `db reset` ажиллуулахгүй.

NFC тагийн домэйн солигдвол хуучин домэйныг үргэлж ажиллуулж шинэ route руу зохистой шилжүүлэх эсвэл бүх тагийг дахин бичих шаардлагатай. Байнгын NFC холбоосын найдвартай байдал нь custom domain-аа хадгалахтай холбоотой.
