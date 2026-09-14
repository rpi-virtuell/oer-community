import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { naddrEncode } from 'nostr-tools/nip19';
import { leererInhalt } from '../src/lib/services/spiegel.js';

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
        profil: 0
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

/**
 * Lädt die Route frisch und schiebt ihr den Spiegel-Inhalt unter.
 *
 * @param {{ d?: string, inhalt?: unknown }} [eingabe]
 */
async function ladeMitAttrappe(eingabe = {}) {
  vi.resetModules();
  const inhalt = eingabe.inhalt ?? inhaltNachstellen();

  vi.doMock('$lib/services/spiegel.js', async () => {
    const echt = await import('../src/lib/services/spiegel.js');
    return { ...echt, spiegelHolen: () => ({ lesen: () => inhalt, letzterFehlschlag: () => null }) };
  });

  const { load } = await import('../src/routes/[d]/+page.server.js');
  const d = eingabe.d ?? 'die-kraft-der-gemeinschaft';
  // load() bricht im Fehlerfall mit error()/redirect() ab; TypeScript sieht
  // dort ein moegliches void. Der Rueckgabetyp haelt fest, was im
  // Erfolgsfall kommt.
  return /** @type {Promise<Seitendaten>} */ (
    load(/** @type {any} */ ({ params: { d }, url: new URL('http://test/' + d) }))
  );
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
