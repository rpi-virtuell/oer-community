import { describe, expect, it } from 'vitest';
import { sitemapXml } from './sitemap.js';
import { leererInhalt } from '../services/spiegel.js';
import { inhaltDerTestquelle } from '../../../test/fixtures/testquelle/laden.js';

describe('sitemapXml', () => {
  it('listet Artikel und Seiten je einmal, die Startseite als /', () => {
    const { inhalt, konfig } = inhaltDerTestquelle();
    const xml = sitemapXml({ konfig, inhalt, basisUrl: 'https://t' });
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('<loc>https://t/</loc>');
    expect(xml).not.toContain('<loc>https://t/startseite</loc>');
    // Die englische Startseite wohnt unter /en (ADR-0033) — ihr d gehört
    // nicht in die Sitemap, es leitete nur weiter.
    expect((xml.match(/<loc>https:\/\/t\/en<\/loc>/g) ?? []).length).toBe(1);
    expect(xml).not.toContain('<loc>https://t/en/startseite</loc>');
    expect(xml).toContain('<loc>https://t/impressum</loc>');
    expect(xml).toContain('<loc>https://t/en/our-team</loc>');
    expect(xml).toContain('<loc>https://t/artikel-a</loc>');
    expect(xml).toContain('<loc>https://t/blog</loc>');
    expect((xml.match(/<url>/g) ?? []).length).toBe(6 + 2); // 6 Beiträge der Testquelle + blog + themen
    expect(xml).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
  });
  it('ein Beitrag auf einem festen Segment kommt nicht zweimal vor', () => {
    const { inhalt, konfig } = inhaltDerTestquelle();
    const vorlage = inhalt.artikel[0];
    inhalt.artikel.push({
      ...vorlage,
      id: 'blog'.padEnd(64, '0'),
      tags: [...vorlage.tags.filter((t) => t[0] !== 'd'), ['d', 'blog']]
    });
    const xml = sitemapXml({ konfig, inhalt, basisUrl: 'https://t' });
    expect((xml.match(/<loc>https:\/\/t\/blog<\/loc>/g) ?? []).length).toBe(1);
  });

  it('ein percent-kodiertes d wird nicht doppelt kodiert', () => {
    const { inhalt, konfig } = inhaltDerTestquelle();
    const vorlage = inhalt.artikel[0];
    inhalt.artikel.push({
      ...vorlage,
      id: 'umlaut'.padEnd(64, '0'),
      tags: [...vorlage.tags.filter((t) => t[0] !== 'd'), ['d', 'oer-visuelle-qualit%C3%A4t']]
    });
    const xml = sitemapXml({ konfig, inhalt, basisUrl: 'https://t' });
    expect((xml.match(/qualit%C3%A4t/g) ?? []).length).toBe(1);
    expect(xml).toContain('<loc>https://t/oer-visuelle-qualit%C3%A4t</loc>');
    expect(xml).not.toContain('qualit%25C3%25A4t');
  });

  it('nennt /termine, sobald Termine da sind — sonst gar nicht (ADR-0034)', () => {
    const mit = inhaltDerTestquelle({ mitTerminen: true });
    const xml = sitemapXml({ ...mit, basisUrl: 'https://t' });
    expect((xml.match(/<loc>https:\/\/t\/termine<\/loc>/g) ?? []).length).toBe(1);
    const ohne = inhaltDerTestquelle();
    expect(sitemapXml({ ...ohne, basisUrl: 'https://t' })).not.toContain('<loc>https://t/termine</loc>');
  });

  it('leerer Spiegel: 503', () => {
    expect(() =>
      sitemapXml({ konfig: inhaltDerTestquelle().konfig, inhalt: leererInhalt(), basisUrl: 'https://t' })
    ).toThrow();
  });
});
