import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { JE_SEITE, artikelListe, themenListe } from './uebersicht.js';
import { leererInhalt } from '../services/spiegel.js';
import { themenTabelleLesen } from '../themen.js';

const fixture = (/** @type {string} */ f) => JSON.parse(readFileSync(new URL(`../../../test/fixtures/${f}`, import.meta.url), 'utf8'));
const BESTAND = fixture('foerbico-artikel-30023.json');
const REFERENZ = fixture('artikel-30023-die-kraft-der-gemeinschaft-2026-09-07.json')[0];
const NACHWEIS = fixture('lizenz-1063-nostr-schrein.json')[0];
const KONFIG = /** @type {any} */ ({ autor: REFERENZ.pubkey, relays: [], abgeloesteHosts: ['oer.community'] });
const TABELLE = themenTabelleLesen('{"Open Educational Resources (OER)": ["OER"]}');

/** Bestand ohne den Referenzfall (alte Fassung) plus die neue Fassung. */
const artikel = [...BESTAND.filter((/** @type {any} */ e) => e.tags.find((/** @type {string[]} */ t) => t[0] === 'd')?.[1] !== 'die-kraft-der-gemeinschaft'), REFERENZ];
const inhalt = { ...leererInhalt(), stand: /** @type {any} */ ({}), artikel, nachweise: [NACHWEIS] };

describe('artikelListe', () => {
  it('sortiert published_at absteigend und blättert in 20ern', () => {
    const s1 = artikelListe(inhalt, KONFIG, { seite: 1, tabelle: TABELLE });
    expect(s1.gesamt).toBe(artikel.length);
    expect(s1.karten).toHaveLength(JE_SEITE);
    expect(s1.seiten).toBe(Math.ceil(artikel.length / JE_SEITE));
    const daten = s1.karten.map((k) => k.veroeffentlicht);
    expect([...daten].sort().reverse()).toEqual(daten);
    const letzte = artikelListe(inhalt, KONFIG, { seite: s1.seiten, tabelle: TABELLE });
    expect(letzte.karten.length).toBe(artikel.length - JE_SEITE * (s1.seiten - 1));
  });

  it('lässt Seiten (Selbst-Label) weg', () => {
    const seite = { ...REFERENZ, id: 'seite', tags: [['d', 'impressum'], ['title', 'Impressum'], ['L', 'foerbico/typ'], ['l', 'seite', 'foerbico/typ']] };
    const mit = { ...inhalt, artikel: [...artikel, seite] };
    expect(artikelListe(mit, KONFIG, { tabelle: TABELLE }).gesamt).toBe(artikel.length);
  });

  it('zeigt das Cover nur, wenn die Kette ok ist; abgelöste Hosts nie', () => {
    const alle = artikelListe(inhalt, KONFIG, { seite: 1, tabelle: TABELLE });
    const referenz = alle.karten.find((k) => k.d === 'die-kraft-der-gemeinschaft') ??
      artikelListe(inhalt, KONFIG, { seite: 2, tabelle: TABELLE }).karten.find((k) => k.d === 'die-kraft-der-gemeinschaft');
    expect(referenz?.cover?.url).toContain('blossom.edufeed.org');
    const mitAltemCover = alle.karten.filter((k) => k.cover && /oer\.community/.test(k.cover.url));
    expect(mitAltemCover).toEqual([]);
  });

  it('filtert nach Themen-Slug und normalisiert die Themen der Karten', () => {
    const oer = artikelListe(inhalt, KONFIG, { themaSlug: 'open-educational-resources-oer', tabelle: TABELLE });
    expect(oer.thema).toBe('Open Educational Resources (OER)');
    expect(oer.gesamt).toBeGreaterThan(0);
    for (const k of oer.karten) expect(k.themen.map((t) => t.name)).toContain('Open Educational Resources (OER)');
    expect(artikelListe(inhalt, KONFIG, { themaSlug: 'gibt-es-nicht', tabelle: TABELLE }).thema).toBeNull();
  });

  it('eine Seite jenseits des Endes ist leer, nicht kaputt', () => {
    expect(artikelListe(inhalt, KONFIG, { seite: 999, tabelle: TABELLE }).karten).toEqual([]);
  });
});

describe('themenListe', () => {
  it('zählt normalisiert, sortiert nach Anzahl, dann Name', () => {
    const themen = themenListe(inhalt, { tabelle: TABELLE });
    const oer = themen.find((t) => t.slug === 'open-educational-resources-oer');
    expect(oer?.anzahl).toBeGreaterThan(15);
    for (let i = 1; i < themen.length; i++) {
      const [a, b] = [themen[i - 1], themen[i]];
      expect(a.anzahl > b.anzahl || (a.anzahl === b.anzahl && a.name.localeCompare(b.name, 'de') <= 0)).toBe(true);
    }
    expect(themen.some((t) => t.name === 'OER')).toBe(false);
  });
});
