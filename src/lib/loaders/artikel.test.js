import { describe, expect, it } from 'vitest';
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
