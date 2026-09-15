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
  it('die englische Startseite steht ebenso wenig im Menü wie die deutsche', () => {
    const { inhalt, konfig } = inhaltDerTestquelle();
    const nav = inhalt.listen.find((e) => e.tags.some((t) => t[1] === 'navigation'));
    if (nav) nav.tags.push(['a', `30023:${konfig.autor}:en/startseite`]);
    const s = strukturLaden(inhalt, konfig);
    expect(s.menue.some((e) => e.d === 'en/startseite')).toBe(false);
    expect(s.befund.uebersprungen).toContain(
      'navigation: \u201een/startseite\u201c steht nicht im Men\u00fc \u2014 das Logo verlinkt dorthin'
    );
  });
  it('eine kind:30000-Liste mit gleichem d verdrängt die echte Navigation nicht', () => {
    const { inhalt, konfig } = inhaltDerTestquelle();
    const nav = inhalt.listen.find((e) => e.tags.some((t) => t[1] === 'navigation'));
    const fremd = { ...nav, kind: 30000, id: 'c'.repeat(64), tags: [['d', 'navigation']] };
    inhalt.listen.unshift(/** @type {any} */ (fremd));
    const s = strukturLaden(inhalt, konfig);
    expect(s.menue).toEqual([
      { titel: 'Unser Team', pfad: '/unser-team', d: 'unser-team' },
      { titel: 'Artikel A', pfad: '/artikel-a', d: 'artikel-a' }
    ]);
  });
  it('ein Ziel, das schon in der Liste steht, kommt nur einmal vor', () => {
    const { inhalt, konfig } = inhaltDerTestquelle();
    const nav = inhalt.listen.find((e) => e.tags.some((t) => t[1] === 'navigation'));
    if (nav) nav.tags.push(['a', `30023:${konfig.autor}:unser-team`]);
    const s = strukturLaden(inhalt, konfig);
    expect(s.menue.filter((e) => e.d === 'unser-team')).toHaveLength(1);
    expect(s.befund.uebersprungen).toContain('navigation: \u201eunser-team\u201c steht schon in der Liste');
  });
  it('ein Ziel, dessen d ein fester Pfad des Hubs ist, wird \u00fcbersprungen', () => {
    const { inhalt, konfig } = inhaltDerTestquelle();
    const vorlage = inhalt.artikel.find((e) => e.tags.some((t) => t[0] === 'd' && t[1] === 'unser-team'));
    if (vorlage) {
      inhalt.artikel.push({
        ...vorlage,
        id: 'f'.repeat(64),
        tags: [...vorlage.tags.filter((t) => t[0] !== 'd' && t[0] !== 'title'), ['d', 'blog'], ['title', 'Blog']]
      });
    }
    const nav = inhalt.listen.find((e) => e.tags.some((t) => t[1] === 'navigation'));
    if (nav) nav.tags.push(['a', `30023:${konfig.autor}:blog`]);
    const s = strukturLaden(inhalt, konfig);
    expect(s.menue.some((e) => e.d === 'blog')).toBe(false);
    expect(s.befund.uebersprungen).toContain('navigation: \u201eblog\u201c ist ein fester Pfad des Hubs');
  });
  it('ein Profil ohne Namen gilt als fehlend \u2014 die Wortmarke ist der R\u00fcckfall', () => {
    const { inhalt, konfig } = inhaltDerTestquelle();
    if (inhalt.profil) inhalt.profil = { ...inhalt.profil, content: '{}' };
    const s = strukturLaden(inhalt, konfig);
    expect(s.befund.profil).toBe('fehlt');
    expect(s.befund.erwartet.profil).toContain('name');
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
