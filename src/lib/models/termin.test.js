import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { naddrFuerTermin, terminAusEvent } from './termin.js';

/** @type {any} */
const TAGUNG = JSON.parse(readFileSync(new URL('../../../test/fixtures/termine-31922-community.json', import.meta.url), 'utf8'))[0];

describe('terminAusEvent (ADR-0034, NIP-52)', () => {
  it('liest die Abschlusstagung: ganztägig, 2.–3. Februar 2027, Frankfurt, Community', () => {
    const t = terminAusEvent(TAGUNG);
    expect(t.kind).toBe(31922);
    expect(t.ganztaegig).toBe(true);
    expect(t.titel).toContain('FOERBICO Tagung Frankfurt');
    expect(t.start.toISOString().slice(0, 10)).toBe('2027-02-02');
    expect(t.ende?.toISOString().slice(0, 10)).toBe('2027-02-03');
    expect(t.orte).toEqual(['Frankfurt, Hesse, Germany']);
    expect(t.community).toBe('ae6199bb435d70a0ecce61324ac80e7c24dedf2b0680cbd3e94983e7557746a2');
    expect(t.bildUrl).toMatch(/^https:\/\/assets\.uni-frankfurt\.de\//);
    expect(t.bildHash).toBeNull();
    expect(t.autor).toBe(TAGUNG.pubkey);
    expect(t.d).toBe('event-1784115786770-514zxlkhy');
  });
  it('zeitgebunden: start/end als Unix-Sekunden, nicht ganztägig', () => {
    const ev = /** @type {any} */ ({ ...TAGUNG, kind: 31923, tags: [['d', 'x'], ['title', 'T'], ['start', '1790000000'], ['end', '1790003600']] });
    const t = terminAusEvent(ev);
    expect(t.ganztaegig).toBe(false);
    expect(t.start.getTime()).toBe(1790000000 * 1000);
    expect(t.ende?.getTime()).toBe(1790003600 * 1000);
    expect(t.orte).toEqual([]);
    expect(t.community).toBeNull();
  });
  it('naddr für den Link in die edufeed-app', () => {
    const n = naddrFuerTermin(terminAusEvent(TAGUNG), ['wss://relay.edufeed.org/']);
    expect(n).toMatch(/^naddr1/);
  });
});
