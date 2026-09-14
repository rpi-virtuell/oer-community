import { describe, expect, it } from 'vitest';
import { strukturLaden } from './struktur.js';
import { inhaltDerTestquelle } from '../../../test/fixtures/testquelle/laden.js';

describe('strukturLaden', () => {
  it('löst Menü und Fußzeile gegen den Spiegel auf und meldet Übersprungenes', () => {
    const { inhalt, konfig } = inhaltDerTestquelle();
    const s = strukturLaden(inhalt, konfig);
    expect(s.menue).toEqual([
      { titel: 'Unser Team', pfad: '/unser-team', d: 'unser-team' },
      { titel: 'Artikel A', pfad: '/artikel-a', d: 'artikel-a' }
    ]);
    expect(s.fusszeile).toEqual([{ titel: 'Impressum', pfad: '/impressum', d: 'impressum' }]);
    expect(s.befund.uebersprungen).toEqual([
      'navigation: „oer-und-oep“ liegt nicht im Spiegel',
      'navigation: „startseite“ steht nicht im Menü — das Logo verlinkt dorthin',
      `navigation: 30023:${'b'.repeat(64)}:x gehört nicht zur Quelle`,
      'fusszeile: „datenschutz“ liegt nicht im Spiegel'
    ]);
    expect(s.befund).toMatchObject({ profil: 'ok', navigation: 'ok', fusszeile: 'ok', startseite: 'ok' });
    expect(s.startseite?.artikel.titel).toBe('Willkommen');
    expect(s.profil?.name).toBe('Testquelle');
  });
  it('englische Seiten bekommen den /en/-Pfad', () => {
    const { inhalt, konfig } = inhaltDerTestquelle();
    const nav = inhalt.listen.find((e) => e.tags.some((t) => t[1] === 'navigation'));
    if (nav) nav.tags.push(['a', `30023:${konfig.autor}:our-team`]);
    expect(strukturLaden(inhalt, konfig).menue.at(-1)).toEqual({ titel: 'Our team', pfad: '/en/our-team', d: 'our-team' });
  });
  it('fehlende Events: leere Listen, Befund „fehlt“ mit dem erwarteten Event', () => {
    const { inhalt, konfig } = inhaltDerTestquelle({ ohne: [{ kind: 30004 }, { kind: 0 }, { kind: 30023, d: 'startseite' }] });
    const s = strukturLaden(inhalt, konfig);
    expect(s.menue).toEqual([]);
    expect(s.fusszeile).toEqual([]);
    expect(s.profil).toBeNull();
    expect(s.startseite).toBeNull();
    expect(s.befund).toMatchObject({ profil: 'fehlt', navigation: 'fehlt', fusszeile: 'fehlt', startseite: 'fehlt' });
    expect(s.befund.erwartet.navigation).toBe(`kind:30004 mit d = "navigation" von ${konfig.autor.slice(0, 12)}…`);
    expect(s.befund.erwartet.startseite).toBe(`kind:30023 mit d = "startseite" von ${konfig.autor.slice(0, 12)}…`);
  });
});
