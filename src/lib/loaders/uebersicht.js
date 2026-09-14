import { artikelAusEvent, beitragsPfad } from '../models/artikel.js';
import { lizenzPruefen } from '../models/lizenz.js';
import { themaNormalisieren, themenSlug, themenTabelle } from '../themen.js';
import { etagAusSpiegel, nachweiseAusSpiegel } from './lizenz.js';

/** @typedef {import('../services/spiegel.js').Inhalt} Inhalt */
/** @typedef {import('../konfig.js').Konfig} Konfig */
/** @typedef {import('../models/lizenz.js').Nachweis} Nachweis */
/**
 * @typedef {object} Karte
 * @property {string} d
 * @property {string} pfad
 * @property {string} titel
 * @property {string} zusammenfassung
 * @property {string} veroeffentlicht
 * @property {Array<{ name: string, slug: string }>} themen
 * @property {{ url: string, alt: string, nachweis: Nachweis }|null} cover
 */

export const JE_SEITE = 20;

/**
 * Alle Artikel (keine Seiten), published_at absteigend, Themen normalisiert.
 * @param {Inhalt} inhalt @param {Map<string, string>} tabelle
 */
function artikelSortiert(inhalt, tabelle) {
  return inhalt.artikel
    .map((e) => artikelAusEvent(e))
    .filter((a) => !a.istSeite)
    .map((a) => ({
      artikel: a,
      themen: [...new Set(a.themen.map((t) => themaNormalisieren(t, tabelle)))].map((name) => ({ name, slug: themenSlug(name) }))
    }))
    .sort((x, y) => y.artikel.veroeffentlicht.getTime() - x.artikel.veroeffentlicht.getTime());
}

/**
 * Das Cover einer Karte — nur, wenn die Kette ok ist. Ein Bild mit
 * „Lizenz ungeklärt" gehört auf die Artikelseite, wo der Grund steht, nicht
 * in eine Liste, wo er fehlen würde.
 * @param {Inhalt} inhalt @param {Konfig} konfig @param {import('../models/artikel.js').Artikel} a
 */
function cover(inhalt, konfig, a) {
  if (!a.bildUrl || !a.bildHash) return null;
  const { nachweis } = nachweiseAusSpiegel(inhalt, a.bildHash);
  const kette = lizenzPruefen({
    bildUrl: a.bildUrl, bildHash: a.bildHash, nachweis,
    etag: etagAusSpiegel(inhalt, a.bildUrl), abgeloesteHosts: konfig.abgeloesteHosts
  });
  if (!kette.ok) return null;
  return { url: kette.nachweis.url, alt: kette.nachweis.alt ?? kette.nachweis.titel ?? a.titel, nachweis: kette.nachweis };
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
  /** @type {Map<string, number>} */
  const zaehler = new Map();
  for (const { themen } of artikelSortiert(inhalt, tabelle)) {
    for (const t of themen) zaehler.set(t.name, (zaehler.get(t.name) ?? 0) + 1);
  }
  return [...zaehler.entries()]
    .map(([name, anzahl]) => ({ name, slug: themenSlug(name), anzahl }))
    .sort((a, b) => b.anzahl - a.anzahl || a.name.localeCompare(b.name, 'de'));
}
