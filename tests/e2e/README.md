# Browser tests

## Public screens (no Supabase required)

`npm.cmd run test:e2e` starts Next.js automatically at `http://127.0.0.1:3100` and runs the public-screen smoke tests. These check desktop/mobile layouts, navigation, authentication entry points, setup, and invalid NFC links. Install Chromium first with `npx.cmd playwright install chromium`, or use an installed browser by setting `PLAYWRIGHT_CHANNEL=msedge` or `PLAYWRIGHT_CHANNEL=chrome`.

Set `E2E_BASE_URL` only to test an already running application; in that case Playwright does not start a server. The Supabase workflow is skipped by default, while the public-screen tests still run.

## Real Supabase integration test

This suite exercises the running application, Supabase Auth, PostgreSQL RLS, and private Storage. It creates unique test users and organizations, then removes only those exact test resources in `finally` cleanup. Use a dedicated Supabase test project with this repository's migration applied. Public sign-up must be enabled; email sending must be configured or disabled for local Supabase.

The test registers its first user through the registration screen. A server-side administrative key confirms that generated account so a real mailbox is unnecessary. The key is never sent to the browser. The second test user exists solely for tenant isolation checks.

Set these variables in the shell that runs Playwright:

- `E2E_ENABLED=1`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (Supabase secret key or legacy service-role key for the test project)
- Do not set `E2E_BASE_URL` for integration tests: the runner must start a fresh local server with test-only environment variables.

By default Playwright starts Next.js at `http://127.0.0.1:3100` and sets `NEXT_PUBLIC_APP_URL` to that origin. With explicit `E2E_ENABLED=1`, the runner loads **only `.env.e2e.local`**, never production `.env.local`. Set `E2E_SUPABASE_PROJECT_REF` to the separate test project reference. The production project `xcsnkvoulmrpxoxcjuvl`, mismatched project references and non-local app URLs are rejected before any client/server starts. See [test environment setup](../../docs/test-environment.md).

```powershell
npx.cmd playwright install chromium
$env:E2E_ENABLED = '1'
# Set the three Supabase variables in this shell without committing them.
npm.cmd run test:e2e
```

When `E2E_ENABLED` is not `1`, the Supabase workflow explicitly reports one skipped test. Passing public-screen tests does not verify that workflow. Enabling the integration test without a required variable fails rather than silently skipping.

Covered workflow: real registration → organization creation and branding image upload → category creation → menu item creation → draft privacy → page publication → NFC registration → QR PNG download → permanent-link redirect → price change visible through the same link → second-tenant read/write and cross-reference denial → NFC deactivation. Browser traces and screenshots are retained on failure.

If a test is interrupted before cleanup, the generated accounts are named `nfc-e2e-<run>@example.com` and `nfc-e2e-other-<run>@example.com`; organizations use matching unique `e2e-<run>` slugs. Inspect exact IDs before manually cleaning up any interrupted run. Never delete all users or all organizations to reset a test.
