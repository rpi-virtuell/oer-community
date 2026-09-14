import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { etagAusSpiegel, nachweiseAusSpiegel } from './lizenz.js';
import { leererInhalt } from '../services/spiegel.js';

const fixture = (/** @type {string} */ f) => JSON.parse(readFileSync(new URL(`../../../test/fixtures/${f}`, import.meta.url), 'utf8'));
const NACHWEIS = fixture('lizenz-1063-nostr-schrein.json')[0];
const CAESAR = fixture('lizenz-1063-caesar-scheibe.json')[0];
const HASH = NACHWEIS.tags.find((/** @type {string[]} */ t) => t[0] === 'x')[1];

const inhalt = { ...leererInhalt(), nachweise: [NACHWEIS, CAESAR], etags: { 'https://blossom.edufeed.org/x.jpg': '"e"' } };

describe('nachweiseAusSpiegel', () => {
  it('gibt nur die Kandidaten zum Hash zurück und wählt daraus', () => {
    const { nachweis, events } = nachweiseAusSpiegel(inhalt, HASH);
    expect(events.map((e) => e.id)).toEqual([NACHWEIS.id]);
    expect(nachweis?.hash).toBe(HASH);
  });
  it('kein Kandidat: null und leere Liste', () => {
    expect(nachweiseAusSpiegel(inhalt, 'f'.repeat(64))).toEqual({ nachweis: null, events: [] });
  });
});

describe('etagAusSpiegel', () => {
  it('liefert den gemerkten etag oder undefined', () => {
    expect(etagAusSpiegel(inhalt, 'https://blossom.edufeed.org/x.jpg')).toBe('"e"');
    expect(etagAusSpiegel(inhalt, 'https://blossom.edufeed.org/y.jpg')).toBeUndefined();
    expect(etagAusSpiegel(inhalt, null)).toBeUndefined();
  });
});
