# Browser tests

## Public screens (no Supabase required)

`npm.cmd run test:e2e` starts Next.js automatically at `http://127.0.0.1:3100` and runs the public-screen smoke tests. These check desktop/mobile layouts, navigation, authentication entry points, setup, and invalid NFC links. Install Chromium first with `npx.cmd playwright install chromium`, or use an installed browser by setting `PLAYWRIGHT_CHANNEL=msedge` or `PLAYWRIGHT_CHANNEL=chrome`.

Set `E2E_BASE_URL` only to test an already running application; in that case Playwright does not start a server. The Supabase workflow is skipped by default, while the public-screen tests still run.

## Real Supabase integration test

This suite exercises the running application, Supabase Auth, PostgreSQL RLS, and private Storage. It creates unique test users and organizations, then removes only those exact test resources in `finally` cleanup. Use a dedicated Supabase test project with this repository's migration applied. Public sign-up must be enabled; email sending must be configured or disabled for local Supabase.

The test registers its first user through the registration screen. A server-side administrative key confirms that generated account so a real mailbox is unnecessary. The key is never sent to the browser. The second test user exists solely for tenant isolation checks.

Store the dedicated test project's modern publishable and secret keys in the Git-ignored `.env.e2e.local`. Legacy JWT keys and shell-only credential configuration are not supported. Follow [test environment setup](../../docs/test-environment.md) for the complete file format and project identity verification.

Only `nfc-smart-test` (`khohnhjjyetwuzfsttkl`) is permitted. Verification checks both project identities and tests the keys with read-only requests. It requires a local Management token or recent identity metadata obtained by the connected Supabase agent. Never fabricate verification metadata.

The integration runner enables `E2E_ENABLED=1` only in its child process and starts a fresh Next.js server at `http://127.0.0.1:3100`, using `.next-e2e`. Test credentials come exclusively from `.env.e2e.local`; `.env.local` is read only for isolation checks and is not modified. Do not set `E2E_BASE_URL`, and keep port 3100 free.

```powershell
$env:PLAYWRIGHT_CHANNEL = 'msedge' # Or install Playwright Chromium.
npm.cmd run e2e:verify
npm.cmd run test:e2e:integration
```

When `E2E_ENABLED` is not `1`, the Supabase workflow explicitly reports one skipped test. Passing public-screen tests does not verify that workflow. Enabling the integration test without a required variable fails rather than silently skipping.

Covered workflow: real registration → organization creation and branding image upload → category creation → menu item creation → draft privacy → page publication → NFC registration → QR PNG download → permanent-link redirect → price change visible through the same link → second-tenant read/write/delete, cross-reference and Storage denial → NFC deactivation → owner menu deletion → logout and protected access → cleanup.

Integration traces and screenshots are disabled, test output files are removed, and the safe reporter prints workflow status and source coordinates without raw API errors, passwords, cookies or call logs. Public smoke runs retain failure diagnostics.

If a test is interrupted before cleanup, the generated accounts are named `nfc-e2e-<run>@example.com` and `nfc-e2e-other-<run>@example.com`; organizations use matching unique `e2e-<run>` slugs. Inspect exact IDs before manually cleaning up any interrupted run. Never delete all users or all organizations to reset a test.
