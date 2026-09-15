/**
 * Ein Termin nach NIP-52 (ADR-0034): kind 31922 ganztägig (start/end als
 * YYYY-MM-DD), kind 31923 zeitgebunden (Unix-Sekunden). Die Felder werden
 * hier direkt aus den Tags gelesen — `applesauce-common` ist nicht
 * installiert, und für fünf Tags lohnt keine Abhängigkeit. Die Community
 * steht im h-Tag.
 */
import { naddrEncode } from 'nostr-tools/nip19';

/** @typedef {import('./artikel.js').Event} Event */
/**
 * @typedef {object} Termin
 * @property {string} id
 * @property {string} autor
 * @property {string} d
 * @property {31922|31923} kind
 * @property {string} titel
 * @property {string} zusammenfassung
 * @property {string} inhalt          content (Markdown/Text)
 * @property {Date} start
 * @property {Date|null} ende
 * @property {boolean} ganztaegig
 * @property {string[]} orte
 * @property {string|null} bildUrl
 * @property {string|null} bildHash
 * @property {string|null} community  h-Tag
 */

/** @param {string[][]} tags @param {string} name */
const tagWert = (tags, name) => tags.find((t) => t[0] === name && t.length > 1)?.[1] ?? null;

/**
 * Zeitpunkt aus start/end: ganztägig `YYYY-MM-DD` (UTC-Mitternacht), sonst
 * Unix-Sekunden. Unlesbares ergibt null.
 * @param {string|null} wert @param {boolean} ganztaegig @returns {Date|null}
 */
function zeitpunkt(wert, ganztaegig) {
  if (!wert) return null;
  if (ganztaegig) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(wert.trim());
    return m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : null;
  }
  const s = Number(wert);
  return Number.isFinite(s) ? new Date(s * 1000) : null;
}

/** @param {Event} event @returns {Termin} */
export function terminAusEvent(event) {
  const tags = event.tags ?? [];
  const ganztaegig = event.kind === 31922;
  const d = tagWert(tags, 'd') ?? '';
  return {
    id: event.id, autor: event.pubkey, d,
    kind: ganztaegig ? 31922 : 31923,
    titel: tagWert(tags, 'title') ?? d,
    zusammenfassung: tagWert(tags, 'summary') ?? '',
    inhalt: event.content ?? '',
    start: zeitpunkt(tagWert(tags, 'start'), ganztaegig) ?? new Date(event.created_at * 1000),
    ende: zeitpunkt(tagWert(tags, 'end'), ganztaegig),
    ganztaegig,
    orte: tags.filter((t) => t[0] === 'location' && t.length > 1 && t[1].trim() !== '').map((t) => t[1].trim()),
    bildUrl: tagWert(tags, 'image'),
    bildHash: tagWert(tags, 'x'),
    community: tagWert(tags, 'h')
  };
}

/** Adresse des Termins für den Link in die edufeed-app. @param {Termin} termin @param {string[]} relays */
export function naddrFuerTermin(termin, relays) {
  return naddrEncode({ kind: termin.kind, pubkey: termin.autor, identifier: termin.d, relays: relays.slice(0, 2) });
}
