import { expect, test } from '@playwright/test';

/**
 * Rauchtests der Hauptseiten im echten Browser gegen den gebauten Server
 * (test/e2e/server.mjs, Spiegel aus der Testquelle, kein Relay erreichbar).
 *
 * Geprüft wird, was nur im Zusammenspiel sichtbar wird: Auslieferung,
 * Hydration ohne Laufzeitfehler, Navigation, Umschalter, Lesbarkeit ohne
 * JavaScript (ADR-0003). Einzelregeln prüfen die Vitest-Tests.
 */

const TAGUNG = '“Offen. Vernetzt. Zukunft.” - FOERBICO Tagung Frankfurt';

/**
 * Kein Netz außer dem eigenen Server: fremde Bilder (Blossom, Tagungsbild)
 * werden abgebrochen. Gesammelt werden Laufzeitfehler und Konsolenfehler —
 * ohne die Meldungen über die abgebrochenen fremden Bilder.
 * @param {import('@playwright/test').Page} page
 */
async function fehlerSammeln(page) {
  /** @type {string[]} */
  const fehler = [];
  await page.route(/^https?:\/\/(?!127\.0\.0\.1[:/])/, (route) => route.abort());
  page.on('pageerror', (e) => fehler.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) {
      fehler.push(`console: ${m.text()}`);
    }
  });
  return fehler;
}

test.describe('mit JavaScript', () => {
  /** @type {string[]} */
  let fehler;
  test.beforeEach(async ({ page }) => {
    fehler = await fehlerSammeln(page);
  });
  test.afterEach(() => {
    expect(fehler, 'Laufzeit- oder Konsolenfehler im Browser').toEqual([]);
  });

  test('Startseite zeigt Inhalt, Menü, nächste Termine und den Stand', async ({ page }) => {
    const antwort = await page.goto('/');
    expect(antwort?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect(page.getByRole('heading', { level: 1, name: 'Willkommen' })).toBeVisible();

    const menue = page.getByRole('navigation').first();
    await expect(menue.getByRole('link', { name: 'Unser Team' })).toBeVisible();
    await expect(menue.getByRole('link', { name: 'Termine' })).toBeVisible();

    await expect(page.getByText('Nächste Termine')).toBeVisible();
    await expect(page.getByText(TAGUNG).first()).toBeVisible();
    // Kein Relay erreichbar: die Fußzeile nennt das Alter des Stands (ADR-0028).
    await expect(page.getByText(/kein Relay erreichbar/)).toBeVisible();
  });

  test('vom Blog zum Artikel', async ({ page }) => {
    await page.goto('/blog');
    await page.getByRole('link', { name: 'Artikel A' }).first().click();
    await expect(page).toHaveURL(/\/artikel-a$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Artikel A' })).toBeVisible();
  });

  test('Terminseite zeigt die Tagung', async ({ page }) => {
    const antwort = await page.goto('/termine');
    expect(antwort?.status()).toBe(200);
    await expect(page.getByText(TAGUNG).first()).toBeVisible();
    await expect(page.getByText('2.–3. Februar 2027').first()).toBeVisible();
  });

  test('Umschalter führt zum englischen Gegenstück', async ({ page }) => {
    await page.goto('/unser-team');
    await page.getByRole('link', { name: 'EN', exact: true }).click();
    await expect(page).toHaveURL(/\/en\/our-team$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1, name: 'Our team' })).toBeVisible();
  });

  test('englische Startseite unter /en', async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1, name: 'Welcome' })).toBeVisible();
  });
});

test.describe('ohne JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('Blog und Artikel sind serverseitig gerendert lesbar (ADR-0003)', async ({ page }) => {
    await fehlerSammeln(page);
    await page.goto('/blog');
    await expect(page.getByRole('link', { name: 'Artikel A' }).first()).toBeVisible();
    await page.goto('/artikel-a');
    await expect(page.getByRole('heading', { level: 1, name: 'Artikel A' })).toBeVisible();
  });
});

test('unbekannte Adresse antwortet 404', async ({ request }) => {
  const antwort = await request.get('/gibt-es-nicht');
  expect(antwort.status()).toBe(404);
});

test('Feed und Sitemap werden ausgeliefert', async ({ request }) => {
  const feed = await request.get('/feed.xml');
  expect(feed.status()).toBe(200);
  expect(feed.headers()['content-type']).toContain('application/rss+xml');
  expect(await feed.text()).toContain('Artikel A');

  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()['content-type']).toContain('application/xml');
  expect(await sitemap.text()).toContain('/termine');
});
