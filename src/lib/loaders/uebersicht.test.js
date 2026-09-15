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

  it('liefert das Cover auch ohne Nachweis, mit Lizenzstand; relative und abgelöste nie (ADR-0032)', () => {
    const karten = [1, 2, 3, 4, 5].flatMap((seite) => artikelListe(inhalt, KONFIG, { seite, tabelle: TABELLE }).karten);
    const referenz = karten.find((k) => k.d === 'die-kraft-der-gemeinschaft');
    expect(referenz?.cover?.lizenz.ok).toBe(true);
    expect(referenz?.cover?.url).toContain('blossom.edufeed.org');
    // Blossom-Bild ohne x-Tag: zeigbar, Stand „kein-x-tag", Adresse vom Artikel.
    const ohneX = karten.find((k) => k.d === '4g2mkzxv');
    expect(ohneX?.cover?.url).toContain('blossom.edufeed.org');
    expect(ohneX?.cover?.lizenz).toEqual({ ok: false, grund: 'kein-x-tag' });
    // Abgelöste Hosts (74 Artikel auf oer.community) bleiben ohne Cover (ADR-0030).
    expect(karten.filter((k) => k.cover && /oer\.community/.test(k.cover.url))).toEqual([]);
    // 1 mit Nachweis + 3 Blossom-Bilder ohne x-Tag (2× blossom.primal.net, 1× blossom.edufeed.org).
    expect(karten.filter((k) => k.cover)).toHaveLength(4);
  });

  it('ohne Nachweis im Spiegel fällt das Cover auf die Adresse des Artikels zurück (kein-nachweis)', () => {
    const ohneNachweise = { ...inhalt, nachweise: [] };
    const karten = [1, 2, 3, 4, 5].flatMap((seite) => artikelListe(ohneNachweise, KONFIG, { seite, tabelle: TABELLE }).karten);
    const referenz = karten.find((k) => k.d === 'die-kraft-der-gemeinschaft');
    const bildUrl = REFERENZ.tags.find((/** @type {string[]} */ t) => t[0] === 'image')?.[1];
    expect(referenz?.cover?.lizenz).toEqual({ ok: false, grund: 'kein-nachweis' });
    expect(referenz?.cover?.url).toBe(bildUrl);
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

describe('Themen-Slug ist die Identität (Live-Kollision Community/community)', () => {
  /** Zwei Artikel mit derselben Schreibweise-Variante eines Tags außerhalb der Tabelle. */
  const gross = { ...REFERENZ, id: 'g'.repeat(64), tags: [['d', 'gross'], ['title', 'Gross'], ['published_at', '1788433000'], ['t', 'Community']] };
  const klein = { ...REFERENZ, id: 'k'.repeat(64), tags: [['d', 'klein'], ['title', 'Klein'], ['published_at', '1788433001'], ['t', 'community']] };
  const zwei = { ...leererInhalt(), stand: /** @type {any} */ ({}), artikel: [gross, klein] };

  it('fasst beide Schreibweisen zu einem Eintrag mit der Summe zusammen', () => {
    const themen = themenListe(zwei, { tabelle: TABELLE });
    const treffer = themen.filter((t) => t.slug === 'community');
    expect(treffer).toHaveLength(1);
    expect(treffer[0].anzahl).toBe(2);
  });

  it('gibt jeder Karte je Slug genau ein Thema mit demselben Anzeigenamen', () => {
    const liste = artikelListe(zwei, KONFIG, { tabelle: TABELLE });
    const namen = new Set(liste.karten.flatMap((k) => k.themen.filter((t) => t.slug === 'community').map((t) => t.name)));
    expect(namen.size).toBe(1);
    for (const k of liste.karten) expect(k.themen.filter((t) => t.slug === 'community')).toHaveLength(1);
  });

  it('der Filter findet beide Artikel unter dem einen Slug', () => {
    expect(artikelListe(zwei, KONFIG, { themaSlug: 'community', tabelle: TABELLE }).gesamt).toBe(2);
  });

  it('wählt bei Gleichstand den alphabetisch ersten Namen', () => {
    // localeCompare('de') stellt 'community' vor 'Community' — deterministisch
    // ist, worauf es ankommt, nicht welche der beiden Schreibweisen gewinnt.
    expect(themenListe(zwei, { tabelle: TABELLE })[0].name).toBe('community');
  });

  it('wählt sonst den häufigsten Namen', () => {
    const zweiterKlein = { ...klein, id: 'j'.repeat(64), tags: [['d', 'klein2'], ['title', 'Klein 2'], ['published_at', '1788433002'], ['t', 'community']] };
    const drei = { ...zwei, artikel: [gross, klein, zweiterKlein] };
    const treffer = themenListe(drei, { tabelle: TABELLE }).find((t) => t.slug === 'community');
    expect(treffer?.name).toBe('community');
    expect(treffer?.anzahl).toBe(3);
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
