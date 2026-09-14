import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { leererInhalt } from '../src/lib/services/spiegel.js';

/**
 * Prüft die load-Funktionen der Übersichten unter /, /blog, /blog/seite/[n],
 * /themen, /themen/[thema] und /themen/[thema]/seite/[n].
 *
 * Muster wie test/detailansicht.test.js: die Relay-Ebene wird ausgetauscht,
 * nie das Netz benutzt. Die Themen-Tabelle ist die echte daten/themen.json
 * (kein Injekt) — damit ist die Produktionstabelle mit abgedeckt.
 */

/** @type {any[]} */
const artikelEvents = JSON.parse(
  readFileSync(new URL('./fixtures/foerbico-artikel-30023.json', import.meta.url), 'utf8')
);

const UMGEBUNG = {
  QUELLE_AUTOR: '5a12b41ec15b466321e88c371be2dc47d9193f9c8bba4ab09fc50045bd35aedf',
  RELAYS: 'wss://relay.edufeed.org/,wss://relay-rpi.edufeed.org/',
  BLOSSOM_URL: 'https://blossom.edufeed.org/'
};

// $env/dynamic/private gibt es nur im SvelteKit-Lauf; im Test steht die
// Umgebung als Attrappe daneben.
vi.mock('$env/dynamic/private', () => ({ env: UMGEBUNG }));

const RELAY = 'wss://relay.edufeed.org/';
const RPI = 'wss://relay-rpi.edufeed.org/';

/** Ein gültiger Spiegel-Inhalt mit dem FOERBICO-Artikelbestand. */
function inhaltMitArtikeln() {
  return {
    ...leererInhalt(),
    stand: {
      zeitpunkt: '2026-09-14T10:00:00Z',
      dauerMs: 3,
      gefragteRelays: [RELAY, RPI],
      nichtErreichbar: [],
      anzahl: { artikel: artikelEvents.length, listen: 0, nachweise: 0, profil: 0 }
    },
    artikel: artikelEvents
  };
}

/**
 * Lädt ein Routenmodul frisch, mit gemocktem Spiegel.
 * @param {string} modulpfad relativ zu test/, z. B. '../src/routes/blog/+page.server.js'
 * @param {Record<string, string>} params
 * @param {unknown} [inhalt] Standard: gültiger Bestand aus der Fixture
 */
async function lade(modulpfad, params, inhalt = inhaltMitArtikeln()) {
  vi.resetModules();

  vi.doMock('$lib/services/spiegel.js', async () => {
    const echt = await import('../src/lib/services/spiegel.js');
    return { ...echt, spiegelHolen: () => ({ lesen: () => inhalt, letzterFehlschlag: () => null }) };
  });

  const { load } = await import(modulpfad);
  return load(/** @type {any} */ ({ params }));
}

describe('/blog', () => {
  it('liefert die erste Seite', async () => {
    const daten = await lade('../src/routes/blog/+page.server.js', {});
    expect(daten.seite).toBe(1);
    expect(daten.karten).toHaveLength(20);
    expect(daten.basis).toBe('/blog');
  });
});

describe('/blog/seite/[n]', () => {
  it('liefert Seite 2; Unsinn ist 404', async () => {
    expect((await lade('../src/routes/blog/seite/[n]/+page.server.js', { n: '2' })).seite).toBe(2);
    await expect(
      lade('../src/routes/blog/seite/[n]/+page.server.js', { n: 'abc' })
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      lade('../src/routes/blog/seite/[n]/+page.server.js', { n: '0' })
    ).rejects.toMatchObject({ status: 404 });
  });

  it('eine Seite jenseits des Bestands ist 404', async () => {
    await expect(
      lade('../src/routes/blog/seite/[n]/+page.server.js', { n: '99' })
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe('/themen', () => {
  it('listet Themen mit Anzahl', async () => {
    const daten = await lade('../src/routes/themen/+page.server.js', {});
    expect(daten.themen[0].anzahl).toBeGreaterThan(0);
  });
});

describe('/themen/[thema]', () => {
  it('filtert; unbekannt ist 404 mit Hinweis auf /themen', async () => {
    const daten = await lade('../src/routes/themen/[thema]/+page.server.js', { thema: 'community' });
    expect(daten.ueberschrift).toBe('Community');

    await expect(
      lade('../src/routes/themen/[thema]/+page.server.js', { thema: 'nope' })
    ).rejects.toMatchObject({ status: 404, body: { message: expect.stringContaining('/themen') } });
  });
});

describe('/themen/[thema]/seite/[n]', () => {
  it('liefert Seite 1 eines Themas', async () => {
    const daten = await lade('../src/routes/themen/[thema]/seite/[n]/+page.server.js', {
      thema: 'community',
      n: '1'
    });
    expect(daten.seite).toBe(1);
    expect(daten.basis).toBe('/themen/community');
  });
});

describe('/', () => {
  it('zeigt die Übersicht mit dem Hinweis, dass die Startseite fehlt', async () => {
    const daten = await lade('../src/routes/+page.server.js', {});
    expect(daten.hinweis).toContain('startseite');
    expect(daten.karten).toHaveLength(20);
  });
});

describe('leerer Spiegel', () => {
  it('503 mit Relays auf jeder Übersicht', async () => {
    await expect(
      lade('../src/routes/blog/+page.server.js', {}, leererInhalt())
    ).rejects.toMatchObject({ status: 503 });
    await expect(
      lade('../src/routes/blog/seite/[n]/+page.server.js', { n: '1' }, leererInhalt())
    ).rejects.toMatchObject({ status: 503 });
    await expect(
      lade('../src/routes/themen/+page.server.js', {}, leererInhalt())
    ).rejects.toMatchObject({ status: 503 });
    await expect(
      lade('../src/routes/themen/[thema]/+page.server.js', { thema: 'community' }, leererInhalt())
    ).rejects.toMatchObject({ status: 503 });
    await expect(
      lade('../src/routes/themen/[thema]/seite/[n]/+page.server.js', { thema: 'community', n: '1' }, leererInhalt())
    ).rejects.toMatchObject({ status: 503 });
    await expect(
      lade('../src/routes/+page.server.js', {}, leererInhalt())
    ).rejects.toMatchObject({ status: 503 });
  });
});
