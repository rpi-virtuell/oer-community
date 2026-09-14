import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { feedXml } from './feed.js';
import { xmlEscape } from './xml.js';
import { leererInhalt } from '../services/spiegel.js';
import { inhaltDerTestquelle } from '../../../test/fixtures/testquelle/laden.js';

const BESTAND = JSON.parse(readFileSync(new URL('../../../test/fixtures/foerbico-artikel-30023.json', import.meta.url), 'utf8'));

describe('feedXml', () => {
  it('RSS 2.0 mit den 20 neuesten Artikeln, kanonischen Links und Datum', () => {
    const { konfig } = inhaltDerTestquelle();
    const inhalt = { ...leererInhalt(), stand: /** @type {any} */ ({ zeitpunkt: '2026-09-14T10:00:00Z' }), artikel: BESTAND };
    const xml = feedXml({ konfig: { ...konfig, autor: BESTAND[0].pubkey }, inhalt, basisUrl: 'https://oer.community' });
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<rss version="2.0"');
    expect((xml.match(/<item>/g) ?? []).length).toBe(20);
    expect(xml).toContain('<link>https://oer.community/');
    expect(xml).toMatch(/<pubDate>[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4}/);
    expect(xml).toContain('<atom:link href="https://oer.community/feed.xml" rel="self"');
  });
  it('Seiten stehen nicht im Feed', () => {
    const { inhalt, konfig } = inhaltDerTestquelle();
    const xml = feedXml({ konfig, inhalt, basisUrl: 'https://t' });
    expect(xml).toContain('Artikel A');
    expect(xml).not.toContain('Impressum');
    expect(xml).not.toContain('Willkommen');
  });
  it('escapet Titel und Anriss', () => {
    expect(xmlEscape('Tom & Jerry <3 "x"')).toBe('Tom &amp; Jerry &lt;3 &quot;x&quot;');
  });
  it('& und < im Titel stehen im XML als Entität', () => {
    const { inhalt, konfig } = inhaltDerTestquelle();
    const artikel = inhalt.artikel.find((e) => e.tags.some((t) => t[0] === 'd' && t[1] === 'artikel-a'));
    if (artikel) artikel.tags = artikel.tags.map((t) => (t[0] === 'title' ? ['title', 'Tom & Jerry <3'] : t));
    const xml = feedXml({ konfig, inhalt, basisUrl: 'https://t' });
    expect(xml).toContain('<title>Tom &amp; Jerry &lt;3</title>');
    expect(xml).not.toContain('Tom & Jerry');
    expect(xml).not.toContain('<3');
  });

  it('leerer Spiegel: 503 mit Meldung', () => {
    const { konfig } = inhaltDerTestquelle();
    expect(() => feedXml({ konfig, inhalt: leererInhalt(), basisUrl: 'https://t' })).toThrow();
  });
});
