import { describe, expect, it } from 'vitest';
import { HUB_ANSICHTEN, WORTMARKE_RUECKFALL, strukturFuerLayout } from './struktur.js';
import { inhaltDerTestquelle } from '../../../test/fixtures/testquelle/laden.js';

describe('strukturFuerLayout', () => {
  it('hängt Blog und Themen hinter das Menü und rendert den Fußtext als HTML', () => {
    const s = strukturFuerLayout(inhaltDerTestquelle());
    expect(s.wortmarke).toBe('Testquelle');
    expect(s.logoUrl).toBe('https://blossom.example/logo.png');
    expect(s.menue.map((e) => e.pfad)).toEqual(['/unser-team', '/artikel-a', '/blog', '/themen']);
    expect(s.fusszeilenLinks.map((e) => e.pfad)).toEqual(['/impressum']);
    expect(s.fusstextHtml).toContain('<strong>Testquelle</strong>');
    expect(s.fusstextHtml).toContain('href="https://example.org/impressum"');
    expect(s.fusstextHtml).not.toContain('<img');
  });
  it('ohne Profil und Listen: Rückfall-Wortmarke, nur Hub-Ansichten, kein Fußtext', () => {
    const s = strukturFuerLayout(inhaltDerTestquelle({ ohne: [{ kind: 0 }, { kind: 30004 }] }));
    expect(s.wortmarke).toBe(WORTMARKE_RUECKFALL);
    expect(s.logoUrl).toBeNull();
    expect(s.menue).toEqual(HUB_ANSICHTEN);
    expect(s.fusszeilenLinks).toEqual([]);
    expect(s.fusstextHtml).toBeNull();
    expect(s.befund.navigation).toBe('fehlt');
  });
  it('ein Bild im about-Text wird nicht gerendert, der Rest schon', () => {
    const { inhalt, konfig } = inhaltDerTestquelle();
    if (inhalt.profil) inhalt.profil = { ...inhalt.profil, content: JSON.stringify({ name: 'X', about: 'Text ![b](https://blossom.example/abc.png) Ende' }) };
    const s = strukturFuerLayout({ inhalt, konfig });
    expect(s.fusstextHtml).toContain('Text');
    expect(s.fusstextHtml).not.toContain('<img');
  });
});
