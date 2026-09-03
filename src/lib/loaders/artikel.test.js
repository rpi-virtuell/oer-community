import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

import { artikelLaden } from './artikel.js';

/**
 * Merkt sich, welche Relays gefragt wurden, und antwortet nie.
 *
 * @param {string[]} protokoll
 */
function beobachter(protokoll) {
  /** @type {typeof import('../services/relay.js').eventsHolen} */
  return async (relayUrl) => {
    protokoll.push(relayUrl);
    // Antwortet, liefert aber nichts — so ist das Ergebnis belastbar leer.
    return { events: [], erreicht: true };
  };
}

const KONFIGURIERT = ['wss://relay.edufeed.org/', 'wss://relay-rpi.edufeed.org/'];

describe('artikelLaden — Relay-Hinweise aus dem naddr', () => {
  it('fragt NUR die konfigurierten Relays, nie die aus dem naddr', async () => {
    /** @type {string[]} */
    const gefragt = [];
    await artikelLaden({
      adresse: {
        kind: 30023,
        author: 'a'.repeat(64),
        d: 'egal',
        // Ein Fremder kann hier alles hineinschreiben:
        relays: ['wss://boeser-server.example/', 'wss://127.0.0.1:9999/']
      },
      relays: KONFIGURIERT,
      holen: beobachter(gefragt)
    });

    expect(gefragt).toEqual(KONFIGURIERT);
    expect(gefragt).not.toContain('wss://boeser-server.example/');
    expect(gefragt).not.toContain('wss://127.0.0.1:9999/');
  });

  it('fragt die konfigurierten Relays auch ohne Hinweise im naddr', async () => {
    /** @type {string[]} */
    const gefragt = [];
    await artikelLaden({
      adresse: { kind: 30023, author: 'a'.repeat(64), d: 'egal', relays: [] },
      relays: KONFIGURIERT,
      holen: beobachter(gefragt)
    });
    expect(gefragt).toEqual(KONFIGURIERT);
  });
});

describe('artikelLaden gibt das rohe Event und seine Herkunft mit heraus', () => {
  const ARTIKEL_EVENT = JSON.parse(
    readFileSync(
      new URL(
        '../../../test/fixtures/artikel-30023-die-kraft-der-gemeinschaft.json',
        import.meta.url
      ),
      'utf8'
    )
  )[0];

  it('liefert das unveraenderte Event neben dem aufbereiteten Artikel', async () => {
    /** @type {typeof import('../services/relay.js').eventsHolen} */
    const holen = async () => ({ events: [ARTIKEL_EVENT], erreicht: true });

    const ergebnis = await artikelLaden({
      adresse: { kind: 30023, author: ARTIKEL_EVENT.pubkey, d: 'egal', relays: [] },
      relays: ['wss://relay.edufeed.org/'],
      holen
    });

    expect(ergebnis.event?.id).toBe(ARTIKEL_EVENT.id);
    expect(ergebnis.event?.sig).toBe(ARTIKEL_EVENT.sig);
    expect(ergebnis.quellen[ARTIKEL_EVENT.id]).toEqual(['wss://relay.edufeed.org/']);
  });

  it('liefert event: null, wenn nichts gefunden wurde', async () => {
    /** @type {typeof import('../services/relay.js').eventsHolen} */
    const holen = async () => ({ events: [], erreicht: true });

    const ergebnis = await artikelLaden({
      adresse: { kind: 30023, author: 'a'.repeat(64), d: 'fehlt', relays: [] },
      relays: ['wss://relay.edufeed.org/'],
      holen
    });

    expect(ergebnis.event).toBeNull();
    expect(ergebnis.quellen).toEqual({});
  });
});
