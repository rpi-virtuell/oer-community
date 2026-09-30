import { defineConfig, devices } from '@playwright/test';

/**
 * E2E-Rauchtests gegen den gebauten Produktionsserver, ohne Netz
 * (test/e2e/server.mjs). Sie prüfen, was die Vitest-Tests nicht sehen:
 * dass `pnpm build` läuft, der Server startet, die Seiten mit Inhalt
 * ausgeliefert werden und die Hydration im Browser ohne Fehler durchgeht.
 */
const PORT = 4173;

export default defineConfig({
  testDir: 'test/e2e',
  testMatch: '**/*.spec.js',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm build && node test/e2e/server.mjs',
    url: `http://127.0.0.1:${PORT}/`,
    env: { PORT: String(PORT) },
    reuseExistingServer: !process.env.CI,
    timeout: 180_000
  }
});
