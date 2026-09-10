import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GRUND_TEXT, hashAusUrl, lizenzPruefen, nachweisAusEvents } from './lizenz.js';

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

  it('nimmt einen Nachweis ohne credit an (ADR-0022)', () => {
    const n = nachweisAusEvents([
      event([['x', HASH], ['url', BILD], ['license', 'https://cc/0']])
    ]);
    expect(n?.license).toBe('https://cc/0');
    expect(n?.credit).toBe(null);
  });

  it('liest das ai-Tag, laesst nur generated und modified gelten (ADR-0025)', () => {
    const mit = (wert) =>
      nachweisAusEvents([event([['x', HASH], ['url', BILD], ['license', 'L'], ['ai', wert]])]);
    expect(mit('generated')?.ki).toBe('generated');
    expect(mit('modified')?.ki).toBe('modified');
    expect(mit('ja')?.ki).toBe(null);
    expect(nachweisAusEvents([event([['x', HASH], ['url', BILD], ['license', 'L']])])?.ki).toBe(null);
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

describe('Fremdfall Caesar-Scheibe (Fixture)', () => {
  const caesarLizenz = JSON.parse(
    readFileSync(
      new URL('../../../test/fixtures/lizenz-1063-caesar-scheibe.json', import.meta.url),
      'utf8'
    )
  );
  const caesarAmb = JSON.parse(
    readFileSync(
      new URL('../../../test/fixtures/amb-30142-caesar-scheibe.json', import.meta.url),
      'utf8'
    )
  );
  const CAESAR_HASH = '5b8a701b9e91d746bc39027b042e5d4d8dda76ec5ed92cd4cfc141f85b80f471';

  it('löst einen Nachweis mit fremdem Autor und Person als credit auf', () => {
    const n = nachweisAusEvents(caesarLizenz);
    expect(n?.credit).toBe('Jörg Lohrer');
    expect(n?.titel).toBe('Vorschaubild Caesar-Scheibe');
    expect(n?.hash).toBe(CAESAR_HASH);
  });

  it('läuft durch die ganze Kette', () => {
    const nachweis = nachweisAusEvents(caesarLizenz);
    const e = lizenzPruefen({
      bildUrl: `https://blossom.edufeed.org/${CAESAR_HASH}.jpeg`,
      bildHash: CAESAR_HASH,
      nachweis,
      etag: `"${CAESAR_HASH}"`
    });
    expect(e.ok).toBe(true);
  });

  it('sortiert Nicht-1063 am selben Hash aus', () => {
    // Am selben #x hängt auch ein kind:30142 — und es ist das NEUERE Event
    // (created_at 1788408644 gegen 1788408536). Genau deshalb ist der Fall
    // aussagekräftig: Würde nur nach created_at sortiert, gewänne das 30142.
    // Es trägt kein license-Tag und wird schon davor verworfen.
    expect(caesarAmb[0].created_at).toBeGreaterThan(caesarLizenz[0].created_at);
    const n = nachweisAusEvents([...caesarAmb, ...caesarLizenz]);
    expect(n?.id).toBe(caesarLizenz[0].id);
  });
});

describe('Zusatzfelder nach bildattribution.md', () => {
  it('liest alt, authorUrl und modification', () => {
    const n = nachweisAusEvents([
      event([
        ['x', HASH], ['url', BILD], ['license', 'https://cc/by'],
        ['credit', 'John Sankey'],
        ['alt', 'Rhabarberpflanze im Beet'],
        ['authorUrl', 'https://www.inaturalist.org/users/2831535'],
        ['modification', 'beschnitten']
      ])
    ]);
    expect(n?.alt).toBe('Rhabarberpflanze im Beet');
    expect(n?.urheberUrl).toBe('https://www.inaturalist.org/users/2831535');
    expect(n?.bearbeitung).toBe('beschnitten');
  });

  it('gibt null zurueck, wenn die Tags fehlen — der Referenzfall hat keins davon', () => {
    const n = nachweisAusEvents(nachweisEvents);
    expect(n?.alt).toBe(null);
    expect(n?.urheberUrl).toBe(null);
    expect(n?.bearbeitung).toBe(null);
  });
});

describe('hashAusUrl — der Zeiger im Blossom-Pfad (ADR-0023)', () => {
  it('liest den Hash aus einer Blossom-URL, mit und ohne Endung', () => {
    expect(hashAusUrl(`https://blossom.edufeed.org/${HASH}.jpeg`)).toBe(HASH);
    expect(hashAusUrl(`https://blossom.edufeed.org/${HASH}`)).toBe(HASH);
    expect(hashAusUrl(`https://b.example/pfad/${HASH}.png`)).toBe(HASH);
  });

  it('gibt null fuer URLs ohne Hash und fuer relative Pfade', () => {
    expect(hashAusUrl('https://oer.community/x/nosTr-schrein.jpg')).toBe(null);
    expect(hashAusUrl('nosTr-schrein.jpg')).toBe(null);
    expect(hashAusUrl(`https://b.example/${'a'.repeat(63)}.jpg`)).toBe(null);
  });

  it('normalisiert auf Kleinbuchstaben', () => {
    expect(hashAusUrl(`https://b.example/${HASH.toUpperCase()}.jpg`)).toBe(HASH);
  });
});
