import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * Prüft die load-Funktion der Detailansicht.
 *
 * Die Relay-Ebene wird ausgetauscht, nicht das Netz benutzt: geprüft wird,
 * ob die Route lädt, prüft und im Fehlerfall den Grund NENNT — nie eine
 * leere Seite ohne Erklärung (CLAUDE.md).
 *
 * @typedef {object} Seitendaten
 * @property {{ titel: string, zusammenfassung: string, veroeffentlicht: string,
 *   themen: string[], bildUrl: string|null }} artikel
 * @property {import('../src/lib/models/lizenz.js').Ergebnis} lizenz
 * @property {import('../src/lib/inhalt.js').Teil[]} teile
 * @property {Record<string, import('../src/lib/models/lizenz.js').Ergebnis>} fliesstext
 * @property {string[]} entfernteBilder
 */

const NADDR =
  'naddr1qvzqqqr4gupzqksjks0vzk6xvvs73rphr03dc37eryleeza6f2cfl3gqgk7nttklqyv8wumn8ghj7un9d3shjtn9v36kvet9vshx7un89uqp5erfv5kkkunpve6z6er9wgkkwetdv45kuumrdpskvaqntfdpj';

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

/**
 * Relay-Attrappe: nur relay-rpi kennt den Lizenznachweis — so liegt es
 * auch in Wirklichkeit (ADR-0013).
 *
 * @param {{ unerreichbar?: boolean, ohneArtikel?: boolean,
 *   ohneNachweis?: boolean }} [lage]
 */
function relaysNachstellen(lage = {}) {
  return vi.fn(
    async (
      /** @type {string} */ url,
      /** @type {Record<string, unknown>} */ filter
    ) => {
      if (lage.unerreichbar) return { events: [], erreicht: false };

      const kinds = /** @type {number[]} */ (filter.kinds ?? []);
      if (kinds.includes(1063)) {
        const treffer = lage.ohneNachweis || url !== 'wss://relay-rpi.edufeed.org/';
        return { events: treffer ? [] : [nachweisEvent], erreicht: true };
      }
      if (lage.ohneArtikel) return { events: [], erreicht: true };
      return {
        events: url === 'wss://relay.edufeed.org/' ? [artikelEvent] : [],
        erreicht: true
      };
    }
  );
}

/**
 * Lädt die Route frisch und schiebt ihr die Relay-Attrappe unter.
 *
 * @param {{ naddr?: string, holen?: unknown, etag?: string|undefined }} [eingabe]
 */
async function ladeMitAttrappe(eingabe = {}) {
  vi.resetModules();
  const holen = eingabe.holen ?? relaysNachstellen();

  vi.doMock('$lib/services/relay.js', async () => {
    const echt = await import('../src/lib/services/relay.js');
    return { ...echt, eventsHolen: holen };
  });
  vi.doMock('$lib/loaders/lizenz.js', async () => {
    const echt = await import('../src/lib/loaders/lizenz.js');
    return { ...echt, etagHolen: async () => eingabe.etag };
  });

  const { load } = await import('../src/routes/[naddr]/+page.server.js');
  // load() bricht im Fehlerfall mit error() ab; TypeScript sieht dort ein
  // moegliches void. Der Rueckgabetyp haelt fest, was im Erfolgsfall kommt.
  return /** @type {Promise<Seitendaten>} */ (
    load(/** @type {any} */ ({ params: { naddr: eingabe.naddr ?? NADDR } }))
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

  it('meldet den Grund, wenn zum Bild kein Nachweis auf einem Relay liegt', async () => {
    const daten = await ladeMitAttrappe({
      holen: relaysNachstellen({ ohneNachweis: true })
    });

    expect(daten.artikel.titel).toContain('Die Kraft der Gemeinschaft');
    expect(daten.lizenz.ok).toBe(false);
    if (!daten.lizenz.ok) expect(daten.lizenz.grund).toBe('kein-nachweis');
  });
});

describe('Detailansicht nennt jeden Fehlerfall', () => {
  it('bricht mit 400 ab und nennt die unlesbare Adresse', async () => {
    await expect(ladeMitAttrappe({ naddr: 'kein-naddr' })).rejects.toMatchObject({
      status: 400,
      body: { message: expect.stringContaining('naddr') }
    });
  });

  it('bricht mit 503 ab und nennt die Relays, wenn keines antwortet', async () => {
    await expect(
      ladeMitAttrappe({ holen: relaysNachstellen({ unerreichbar: true }) })
    ).rejects.toMatchObject({
      status: 503,
      body: { message: expect.stringContaining('relay.edufeed.org') }
    });
  });

  it('bricht mit 404 ab und nennt d, wenn die Relays antworten aber nichts haben', async () => {
    await expect(
      ladeMitAttrappe({ holen: relaysNachstellen({ ohneArtikel: true }) })
    ).rejects.toMatchObject({
      status: 404,
      body: { message: expect.stringContaining('die-kraft-der-gemeinschaft') }
    });
  });
});
