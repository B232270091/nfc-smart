import { randomUUID } from "node:crypto";
import { test, expect, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { announceE2EMutation } from '../../scripts/e2e-safety.mjs';

// This suite makes real Auth/Database/Storage requests. Use a dedicated test project.
// Disabled runs are reported as skipped, never represented as integration passes.
test.skip(process.env.E2E_ENABLED !== "1", "Set E2E_ENABLED=1 with a migrated Supabase test project to run.");

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`E2E_ENABLED=1 requires ${name}. See docs/deployment.md.`);
  return value;
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('form:has(input[name="email"]) button[type="submit"]').click();
  await expect(page).toHaveURL(/\/dashboard(?:\/organizations)?$/);
}

async function findUser(admin: SupabaseClient, email: string) {
  for (let page = 1; page <= 100; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`Auth lookup failed (HTTP ${error.status ?? 'unknown'}).`);
    const found = data.users.find((user) => user.email === email);
    if (found) return found.id;
    if (data.users.length < 1000) break;
  }
  return null;
}

function dbSuccess(error: { message: string } | null) {
  // Do not copy API error bodies (which may include credentials) into reports.
  expect(error === null, 'Supabase operation must succeed').toBe(true);
}

test("register → publish menu → reuse permanent NFC URL after edit → disable; tenants remain isolated", async ({ page, browser, baseURL }) => {
  announceE2EMutation(process.env, 'create/update test fixtures');
  const url = required("NEXT_PUBLIC_SUPABASE_URL");
  const publishable = required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  const secret = required("SUPABASE_SECRET_KEY");
  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const otherClient = createClient(url, publishable, { auth: { persistSession: false, autoRefreshToken: false } });
  const run = randomUUID().replaceAll("-", "").slice(0, 16);
  const email = `nfc-e2e-${run}@example.com`;
  const otherEmail = `nfc-e2e-other-${run}@example.com`;
  const password = `Nfc!${randomUUID()}Aa9`;
  const orgSlug = `e2e-${run}`;
  const otherSlug = `e2e-other-${run}`;
  const pageSlug = `e2e-menu-${run}`;
  const itemName = `Тест хоол ${run}`;
  const cardName = `Тест NFC ${run}`;
  const users: string[] = [];
  const organizationIds: string[] = [];
  const visitor = await browser.newContext({ baseURL });
  const publicPage = await visitor.newPage();
  let logoPath = '';

  try {
    await test.step('Verify migrated tables and the private test Storage bucket before registration', async () => {
      for (const table of ['organizations', 'organization_members', 'menu_categories', 'menu_items', 'pages', 'nfc_cards']) {
        dbSuccess((await admin.from(table).select('*', { count: 'exact', head: true }).limit(0)).error);
      }
      const bucket = await admin.storage.getBucket('organization-assets');
      dbSuccess(bucket.error);
      expect(bucket.data?.public).toBe(false);
      expect(Number(bucket.data?.file_size_limit)).toBe(5 * 1024 * 1024);
      expect(bucket.data?.allowed_mime_types).toEqual(expect.arrayContaining(['image/png', 'image/jpeg', 'image/webp']));
    });
    await test.step("Register through the real UI and confirm this test account", async () => {
      await page.goto("/register");
      await page.locator('input[name="email"]').fill(email);
      await page.locator('input[name="password"]').fill(password);
      await page.locator('form:has(input[name="email"]) button[type="submit"]').click();
      let userId: string | null = null;
      await expect.poll(async () => { userId = await findUser(admin, email); return userId; }, { timeout: 30_000 }).not.toBeNull();
      users.push(userId!);
      dbSuccess((await admin.auth.admin.updateUserById(userId!, { email_confirm: true })).error);
      await login(page, email, password);
    });

    let orgId = "";
    await test.step("Create an organization and update its branding", async () => {
      await page.goto("/dashboard/organizations");
      const form = page.locator('form:has(input[name="slug"])');
      await form.locator('input[name="name"]').fill(`E2E Restaurant ${run}`);
      await form.locator('input[name="slug"]').fill(orgSlug);
      await form.locator('button[type="submit"]').click();
      await expect(page).toHaveURL(/\/dashboard$/);
      const org = await admin.from("organizations").select("id").eq("slug", orgSlug).single();
      dbSuccess(org.error);
      orgId = org.data!.id;
      organizationIds.push(orgId);
      await page.goto("/dashboard/settings");
      await page.locator('input[name="phone"]').fill("99112233");
      await page.locator('textarea[name="description"]').fill("Автомат тестийн ресторан");
      await page.locator('input[name="logo"]').setInputFiles({
        name: "test-logo.png", mimeType: "image/png",
        buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jY1sAAAAASUVORK5CYII=", "base64"),
      });
      await page.locator('form:has(input[name="primary_color"]) button[type="submit"]').click();
      await expect(page.getByRole("status").filter({ hasText: "Амжилттай" }).first()).toBeVisible();
      const branding = await admin.from("organizations").select("logo_path,phone").eq("id", orgId).single();
      dbSuccess(branding.error);
      expect(branding.data!.logo_path).toMatch(new RegExp(`^${orgId}/branding/`));
      logoPath = branding.data!.logo_path;
      expect(branding.data!.phone).toBe("99112233");
    });

    let itemId = "";
    let categoryId = "";
    await test.step("Create a category and a published menu item", async () => {
      await page.goto("/dashboard/menu/categories");
      await page.getByRole("button", { name: "Ангилал нэмэх", exact: true }).click();
      const form = page.locator('form:has(input[name="name"])').first();
      await form.locator('input[name="name"]').fill("Үндсэн хоол");
      await form.locator('button[type="submit"]').click();
      await expect(page.getByRole("dialog").getByRole("status")).toBeVisible();
      await page.getByRole("button", { name: "Хаах", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Үндсэн хоол", exact: true })).toBeVisible();
      const category = await admin.from("menu_categories").select("id").eq("organization_id", orgId).single();
      dbSuccess(category.error);
      categoryId = category.data!.id;
      await page.goto("/dashboard/menu/new");
      await page.locator('input[name="name_mn"]').fill(itemName);
      await page.locator('select[name="category_id"]').selectOption(categoryId);
      await page.locator('input[name="price_mnt"]').fill("18000");
      await page.locator('input[name="is_published"]').check();
      await page.locator('form:has(input[name="name_mn"]) button[type="submit"]').click();
      await expect(page).toHaveURL(/\/dashboard\/menu$/);
      const item = await admin.from("menu_items").select("id").eq("organization_id", orgId).eq("name_mn", itemName).single();
      dbSuccess(item.error);
      itemId = item.data!.id;
    });

    let destinationId = "";
    await test.step("Draft pages are private; publish a real menu page", async () => {
      await page.goto("/dashboard/pages/new?type=menu");
      await page.locator('input[name="title"]').fill("Манай хоолны цэс");
      await page.locator('input[name="slug"]').fill(pageSlug);
      await page.locator('select[name="type"]').selectOption("menu");
      await page.locator('form:has(input[name="title"]) button[type="submit"]').click();
      await expect(page).toHaveURL(/\/dashboard\/pages$/);
      const destination = await admin.from("pages").select("id").eq("slug", pageSlug).single();
      dbSuccess(destination.error);
      destinationId = destination.data!.id;
      expect((await visitor.request.get(`/p/${pageSlug}`)).status()).toBe(404);
      await page.goto(`/dashboard/pages/${destinationId}`);
      await page.locator('input[name="is_published"]').check();
      await page.locator('form:has(input[name="title"]) button[type="submit"]').click();
      await expect(page.getByRole("status").filter({ hasText: "Амжилттай" }).first()).toBeVisible();
      await publicPage.goto(`/p/${pageSlug}`);
      await expect(publicPage.getByRole("heading", { name: itemName, exact: true })).toBeVisible();
    });

    let code = "";
    let cardId = "";
    await test.step("Register the NFC card and resolve its permanent temporary redirect", async () => {
      await page.goto("/dashboard/nfc-cards");
      const form = page.locator('form:has(select[name="page_id"])').first();
      await form.locator('input[name="name"]').fill(cardName);
      await form.locator('select[name="page_id"]').selectOption(destinationId);
      await form.locator('button[type="submit"]').click();
      await expect.poll(async () => {
        const result = await admin.from("nfc_cards").select("id,code").eq("organization_id", orgId).eq("name", cardName).maybeSingle();
        dbSuccess(result.error);
        if (result.data) { code = result.data.code; cardId = result.data.id; }
        return result.data?.code;
      }).toMatch(/^[a-f0-9]{24}$/);
      const card = page.getByTestId("nfc-card").filter({ has: page.getByRole("heading", { name: cardName, exact: true }) });
      await expect(card.getByTestId("nfc-url")).toContainText(`/t/${code}`);
      await expect(card.getByRole("img", { name: `${cardName} QR`, exact: true })).toBeVisible();
      const downloadEvent = page.waitForEvent("download");
      await card.getByRole("link", { name: "QR татах", exact: true }).click();
      const download = await downloadEvent;
      expect(download.suggestedFilename()).toMatch(/\.png$/);
      const stream = await download.createReadStream();
      expect(stream).not.toBeNull();
      const chunks: Buffer[] = [];
      for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
      const png = Buffer.concat(chunks);
      expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      expect(png.readUInt32BE(16)).toBe(600);
      expect(png.readUInt32BE(20)).toBe(600);
      const response = await visitor.request.get(`/t/${code}`, { maxRedirects: 0 });
      expect([302, 303, 307]).toContain(response.status());
      expect(response.headers().location).toContain(`/p/${pageSlug}`);
      expect(response.headers()["cache-control"]).toContain("no-store");
      await publicPage.goto(`/t/${code}`);
      await expect(publicPage).toHaveURL(new RegExp(`/p/${pageSlug}$`));
      const article = publicPage.locator("article").filter({ has: publicPage.getByRole("heading", { name: itemName, exact: true }) });
      await expect(article).toContainText(/18[\s,.\u00a0\u202f]?000/);
    });

    await test.step("Update the menu price and reuse the identical physical-card URL", async () => {
      await page.goto(`/dashboard/menu/${itemId}`);
      await page.locator('input[name="price_mnt"]').fill("22000");
      await page.locator('form:has(input[name="name_mn"]) button[type="submit"]').click();
      await expect(page.getByRole("status").filter({ hasText: "Амжилттай" }).first()).toBeVisible();
      await publicPage.goto(`/t/${code}`);
      const article = publicPage.locator("article").filter({ has: publicPage.getByRole("heading", { name: itemName, exact: true }) });
      await expect(article).toContainText(/22[\s,.\u00a0\u202f]?000/);
      await expect(article).not.toContainText(/18[\s,.\u00a0\u202f]?000/);
      const record = await admin.from("nfc_cards").select("code").eq("id", cardId).single();
      dbSuccess(record.error);
      expect(record.data!.code).toBe(code);
    });

    await test.step("A second organization cannot read, overwrite or cross-link private tenant data", async () => {
      const otherUser = await admin.auth.admin.createUser({ email: otherEmail, password, email_confirm: true });
      dbSuccess(otherUser.error);
      users.push(otherUser.data.user!.id);
      dbSuccess((await otherClient.auth.signInWithPassword({ email: otherEmail, password })).error);
      const otherOrg = await otherClient.rpc("create_organization", { p_name: `Other E2E ${run}`, p_slug: otherSlug });
      dbSuccess(otherOrg.error);
      organizationIds.push(otherOrg.data as string);
      const hidden = await otherClient.from("menu_items").select("id").eq("id", itemId);
      dbSuccess(hidden.error);
      expect(hidden.data).toEqual([]);
      const overwrite = await otherClient.from("menu_items").update({ price_mnt: 1 }).eq("id", itemId).select("id");
      dbSuccess(overwrite.error);
      expect(overwrite.data).toEqual([]);
      const forgedItem = await otherClient.from("menu_items").insert({ organization_id: otherOrg.data, category_id: categoryId, name_mn: "Forbidden", price_mnt: 1 });
      expect(forgedItem.error).not.toBeNull();
      const forgedCard = await otherClient.from("nfc_cards").insert({ organization_id: otherOrg.data, page_id: destinationId, name: "Forbidden", code: randomUUID().replaceAll("-", "").slice(0, 24) });
      expect(forgedCard.error).not.toBeNull();
      const privateMembers = await otherClient.from("organization_members").select("user_id").eq("organization_id", orgId);
      dbSuccess(privateMembers.error);
      expect(privateMembers.data).toEqual([]);
      const forbiddenDownload = await otherClient.storage.from('organization-assets').download(logoPath);
      expect(forbiddenDownload.error).not.toBeNull();
      const forbiddenUpload = await otherClient.storage.from('organization-assets').upload(
        `${orgId}/branding/${randomUUID()}.png`, Buffer.from('forbidden'), { contentType: 'image/png' });
      expect(forbiddenUpload.error).not.toBeNull();
      const deniedDelete = await otherClient.from('menu_items').delete().eq('id', itemId).select('id');
      dbSuccess(deniedDelete.error);
      expect(deniedDelete.data).toEqual([]);
      const preserved = await admin.from('menu_items').select('price_mnt').eq('id', itemId).single();
      dbSuccess(preserved.error);
      expect(Number(preserved.data!.price_mnt)).toBe(22000);
      const deniedBrowser = await browser.newContext({ baseURL });
      try {
        const otherPage = await deniedBrowser.newPage();
        await login(otherPage, otherEmail, password);
        expect((await otherPage.goto(`/dashboard/menu/${itemId}`))?.status()).toBe(404);
        await expect(otherPage.locator('input[name="name_mn"]')).toHaveCount(0);
      } finally { await deniedBrowser.close(); }
    });

    await test.step("Disable the card; its old URL stops opening the destination", async () => {
      await page.goto("/dashboard/nfc-cards");
      const cardForm = page.locator(`form:has(input[name="id"][value="${cardId}"]):has(select[name="page_id"])`);
      await cardForm.locator('input[name="is_active"]').uncheck();
      await cardForm.locator('button[type="submit"]').click();
      await expect(cardForm.getByRole("status").filter({ hasText: "Амжилттай" })).toBeVisible();
      const response = await visitor.request.get(`/t/${code}`, { maxRedirects: 0 });
      expect([404, 410]).toContain(response.status());
      expect(response.headers().location).toBeUndefined();
    });
    await test.step('Owner deletes the menu item through the confirmation dialog', async () => {
      announceE2EMutation(process.env, 'delete own test menu item');
      await page.goto('/dashboard/menu');
      const article = page.locator('article').filter({ has: page.getByRole('heading', { name: itemName, exact: true }) });
      await article.getByRole('button', { name: 'Устгах', exact: true }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Баталгаажуулах', exact: true }).click();
      await expect(article).toHaveCount(0);
      const deleted = await admin.from('menu_items').select('id').eq('id', itemId);
      dbSuccess(deleted.error);
      expect(deleted.data).toEqual([]);
    });
    await test.step('Logout removes access to protected organization pages', async () => {
      await page.locator('.account-menu summary').click();
      await page.locator('.account-menu').getByRole('button', { name: 'Гарах', exact: true }).click();
      await expect(page).toHaveURL(/\/login$/);
      await page.goto('/dashboard/menu');
      await expect(page).toHaveURL(/\/login$/);
    });
  } finally {
    // Recheck the exact target before any sign-out, Storage remove, or row deletion.
    announceE2EMutation(process.env, 'cleanup only this run');
    test.setTimeout(test.info().timeout + 60_000);
    await visitor.close();
    await otherClient.auth.signOut();
    // Only exact, unique identifiers created by this test are ever deleted.
    const foundOrgs = await admin.from("organizations").select("id").in("slug", [orgSlug, otherSlug]);
    dbSuccess(foundOrgs.error);
    for (const org of foundOrgs.data ?? []) if (!organizationIds.includes(org.id)) organizationIds.push(org.id);
    for (const organizationId of organizationIds) {
      for (const scope of ["branding", "menu", "pages"]) {
        const folder = `${organizationId}/${scope}`;
        const objects = await admin.storage.from("organization-assets").list(folder);
        dbSuccess(objects.error);
        const paths = (objects.data ?? []).filter((entry) => entry.id).map((entry) => `${folder}/${entry.name}`);
        if (paths.length) dbSuccess((await admin.storage.from("organization-assets").remove(paths)).error);
      }
      for (const table of ["nfc_cards", "menu_items", "pages", "menu_categories"]) dbSuccess((await admin.from(table).delete().eq("organization_id", organizationId)).error);
      dbSuccess((await admin.from("organizations").delete().eq("id", organizationId)).error);
    }
    for (const testEmail of [email, otherEmail]) {
      const registeredId = await findUser(admin, testEmail);
      if (registeredId && !users.includes(registeredId)) users.push(registeredId);
    }
    for (const userId of users) dbSuccess((await admin.auth.admin.deleteUser(userId)).error);
    const remaining = await admin.from('organizations').select('id').in('slug', [orgSlug, otherSlug]);
    dbSuccess(remaining.error);
    expect(remaining.data).toEqual([]);
    for (const testEmail of [email, otherEmail]) expect(await findUser(admin, testEmail)).toBeNull();
  }
});
