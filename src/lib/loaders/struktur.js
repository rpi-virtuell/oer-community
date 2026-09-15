/**
 * Die Seitenstruktur aus dem Spiegel (ADR-0027): Profil, Menü, Fußzeile,
 * Startseite. Was fehlt, steht im Befund — nie eine leere Fläche ohne
 * Erklärung (CLAUDE.md). Kennt die Oberfläche nicht: liefert Einträge,
 * keine Links; „Blog" und „Themen" hängt die Routen-Schicht an.
 */
import { beitragsPfad, istStartseitenD } from '../models/artikel.js';
import { FESTE_SEGMENTE } from '../models/feste-segmente.js';
import { listeFinden } from '../models/liste.js';
import { profilAusEvent } from '../models/profil.js';
import { artikelAusSpiegel } from './artikel.js';

/** @typedef {import('../services/spiegel.js').Inhalt} Inhalt */
/** @typedef {import('../services/spiegel.js').Event} Event */
/** @typedef {import('../konfig.js').Konfig} Konfig */
/** @typedef {import('../models/artikel.js').Artikel} Artikel */
/** @typedef {import('../models/profil.js').Profil} Profil */
/** @typedef {{ titel: string, pfad: string, d: string }} Eintrag */
/** @typedef {'ok'|'fehlt'} Vorhanden */
/**
 * @typedef {object} Struktur
 * @property {Profil|null} profil
 * @property {Eintrag[]} menue
 * @property {Eintrag[]} fusszeile
 * @property {{ artikel: Artikel, event: Event }|null} startseite
 * @property {{ profil: Vorhanden, navigation: Vorhanden, fusszeile: Vorhanden, startseite: Vorhanden,
 *   erwartet: { profil: string, navigation: string, fusszeile: string, startseite: string },
 *   uebersprungen: string[] }} befund
 */

/**
 * @param {Inhalt} inhalt @param {Konfig} konfig @param {string} listenD
 * @param {string[]} uebersprungen  wird ergänzt
 * @returns {{ eintraege: Eintrag[], vorhanden: Vorhanden }}
 */
function eintraegeAufloesen(inhalt, konfig, listenD, uebersprungen) {
  const liste = listeFinden(inhalt.listen, listenD);
  if (!liste) return { eintraege: [], vorhanden: 'fehlt' };
  /** @type {Eintrag[]} */
  const eintraege = [];
  /** Schon aufgenommene d dieser Liste — ein Ziel zweimal wäre ein doppelter Link. */
  const gesehen = new Set();
  for (const ziel of liste.ziele) {
    if (ziel.kind !== 30023 || ziel.pubkey !== konfig.autor) {
      uebersprungen.push(`${listenD}: ${ziel.roh} gehört nicht zur Quelle`);
      continue;
    }
    // Doppelte Ziele und Ziele auf festen Pfaden ergäben zwei Einträge mit
    // demselben Pfad. Svelte keyt die Menüschleife auf den Pfad und bricht
    // die Hydration mit `each_key_duplicate` ab — auch im Produktionsbau.
    if (gesehen.has(ziel.d)) {
      uebersprungen.push(`${listenD}: „${ziel.d}“ steht schon in der Liste`);
      continue;
    }
    if (FESTE_SEGMENTE.includes(ziel.d)) {
      uebersprungen.push(`${listenD}: „${ziel.d}“ ist ein fester Pfad des Hubs`);
      continue;
    }
    if (istStartseitenD(ziel.d, konfig.startseiteD)) {
      uebersprungen.push(`${listenD}: „${ziel.d}“ steht nicht im Menü — das Logo verlinkt dorthin`);
      continue;
    }
    const { artikel } = artikelAusSpiegel(inhalt, { d: ziel.d });
    if (!artikel) {
      uebersprungen.push(`${listenD}: „${ziel.d}“ liegt nicht im Spiegel`);
      continue;
    }
    gesehen.add(ziel.d);
    eintraege.push({ titel: artikel.titel, pfad: beitragsPfad(artikel), d: artikel.d });
  }
  return { eintraege, vorhanden: 'ok' };
}

/** @param {Inhalt} inhalt @param {Konfig} konfig @returns {Struktur} */
export function strukturLaden(inhalt, konfig) {
  /** @type {string[]} */
  const uebersprungen = [];
  const profil = profilAusEvent(inhalt.profil);
  const menue = eintraegeAufloesen(inhalt, konfig, konfig.navigationD, uebersprungen);
  const fusszeile = eintraegeAufloesen(inhalt, konfig, konfig.fusszeileD, uebersprungen);
  const start = artikelAusSpiegel(inhalt, { d: konfig.startseiteD });
  const wer = `von ${konfig.autor.slice(0, 12)}…`;
  return {
    profil,
    menue: menue.eintraege,
    fusszeile: fusszeile.eintraege,
    startseite: start.artikel && start.event ? { artikel: start.artikel, event: start.event } : null,
    befund: {
      profil: profil?.name ? 'ok' : 'fehlt',
      navigation: menue.vorhanden,
      fusszeile: fusszeile.vorhanden,
      startseite: start.artikel ? 'ok' : 'fehlt',
      erwartet: {
        profil: `kind:0 mit name oder display_name ${wer}`,
        navigation: `kind:30004 mit d = "${konfig.navigationD}" ${wer}`,
        fusszeile: `kind:30004 mit d = "${konfig.fusszeileD}" ${wer}`,
        startseite: `kind:30023 mit d = "${konfig.startseiteD}" ${wer}`
      },
      uebersprungen
    }
  };
}
