import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { echtesEvent } from './signatur.js';

/** @param {string} datei */
const fixture = (datei) =>
  JSON.parse(readFileSync(new URL(`../../../test/fixtures/${datei}`, import.meta.url), 'utf8'));

const ARTIKEL = fixture('artikel-30023-die-kraft-der-gemeinschaft.json')[0];

describe('echtesEvent (ADR-0036)', () => {
  it('nimmt ein echtes, signiertes Event an', () => {
    expect(echtesEvent(structuredClone(ARTIKEL))).toBe(true);
  });

  it('verwirft ein Event mit falscher Signatur', () => {
    expect(echtesEvent({ ...structuredClone(ARTIKEL), sig: '00'.repeat(64) })).toBe(false);
  });

  it('verwirft veränderten Inhalt bei unberührter id und sig — verifyEvent allein ließe ihn durch (ADR-0017)', () => {
    expect(echtesEvent({ ...structuredClone(ARTIKEL), content: 'MANIPULIERT' })).toBe(false);
  });

  it('verwirft ein Event mit fremdem pubkey unter derselben Signatur', () => {
    expect(echtesEvent({ ...structuredClone(ARTIKEL), pubkey: 'ab'.repeat(32) })).toBe(false);
  });

  it('prüft neu, auch wenn verifyEvent das Original schon als geprüft markiert hat', () => {
    const original = structuredClone(ARTIKEL);
    expect(echtesEvent(original)).toBe(true);
    // Eine Spread-Kopie trüge eine Markierung von verifyEvent mit.
    expect(echtesEvent({ ...original, sig: '00'.repeat(64) })).toBe(false);
  });

  it('wirft nicht bei unvollständigen Events, sondern verwirft sie', () => {
    expect(echtesEvent(/** @type {any} */ ({ id: 'x' }))).toBe(false);
    expect(echtesEvent(/** @type {any} */ (null))).toBe(false);
  });
});
