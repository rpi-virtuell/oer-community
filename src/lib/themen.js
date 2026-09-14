/**
 * Themen normalisieren (CLAUDE.md): Die Tabelle daten/themen.json ist
 * Redaktionsarbeit — Schlüssel ist die Anzeigeform, die Liste sind
 * Schreibweisen, die darauf abgebildet werden. Unbekannte Themen bleiben,
 * wie sie sind; jedes Thema ist über seinen Slug filterbar.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Vergleichsform: getrimmt, klein — Schreibweisen unterscheiden sich meist nur darin. @param {string} s */
const schluessel = (s) => s.trim().toLowerCase();

/**
 * @param {string} text  JSON: { "Anzeigeform": ["Schreibweise", …] }
 * @returns {Map<string, string>}  Vergleichsform → Anzeigeform
 */
export function themenTabelleLesen(text) {
  /** @type {Record<string, string[]>} */
  const roh = JSON.parse(text);
  /** @type {Map<string, string>} */
  const tabelle = new Map();
  /** @type {Map<string, string>} */
  const normalisiert = new Map();
  /** @param {string} form @param {string} ziel */
  const eintragen = (form, ziel) => {
    const norm = schluessel(form);
    const bisher = normalisiert.get(norm);
    if (bisher && bisher !== ziel) {
      throw new Error(`daten/themen.json: "${form}" steht unter "${bisher}" und unter "${ziel}".`);
    }
    normalisiert.set(norm, ziel);
    tabelle.set(form, ziel);
  };
  for (const [anzeige, formen] of Object.entries(roh)) {
    eintragen(anzeige, anzeige);
    for (const f of formen) eintragen(f, anzeige);
  }
  return tabelle;
}

/** @param {string} name @param {Map<string, string>} tabelle */
export function themaNormalisieren(name, tabelle) {
  const normalized = schluessel(name);
  for (const [key, value] of tabelle) {
    if (schluessel(key) === normalized) {
      return value;
    }
  }
  return name.trim();
}

const UMLAUTE = /** @type {Record<string, string>} */ ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' });

/** URL-Slug eines Themas. @param {string} name */
export function themenSlug(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[äöüß]/g, (z) => UMLAUTE[z])
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** @type {Map<string, string>|null} */
let geladen = null;

/** Die Tabelle aus daten/themen.json, einmal je Prozess gelesen. */
export function themenTabelle() {
  geladen ??= themenTabelleLesen(readFileSync(resolve(process.cwd(), 'daten/themen.json'), 'utf8'));
  return geladen;
}
