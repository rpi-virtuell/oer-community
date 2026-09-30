import { describe, expect, it } from 'vitest';
import { blogLaden, startLaden, themenLaden } from './uebersicht.js';
import { inhaltDerTestquelle } from '../../../test/fixtures/testquelle/laden.js';

// Der Breitenschalter des Layouts (ADR-0040): Übersichten und Startseite
// laufen breit, Beitrag und Termine bleiben in der Lesebreite.
describe('breit — Kartenraster und Hero brauchen den ganzen Container', () => {
  it('Blog und Themen sind breit', () => {
    const { konfig, inhalt } = inhaltDerTestquelle();
    expect(blogLaden({ konfig, inhalt }).breit).toBe(true);
    expect(themenLaden({ konfig, inhalt }).breit).toBe(true);
  });
  it('die Startseite ist breit — als Seite wie als Blog-Rückfall', async () => {
    const { konfig, inhalt } = inhaltDerTestquelle();
    const seite = await startLaden({ konfig, inhalt });
    expect(seite.art).toBe('seite');
    expect(seite.breit).toBe(true);
    const ohne = inhaltDerTestquelle({ ohne: [{ kind: 30023, d: konfig.startseiteD }] });
    const blog = await startLaden(ohne);
    expect(blog.art).toBe('blog');
    expect(blog.breit).toBe(true);
  });
});
