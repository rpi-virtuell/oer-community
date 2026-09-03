import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';

import { lizenzLaden } from './lizenz.js';

const nachweisEvent = JSON.parse(
  readFileSync(
    new URL('../../../test/fixtures/lizenz-1063-nostr-schrein.json', import.meta.url),
    'utf8'
  )
)[0];

const HASH = nachweisEvent.tags.find((/** @type {string[]} */ t) => t[0] === 'x')[1];

describe('lizenzLaden meldet keine Stoerung im Erfolgsfall', () => {
  it('gibt fehler: [], wenn ein Relay den Nachweis hat und das andere nur nichts', async () => {
    const holen = vi.fn(async (/** @type {string} */ url) => ({
      events: url === 'wss://rpi/' ? [nachweisEvent] : [],
      erreicht: true
    }));

    const ergebnis = await lizenzLaden({
      hash: HASH,
      relays: ['wss://relay.edufeed.org/', 'wss://rpi/'],
      holen
    });

    expect(ergebnis.nachweis?.credit).toBe(nachweisEvent.tags.find((/** @type {string[]} */ t) => t[0] === 'credit')[1]);
    expect(ergebnis.fehler).toEqual([]);
    expect(ergebnis.grund).toBeNull();
  });

  it('nennt bei leerer Relay-Liste einen Grund, statt stumm null zu liefern', async () => {
    const ergebnis = await lizenzLaden({ hash: HASH, relays: [], holen: vi.fn() });

    expect(ergebnis.nachweis).toBeNull();
    expect(ergebnis.fehler).toEqual([]);
    expect(ergebnis.grund).toBe('keine-relays-konfiguriert');
  });

  it('nennt einen Grund, wenn kein Relay erreichbar war', async () => {
    const holen = vi.fn(async () => ({ events: [], erreicht: false }));

    const ergebnis = await lizenzLaden({
      hash: HASH,
      relays: ['wss://kaputt/'],
      holen
    });

    expect(ergebnis.nachweis).toBeNull();
    expect(ergebnis.fehler).toEqual(['wss://kaputt/']);
    expect(ergebnis.grund).toBe('kein-relay-erreichbar');
  });
});
