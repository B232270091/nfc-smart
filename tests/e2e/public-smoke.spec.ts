import { test, expect } from "@playwright/test";

for (const width of [390, 1440]) {
  test(`public screens render without horizontal overflow at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const clientErrors: string[] = [];
    page.on("pageerror", (error) => clientErrors.push(error.message));
    for (const route of ["/", "/features", "/pricing", "/contact", "/login", "/register", "/setup"]) {
      const response = await page.goto(route);
      expect(response?.status(), route).toBe(200);
      await expect(page.locator("h1")).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const dimensions = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }));
      expect(dimensions.content, `${route} overflows at ${width}px`).toBeLessThanOrEqual(dimensions.viewport + 1);
      if (route === "/" || route === "/login") await page.screenshot({ path: testInfo.outputPath(`${route === "/" ? "home" : "login"}-${width}.png`), fullPage: true });
    }
    expect(clientErrors).toEqual([]);
  });
}

test("mobile navigation, authentication entry points, setup, and invalid NFC URL", async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Цэс нээх", exact: true }).click();
  const menu = page.getByRole("navigation", { name: "Гар утасны цэс", exact: true });
  await expect(menu).toBeVisible();
  await menu.locator('a[href="/features"]').click();
  await expect(page).toHaveURL(/\/features$/);
  await expect(menu).toHaveCount(0);
  await page.goto("/login");
  await expect(page.locator('input[name="email"]')).toHaveAttribute("type", "email");
  await expect(page.locator('input[name="password"]')).toHaveAttribute("type", "password");
  await page.locator('a[href="/register"]').click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.locator('input[name="password"]')).toHaveAttribute("minlength", "8");
  await page.goto("/setup");
  await expect(page.getByRole("heading", { name: "Өгөгдлийн сангаа холбоорой", exact: true })).toBeVisible();
  const missing = await request.get("/t/invalid-code", { maxRedirects: 0 });
  expect(missing.status()).toBe(404);
  expect(missing.headers().location).toBeUndefined();
  expect(missing.headers()["cache-control"]).toContain("no-store");
});

test('signed-out visitors cannot open organization or admin workspaces', async ({ page }) => {
  for (const route of ['/dashboard/organizations', '/dashboard/menu', '/dashboard/nfc-cards', '/admin', '/admin/users']) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/(login|setup)$/);
  }
});

test('light and dark preferences survive a page reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Өнгөний горим солих' }).click();
  const dark = await page.locator('html').evaluate(el => el.classList.contains('dark'));
  await page.reload();
  await expect.poll(() => page.locator('html').evaluate(el => el.classList.contains('dark'))).toBe(dark);
  await page.getByRole('button', { name: 'Өнгөний горим солих' }).click();
  await expect.poll(() => page.locator('html').evaluate(el => el.classList.contains('dark'))).toBe(!dark);
});
