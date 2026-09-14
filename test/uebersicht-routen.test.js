import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { leererInhalt } from '../src/lib/services/spiegel.js';
import { inhaltDerTestquelle, testquelle } from './fixtures/testquelle/laden.js';

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

const FOERBICO_AUTOR = '5a12b41ec15b466321e88c371be2dc47d9193f9c8bba4ab09fc50045bd35aedf';

/** @param {string} autor */
const umgebung = (autor) => ({
  QUELLE_AUTOR: autor,
  RELAYS: 'wss://relay.edufeed.org/,wss://relay-rpi.edufeed.org/',
  BLOSSOM_URL: 'https://blossom.edufeed.org/'
});

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
 * Lädt ein Routenmodul frisch, mit gemocktem Spiegel und gemockter Umgebung.
 * @param {string} modulpfad relativ zu test/, z. B. '../src/routes/blog/+page.server.js'
 * @param {Record<string, string>} params
 * @param {unknown} [inhalt] Standard: gültiger Bestand aus der Fixture
 * @param {string} [autor] QUELLE_AUTOR in der gemockten Umgebung; Standard: FOERBICO
 */
async function lade(modulpfad, params, inhalt = inhaltMitArtikeln(), autor = FOERBICO_AUTOR) {
  vi.resetModules();

  // $env/dynamic/private gibt es nur im SvelteKit-Lauf; im Test steht die
  // Umgebung als Attrappe daneben — je Aufruf neu, wegen resetModules().
  vi.doMock('$env/dynamic/private', () => ({ env: umgebung(autor) }));

  vi.doMock('$lib/services/spiegel.js', async () => {
    const echt = await import('../src/lib/services/spiegel.js');
    return { ...echt, spiegelHolen: () => ({ lesen: () => inhalt, letzterFehlschlag: () => null }) };
  });

  const { load } = await import(modulpfad);
  return load(/** @type {any} */ ({ params, url: new URL('https://hub.example/') }));
}

/**
 * Lädt eine +server.js-Route (GET) frisch, mit gemocktem Spiegel und
 * gemockter Umgebung — dasselbe Muster wie lade(), aber für Handler statt
 * load-Funktionen.
 * @param {string} modulpfad relativ zu test/, z. B. '../src/routes/feed.xml/+server.js'
 * @param {string} pfad z. B. 'https://hub.example/feed.xml'
 * @param {unknown} [inhalt] Standard: gültiger Bestand aus der Fixture
 * @param {string} [autor] QUELLE_AUTOR in der gemockten Umgebung; Standard: FOERBICO
 */
async function ladeServer(modulpfad, pfad, inhalt = inhaltMitArtikeln(), autor = FOERBICO_AUTOR) {
  vi.resetModules();
  vi.doMock('$env/dynamic/private', () => ({ env: umgebung(autor) }));
  vi.doMock('$lib/services/spiegel.js', async () => {
    const echt = await import('../src/lib/services/spiegel.js');
    return { ...echt, spiegelHolen: () => ({ lesen: () => inhalt, letzterFehlschlag: () => null }) };
  });
  const { GET } = await import(modulpfad);
  return GET(/** @type {any} */ ({ url: new URL(pfad) }));
}

describe('/feed.xml', () => {
  it('liefert RSS mit application/rss+xml', async () => {
    const response = await ladeServer('../src/routes/feed.xml/+server.js', 'https://hub.example/feed.xml');
    expect(response.headers.get('content-type')).toBe('application/rss+xml; charset=utf-8');
    expect(await response.text()).toContain('<rss');
  });
});

describe('/sitemap.xml', () => {
  it('liefert application/xml', async () => {
    const response = await ladeServer('../src/routes/sitemap.xml/+server.js', 'https://hub.example/sitemap.xml');
    expect(response.headers.get('content-type')).toBe('application/xml; charset=utf-8');
    expect(await response.text()).toContain('<urlset');
  });
});

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
    expect(daten.art).toBe('blog');
    expect(daten.hinweis).toContain('startseite');
    expect(daten.karten).toHaveLength(20);
  });

  it('zeigt die Startseite als Seite, wenn sie publiziert ist', async () => {
    const { inhalt } = inhaltDerTestquelle();
    const daten = await lade('../src/routes/+page.server.js', {}, inhalt, testquelle().pubkey);
    expect(daten.art).toBe('seite');
    expect(daten.seite.artikel.titel).toBe('Willkommen');
    expect(daten.seite.artikel.istSeite).toBe(true);
  });

  it('zeigt den Blog mit Hinweis, wenn die Startseite fehlt', async () => {
    const { inhalt } = inhaltDerTestquelle({ ohne: [{ kind: 30023, d: 'startseite' }] });
    const daten = await lade('../src/routes/+page.server.js', {}, inhalt, testquelle().pubkey);
    expect(daten.art).toBe('blog');
    expect(daten.hinweis).toContain('startseite');
  });
});

describe('/en', () => {
  it('leitet dauerhaft auf / weiter', async () => {
    await expect(lade('../src/routes/en/+page.server.js', {})).rejects.toMatchObject({ status: 301, location: '/' });
  });
});

describe('+layout.server.js', () => {
  it('liefert die Struktur der Testquelle, wenn QUELLE_AUTOR auf sie zeigt', async () => {
    const { inhalt } = inhaltDerTestquelle();
    const daten = await lade('../src/routes/+layout.server.js', {}, inhalt, testquelle().pubkey);
    expect(daten.struktur.wortmarke).toBe('Testquelle');
  });

  it('wirft nie: bei leerem Spiegel Rückfall-Wortmarke, die Seiten melden den Leerstand', async () => {
    const daten = await lade('../src/routes/+layout.server.js', {}, leererInhalt());
    expect(daten.struktur.wortmarke).toBe('Community-Hub');
  });

  it('basisUrl: die website aus dem kind:0 der Testquelle', async () => {
    const { inhalt } = inhaltDerTestquelle();
    const daten = await lade('../src/routes/+layout.server.js', {}, inhalt, testquelle().pubkey);
    expect(daten.struktur.basisUrl).toBe('https://test.example');
  });

  it('basisUrl: der Origin der Anfrage, wenn kein Profil da ist', async () => {
    const daten = await lade('../src/routes/+layout.server.js', {}, leererInhalt());
    expect(daten.struktur.basisUrl).toBe('https://hub.example');
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
    await expect(
      ladeServer('../src/routes/feed.xml/+server.js', 'https://hub.example/feed.xml', leererInhalt())
    ).rejects.toMatchObject({ status: 503 });
    await expect(
      ladeServer('../src/routes/sitemap.xml/+server.js', 'https://hub.example/sitemap.xml', leererInhalt())
    ).rejects.toMatchObject({ status: 503 });
  });
});
