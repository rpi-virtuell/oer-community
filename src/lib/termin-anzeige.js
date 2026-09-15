/**
 * Die Anzeige eines Termins in Worten (ADR-0034). Rein — keine Importe außer
 * der Texttabelle —, damit Komponenten es nutzen dürfen (wie sprache.js und
 * kanonisch.js; die Datenschicht kennt die Oberfläche nicht, CLAUDE.md).
 *
 * Die Zeile steht an zwei Stellen: auf der Terminseite (Termin.svelte) und im
 * Block der Startseite (NaechsteTermine.svelte). Zweimal geschrieben liefe
 * sie auseinander — deshalb hier einmal.
 */
import { t } from './sprache.js';

/** @typedef {import('./sprache.js').Sprache} Sprache */
/**
 * Nur die Felder, die die Zeile braucht — nicht der ganze Termin, damit auch
 * eine Karte der Startseite hineinpasst.
 * @typedef {{ start: Date, ende: Date|null, ganztaegig: boolean }} Zeitraum
 */

/**
 * Der Zeitraum als eine Zeile. Ganztägige Termine tragen ihr Datum ohne
 * Zeitzone (im Event steht `YYYY-MM-DD`, gelesen als UTC-Mitternacht) und
 * werden deshalb in UTC dargestellt; zeitgebundene in Berliner Zeit — die
 * Community sitzt hier, und der Host kann anderswo stehen.
 *
 * Gleicher Tag heißt ein Datum; bei ganztägigen Terminen im selben Monat
 * nennt die erste Angabe nur den Tag („2.–3. Februar 2027"), weil Monat und
 * Jahr sich nicht ändern.
 *
 * @param {Zeitraum} termin @param {Sprache} [sprache]
 */
export function zeitraumText(termin, sprache = 'de') {
  const locale = t(sprache, 'datumsformat');
  /** Ganztägig: reines Datum (die Zeitzone steckt nicht im Event). @param {Date} d */
  const tag = (d) => d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  /** Zeitgebunden: Datum und Uhrzeit in Berliner Zeit. @param {Date} d */
  const zeit = (d) =>
    d.toLocaleString(locale, {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin'
    });
  /** Nur die Uhrzeit — für das Ende am selben Tag. @param {Date} d */
  const uhrzeit = (d) =>
    d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' });
  /** Berliner Kalendertag, um „selber Tag" zu entscheiden. @param {Date} d */
  const berlinerTag = (d) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

  const { start, ende, ganztaegig } = termin;
  if (!ende || ende.getTime() === start.getTime()) return ganztaegig ? tag(start) : zeit(start);
  if (ganztaegig) {
    const gleicherMonat =
      start.getUTCFullYear() === ende.getUTCFullYear() && start.getUTCMonth() === ende.getUTCMonth();
    // Der erste Tag als bloße Zahl: im Deutschen mit Punkt, im Englischen ohne.
    const ersterTag = locale.startsWith('de') ? `${start.getUTCDate()}.` : `${start.getUTCDate()}`;
    return gleicherMonat ? `${ersterTag}–${tag(ende)}` : `${tag(start)} – ${tag(ende)}`;
  }
  // Endet der Termin am selben Tag, genügt die Uhrzeit — das Datum zweimal
  // zu nennen liest sich wie zwei Termine.
  return berlinerTag(start) === berlinerTag(ende)
    ? `${zeit(start)} – ${uhrzeit(ende)}`
    : `${zeit(start)} – ${zeit(ende)}`;
}
