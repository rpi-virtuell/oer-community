import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { verifyEvent } from 'nostr-tools/pure';

const lesen = (/** @type {string} */ f) => JSON.parse(readFileSync(new URL(`./${f}`, import.meta.url), 'utf8'));

describe('Fixtures der Testquelle', () => {
  const events = lesen('events.json');
  const { pubkey } = lesen('schluessel.json');
  it('sind gültig signiert und stammen alle vom Testschlüssel', () => {
    expect(events.length).toBe(9);
    for (const e of events) {
      expect(verifyEvent(e)).toBe(true);
      expect(e.pubkey).toBe(pubkey);
    }
  });
  it('enthalten die Kinds, die Stufe 2 braucht', () => {
    expect(events.map((/** @type {any} */ e) => e.kind).sort((/** @type {number} */ a, /** @type {number} */ b) => a - b)).toEqual([0, 30004, 30004, 30023, 30023, 30023, 30023, 30023, 30023]);
  });
});
