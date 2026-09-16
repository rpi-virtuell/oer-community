import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Karte from '../src/lib/komponenten/Karte.svelte';
import Uebersicht from '../src/lib/komponenten/Uebersicht.svelte';
import ThemenSeite from '../src/routes/themen/+page.svelte';
import BlogSeitePage from '../src/routes/blog/seite/[n]/+page.svelte';
import BlogPage from '../src/routes/blog/+page.svelte';
import ThemaPage from '../src/routes/themen/[thema]/+page.svelte';
import { strukturFuerLayout } from '../src/lib/routen/struktur.js';
import { inhaltDerTestquelle } from './fixtures/testquelle/laden.js';
import { GRUND_TEXT } from '../src/lib/models/lizenz.js';

const NACHWEIS = /** @type {any} */ ({ id: 'n', hash: 'h', url: 'https://blossom.edufeed.org/h.jpg', titel: 'Schrein', license: 'https://creativecommons.org/publicdomain/zero/1.0/', credit: 'Comenius-Institut', beschreibung: null, quelle: null, alt: 'Ein Schrein', urheberUrl: null, bearbeitung: null, ki: null, mime: 'image/jpeg' });
const karte = (/** @type {Partial<any>} */ ab = {}) => ({
  d: 'canva', pfad: '/canva', titel: 'Canva für OER', zusammenfassung: 'Kurz.', veroeffentlicht: '2024-12-19T00:00:00.000Z',
  themen: [{ name: 'Lizenzen', slug: 'lizenzen' }], cover: null, ...ab
});

describe('Karte', () => {
  it('verlinkt Titel auf den Pfad, nennt Datum und Themen als Links', () => {
    const { body } = render(Karte, { props: { karte: karte() } });
    expect(body).toContain('href="/canva"');
    expect(body).toContain('Canva für OER');
    expect(body).toContain('19. Dezember 2024');
    expect(body).toContain('href="/themen/lizenzen"');
  });
  it('zeigt das Cover mit Lizenzpille statt Textzeile; ohne Cover kein <img> (ADR-0032)', () => {
    const mit = render(Karte, { props: { karte: karte({ cover: { url: NACHWEIS.url, alt: 'Ein Schrein', lizenz: { ok: true, nachweis: NACHWEIS } } }) } }).body;
    expect(mit).toContain('<img');
    expect(mit).toContain('alt="Ein Schrein"');
    expect(mit).toContain('CC0 (Public Domain)');
    expect(mit).toContain('Comenius-Institut');
    expect(mit).not.toContain('bildnachweis');
    // Die Pille steht neben dem Cover-Link, nicht darin — der Link ist aria-hidden.
    expect(mit.indexOf('class="pille')).toBeGreaterThan(mit.indexOf('</a>'));
    expect(render(Karte, { props: { karte: karte() } }).body).not.toContain('<img');
  });

  it('zeigt ein Cover ohne Nachweis mit der Pille „Lizenz ungeklärt" (ADR-0032)', () => {
    const body = render(Karte, {
      props: { karte: karte({ cover: { url: 'https://blossom.edufeed.org/x.jpg', alt: 'Canva für OER', lizenz: { ok: false, grund: 'kein-x-tag' } } }) }
    }).body;
    expect(body).toContain('src="https://blossom.edufeed.org/x.jpg"');
    expect(body).toContain('Lizenz ungeklärt');
    expect(body).toContain(GRUND_TEXT['kein-x-tag']);
  });
});

describe('Uebersicht', () => {
  it('rendert Überschrift, Karten und Seitenzahlen mit richtigen Zielen', () => {
    const { body } = render(Uebersicht, { props: { karten: [karte(), karte({ d: 'b', pfad: '/b', titel: 'B' })], seite: 2, seiten: 3, basis: '/blog', ueberschrift: 'Blog' } });
    expect(body).toContain('<h1');
    expect(body).toContain('Blog');
    expect(body).toContain('href="/blog"');          // Seite 1
    expect(body).toContain('href="/blog/seite/3"');
    expect(body).toContain('aria-current="page"');
    expect(body).toContain('Seite 2 von 3');
  });
  it('nennt einen Hinweis, wenn keine Karten da sind — nie eine leere Liste', () => {
    const { body } = render(Uebersicht, { props: { karten: [], seite: 1, seiten: 1, basis: '/themen/x', ueberschrift: 'Thema', hinweis: 'Zu diesem Thema gibt es keinen Beitrag.' } });
    expect(body).toContain('keinen Beitrag');
  });
  it('zeigt bei einer einzigen Seite keine Seitenzahlen', () => {
    const { body } = render(Uebersicht, { props: { karten: [karte()], seite: 1, seiten: 1, basis: '/blog', ueberschrift: 'Blog' } });
    expect(body).not.toContain('Seite 1 von 1');
  });
});

describe('/themen', () => {
  it('listet Themen mit Link auf den Slug und Anzahl', () => {
    const { body } = render(ThemenSeite, {
      props: {
        data: {
          spiegelstand: { zeitpunkt: null, veraltet: false, relays: [] }, breit: true,
          struktur: strukturFuerLayout({ ...inhaltDerTestquelle(), origin: 'https://hub.example' }),
          themen: [{ name: 'Lizenzen', slug: 'lizenzen', anzahl: 5 }]
        }
      }
    });
    expect(body).toContain('href="/themen/lizenzen"');
    expect(body).toContain('Lizenzen');
    expect(body).toContain('5');
  });

  it('trägt „Themen" und die Wortmarke aus der Struktur im <title>', () => {
    const { head } = render(ThemenSeite, {
      props: {
        data: {
          spiegelstand: { zeitpunkt: null, veraltet: false, relays: [] }, breit: true,
          struktur: { ...strukturFuerLayout({ ...inhaltDerTestquelle(), origin: 'https://hub.example' }), wortmarke: 'Testquelle' },
          themen: []
        }
      }
    });
    expect(head).toContain('<title>Themen · Testquelle</title>');
  });

  it('setzt den kanonischen Link auf /themen', () => {
    const { head } = render(ThemenSeite, {
      props: {
        data: {
          spiegelstand: { zeitpunkt: null, veraltet: false, relays: [] }, breit: true,
          struktur: strukturFuerLayout({ ...inhaltDerTestquelle(), origin: 'https://hub.example' }),
          themen: []
        }
      }
    });
    expect(head).toContain('<link rel="canonical" href="https://test.example/themen"');
  });
});

/** Übersichtsdaten, wie die load-Funktionen sie liefern. @param {Partial<any>} ab */
const uebersichtsdaten = (ab = {}) => ({
  spiegelstand: { zeitpunkt: null, veraltet: false, relays: [] },
  struktur: strukturFuerLayout({ ...inhaltDerTestquelle(), origin: 'https://hub.example' }),
  karten: [], seite: 1, seiten: 3, gesamt: 0, thema: null, basis: '/blog', ueberschrift: 'Blog', hinweis: null, breit: true, ...ab
});

describe('/blog', () => {
  it('setzt den kanonischen Link auf .../blog — Seite 1 ohne /seite/1', () => {
    const { head } = render(BlogPage, { props: { data: uebersichtsdaten() } });
    expect(head).toContain('<link rel="canonical" href="https://test.example/blog"');
    expect(head).not.toContain('/blog/seite/1');
  });
});

describe('/themen/[thema]', () => {
  it('setzt den kanonischen Link auf das Thema — Seite 1 ohne /seite/1', () => {
    const { head } = render(ThemaPage, {
      props: { data: uebersichtsdaten({ basis: '/themen/community', ueberschrift: 'Community', thema: 'Community' }) }
    });
    expect(head).toContain('<link rel="canonical" href="https://test.example/themen/community"');
    expect(head).not.toContain('/seite/1');
  });
});

describe('/blog/seite/[n]', () => {
  it('setzt den kanonischen Link auf .../blog/seite/2', () => {
    const { head } = render(BlogSeitePage, {
      props: {
        data: {
          spiegelstand: { zeitpunkt: null, veraltet: false, relays: [] }, breit: true,
          struktur: strukturFuerLayout({ ...inhaltDerTestquelle(), origin: 'https://hub.example' }),
          karten: [], seite: 2, seiten: 3, gesamt: 0, thema: null, basis: '/blog', ueberschrift: 'Blog', hinweis: null
        }
      }
    });
    expect(head).toContain('<link rel="canonical" href="https://test.example/blog/seite/2"');
  });
});

describe('strukturFuerLayout je Sprache (ADR-0033)', () => {
  it('unter en: Menü und Fußzeile auf Gegenstücke, sonst der deutsche Eintrag; Hub-Ansichten übersetzt', () => {
    const { inhalt, konfig } = inhaltDerTestquelle();
    const en = strukturFuerLayout({ konfig, inhalt, origin: 'http://x', sprache: 'en' });
    expect(en.sprache).toBe('en');
    expect(en.zweisprachig).toBe(true);
    expect(en.menue.find((e) => e.pfad === '/en/our-team')?.titel).toBe('Our team');
    expect(en.menue.some((e) => e.pfad === '/unser-team')).toBe(false);
    expect(en.menue.find((e) => e.pfad === '/artikel-a')?.titel).toBe('Artikel A');
    expect(en.menue.map((e) => e.titel)).toContain('Topics');
    expect(en.fusszeilenLinks.find((e) => e.d === 'impressum')?.pfad).toBe('/impressum');
    const de = strukturFuerLayout({ konfig, inhalt, origin: 'http://x' });
    expect(de.sprache).toBe('de');
    expect(de.menue.map((e) => e.titel)).toContain('Themen');
  });
});

describe('Menüpunkt Termine (ADR-0034)', () => {
  it('steht vor „Blog", sobald Termine da sind — auf Englisch „Events"', () => {
    const { inhalt, konfig } = inhaltDerTestquelle({ mitTerminen: true });
    const de = strukturFuerLayout({ konfig, inhalt, origin: 'http://x' });
    expect(de.menue.map((e) => e.pfad)).toContain('/termine');
    expect(de.menue.find((e) => e.pfad === '/termine')?.titel).toBe('Termine');
    // Erst die Termine, dann Blog und Themen.
    expect(de.menue.indexOf(/** @type {any} */ (de.menue.find((e) => e.pfad === '/termine')))).toBeLessThan(
      de.menue.findIndex((e) => e.pfad === '/blog')
    );
    const en = strukturFuerLayout({ konfig, inhalt, origin: 'http://x', sprache: 'en' });
    expect(en.menue.find((e) => e.pfad === '/termine')?.titel).toBe('Events');
  });

  it('fehlt ohne Termine — was es nicht gibt, wird nicht angedeutet (CLAUDE.md)', () => {
    const { inhalt, konfig } = inhaltDerTestquelle();
    const s = strukturFuerLayout({ konfig, inhalt, origin: 'http://x' });
    expect(s.menue.some((e) => e.pfad === '/termine')).toBe(false);
  });

  it('auch vergangene Termine genügen: der Kalender ist dann nicht leer', () => {
    const { inhalt, konfig } = inhaltDerTestquelle({ mitTerminen: true });
    // Die Tagung liegt Februar 2027 — von 2028 aus gesehen vergangen.
    const s = strukturFuerLayout({ konfig, inhalt, origin: 'http://x', jetzt: () => new Date('2028-01-01T00:00:00Z') });
    expect(s.menue.some((e) => e.pfad === '/termine')).toBe(true);
  });
});
