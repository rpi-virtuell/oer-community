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

  it('entfernt absolute Bilder ebenfalls — sie haben keinen Nachweis', () => {
    // Frueher stand hier die Erwartung, absolute Bilder zu BEHALTEN.
    // Das war eine Luecke: Zu einem Bild im Fliesstext gibt es kein
    // x-Tag, also keinen aufloesbaren Nachweis (ADR-0013/-0015).
    const { html, entfernteBilder } = inhaltAufbereiten(
      '![Alt](https://example.org/b.png)'
    );
    expect(entfernteBilder).toEqual(['https://example.org/b.png']);
    expect(html).not.toContain('<img');
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

describe('inhaltAufbereiten — Bilder im Fließtext haben keinen Nachweis', () => {
  it('entfernt auch absolute Bilder, denn zu ihnen gibt es kein x-Tag', () => {
    const { html, entfernteBilder } = inhaltAufbereiten(
      'Davor\n\n![Alt](https://open-educational-resources.de/bild.png)\n\nDanach'
    );
    expect(entfernteBilder).toEqual([
      'https://open-educational-resources.de/bild.png'
    ]);
    expect(html).not.toContain('<img');
    expect(html).toContain('Davor');
    expect(html).toContain('Danach');
  });

  it('entfernt Bilder auch von Hosts mit ungeklärter Lizenz', () => {
    const { html, entfernteBilder } = inhaltAufbereiten(
      '![](https://cdn.midjourney.com/x.png)\n\n![](https://upload.wikimedia.org/y.jpg)'
    );
    expect(entfernteBilder).toHaveLength(2);
    expect(html).not.toContain('<img');
  });

  it('behält Links, entfernt nur Bilder', () => {
    const { html, entfernteBilder } = inhaltAufbereiten(
      '[Text](https://example.org) und ![Bild](https://example.org/b.png)'
    );
    expect(entfernteBilder).toEqual(['https://example.org/b.png']);
    expect(html).toContain('href="https://example.org"');
    expect(html).not.toContain('<img');
  });
});
