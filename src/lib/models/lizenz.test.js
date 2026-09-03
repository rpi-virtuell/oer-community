import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GRUND_TEXT, lizenzPruefen, nachweisAusEvents } from './lizenz.js';

const HASH = 'a2a54ea54f386ba0abceb4d28498c4c5c0b66da153bdec04c36bf40a6c32bf5b';
const BILD = `https://blossom.edufeed.org/${HASH}.jpeg`;

const nachweisEvents = JSON.parse(
  readFileSync(
    new URL('../../../test/fixtures/lizenz-1063-nostr-schrein.json', import.meta.url),
    'utf8'
  )
);

/** @param {string[][]} tags */
function event(tags, created_at = 1000, id = 'a'.repeat(64)) {
  return { id, pubkey: 'b'.repeat(64), created_at, kind: 1063, tags, content: '', sig: '' };
}

describe('nachweisAusEvents', () => {
  it('liest den echten Nachweis', () => {
    const n = nachweisAusEvents(nachweisEvents);
    expect(n?.credit).toBe('Comenius-Institut');
    expect(n?.license).toBe('https://creativecommons.org/publicdomain/zero/1.0/');
    expect(n?.titel).toBe('nosTr-schrein');
    expect(n?.hash).toBe(HASH);
  });

  it('liefert null bei leerer Liste', () => {
    expect(nachweisAusEvents([])).toBe(null);
  });

  it('verwirft einen Nachweis ohne credit', () => {
    expect(
      nachweisAusEvents([
        event([['x', HASH], ['url', BILD], ['license', 'https://cc/0']])
      ])
    ).toBe(null);
  });

  it('verwirft einen Nachweis ohne license', () => {
    expect(
      nachweisAusEvents([event([['x', HASH], ['url', BILD], ['credit', 'Wer']])])
    ).toBe(null);
  });

  it('nimmt bei mehreren das neueste created_at', () => {
    const alt = event([['x', HASH], ['url', BILD], ['license', 'L1'], ['credit', 'alt']], 100);
    const neu = event([['x', HASH], ['url', BILD], ['license', 'L2'], ['credit', 'neu']], 200, 'd'.repeat(64));
    expect(nachweisAusEvents([alt, neu])?.credit).toBe('neu');
    expect(nachweisAusEvents([neu, alt])?.credit).toBe('neu');
  });

  it('entscheidet Gleichstand nach id', () => {
    const a = event([['x', HASH], ['url', BILD], ['license', 'L'], ['credit', 'A']], 100, 'a'.repeat(64));
    const b = event([['x', HASH], ['url', BILD], ['license', 'L'], ['credit', 'B']], 100, 'f'.repeat(64));
    expect(nachweisAusEvents([b, a])?.credit).toBe('A');
  });
});

describe('lizenzPruefen', () => {
  const nachweis = nachweisAusEvents(nachweisEvents);
  if (!nachweis) throw new Error('Fixture liefert keinen Nachweis');

  it('laesst den Referenzfall durch', () => {
    const e = lizenzPruefen({ bildUrl: BILD, bildHash: HASH, nachweis, etag: `"${HASH}"` });
    expect(e.ok).toBe(true);
  });

  it('kommt ohne etag durch (Schritt 5 entfaellt)', () => {
    expect(lizenzPruefen({ bildUrl: BILD, bildHash: HASH, nachweis }).ok).toBe(true);
  });

  it('Schritt 1: relativer Pfad', () => {
    const e = lizenzPruefen({ bildUrl: 'nosTr-schrein.jpg', bildHash: HASH, nachweis });
    expect(e).toEqual({ ok: false, grund: 'relativ' });
  });

  it('kein Bild', () => {
    expect(lizenzPruefen({ bildUrl: null, bildHash: null, nachweis: null })).toEqual({
      ok: false,
      grund: 'kein-bild'
    });
  });

  it('Schritt 2: kein x-Tag', () => {
    expect(lizenzPruefen({ bildUrl: BILD, bildHash: null, nachweis })).toEqual({
      ok: false,
      grund: 'kein-x-tag'
    });
  });

  it('Schritt 3: kein Nachweis', () => {
    expect(lizenzPruefen({ bildUrl: BILD, bildHash: HASH, nachweis: null })).toEqual({
      ok: false,
      grund: 'kein-nachweis'
    });
  });

  it('Schritt 4: Nachweis gehoert zu einem anderen Hash', () => {
    const fremd = { ...nachweis, hash: 'f'.repeat(64) };
    expect(lizenzPruefen({ bildUrl: BILD, bildHash: HASH, nachweis: fremd })).toEqual({
      ok: false,
      grund: 'pflichtfeld-fehlt'
    });
  });

  it('Schritt 5: etag widerspricht', () => {
    expect(
      lizenzPruefen({ bildUrl: BILD, bildHash: HASH, nachweis, etag: '"deadbeef"' })
    ).toEqual({ ok: false, grund: 'hash-widerspruch' });
  });
});

describe('GRUND_TEXT', () => {
  it('nennt zu jedem der sechs Gruende einen Text', () => {
    /** @type {import('./lizenz.js').Grund[]} */
    const gruende = [
      'kein-bild',
      'relativ',
      'kein-x-tag',
      'kein-nachweis',
      'pflichtfeld-fehlt',
      'hash-widerspruch'
    ];
    expect(Object.keys(GRUND_TEXT).sort()).toEqual([...gruende].sort());
    for (const grund of gruende) {
      expect(GRUND_TEXT[grund].length).toBeGreaterThan(0);
    }
  });
});
