import type { E2EEnv } from './e2e-safety.mjs';
export function readTestEnvironment(path?: string): Record<string, string>;
export function readProductionEnvironment(): Record<string, string>;
export function isolateTestEnvironment(test: E2EEnv, inherited?: E2EEnv, production?: E2EEnv): E2EEnv;
export function loadE2EEnvironment(inherited?: E2EEnv): E2EEnv;
