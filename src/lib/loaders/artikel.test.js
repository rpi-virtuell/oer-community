import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';

import { artikelLaden } from './artikel.js';

const artikelEvent = JSON.parse(
  readFileSync(
    new URL('../../../test/fixtures/artikel-30023-die-kraft-der-gemeinschaft.json', import.meta.url),
    'utf8'
  )
)[0];

/** @type {import('../naddr.js').Adresse} */
const adresse = {
  kind: artikelEvent.kind,
  author: artikelEvent.pubkey,
  d: artikelEvent.tags.find((/** @type {string[]} */ t) => t[0] === 'd')[1],
  relays: ['wss://relay.edufeed.org/']
};

describe('artikelLaden meldet keine Stoerung im Erfolgsfall', () => {
  it('gibt fehler: [], wenn ein Relay liefert und das andere nur nichts hat', async () => {
    const holen = vi.fn(async (/** @type {string} */ url) => ({
      events: url === 'wss://relay.edufeed.org/' ? [artikelEvent] : [],
      erreicht: true
    }));

    const ergebnis = await artikelLaden({
      adresse,
      relays: ['wss://relay.edufeed.org/', 'wss://zweit/'],
      holen
    });

    expect(ergebnis.artikel).not.toBeNull();
    expect(ergebnis.fehler).toEqual([]);
    expect(ergebnis.grund).toBeNull();
    expect(ergebnis.gefragteRelays).toEqual(['wss://relay.edufeed.org/', 'wss://zweit/']);
  });

  it('nennt einen Grund, wenn kein Relay erreichbar war', async () => {
    const holen = vi.fn(async () => ({ events: [], erreicht: false }));

    const ergebnis = await artikelLaden({ adresse, relays: [], holen });

    expect(ergebnis.artikel).toBeNull();
    expect(ergebnis.grund).toBe('kein-relay-erreichbar');
  });

  it('nennt bei leerer Relay-Liste einen eigenen Grund', async () => {
    const ergebnis = await artikelLaden({
      adresse: { ...adresse, relays: [] },
      relays: [],
      holen: vi.fn()
    });

    expect(ergebnis.artikel).toBeNull();
    expect(ergebnis.gefragteRelays).toEqual([]);
    expect(ergebnis.grund).toBe('keine-relays-konfiguriert');
  });
});
