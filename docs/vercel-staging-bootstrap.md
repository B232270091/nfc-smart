# NFC Smart — анхны staging Preview URL тохируулах

Бэлтгэсэн: 2026-10-17. Энэ заавар нь Git-тэй холбогдсон Vercel Project-ийн `staging` branch болон **зөвхөн `nfc-smart-test`** (`khohnhjjyetwuzfsttkl`)-д хамаарна. Доорх cloud алхмуудыг одоогоор гүйцэтгээгүй; бодит Vercel URL хараахан аваагүй. Production Supabase-д өөрчлөлт хийхгүй.

## 1. Bootstrap-ийн зарчим

Хоёр build хийнэ. Эхний build Vercel-ийн өөрийн `VERCEL_BRANCH_URL` metadata-аас бодит хаягийг харуулаад, `NEXT_PUBLIC_APP_URL` дутуу учраас одоогийн guard дээр зогсоно. Тэр хаягийг гараар тохируулсны дараах хоёр дахь build аппыг deploy хийнэ. Эхний build-ийн алдаа нь төлөвлөсөн хамгаалалт; guard-ийг унтраах шаардлагагүй.

`VERCEL_BRANCH_URL` нь Git branch-ийн generated domain бөгөөд `https://` агуулахгүй. `VERCEL_URL` нь тухайн deployment-ийн хаяг, `VERCEL_PROJECT_PRODUCTION_URL` нь production хаяг тул энэ bootstrap-д ашиглахгүй. System Environment Variables-ийг build-д ил гаргах тохиргоо асаалттай байх ёстой. [Vercel system environment variables](https://vercel.com/docs/environment-variables/system-environment-variables).

Branch URL нь нэг branch-ийн шинэ deployment-уудын хооронд тогтвортой. Project/team/branch нэр эсвэл domain тохиргоог өөрчлөхөд дахин шалгана. URL-ийн загварыг нэрээр нь таахгүй: уртын хязгаар болон Vercel-ийн нэршлийн боловсруулалт нөлөөлж болно. [Vercel generated URLs](https://vercel.com/docs/deployments/generated-urls).

## 2. Эхний build-ээс өмнө

1. Локал өөрчлөлтүүдээ хянаж, GitHub-ийн `staging` branch-д оруулна. Ялангуяа `vercel.json`, `package.json`/lockfile, environment guard, шинэ `scripts/staging-origin.mjs`, холбогдох тестүүд remote commit-д байх шаардлагатай. Зөвхөн локал файл Vercel дээр ажиллахгүй. Нууц `.env*` файлуудыг commit хийхгүй.
2. Vercel дээр `B232270091/nfc-smart` repository-г import хийнэ. Framework: Next.js, Root Directory: repository root, Node.js: 24.x, Install Command: `npm ci`, Build Command: **`npm run check`**. Dashboard override байвал repository-ийн `vercel.json`-тай тааруулна.
3. Production Branch нь **`main`** хэвээр байна. `staging`-ийг Production Branch болгож болохгүй. Import автоматаар `main` build эхлүүлбэл production тохиргоо дутуугаас guard дээр унахыг зөвшөөрнө; үүнийг засахын тулд test key-г Production environment-д хуулж болохгүй. [Vercel Git deployments](https://vercel.com/docs/git).
4. Project Settings → Environment Variables хэсэгт **Automatically expose System Environment Variables** асаалттайг шалгана. `VERCEL`, `VERCEL_ENV`, `VERCEL_BRANCH_URL`, `VERCEL_GIT_COMMIT_REF`-ийг өөрөө зохиож override хийхгүй.
5. Дараах утгуудыг **Preview → зөвхөн `staging` branch** scope-д нэмнэ. Production scope сонгогдоогүйг нэг бүрчлэн шалгана. Preview-ийн branch-specific утга нь ерөнхий Preview утгыг дарж хэрэглэгдэнэ. [Vercel environment variable scopes](https://vercel.com/docs/environment-variables).

| Variable | Staging-д өгөх утга |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://khohnhjjyetwuzfsttkl.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `nfc-smart-test` Dashboard-оос авсан publishable key |
| `SUPABASE_SECRET_KEY` | Ижил test төслийн server-only secret key; sensitive байдлаар хадгална |
| `ANALYTICS_HMAC_SECRET` | Staging-д зориулсан дор хаяж 32 тэмдэгт санамсаргүй нууц; sensitive байдлаар хадгална |
| `NEXT_PUBLIC_APP_URL` | **Эхний build-д үүсгэхгүй.** Ерөнхий Preview scope-оос өөр URL өвлөгдөхгүйг шалгана |

`E2E_*`, `NFC_E2E_SERVER`, database password, Management API token энэ deployment-д шаардлагагүй. Secret key/HMAC-д `NEXT_PUBLIC_` prefix хэрэглэхгүй. Opaque key-ийн project харьяаллыг prefix-ээр батлах боломжгүй тул test Dashboard-оос авснаа шалгана. Production key-г энэ Project-ийн Preview scope-д бүү оруул.

## 3. Эхний staging build — бодит URL авах

1. `staging` branch руу хянасан commit push хийх, эсвэл Project → Deployments → Create Deployment дээр Git branch **`staging`**-ийг сонгоно. Deployment detail дээр Environment **Preview**, branch **staging**, зөв commit гэдгийг шалгана.
2. Build Logs-оос **`STAGING_BRANCH_ORIGIN=`** мөрийг хайна. Тэнцүүгийн дараах `https://`-ээр эхэлсэн хаягийг дараагийн зай хүртэл бүхэлд нь хуулна. Хаалт доторх тайлбарыг хуулж болохгүй.
3. Үүний дараа `NEXT_PUBLIC_APP_URL must be the real canonical HTTPS origin...` алдаа, failed build гарах нь хүлээгдэж буй үр дүн. Оношилгоо environment variable оноохгүй, зөвхөн бодит metadata-г харуулдаг; guard exit code 1 хэвээр.
4. Хуулсан хаягийг цаашид **O** гэж нэрлэнэ. O нь зааврын placeholder биш, таны Build Logs-оос авсан бодит origin байна. Доорх `O/...` тэмдэглэгээг UI-д үсгээр нь оруулахгүй.

Оношилгоо зөвхөн `VERCEL=1`, `VERCEL_ENV=preview`, `VERCEL_GIT_COMMIT_REF=staging`, хоосон `NEXT_PUBLIC_APP_URL`, зөв хэлбэртэй Vercel branch hostname үед ажиллана. Build-ийн lint/typecheck/test өмнө нь унавал эхлээд тэр алдааг засна. Мөр байхгүй бол remote commit, branch context, system variables болон APP_URL-ийн өвлөгдсөн утгыг шалгана. Metadata байхгүй үед URL таах, guard сулруулах, `VERCEL=0` болгохгүй. Failed build-ийн branch alias хараахан ажиллахгүй байж болно; амжилттай deployment-ийн дараа шалгана.

## 4. Vercel болон test Supabase URL-ийг тааруулах

1. Vercel → Environment Variables → Preview → branch `staging` дээр `NEXT_PUBLIC_APP_URL` үүсгээд **O-ийн бодит утгыг** өгнө. Зөвхөн `https://hostname`, төгсгөлийн slash/path/query байхгүй. `${VERCEL_BRANCH_URL}` зэрэг interpolation текст, deployment hash URL эсвэл production URL оруулахгүй.
2. [Test Supabase URL Configuration](https://supabase.com/dashboard/project/khohnhjjyetwuzfsttkl/auth/url-configuration)-ийг нээнэ. Header дээр **nfc-smart-test**, URL-д **khohnhjjyetwuzfsttkl** гэдгийг шалгана. Өөрчлөхөөс өмнө одоогийн Site URL болон Redirect URLs-ийг хувийн тэмдэглэлд хадгална.
3. **Site URL = O** болгоно. Энэ нь test төслийн нийтлэг fallback URL-ийг өөрчилнө; уг төслийг өөр preview/local хэрэглэгч хуваалцдаг бол тэдэнд мөн нөлөөлнө.
4. **Redirect URLs**-д хоёр exact entry нэмнэ: O-ийн араас `/auth/callback`, мөн O-ийн араас `/auth/callback?next=/reset-password`. Өмнөх шаардлагатай localhost/test callback entry-үүдийг хадгална. `https://**.vercel.app/**` гэсэн бүх preview-д нээлттэй wildcard нэмэхгүй. [Supabase redirect allowlist](https://supabase.com/docs/guides/auth/redirect-urls).
5. Save changes хийнэ. **Confirm email ON** хэвээр үлдээнэ. Production project-ийн Site URL, allowlist, Auth provider, SMTP, database, Storage-д хүрэхгүй.

Аппын бүртгэл `/auth/callback` руу, password reset `/auth/callback?next=/reset-password` руу буцдаг тул хоёр entry хоёулаа шаардлагатай. Хэрэв email template өмнө нь өөрчлөгдсөн бол confirmation холбоос redirect утгыг хадгалж байгааг test орчинд шалгана; production template өөрчлөхгүй.

## 5. Хоёр дахь build ба бодит шалгалт

1. Ижил `staging` Preview deployment-ийг **шинэ environment variable-тай дахин build** хийнэ. Redeploy UI-д хуучин build cache ашиглах сонголтыг унтрааж болно. Environment өөрчлөх нь өмнө бүтсэн client bundle-ийг өөрчлөхгүй; `NEXT_PUBLIC_APP_URL` build үед шингэдэг.
2. Build `npm run check`-ээр бүрэн амжилттай болсон эсэхийг шалгана. Dashboard-ийн branch alias нь **O-той яг таарч**, шинэ deployment руу зааж байгааг батална. Таарахгүй бол flow эхлүүлэхгүй; бодит metadata/domain тохиргоог шалгаж URL-уудаа тааруулаад дахин build хийнэ.
3. Browser-д **O-оор** нээнэ. Deployment Protection байвал эхлээд Vercel-ийн зөвшөөрөгдсөн хэрэглэгчээр нэвтэрнэ; бүх preview-ийн хамгаалалтыг унтраах эсвэл bypass token-ийг Auth URL-д хийхгүй.
4. Browser Network хэсгээс Supabase хүсэлтүүд **khohnhjjyetwuzfsttkl.supabase.co** руу явж байгааг шалгана. Production ref харагдвал тестийн өгөгдөл оруулахгүй, deployment тохиргоог шалгана. Browser bundle/network-д secret key/HMAC байх ёсгүй.
5. Зөвхөн test хэрэглэгчээр signup → confirm email → login → logout болон password reset урсгалыг шалгана. Эхлүүлэх болон email холбоос нээхдээ **ижил browser/profile, O origin** ашиглана. Hash deployment URL-ээс эхлүүлж branch URL руу буцвал PKCE verifier cookie таарахгүй байж болно. [Supabase SSR / PKCE](https://supabase.com/docs/guides/auth/server-side/advanced-guide).
6. Reset холбоос `/reset-password` хуудсанд хүрч, шинэ нууц үгээр login болох; callback/dashboard нь O origin дээр үлдэх; authenticated хуудас cache-аас бусдын өгөгдөл харуулахгүйг шалгана. Test NFC URL/QR-д O ашиглагдаж, зөв public content руу чиглэхийг шалгана.

Custom SMTP хараахан бэлэн биш тул default Supabase mail service зөвхөн зөвшөөрөгдсөн багийн хаягт илгээх хязгаарлалттай. Email ирэхгүй бол delivery/rate limit болон Auth logs-ийг шалгана; URL алдаа гэж шууд дүгнэхгүй, Confirm email-ийг унтраахгүй. Resend/custom domain/sender энэ bootstrap-д шаардлагатай өөрчлөлт биш бөгөөд placeholder хэвээр. [Supabase SMTP хязгаарлалт](https://supabase.com/docs/guides/auth/auth-smtp).

## 6. Дууссан гэж үзэх нотолгоо ба буцаах арга

- Эхний failed Preview build-ийн ID/commit, metadata-аас авсан O.
- Vercel Preview → staging APP_URL болон test Supabase Site URL/exact callback хоёрын тохирол; нууц түлхүүргүй тэмдэглэл.
- Хоёр дахь successful Preview build-ийн ID/commit, branch alias O, test Supabase network target.
- Login/signup confirmation/reset/logout болон test NFC flow-ийн бодит дүн. Хийгээгүйг PASS гэж тэмдэглэхгүй.

Staging тохиргоог буцаах шаардлагатай бол test Supabase-ийн хадгалсан өмнөх Site URL/allowlist-ийг сэргээж, зөвхөн энэ bootstrap-аар нэмсэн entry-үүдийг авч, Vercel staging variable-уудыг өмнөх төлөвт нь буцаагаад шинэ build хийнэ. APP_URL-ийг авахад дараагийн build guard дээр зогсоно; аль хэдийн ажиллаж байгаа deployment автоматаар зогсохгүй. Deployment access-ийг тусад нь хязгаарлах шаардлагатай бол Vercel-ийн тухайн preview тохиргоог ашиглана. Энэ зааварт production deploy, promote, migration, өгөгдөл устгах алхам байхгүй.

## 7. Локал бэлтгэлийн баталгаажуулалт

`scripts/staging-origin.mjs` болон `scripts/check-environment.mjs`-д зөвхөн оношилгоо нэмсэн. `scripts/deployment-environment.mjs`-ийн шалгалт өөрчлөгдөөгүй. Guard + bootstrap-ийн **28 тест PASS**, холбогдох ESLint PASS. Тест нь APP_URL дутуу үед бодит checker exit code 1 өгч, secret хэвлэхгүйг шалгадаг. Энэ нь Vercel дээр бодит deployment/Auth callback шалгасан гэсэн үг биш.

Холбоотой бэлтгэл: [Production deployment](production-deployment-preparation.md), [Backup/recovery](production-backup-recovery.md).
