import { nachweisAusEvents } from '../models/lizenz.js';
export { etagHolen } from '../services/blossom.js';

/** @typedef {import('../services/spiegel.js').Inhalt} Inhalt */

/**
 * Die Kandidaten zu einem Hash aus dem Spiegel und der gewählte Nachweis.
 * Nach x gefiltert, bevor gewählt wird — ein Nachweis zu Hash A darf nie
 * Hash B zugeschlagen werden (ADR-0023).
 * @param {Inhalt} inhalt @param {string} hash
 */
export function nachweiseAusSpiegel(inhalt, hash) {
  const events = inhalt.nachweise.filter((e) => (e.tags ?? []).some((t) => t[0] === 'x' && t[1] === hash));
  return { nachweis: nachweisAusEvents(events), events };
}

/** @param {Inhalt} inhalt @param {string|null} url */
export function etagAusSpiegel(inhalt, url) {
  return url ? inhalt.etags[url] : undefined;
}
