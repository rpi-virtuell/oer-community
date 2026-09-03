import { describe, expect, it, vi, afterEach } from 'vitest';

import { eventsVonAllen, ZUSAMMENFUEHREN_OHNE_RELAYS } from './relay.js';

/**
 * Baut ein Minimal-Event.
 *
 * @param {string} id
 * @param {number} [created_at]
 * @returns {import('./relay.js').Event}
 */
function event(id, created_at = 1) {
  return {
    id,
    pubkey: 'a'.repeat(64),
    created_at,
    kind: 1063,
    tags: [],
    content: '',
    sig: 'b'.repeat(128)
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('eventsVonAllen trennt "nicht erreichbar" von "hat nichts"', () => {
  it('meldet kein Relay als Stoerung, wenn es antwortet und nur nichts besitzt', async () => {
    const holen = vi.fn(async (url) => ({
      events: url === 'wss://a/' ? [event('e1')] : [],
      erreicht: true
    }));

    const ergebnis = await eventsVonAllen(['wss://a/', 'wss://b/'], {}, { holen });

    expect(ergebnis.events).toHaveLength(1);
    expect(ergebnis.fehler).toEqual([]);
    expect(ergebnis.ohneTreffer).toEqual(['wss://b/']);
    expect(ergebnis.gefragt).toEqual(['wss://a/', 'wss://b/']);
  });

  it('meldet nur das Relay als Stoerung, das nicht erreichbar war', async () => {
    const holen = vi.fn(async (url) => ({
      events: [],
      erreicht: url !== 'wss://kaputt/'
    }));

    const ergebnis = await eventsVonAllen(['wss://gut/', 'wss://kaputt/'], {}, { holen });

    expect(ergebnis.fehler).toEqual(['wss://kaputt/']);
    expect(ergebnis.ohneTreffer).toEqual(['wss://gut/']);
  });

  it('nennt bei leerer Relay-Liste einen eigenen Grund statt zu schweigen', async () => {
    const holen = vi.fn();

    const ergebnis = await eventsVonAllen([], {}, { holen });

    expect(holen).not.toHaveBeenCalled();
    expect(ergebnis.events).toEqual([]);
    expect(ergebnis.gefragt).toEqual([]);
    expect(ergebnis.grund).toBe(ZUSAMMENFUEHREN_OHNE_RELAYS);
    expect(ergebnis.grund).toBeTruthy();
  });

  it('nennt keinen Grund, solange ein Relay erreicht wurde', async () => {
    const holen = vi.fn(async () => ({ events: [event('e1')], erreicht: true }));

    const ergebnis = await eventsVonAllen(['wss://a/'], {}, { holen });

    expect(ergebnis.grund).toBeNull();
  });

  it('nennt einen Grund, wenn kein einziges Relay erreichbar war', async () => {
    const holen = vi.fn(async () => ({ events: [], erreicht: false }));

    const ergebnis = await eventsVonAllen(['wss://a/', 'wss://b/'], {}, { holen });

    expect(ergebnis.fehler).toEqual(['wss://a/', 'wss://b/']);
    expect(ergebnis.grund).toBe('kein-relay-erreichbar');
  });

  it('dedupliziert nach id ueber Relays hinweg', async () => {
    const holen = vi.fn(async () => ({ events: [event('gleich')], erreicht: true }));

    const ergebnis = await eventsVonAllen(['wss://a/', 'wss://b/'], {}, { holen });

    expect(ergebnis.events).toHaveLength(1);
  });
});

describe('eventsVonAllen haelt fest, welches Relay ein Event lieferte', () => {
  it('nennt zu jeder Event-id die Relays, die es hatten', async () => {
    const holen = vi.fn(async (/** @type {string} */ url) => ({
      events: url === 'wss://artikel/' ? [event('a1')] : [event('n1')],
      erreicht: true
    }));

    const ergebnis = await eventsVonAllen(
      ['wss://artikel/', 'wss://nachweis/'],
      {},
      { holen }
    );

    expect(ergebnis.quellen).toEqual({
      a1: ['wss://artikel/'],
      n1: ['wss://nachweis/']
    });
  });

  it('nennt bei einem Event auf mehreren Relays alle, nicht nur das letzte', async () => {
    const holen = vi.fn(async () => ({ events: [event('gleich')], erreicht: true }));

    const ergebnis = await eventsVonAllen(['wss://a/', 'wss://b/'], {}, { holen });

    expect(ergebnis.events).toHaveLength(1);
    expect(ergebnis.quellen.gleich).toEqual(['wss://a/', 'wss://b/']);
  });

  it('liefert bei leerer Relay-Liste ein leeres Verzeichnis, nicht undefined', async () => {
    const ergebnis = await eventsVonAllen([], {}, { holen: vi.fn() });

    expect(ergebnis.quellen).toEqual({});
  });
});
