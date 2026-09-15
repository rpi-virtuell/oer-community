/**
 * Übersetzungen zwischen Beiträgen (ADR-0033): Das a-Tag mit Marker
 * translation steht an einer Seite oder an beiden; hier wird die Zuordnung
 * symmetrisch, damit der Umschalter in beide Richtungen führt.
 */
import { artikelAusEvent, dNormalisieren } from '../models/artikel.js';
import { artikelAusSpiegel } from './artikel.js';

/** @typedef {import('../services/spiegel.js').Inhalt} Inhalt */
/** @typedef {import('../models/artikel.js').Artikel} Artikel */

/**
 * Das Gegenstück eines Beitrags in der anderen Sprache — oder null.
 * Vorwärts über die eigenen a-Tags, rückwärts über die a-Tags aller anderen.
 * @param {Inhalt} inhalt @param {Artikel} artikel @returns {Artikel|null}
 */
export function gegenstueck(inhalt, artikel) {
  for (const d of artikel.uebersetzungen) {
    const { artikel: ziel } = artikelAusSpiegel(inhalt, { d });
    if (ziel && ziel.sprache !== artikel.sprache) return ziel;
  }
  const eigenes = dNormalisieren(artikel.d);
  for (const event of inhalt.artikel) {
    const kandidat = artikelAusEvent(event);
    if (kandidat.sprache === artikel.sprache) continue;
    if (kandidat.uebersetzungen.some((d) => dNormalisieren(d) === eigenes)) return kandidat;
  }
  return null;
}

/** Gibt es im Spiegel überhaupt englische Beiträge? Dann erscheint der Umschalter. @param {Inhalt} inhalt */
export function englischVorhanden(inhalt) {
  return inhalt.artikel.some((e) => artikelAusEvent(e).sprache === 'en');
}
