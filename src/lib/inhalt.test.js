import { describe, expect, it } from 'vitest';
import { inhaltAufbereiten } from './inhalt.js';

describe('inhaltAufbereiten', () => {
  it('entfernt relative Bilder und zaehlt sie', () => {
    const { html, entfernteBilder } = inhaltAufbereiten(
      'Davor\n\n![](nosTr-schrein.jpg)\n\nDanach'
    );
    expect(entfernteBilder).toEqual(['nosTr-schrein.jpg']);
    expect(html).not.toContain('nosTr-schrein.jpg');
    expect(html).toContain('Davor');
    expect(html).toContain('Danach');
  });

  it('behaelt absolute Bilder', () => {
    const { html, entfernteBilder } = inhaltAufbereiten(
      '![Alt](https://example.org/b.png)'
    );
    expect(entfernteBilder).toEqual([]);
    expect(html).toContain('https://example.org/b.png');
  });

  it('behaelt Blockquotes — bei FOERBICO sind es echte Zitate', () => {
    const { html } = inhaltAufbereiten('> Ein Zitat');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('Ein Zitat');
  });

  it('rendert Ueberschriften und Links', () => {
    const { html } = inhaltAufbereiten('## Titel\n\n[Text](https://example.org)');
    expect(html).toContain('<h2');
    expect(html).toContain('href="https://example.org"');
  });

  it('vertraegt leeren Inhalt', () => {
    expect(inhaltAufbereiten('')).toEqual({ html: '', entfernteBilder: [] });
  });

  it('entfernt mehrere relative Bilder', () => {
    const { entfernteBilder } = inhaltAufbereiten('![](a.jpg)\n\n![](b/c.png)');
    expect(entfernteBilder).toEqual(['a.jpg', 'b/c.png']);
  });
});
