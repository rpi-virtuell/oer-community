import { describe, expect, it } from 'vitest';
import { HUB_ANSICHTEN, WORTMARKE_RUECKFALL, basisUrlBestimmen, strukturFuerLayout } from './struktur.js';
import { inhaltDerTestquelle } from '../../../test/fixtures/testquelle/laden.js';

const ORIGIN = 'https://hub.example';

describe('strukturFuerLayout', () => {
  it('hängt Blog und Themen hinter das Menü und rendert den Fußtext als HTML', () => {
    const s = strukturFuerLayout({ ...inhaltDerTestquelle(), origin: ORIGIN });
    expect(s.wortmarke).toBe('Testquelle');
    expect(s.logoUrl).toBe('https://blossom.example/logo.png');
    expect(s.menue.map((e) => e.pfad)).toEqual(['/unser-team', '/artikel-a', '/blog', '/themen']);
    expect(s.fusszeilenLinks.map((e) => e.pfad)).toEqual(['/impressum']);
    expect(s.fusstextHtml).toContain('<strong>Testquelle</strong>');
    expect(s.fusstextHtml).toContain('href="https://example.org/impressum"');
    expect(s.fusstextHtml).not.toContain('<img');
  });
  it('ohne Profil und Listen: Rückfall-Wortmarke, nur Hub-Ansichten, kein Fußtext', () => {
    const s = strukturFuerLayout({ ...inhaltDerTestquelle({ ohne: [{ kind: 0 }, { kind: 30004 }] }), origin: ORIGIN });
    expect(s.wortmarke).toBe(WORTMARKE_RUECKFALL);
    expect(s.logoUrl).toBeNull();
    expect(s.menue).toEqual(HUB_ANSICHTEN);
    expect(s.fusszeilenLinks).toEqual([]);
    expect(s.fusstextHtml).toBeNull();
    expect(s.befund.navigation).toBe('fehlt');
  });
  it('liefert keine zwei Men\u00fceintr\u00e4ge mit gleichem Pfad \u2014 auch nicht gegen HUB_ANSICHTEN', () => {
    const { inhalt, konfig } = inhaltDerTestquelle();
    const vorlage = inhalt.artikel.find((e) => e.tags.some((t) => t[0] === 'd' && t[1] === 'unser-team'));
    if (vorlage) {
      for (const d of ['blog', 'themen']) {
        inhalt.artikel.push({
          ...vorlage,
          id: d.padEnd(64, '0'),
          tags: [...vorlage.tags.filter((t) => t[0] !== 'd' && t[0] !== 'title'), ['d', d], ['title', d]]
        });
      }
    }
    const nav = inhalt.listen.find((e) => e.tags.some((t) => t[1] === 'navigation'));
    if (nav) nav.tags.push(['a', `30023:${konfig.autor}:blog`], ['a', `30023:${konfig.autor}:themen`], ['a', `30023:${konfig.autor}:unser-team`]);
    const pfade = strukturFuerLayout({ inhalt, konfig, origin: ORIGIN }).menue.map((e) => e.pfad);
    expect(new Set(pfade).size).toBe(pfade.length);
  });

  it('ein Bild im about-Text wird nicht gerendert, der Rest schon', () => {
    const { inhalt, konfig } = inhaltDerTestquelle();
    if (inhalt.profil) inhalt.profil = { ...inhalt.profil, content: JSON.stringify({ name: 'X', about: 'Text ![b](https://blossom.example/abc.png) Ende' }) };
    const s = strukturFuerLayout({ inhalt, konfig, origin: ORIGIN });
    expect(s.fusstextHtml).toContain('Text');
    expect(s.fusstextHtml).not.toContain('<img');
  });

  it('basisUrl: website aus dem Profil ohne Schrägstrich, sonst der Origin', () => {
    const s = strukturFuerLayout({ ...inhaltDerTestquelle(), origin: 'https://hub.example' });
    expect(s.basisUrl).toBe('https://test.example');
    const ohne = strukturFuerLayout({ ...inhaltDerTestquelle({ ohne: [{ kind: 0 }] }), origin: 'https://hub.example' });
    expect(ohne.basisUrl).toBe('https://hub.example');
    expect(basisUrlBestimmen({ name: 'X', logoUrl: null, fusstext: null, website: 'https://oer.community/' }, 'https://o')).toBe('https://oer.community');
  });
});
