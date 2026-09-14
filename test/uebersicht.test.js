import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Karte from '../src/lib/komponenten/Karte.svelte';
import Uebersicht from '../src/lib/komponenten/Uebersicht.svelte';

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
  it('zeigt das Cover mit Lizenzzeile, wenn eines da ist, sonst kein <img>', () => {
    const mit = render(Karte, { props: { karte: karte({ cover: { url: NACHWEIS.url, alt: 'Ein Schrein', nachweis: NACHWEIS } }) } }).body;
    expect(mit).toContain('<img');
    expect(mit).toContain('alt="Ein Schrein"');
    expect(mit).toContain('Comenius-Institut');
    expect(render(Karte, { props: { karte: karte() } }).body).not.toContain('<img');
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
