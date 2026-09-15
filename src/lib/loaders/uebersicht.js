import { artikelAusEvent, beitragsPfad } from '../models/artikel.js';
import { NICHT_ZEIGBAR, lizenzPruefen } from '../models/lizenz.js';
import { themaNormalisieren, themenSlug, themenTabelle } from '../themen.js';
import { etagAusSpiegel, nachweiseAusSpiegel } from './lizenz.js';

/** @typedef {import('../services/spiegel.js').Inhalt} Inhalt */
/** @typedef {import('../konfig.js').Konfig} Konfig */
/** @typedef {import('../models/lizenz.js').Ergebnis} Ergebnis */
/**
 * @typedef {object} Karte
 * @property {string} d
 * @property {string} pfad
 * @property {string} titel
 * @property {string} zusammenfassung
 * @property {string} veroeffentlicht
 * @property {Array<{ name: string, slug: string }>} themen
 * @property {{ url: string, alt: string, lizenz: Ergebnis }|null} cover
 */

export const JE_SEITE = 20;

/**
 * Anzeigename je Slug — der Slug ist die Identität eines Themas, nicht der
 * Name: Tags außerhalb der Tabelle behalten ihre Schreibweise, und `Community`
 * neben `community` ergäbe sonst zwei Einträge mit derselben URL. Es gewinnt
 * der häufigste Name, bei Gleichstand der alphabetisch erste.
 *
 * @param {Array<{ artikel: import('../models/artikel.js').Artikel, namen: string[] }>} bestand
 * @returns {Map<string, string>} Slug → Anzeigename
 */
function anzeigenamenJeSlug(bestand) {
  /** @type {Map<string, Map<string, number>>} */
  const zaehler = new Map();
  for (const { namen } of bestand) {
    for (const name of namen) {
      const slug = themenSlug(name);
      const je = zaehler.get(slug) ?? new Map();
      je.set(name, (je.get(name) ?? 0) + 1);
      zaehler.set(slug, je);
    }
  }
  /** @type {Map<string, string>} */
  const namenJeSlug = new Map();
  for (const [slug, je] of zaehler) {
    const [name] = [...je.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'de'))[0];
    namenJeSlug.set(slug, name);
  }
  return namenJeSlug;
}

/**
 * Alle Artikel (keine Seiten), published_at absteigend, Themen normalisiert
 * und je Slug auf einen Eintrag mit einem Anzeigenamen zusammengefasst.
 * @param {Inhalt} inhalt @param {Map<string, string>} tabelle
 */
function artikelSortiert(inhalt, tabelle) {
  const bestand = inhalt.artikel
    .map((e) => artikelAusEvent(e))
    .filter((a) => !a.istSeite)
    .map((a) => ({ artikel: a, namen: a.themen.map((t) => themaNormalisieren(t, tabelle)) }));
  const namenJeSlug = anzeigenamenJeSlug(bestand);
  return bestand
    .map(({ artikel, namen }) => ({
      artikel,
      themen: [...new Set(namen.map((name) => themenSlug(name)))].map((slug) => ({
        name: namenJeSlug.get(slug) ?? slug,
        slug
      }))
    }))
    .sort((x, y) => y.artikel.veroeffentlicht.getTime() - x.artikel.veroeffentlicht.getTime());
}

/**
 * Das Cover einer Karte mit seinem Lizenzstand (ADR-0032): Wie in der
 * Detailansicht wird das Bild auch ohne Nachweis ausgeliefert (ADR-0022);
 * nur was sich nicht zeigen lässt, ergibt null. Ohne x-Tag gibt es keinen
 * Lookup — derselbe Weg wie in beitragLaden, damit Karte und Artikelseite
 * denselben Stand nennen.
 * @param {Inhalt} inhalt @param {Konfig} konfig @param {import('../models/artikel.js').Artikel} a
 * @returns {{ url: string, alt: string, lizenz: Ergebnis }|null}
 */
function cover(inhalt, konfig, a) {
  if (!a.bildUrl) return null;
  const nachweis = a.bildHash ? nachweiseAusSpiegel(inhalt, a.bildHash).nachweis : null;
  const lizenz = lizenzPruefen({
    bildUrl: a.bildUrl, bildHash: a.bildHash, nachweis,
    etag: etagAusSpiegel(inhalt, a.bildUrl), abgeloesteHosts: konfig.abgeloesteHosts
  });
  if (!lizenz.ok && NICHT_ZEIGBAR.includes(lizenz.grund)) return null;
  if (lizenz.ok) {
    return { url: lizenz.nachweis.url, alt: lizenz.nachweis.alt ?? lizenz.nachweis.titel ?? a.titel, lizenz };
  }
  return { url: a.bildUrl, alt: a.titel, lizenz };
}

/**
 * @param {Inhalt} inhalt @param {Konfig} konfig
 * @param {{ seite?: number, themaSlug?: string|null, tabelle?: Map<string, string> }} [optionen]
 */
export function artikelListe(inhalt, konfig, { seite = 1, themaSlug = null, tabelle = themenTabelle() } = {}) {
  let alle = artikelSortiert(inhalt, tabelle);
  /** @type {string|null} */
  let thema = null;
  if (themaSlug) {
    const treffer = alle.find((x) => x.themen.some((t) => t.slug === themaSlug));
    thema = treffer?.themen.find((t) => t.slug === themaSlug)?.name ?? null;
    alle = thema ? alle.filter((x) => x.themen.some((t) => t.slug === themaSlug)) : [];
  }
  const gesamt = alle.length;
  const seiten = Math.max(1, Math.ceil(gesamt / JE_SEITE));
  const ab = (Math.max(1, seite) - 1) * JE_SEITE;
  const karten = alle.slice(ab, ab + JE_SEITE).map(({ artikel: a, themen }) => ({
    d: a.d,
    pfad: beitragsPfad(a),
    titel: a.titel,
    zusammenfassung: a.zusammenfassung,
    veroeffentlicht: a.veroeffentlicht.toISOString(),
    themen,
    cover: cover(inhalt, konfig, a)
  }));
  return { karten, seite, seiten, gesamt, thema };
}

/**
 * Alle Themen mit Anzahl — nach Anzahl absteigend, dann Name.
 * @param {Inhalt} inhalt @param {{ tabelle?: Map<string, string> }} [optionen]
 */
export function themenListe(inhalt, { tabelle = themenTabelle() } = {}) {
  /** @type {Map<string, { name: string, anzahl: number }>} */
  const zaehler = new Map();
  for (const { themen } of artikelSortiert(inhalt, tabelle)) {
    for (const t of themen) {
      const bisher = zaehler.get(t.slug);
      zaehler.set(t.slug, { name: t.name, anzahl: (bisher?.anzahl ?? 0) + 1 });
    }
  }
  return [...zaehler.entries()]
    .map(([slug, { name, anzahl }]) => ({ name, slug, anzahl }))
    .sort((a, b) => b.anzahl - a.anzahl || a.name.localeCompare(b.name, 'de'));
}
