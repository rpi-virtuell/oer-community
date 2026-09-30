import { describe, expect, it } from 'vitest';
import { inhaltAufbereiten } from './inhalt.js';

const HASH = 'a2a54ea54f386ba0abceb4d28498c4c5c0b66da153bdec04c36bf40a6c32bf5b';
const BLOSSOM = `https://blossom.edufeed.org/${HASH}.jpeg`;
const CC0 = 'https://creativecommons.org/publicdomain/zero/1.0/';

/** Nur die HTML-Teile, zusammengefügt — für Tests, die den Text prüfen. */
function htmlVon(/** @type {ReturnType<typeof inhaltAufbereiten>} */ r) {
  return r.teile.map((t) => (t.art === 'html' ? t.html : '')).join('');
}

/** Nur die Bild-Teile. */
function bilderVon(/** @type {ReturnType<typeof inhaltAufbereiten>} */ r) {
  return r.teile.filter((t) => t.art === 'bild');
}

describe('inhaltAufbereiten — Bilder ohne Hash werden entfernt (ADR-0015)', () => {
  it('entfernt relative Bilder und zaehlt sie', () => {
    const r = inhaltAufbereiten('Davor\n\n![](nosTr-schrein.jpg)\n\nDanach');
    expect(r.entfernteBilder).toEqual(['nosTr-schrein.jpg']);
    expect(bilderVon(r)).toEqual([]);
    expect(htmlVon(r)).not.toContain('nosTr-schrein.jpg');
    expect(htmlVon(r)).toContain('Davor');
    expect(htmlVon(r)).toContain('Danach');
  });

  it('entfernt absolute Bilder ohne Hash — kein Zeiger, kein Nachweis', () => {
    const r = inhaltAufbereiten('![Alt](https://example.org/b.png)');
    expect(r.entfernteBilder).toEqual(['https://example.org/b.png']);
    expect(bilderVon(r)).toEqual([]);
    expect(htmlVon(r)).not.toContain('<img');
  });

  it('entfernt Bilder auch von Hosts mit ungeklärter Lizenz', () => {
    const r = inhaltAufbereiten(
      '![](https://cdn.midjourney.com/x.png)\n\n![](https://upload.wikimedia.org/y.jpg)'
    );
    expect(r.entfernteBilder).toHaveLength(2);
    expect(bilderVon(r)).toEqual([]);
  });

  it('behält Links, entfernt nur Bilder', () => {
    const r = inhaltAufbereiten(
      '[Text](https://example.org) und ![Bild](https://example.org/b.png)'
    );
    expect(r.entfernteBilder).toEqual(['https://example.org/b.png']);
    expect(htmlVon(r)).toContain('href="https://example.org"');
    expect(htmlVon(r)).not.toContain('<img');
  });

  it('entfernt mehrere relative Bilder', () => {
    const r = inhaltAufbereiten('![](a.jpg)\n\n![](b/c.png)');
    expect(r.entfernteBilder).toEqual(['a.jpg', 'b/c.png']);
  });
});

describe('inhaltAufbereiten — Bilder mit Hash-URL werden zu Bild-Teilen (ADR-0023)', () => {
  it('macht aus einem Blossom-Bild einen Bild-Teil und lässt den Text darum stehen', () => {
    const r = inhaltAufbereiten(`Davor\n\n![Ein Schrein](${BLOSSOM})\n\nDanach`);
    expect(r.entfernteBilder).toEqual([]);
    expect(bilderVon(r)).toEqual([
      { art: 'bild', url: BLOSSOM, hash: HASH, alt: 'Ein Schrein', unterschrift: null }
    ]);
    expect(r.teile.map((t) => t.art)).toEqual(['html', 'bild', 'html']);
    expect(htmlVon(r)).toContain('Davor');
    expect(htmlVon(r)).toContain('Danach');
    expect(htmlVon(r)).not.toContain('<img');
    expect(htmlVon(r)).not.toContain('@@');
  });

  it('erkennt die Konventionszeile direkt unter dem Bild als Unterschrift', () => {
    // bildattribution.md: Caption auf der Zeile direkt nach dem Bild, gleicher Absatz.
    const r = inhaltAufbereiten(
      `![Alt](${BLOSSOM})\nnosTr-schrein, Comenius-Institut, [CC0](${CC0})\n\nDanach`
    );
    const [bild] = bilderVon(r);
    expect(bild.unterschrift).toContain(`href="${CC0}"`);
    expect(bild.unterschrift).toContain('nosTr-schrein');
    // Die Zeile gehört zum Bild, nicht zum Text — sonst stünde sie doppelt.
    expect(htmlVon(r)).not.toContain('nosTr-schrein');
    expect(htmlVon(r)).toContain('Danach');
  });

  it('nimmt einen Absatz nach einer Leerzeile nicht als Unterschrift', () => {
    const r = inhaltAufbereiten(`![Alt](${BLOSSOM})\n\nEin eigener Absatz.`);
    expect(bilderVon(r)[0].unterschrift).toBe(null);
    expect(htmlVon(r)).toContain('Ein eigener Absatz.');
  });

  it('liefert dasselbe Bild an zwei Stellen als zwei Teile mit gleichem Hash', () => {
    const r = inhaltAufbereiten(`![a](${BLOSSOM})\n\nText\n\n![b](${BLOSSOM})`);
    const bilder = bilderVon(r);
    expect(bilder).toHaveLength(2);
    expect(bilder.map((b) => b.hash)).toEqual([HASH, HASH]);
    expect(bilder.map((b) => b.alt)).toEqual(['a', 'b']);
  });

  it('trennt Hash-Bilder und hashlose Bilder sauber', () => {
    const r = inhaltAufbereiten(
      `![a](${BLOSSOM})\n\n![b](https://cdn.midjourney.com/x.png)\n\n![c](rel.jpg)`
    );
    expect(bilderVon(r)).toHaveLength(1);
    expect(r.entfernteBilder).toEqual(['https://cdn.midjourney.com/x.png', 'rel.jpg']);
  });

  it('nimmt auch Hash-URLs ohne Endung und mit Großbuchstaben', () => {
    const r = inhaltAufbereiten(`![a](https://b.example/${HASH.toUpperCase()})`);
    expect(bilderVon(r)[0]?.hash).toBe(HASH);
  });

  it('entschärft die Unterschrift wie den Fließtext', () => {
    const r = inhaltAufbereiten(
      `![Alt](${BLOSSOM})\n<script>alert(1)</script>[CC0](javascript:alert(2))`
    );
    const u = bilderVon(r)[0].unterschrift ?? '';
    expect(u).not.toContain('<script');
    expect(u).not.toContain('javascript:');
  });
});

describe('inhaltAufbereiten — Markdown', () => {
  it('behaelt Blockquotes — bei FOERBICO sind es echte Zitate', () => {
    const html = htmlVon(inhaltAufbereiten('> Ein Zitat'));
    expect(html).toContain('<blockquote>');
    expect(html).toContain('Ein Zitat');
  });

  it('rendert Ueberschriften und Links', () => {
    const html = htmlVon(inhaltAufbereiten('## Titel\n\n[Text](https://example.org)'));
    expect(html).toContain('<h2');
    expect(html).toContain('href="https://example.org"');
  });

  it('vertraegt leeren Inhalt', () => {
    expect(inhaltAufbereiten('')).toEqual({ teile: [], entfernteBilder: [] });
  });

  it('liefert reinen Text als genau einen HTML-Teil', () => {
    const r = inhaltAufbereiten('Nur Text.');
    expect(r.teile).toHaveLength(1);
    expect(r.teile[0].art).toBe('html');
  });
});

describe('inhaltAufbereiten — Roh-HTML wird entschärft', () => {
  it('entfernt script-Elemente samt Inhalt', () => {
    const html = htmlVon(inhaltAufbereiten('Davor\n\n<script>alert(1)</script>\n\nDanach'));
    expect(html).not.toContain('<script');
    expect(html).not.toContain('alert(1)');
    expect(html).toContain('Davor');
    expect(html).toContain('Danach');
  });

  it('entfernt iframe, object und embed', () => {
    const html = htmlVon(
      inhaltAufbereiten(
        '<iframe src="https://boese.example"></iframe><object data="x"></object><embed src="y">'
      )
    );
    expect(html).not.toContain('<iframe');
    expect(html).not.toContain('<object');
    expect(html).not.toContain('<embed');
  });

  it('entfernt Ereignis-Attribute', () => {
    const html = htmlVon(inhaltAufbereiten('<p onclick="alert(1)">Text</p>'));
    expect(html).not.toContain('onclick');
    expect(html).toContain('Text');
  });

  it('entfernt javascript:-Verweise, behält den Linktext', () => {
    const html = htmlVon(inhaltAufbereiten('[Klick](javascript:alert(1))'));
    expect(html).not.toContain('javascript:');
    expect(html).toContain('Klick');
  });

  it('behält harmloses Roh-HTML wie <br>', () => {
    // Im FOERBICO-Bestand kommen genau diese vor (8 Stück).
    // Der Sanitizer schreibt sie als <br /> — derselbe Tag.
    expect(htmlVon(inhaltAufbereiten('Zeile<br>Zeile'))).toMatch(/<br\s*\/?>/);
  });

  it('behält gewöhnliche Links', () => {
    const html = htmlVon(inhaltAufbereiten('[Text](https://example.org/seite)'));
    expect(html).toContain('href="https://example.org/seite"');
  });
});

describe('inhaltAufbereiten — Fremdbilder mit Quellenzeile (ADR-0038)', () => {
  const LOGO = 'https://www.uni-frankfurt.de/logo.svg';
  const ZEILE = '© Goethe-Universität Frankfurt, Quelle: [uni-frankfurt.de](https://www.uni-frankfurt.de/)';

  /** Nur die Fremdbild-Teile. */
  function fremdVon(/** @type {ReturnType<typeof inhaltAufbereiten>} */ r) {
    return r.teile.filter((t) => t.art === 'fremdbild');
  }

  it('zeigt ein absolutes Bild ohne Hash, wenn darunter eine Zeile mit Quellenlink steht', () => {
    const r = inhaltAufbereiten(`Davor\n\n![Logo der Goethe-Universität](${LOGO})\n${ZEILE}\n\nDanach`);
    expect(r.entfernteBilder).toEqual([]);
    const [f] = fremdVon(r);
    expect(f).toMatchObject({ art: 'fremdbild', url: LOGO, alt: 'Logo der Goethe-Universität' });
    expect(f && 'unterschrift' in f ? f.unterschrift : '').toContain('href="https://www.uni-frankfurt.de/"');
    expect(f && 'unterschrift' in f ? f.unterschrift : '').toContain('©');
    // Die Zeile steht einmal — am Bild, nicht zusätzlich im Text.
    expect(htmlVon(r)).not.toContain('Quelle:');
    expect(htmlVon(r)).toContain('Davor');
    expect(htmlVon(r)).toContain('Danach');
  });

  it('entfernt das Fremdbild weiter, wenn die Zeile keinen Link trägt', () => {
    const r = inhaltAufbereiten(`![Logo](${LOGO})\n© Goethe-Universität Frankfurt`);
    expect(fremdVon(r)).toEqual([]);
    expect(r.entfernteBilder).toEqual([LOGO]);
    expect(htmlVon(r)).toContain('© Goethe-Universität Frankfurt');
  });

  it('entfernt das Fremdbild weiter ohne Zeile darunter', () => {
    const r = inhaltAufbereiten(`![Logo](${LOGO})\n\nText`);
    expect(fremdVon(r)).toEqual([]);
    expect(r.entfernteBilder).toEqual([LOGO]);
  });

  it('entfernt relative Bilder auch mit Quellenzeile (ADR-0015)', () => {
    const r = inhaltAufbereiten(`![Logo](/hello-world/logo.png)\n${ZEILE}`);
    expect(fremdVon(r)).toEqual([]);
    expect(r.entfernteBilder).toEqual(['/hello-world/logo.png']);
  });

  it('entfernt Fremdbilder von abgelösten Hosts auch mit Quellenzeile (ADR-0030)', () => {
    const r = inhaltAufbereiten(`![Logo](https://oer.community/logo.png)\n${ZEILE}`, {
      abgeloesteHosts: ['oer.community']
    });
    expect(fremdVon(r)).toEqual([]);
    expect(r.entfernteBilder).toEqual(['https://oer.community/logo.png']);
  });

  it('nimmt nur https — ein http-Bild wäre gemischter Inhalt', () => {
    const r = inhaltAufbereiten(`![Logo](http://example.org/logo.png)\n${ZEILE}`);
    expect(fremdVon(r)).toEqual([]);
  });

  it('ein Bild mitten im Satz bleibt entfernt — es hat keine eigene Zeile', () => {
    const r = inhaltAufbereiten(`Text ![Logo](${LOGO}) mehr Text\n${ZEILE}`);
    expect(fremdVon(r)).toEqual([]);
    expect(r.entfernteBilder).toEqual([LOGO]);
  });
});
