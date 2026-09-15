import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { naddrEncode } from 'nostr-tools/nip19';
import { leererInhalt } from '../src/lib/services/spiegel.js';
import { inhaltDerTestquelle, testquelle } from './fixtures/testquelle/laden.js';

/**
 * Prüft die load-Funktion der Detailansicht unter /[d].
 *
 * Die Relay-Ebene wird ausgetauscht, nicht das Netz benutzt: geprüft wird,
 * ob die Route lädt, prüft und im Fehlerfall den Grund NENNT — nie eine
 * leere Seite ohne Erklärung (CLAUDE.md).
 *
 * @typedef {object} Seitendaten
 * @property {{ titel: string, zusammenfassung: string, veroeffentlicht: string,
 *   themen: string[], bildUrl: string|null, sprache: 'de'|'en', istSeite: boolean }} artikel
 * @property {import('../src/lib/models/lizenz.js').Ergebnis} lizenz
 * @property {import('../src/lib/inhalt.js').Teil[]} teile
 * @property {Record<string, import('../src/lib/models/lizenz.js').Ergebnis>} fliesstext
 * @property {string[]} entfernteBilder
 * @property {string} pfad
 * @property {{ zeitpunkt: string, nichtErreichbar: string[] }|null} stand
 */

const NADDR =
  'naddr1qvzqqqr4gupzqksjks0vzk6xvvs73rphr03dc37eryleeza6f2cfl3gqgk7nttklqyv8wumn8ghj7un9d3shjtn9v36kvet9vshx7un89uqp5erfv5kkkunpve6z6er9wgkkwetdv45kuumrdpskvaqntfdpj';

// Ein naddr, der zu keinem Beitrag dieser Quelle gehört — mit nip19 selbst
// kodiert statt aus einer fremden Quelle kopiert.
const NADDR_FREMD = naddrEncode({ kind: 30023, pubkey: 'b'.repeat(64), identifier: 'x', relays: [] });

/** @type {any} */
const artikelEvent = JSON.parse(
  readFileSync(
    new URL('./fixtures/artikel-30023-die-kraft-der-gemeinschaft.json', import.meta.url),
    'utf8'
  )
)[0];

/** @type {any} */
const nachweisEvent = JSON.parse(
  readFileSync(
    new URL('./fixtures/lizenz-1063-nostr-schrein.json', import.meta.url),
    'utf8'
  )
)[0];

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

/**
 * Spiegelinhalt nachstellen: nur relay-rpi kennt den Lizenznachweis — so
 * liegt es auch in Wirklichkeit (ADR-0013). Die Fälle „unerreichbar" und
 * „ohne Artikel" werden über den Spiegel-Inhalt selbst nachgestellt, seit
 * ADR-0028 liest die Route aus dem Spiegel.
 *
 * @param {{ unerreichbar?: boolean, ohneArtikel?: boolean,
 *   ohneNachweis?: boolean, etag?: string }} [lage]
 */
function inhaltNachstellen(lage = {}) {
  if (lage.unerreichbar) return leererInhalt();

  return {
    ...leererInhalt(),
    stand: {
      zeitpunkt: '2026-09-14T10:00:00Z',
      dauerMs: 3,
      gefragteRelays: [RELAY, RPI],
      nichtErreichbar: [],
      anzahl: {
        artikel: lage.ohneArtikel ? 0 : 1,
        listen: 0,
        nachweise: lage.ohneNachweis ? 0 : 1,
        profil: 0,
        termine: 0
      }
    },
    artikel: lage.ohneArtikel ? [] : [artikelEvent],
    nachweise: lage.ohneNachweis ? [] : [nachweisEvent],
    quellen: lage.ohneArtikel
      ? {}
      : { [artikelEvent.id]: [RELAY], ...(lage.ohneNachweis ? {} : { [nachweisEvent.id]: [RPI] }) },
    etags: lage.etag
      ? { [artikelEvent.tags.find((/** @type {string[]} */ t) => t[0] === 'image')[1]]: lage.etag }
      : {}
  };
}

/** Den Spiegel der Route unterschieben. @param {unknown} inhalt */
async function spiegelUnterschieben(inhalt) {
  vi.resetModules();
  vi.doMock('$lib/services/spiegel.js', async () => {
    const echt = await import('../src/lib/services/spiegel.js');
    return { ...echt, spiegelHolen: () => ({ lesen: () => inhalt, letzterFehlschlag: () => null }) };
  });
}

/**
 * Lädt die Route frisch und schiebt ihr den Spiegel-Inhalt unter.
 *
 * `autor` setzt QUELLE_AUTOR in der gemockten Umgebung — nötig für Fälle mit
 * der Testquelle, deren Events einen anderen Schlüssel tragen (Muster wie in
 * test/uebersicht-routen.test.js).
 *
 * @param {{ d?: string, inhalt?: unknown, englisch?: boolean, autor?: string }} [eingabe]
 */
async function ladeMitAttrappe(eingabe = {}) {
  await spiegelUnterschieben(eingabe.inhalt ?? inhaltNachstellen());
  if (eingabe.autor) vi.doMock('$env/dynamic/private', () => ({ env: { ...UMGEBUNG, QUELLE_AUTOR: eingabe.autor } }));

  const { load } = eingabe.englisch
    ? await import('../src/routes/en/[d]/+page.server.js')
    : await import('../src/routes/[d]/+page.server.js');
  const d = eingabe.d ?? 'die-kraft-der-gemeinschaft';
  // load() bricht im Fehlerfall mit error()/redirect() ab; TypeScript sieht
  // dort ein moegliches void. Der Rueckgabetyp haelt fest, was im
  // Erfolgsfall kommt.
  return /** @type {Promise<Seitendaten>} */ (
    load(/** @type {any} */ ({ params: { d }, url: new URL('http://test/' + d) }))
  );
}

/**
 * Die JSON-Route unter /[d]/json frisch laden.
 * @param {{ d: string, inhalt?: unknown, autor?: string }} eingabe
 */
async function jsonMitAttrappe(eingabe) {
  await spiegelUnterschieben(eingabe.inhalt ?? inhaltNachstellen());
  if (eingabe.autor) vi.doMock('$env/dynamic/private', () => ({ env: { ...UMGEBUNG, QUELLE_AUTOR: eingabe.autor } }));
  const { GET } = await import('../src/routes/[d]/json/+server.js');
  return GET(/** @type {any} */ ({ params: { d: eingabe.d }, url: new URL('http://test/' + eingabe.d + '/json') }));
}

/**
 * Die JSON-Route unter /en/[d]/json frisch laden.
 * @param {{ d: string, inhalt?: unknown, autor?: string }} eingabe
 */
async function jsonEnglischMitAttrappe(eingabe) {
  await spiegelUnterschieben(eingabe.inhalt ?? inhaltNachstellen());
  if (eingabe.autor) vi.doMock('$env/dynamic/private', () => ({ env: { ...UMGEBUNG, QUELLE_AUTOR: eingabe.autor } }));
  const { GET } = await import('../src/routes/en/[d]/json/+server.js');
  return GET(/** @type {any} */ ({ params: { d: eingabe.d }, url: new URL('http://test/en/' + eingabe.d + '/json') }));
}

describe('Detailansicht laedt den Artikel serverseitig', () => {
  it('gibt Titel, Datum, Inhalt und die geprüfte Lizenz zurück', async () => {
    const daten = await ladeMitAttrappe();

    expect(daten.artikel.titel).toContain('Die Kraft der Gemeinschaft');
    expect(daten.artikel.veroeffentlicht).toBe(
      new Date(1788433547 * 1000).toISOString()
    );
    // Seit ADR-0023 kommt der Inhalt als Teile: HTML-Segmente und Bilder.
    expect(daten.teile.some((t) => t.art === 'html' && t.html.includes('<p>'))).toBe(true);
    expect(typeof daten.fliesstext).toBe('object');
    expect(daten.lizenz.ok).toBe(true);
    if (daten.lizenz.ok) {
      expect(daten.lizenz.nachweis.credit).toBe('Comenius-Institut');
      expect(daten.lizenz.nachweis.url).toContain('blossom.edufeed.org');
    }
  });

  it('meldet den Grund, wenn zum Bild kein Nachweis im Spiegel liegt', async () => {
    const daten = await ladeMitAttrappe({
      inhalt: inhaltNachstellen({ ohneNachweis: true })
    });

    expect(daten.artikel.titel).toContain('Die Kraft der Gemeinschaft');
    expect(daten.lizenz.ok).toBe(false);
    if (!daten.lizenz.ok) expect(daten.lizenz.grund).toBe('kein-nachweis');
  });

  it('liefert pfad und den Stand des Spiegels mit', async () => {
    const daten = await ladeMitAttrappe();

    expect(daten.pfad).toBe('/die-kraft-der-gemeinschaft');
    expect(daten.stand?.zeitpunkt).toBeTruthy();
  });
});

describe('Detailansicht leitet naddr-Adressen weiter (ADR-0029)', () => {
  it('leitet ein naddr der eigenen Quelle dauerhaft auf /d weiter', async () => {
    await expect(ladeMitAttrappe({ d: NADDR })).rejects.toMatchObject({
      status: 301,
      location: '/die-kraft-der-gemeinschaft'
    });
  });

  it('ein naddr fremder Quelle ist 404, keine Weiterleitung', async () => {
    await expect(ladeMitAttrappe({ d: NADDR_FREMD })).rejects.toMatchObject({ status: 404 });
  });

  it('ein Text, der wie naddr beginnt, aber nicht dekodiert, ist ein unbekanntes d → 404', async () => {
    await expect(ladeMitAttrappe({ d: 'naddr1kaputt' })).rejects.toMatchObject({ status: 404 });
  });
});

// Eine englische Fassung des Referenzfalls: dieselben Tags, inLanguage=en,
// eigenes d. Damit prüft /en/[d] echte Ereignisse statt einer Erfindung.
const englischEvent = {
  ...artikelEvent,
  id: 'e'.repeat(64),
  tags: [
    ...artikelEvent.tags.filter((/** @type {string[]} */ t) => t[0] !== 'd' && t[0] !== 'inLanguage'),
    ['d', 'our-team'],
    ['inLanguage', 'en']
  ]
};

/** Spiegel mit deutschem UND englischem Beitrag. */
function inhaltZweisprachig() {
  const basis = inhaltNachstellen();
  return { ...basis, artikel: [...basis.artikel, englischEvent] };
}

describe('Sprachweiterleitung zwischen /[d] und /en/[d] (ADR-0029)', () => {
  it('ein englischer Beitrag unter /[d] leitet dauerhaft auf /en/[d]', async () => {
    await expect(
      ladeMitAttrappe({ d: 'our-team', inhalt: inhaltZweisprachig() })
    ).rejects.toMatchObject({ status: 301, location: '/en/our-team' });
  });

  it('/en/[d] liefert den englischen Beitrag mit seinem Pfad', async () => {
    const daten = await ladeMitAttrappe({ d: 'our-team', englisch: true, inhalt: inhaltZweisprachig() });
    expect(daten.artikel.sprache).toBe('en');
    expect(daten.pfad).toBe('/en/our-team');
  });

  it('ein deutscher Beitrag unter /en/[d] leitet dauerhaft auf /[d]', async () => {
    await expect(
      ladeMitAttrappe({ d: 'die-kraft-der-gemeinschaft', englisch: true, inhalt: inhaltZweisprachig() })
    ).rejects.toMatchObject({ status: 301, location: '/die-kraft-der-gemeinschaft' });
  });
});

describe('Prozent-kodierte d finden ihren Beitrag (ADR-0029)', () => {
  it('der dekodierte Param trifft ein d mit literalem Prozentzeichen', async () => {
    const kodiert = {
      ...artikelEvent,
      id: 'c'.repeat(64),
      tags: [
        ...artikelEvent.tags.filter((/** @type {string[]} */ t) => t[0] !== 'd'),
        ['d', 'oer-visuelle-qualit%C3%A4t']
      ]
    };
    const basis = inhaltNachstellen();
    const daten = await ladeMitAttrappe({
      d: 'oer-visuelle-qualität',
      inhalt: { ...basis, artikel: [kodiert] }
    });
    expect(daten.pfad).toBe('/oer-visuelle-qualit%C3%A4t');
  });
});

describe('Die JSON-Route leitet naddr auf ihr eigenes Ziel weiter', () => {
  it('/naddr…/json geht nach /[d]/json, nicht nach /[d]', async () => {
    await expect(jsonMitAttrappe({ d: NADDR })).rejects.toMatchObject({
      status: 301,
      location: '/die-kraft-der-gemeinschaft/json'
    });
  });

  it('auch die Sprachweiterleitung bleibt bei JSON', async () => {
    await expect(
      jsonMitAttrappe({ d: 'our-team', inhalt: inhaltZweisprachig() })
    ).rejects.toMatchObject({ status: 301, location: '/en/our-team/json' });
  });
});

describe('Detailansicht nennt jeden Fehlerfall', () => {
  it('bricht mit 503 ab und nennt die Relays, wenn der Spiegel noch keinen Stand hat', async () => {
    await expect(
      ladeMitAttrappe({ inhalt: inhaltNachstellen({ unerreichbar: true }) })
    ).rejects.toMatchObject({
      status: 503,
      body: { message: expect.stringContaining('wss://relay.edufeed.org/') }
    });
  });

  it('bricht mit 404 ab, wenn d unbekannt ist', async () => {
    await expect(ladeMitAttrappe({ d: 'gibt-es-nicht' })).rejects.toMatchObject({
      status: 404
    });
  });
});

// Die Startseite hat zwei Adressen, solange /[d] sie auch ausliefert. Bis zur
// Stufe 4 (eigene Seitenroute) gewinnt /, damit derselbe Text nicht unter zwei
// Adressen steht; die JSON-Route bleibt erreichbar, sie ist die Entwickleransicht.
describe('Die Startseite wohnt unter /, nicht unter /[d]', () => {
  it('/[d] mit dem d der Startseite leitet dauerhaft auf /', async () => {
    const { inhalt } = inhaltDerTestquelle();
    await expect(
      ladeMitAttrappe({ d: 'startseite', inhalt, autor: testquelle().pubkey })
    ).rejects.toMatchObject({ status: 301, location: '/' });
  });

  it('/startseite/json bleibt erreichbar', async () => {
    const { inhalt } = inhaltDerTestquelle();
    const antwort = await jsonMitAttrappe({ d: 'startseite', inhalt, autor: testquelle().pubkey });
    expect(antwort.status).toBe(200);
  });

  // Die Entwickleransicht soll sagen, was sie *gerendert* hat: unter /en/ wird
  // aus dem angefragten „startseite" der Beitrag „en/startseite" (ADR-0033).
  it('die JSON-Ansicht meldet das aufgelöste d, nicht das angefragte', async () => {
    const { inhalt } = inhaltDerTestquelle();
    const antwort = await jsonEnglischMitAttrappe({ d: 'startseite', inhalt, autor: testquelle().pubkey });
    expect(antwort.status).toBe(200);
    const koerper = await antwort.json();
    expect(koerper.adresse).toEqual({ d: 'en/startseite', pfad: '/en/startseite' });
  });
});
