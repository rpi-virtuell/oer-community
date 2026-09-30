/**
 * Startet den gebauten Produktionsserver (`build/`) für die E2E-Rauchtests.
 *
 * Kein Netz: Der Spiegel beginnt mit einer Datei aus der Testquelle (plus
 * Termin-Fixtures), das einzige Relay ist eine Adresse, an der niemand
 * lauscht. Jeder Lauf scheitert also und ersetzt nichts (ADR-0028) — der
 * Server liefert den Stand aus der Datei, wie nach einem Relay-Ausfall.
 *
 * Aufruf über `pnpm test:e2e` (playwright.config.js, webServer).
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { inhaltDerTestquelle } from '../fixtures/testquelle/laden.js';

const wurzel = fileURLToPath(new URL('../..', import.meta.url));
const verzeichnis = fileURLToPath(new URL('../../test-results/e2e-spiegel/', import.meta.url));
const spiegelPfad = `${verzeichnis}spiegel.json`;
const port = process.env.PORT ?? '4173';

const { inhalt, konfig } = inhaltDerTestquelle({ mitTerminen: true });
mkdirSync(verzeichnis, { recursive: true });
writeFileSync(spiegelPfad, JSON.stringify(inhalt), 'utf8');

const server = spawn(process.execPath, ['build/index.js'], {
  cwd: wurzel,
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: port,
    HOST: '127.0.0.1',
    ORIGIN: `http://127.0.0.1:${port}`,
    QUELLE_AUTOR: konfig.autor,
    QUELLE_H_TAG: '',
    RELAYS: 'wss://127.0.0.1:9/',
    BLOSSOM_URL: 'https://blossom.example/',
    ABGELOESTE_HOSTS: '',
    COMMUNITY_PUBKEY: konfig.community ?? '',
    EDUFEED_URL: konfig.edufeedUrl,
    SPIEGEL_PFAD: spiegelPfad,
    SPIEGEL_INTERVALL_S: '3600',
    SPIEGEL_STARTWARTEZEIT_S: '1'
  }
});

for (const signal of /** @type {const} */ (['SIGINT', 'SIGTERM'])) {
  process.on(signal, () => server.kill(signal));
}
server.on('exit', (code) => process.exit(code ?? 0));
