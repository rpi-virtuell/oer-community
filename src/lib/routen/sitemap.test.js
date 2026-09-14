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
    expect(xml).toContain('<loc>https://t/impressum</loc>');
    expect(xml).toContain('<loc>https://t/en/our-team</loc>');
    expect(xml).toContain('<loc>https://t/artikel-a</loc>');
    expect(xml).toContain('<loc>https://t/blog</loc>');
    expect((xml.match(/<url>/g) ?? []).length).toBe(5 + 2); // 5 Beiträge der Testquelle + blog + themen
    expect(xml).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
  });
  it('leerer Spiegel: 503', () => {
    expect(() =>
      sitemapXml({ konfig: inhaltDerTestquelle().konfig, inhalt: leererInhalt(), basisUrl: 'https://t' })
    ).toThrow();
  });
});
