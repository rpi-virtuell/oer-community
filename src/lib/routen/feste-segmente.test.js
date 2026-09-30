import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { FESTE_SEGMENTE } from './feste-segmente.js';
import { dNormalisieren } from '../models/artikel.js';

/** @type {any[]} */
const BESTAND = JSON.parse(
  readFileSync(new URL('../../../test/fixtures/foerbico-artikel-30023.json', import.meta.url), 'utf8')
);

describe('Feste Segmente der ersten Pfadebene (ADR-0029)', () => {
  it('hält die Liste fest', () => {
    expect([...FESTE_SEGMENTE]).toEqual(['blog', 'themen', 'termine', 'profilbild', 'en', 'feed.xml', 'sitemap.xml']);
  });

  it('kein d des Bestands kollidiert mit einem festen Segment', () => {
    const kollidiert = BESTAND.map((e) =>
      dNormalisieren(e.tags.find((/** @type {string[]} */ t) => t[0] === 'd')?.[1] ?? '')
    ).filter((/** @type {string} */ d) => FESTE_SEGMENTE.includes(d));
    expect(kollidiert).toEqual([]);
  });
});
