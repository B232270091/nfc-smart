import type { FullResult, Reporter, TestCase, TestResult, TestStep } from '@playwright/test/reporter';

// Playwright's default error call logs can include fill(password) arguments.
// Integration output deliberately excludes raw error bodies, traces and cookies.
export default class SafeE2EReporter implements Reporter {
  onStepEnd(_test: TestCase, _result: TestResult, step: TestStep) {
    // Only explicitly named workflow steps; API call titles can include passwords.
    if (step.category === 'test.step') console.log(`[E2E step] ${step.error ? 'failed' : 'passed'}: ${step.title}`);
  }
  onTestEnd(test: TestCase, result: TestResult) {
    console.log(`[E2E] ${result.status}: ${test.title} (${Math.round(result.duration / 1000)}s)`);
    if (result.errors.length) console.log(`[E2E] ${result.errors.length} error(s) at ${test.location.file}:${test.location.line}; raw credential-bearing diagnostics suppressed.`);
  }
  onStdOut(chunk: string | Buffer) {
    const text = chunk.toString().trim();
    if (/^\[E2E [a-z /]+\] Target: nfc-smart-test \([a-z]{20}\)$/.test(text)) console.log(text);
  }
  onError() { console.error('[E2E] Runner error. Check verified target, migrations, Auth setup, and local port availability.'); }
  onEnd(result: FullResult) { console.log(`[E2E] Suite ${result.status}.`); }
}
