import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';

import { beitragLaden } from './beitrag.js';

/** @param {string} datei */
function fixture(datei) {
  return JSON.parse(
    readFileSync(new URL(`../../../test/fixtures/${datei}`, import.meta.url), 'utf8')
  );
}

const ARTIKEL = fixture('artikel-30023-die-kraft-der-gemeinschaft.json')[0];
const NACHWEIS = fixture('lizenz-1063-nostr-schrein.json')[0];

const KONFIG = {
  autor: ARTIKEL.pubkey,
  hTag: null,
  relays: ['wss://relay.edufeed.org/', 'wss://relay-rpi.edufeed.org/'],
  blossomUrl: 'https://blossom.edufeed.org/'
};

/** Verteilt die Events wie in Wirklichkeit: Artikel und Nachweis getrennt. */
function relaysWieEcht() {
  /** @type {typeof import('../services/relay.js').eventsHolen} */
  return async (url, filter) => {
    const kinds = /** @type {number[]} */ (
      /** @type {Record<string, unknown>} */ (filter).kinds
    );
    if (kinds.includes(30023)) {
      return { events: url === KONFIG.relays[0] ? [ARTIKEL] : [], erreicht: true };
    }
    return { events: url === KONFIG.relays[1] ? [NACHWEIS] : [], erreicht: true };
  };
}

const ADRESSE = {
  kind: 30023,
  author: ARTIKEL.pubkey,
  d: 'die-kraft-der-gemeinschaft',
  relays: []
};

describe('beitragLaden traegt die Wächter aus ADR-0016 mit', () => {
  it('lehnt einen fremden Autor ab, ohne ein Relay zu fragen', async () => {
    const holen = vi.fn();

    const ergebnis = await beitragLaden({
      adresse: { ...ADRESSE, author: 'b'.repeat(64) },
      konfig: KONFIG,
      holen
    });

    expect(ergebnis.ok).toBe(false);
    expect(ergebnis.ok === false && ergebnis.status).toBe(404);
    expect(holen).not.toHaveBeenCalled();
  });

  it('fragt nie die Relays aus dem naddr, auch nicht bei eigener Quelle', async () => {
    /** @type {string[]} */
    const gefragt = [];
    /** @type {typeof import('../services/relay.js').eventsHolen} */
    const holen = async (url) => {
      gefragt.push(url);
      return { events: [], erreicht: true };
    };

    await beitragLaden({
      adresse: { ...ADRESSE, relays: ['wss://127.0.0.1:9999/', 'wss://boese/'] },
      konfig: KONFIG,
      holen
    });

    expect(gefragt).toEqual(KONFIG.relays);
  });

  it('meldet 503 statt 404, wenn kein Relay erreichbar war', async () => {
    /** @type {typeof import('../services/relay.js').eventsHolen} */
    const holen = async () => ({ events: [], erreicht: false });

    const ergebnis = await beitragLaden({ adresse: ADRESSE, konfig: KONFIG, holen });

    expect(ergebnis.ok === false && ergebnis.status).toBe(503);
  });

  it('meldet 404, wenn die Relays antworteten und nichts hatten', async () => {
    /** @type {typeof import('../services/relay.js').eventsHolen} */
    const holen = async () => ({ events: [], erreicht: true });

    const ergebnis = await beitragLaden({ adresse: ADRESSE, konfig: KONFIG, holen });

    expect(ergebnis.ok === false && ergebnis.status).toBe(404);
  });
});

describe('beitragLaden liefert den Referenzfall vollstaendig', () => {
  it('loest die Lizenz ueber beide Relays auf und gibt die Rohdaten mit', async () => {
    const ergebnis = await beitragLaden({
      adresse: ADRESSE,
      konfig: KONFIG,
      holen: relaysWieEcht(),
      etagHolen: async () => `"${NACHWEIS.tags.find((/** @type {string[]} */ t) => t[0] === 'x')[1]}"`
    });

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;

    expect(ergebnis.artikel.titel).toContain('Kraft der Gemeinschaft');
    expect(ergebnis.lizenz.ok).toBe(true);
    expect(ergebnis.artikelEvent.id).toBe(ARTIKEL.id);
    expect(ergebnis.lizenzEvents).toHaveLength(1);
    // Der Nachweis kam vom anderen Relay als der Artikel (ADR-0013).
    expect(ergebnis.lizenzAbfrage.quellen[NACHWEIS.id]).toEqual([KONFIG.relays[1]]);
    expect(ergebnis.artikelAbfrage.quellen[ARTIKEL.id]).toEqual([KONFIG.relays[0]]);
  });

  it('fragt keinen etag ab, wenn der Artikel kein Bild hat', async () => {
    const ohneBild = {
      ...ARTIKEL,
      tags: ARTIKEL.tags.filter((/** @type {string[]} */ t) => t[0] !== 'image')
    };
    const etagHolen = vi.fn();

    const ergebnis = await beitragLaden({
      adresse: ADRESSE,
      konfig: KONFIG,
      holen: async (/** @type {string} */ url, /** @type {Record<string, unknown>} */ filter) =>
        /** @type {number[]} */ (filter.kinds).includes(30023)
          ? { events: url === KONFIG.relays[0] ? [ohneBild] : [], erreicht: true }
          : { events: [], erreicht: true },
      etagHolen
    });

    expect(ergebnis.ok).toBe(true);
    expect(etagHolen).not.toHaveBeenCalled();
  });

  it('fragt den Lizenznachweis nicht ab, wenn kein x-Tag vorliegt', async () => {
    const ohneHash = {
      ...ARTIKEL,
      tags: ARTIKEL.tags.filter((/** @type {string[]} */ t) => t[0] !== 'x')
    };
    /** @type {Record<string, unknown>[]} */
    const filter = [];

    const ergebnis = await beitragLaden({
      adresse: ADRESSE,
      konfig: KONFIG,
      holen: async (/** @type {string} */ url, /** @type {Record<string, unknown>} */ f) => {
        filter.push(f);
        return /** @type {number[]} */ (f.kinds).includes(30023)
          ? { events: url === KONFIG.relays[0] ? [ohneHash] : [], erreicht: true }
          : { events: [], erreicht: true };
      },
      etagHolen: async () => undefined
    });

    expect(ergebnis.ok).toBe(true);
    // Ohne Hash keine Frage — das ist eine fehlende Angabe, kein fehlender
    // Nachweis (CLAUDE.md).
    expect(filter.some((f) => /** @type {number[]} */ (f.kinds).includes(1063))).toBe(false);
    expect(ergebnis.ok === true && ergebnis.lizenz.ok === false && ergebnis.lizenz.grund).toBe(
      'kein-x-tag'
    );
  });
});
