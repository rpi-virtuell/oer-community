/**
 * Termine der Community (ADR-0034): h-Tag und Autor aus dem Redaktionskreis
 * — zwei Kriterien, nie eines allein (ADR-0012). Kommend/vergangen nach dem
 * Kalendertag Europe/Berlin; Bilder mit Lizenzstand wie überall.
 */
import { NICHT_ZEIGBAR, lizenzPruefen } from '../models/lizenz.js';
import { listeFinden } from '../models/liste.js';
import { naddrFuerTermin, terminAusEvent } from '../models/termin.js';
import { etagAusSpiegel, nachweiseAusSpiegel } from './lizenz.js';

/** @typedef {import('../services/spiegel.js').Inhalt} Inhalt */
/** @typedef {import('../konfig.js').Konfig} Konfig */
/** @typedef {import('../models/termin.js').Termin} Termin */
/** @typedef {import('../models/lizenz.js').Ergebnis} Ergebnis */
/** @typedef {{ termin: Termin, bild: { url: string, alt: string, lizenz: Ergebnis }|null, naddr: string, kalenderUrl: string }} Terminkarte */

export const REDAKTION_D = 'redaktion';

/** Beginn des heutigen Tages in Europe/Berlin, als UTC-Zeitpunkt. @param {Date} jetzt */
export function tagesbeginnBerlin(jetzt) {
  const teile = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(jetzt);
  // en-CA liefert YYYY-MM-DD; Mitternacht Berlin liegt je nach Sommerzeit 1
  // oder 2 Stunden vor UTC-Mitternacht.
  const utcMitternacht = new Date(`${teile}T00:00:00Z`);
  const versatzMin = new Date(utcMitternacht.toLocaleString('en-US', { timeZone: 'Europe/Berlin' })).getTime() - utcMitternacht.getTime();
  return new Date(utcMitternacht.getTime() - versatzMin);
}

/** Zugelassene Autoren: Redaktionskreis (p-Tags) plus FOERBICO und Community. @param {Inhalt} inhalt @param {Konfig} konfig */
export function zugelasseneAutoren(inhalt, konfig) {
  const liste = listeFinden(inhalt.listen, REDAKTION_D);
  const personen = liste?.personen ?? [];
  return new Set([konfig.autor, ...(konfig.community ? [konfig.community] : []), ...personen]);
}

/**
 * Das Bild eines Termins mit seinem Lizenzstand — derselbe Weg wie beim Cover
 * eines Artikels (`cover()` in loaders/uebersicht.js, ADR-0032): ausgeliefert
 * wird auch ohne Nachweis (ADR-0022); nur was sich nicht zeigen lässt
 * (NICHT_ZEIGBAR), ergibt null. Ohne x-Tag gibt es keinen Lookup.
 * @param {Inhalt} inhalt @param {Konfig} konfig @param {Termin} termin
 * @returns {{ url: string, alt: string, lizenz: Ergebnis }|null}
 */
function bild(inhalt, konfig, termin) {
  if (!termin.bildUrl) return null;
  const nachweis = termin.bildHash ? nachweiseAusSpiegel(inhalt, termin.bildHash).nachweis : null;
  const lizenz = lizenzPruefen({
    bildUrl: termin.bildUrl, bildHash: termin.bildHash, nachweis,
    etag: etagAusSpiegel(inhalt, termin.bildUrl), abgeloesteHosts: konfig.abgeloesteHosts
  });
  if (!lizenz.ok && NICHT_ZEIGBAR.includes(lizenz.grund)) return null;
  if (lizenz.ok) {
    return { url: lizenz.nachweis.url, alt: lizenz.nachweis.alt ?? lizenz.nachweis.titel ?? termin.titel, lizenz };
  }
  return { url: termin.bildUrl, alt: termin.titel, lizenz };
}

/**
 * Ein ganztägiger Termin endet am Ende seines letzten Tages. NIP-52 liest
 * `end` exklusiv (der Tag nach dem letzten), edufeed schreibt offenbar den
 * letzten Tag inklusiv — beide Lesarten überleben mit +24 h auf `ende`.
 * Die Anzeige zeigt start bis ende als Datum ohne Korrektur.
 * @param {Termin} t
 */
function letzterZeitpunkt(t) {
  const basis = t.ende ?? t.start;
  return t.ganztaegig ? new Date(basis.getTime() + 24 * 3600 * 1000) : basis;
}

/**
 * @param {Inhalt} inhalt @param {Konfig} konfig @param {{ jetzt?: () => Date }} [optionen]
 * @returns {{ kommend: Terminkarte[], vergangen: Terminkarte[], zugelassen: number, uebersprungen: string[] }}
 */
export function termineListe(inhalt, konfig, { jetzt = () => new Date() } = {}) {
  /** @type {string[]} */
  const uebersprungen = [];
  if (!konfig.community) return { kommend: [], vergangen: [], zugelassen: 0, uebersprungen };
  const autoren = zugelasseneAutoren(inhalt, konfig);
  const grenze = tagesbeginnBerlin(jetzt());
  /** @type {Terminkarte[]} */
  const karten = [];
  for (const event of inhalt.termine) {
    const termin = terminAusEvent(event);
    if (termin.community !== konfig.community) {
      uebersprungen.push(`${termin.d}: h-Tag gehört nicht zur Community`);
      continue;
    }
    if (!autoren.has(termin.autor)) {
      uebersprungen.push(`${termin.d}: Autor ${termin.autor.slice(0, 12)}… nicht im Redaktionskreis`);
      continue;
    }
    const naddr = naddrFuerTermin(termin, konfig.relays);
    karten.push({
      termin,
      bild: bild(inhalt, konfig, termin),
      naddr,
      kalenderUrl: `${konfig.edufeedUrl}/calendar/event/${naddr}`
    });
  }
  const kommend = karten
    .filter((k) => letzterZeitpunkt(k.termin) > grenze)
    .sort((a, b) => a.termin.start.getTime() - b.termin.start.getTime());
  const vergangen = karten
    .filter((k) => letzterZeitpunkt(k.termin) <= grenze)
    .sort((a, b) => b.termin.start.getTime() - a.termin.start.getTime());
  return { kommend, vergangen, zugelassen: autoren.size, uebersprungen };
}
