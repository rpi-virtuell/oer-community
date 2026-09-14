import { artikelAusEvent, dNormalisieren } from '../models/artikel.js';
import { ZUSAMMENFUEHREN_UNERREICHBAR } from '../services/spiegel.js';

/**
 * @typedef {import('../services/spiegel.js').Inhalt} Inhalt
 * @typedef {import('../services/spiegel.js').Event} Event
 * @typedef {import('../konfig.js').Konfig} Konfig
 * @typedef {import('../models/artikel.js').Artikel} Artikel
 * @typedef {import('../models/entwickleransicht.js').Abfrage} Abfrage
 */

/** @param {string[][]} tags @param {string} name */
const tagWert = (tags, name) => tags.find((t) => t[0] === name && t.length > 1)?.[1] ?? null;

/**
 * Ein Beitrag aus dem Spiegel über sein d (ADR-0029) — optional nur in einer
 * Sprache. Kein Relay wird gefragt; was nicht im Spiegel ist, gibt es nicht.
 *
 * @param {Inhalt} inhalt
 * @param {{ d: string, sprache?: 'de'|'en'|null }} suche
 * @returns {{ artikel: Artikel|null, event: Event|null }}
 */
export function artikelAusSpiegel(inhalt, { d, sprache = null }) {
  const gesucht = dNormalisieren(d);
  for (const event of inhalt.artikel) {
    if (dNormalisieren(tagWert(event.tags ?? [], 'd') ?? '') !== gesucht) continue;
    const artikel = artikelAusEvent(event);
    if (sprache && artikel.sprache !== sprache) continue;
    return { artikel, event };
  }
  return { artikel: null, event: null };
}

/**
 * Der Stand des Spiegels in der Form, die die Entwickleransicht seit dem
 * ersten Durchstich kennt — dieselbe Auskunft, ehrlich datiert (ADR-0028).
 * `ohneTreffer` sind Relays, die im Lauf antworteten, dieses Event aber
 * nicht lieferten.
 *
 * @param {Inhalt} inhalt @param {Konfig} konfig @param {Event|null} event
 * @returns {Abfrage}
 */
export function abfrageAusStand(inhalt, konfig, event) {
  const stand = inhalt.stand;
  if (!stand) {
    return { gefragteRelays: konfig.relays, fehler: konfig.relays, ohneTreffer: [], quellen: {}, grund: ZUSAMMENFUEHREN_UNERREICHBAR };
  }
  const lieferanten = event ? (inhalt.quellen[event.id] ?? []) : [];
  const antwortend = stand.gefragteRelays.filter((r) => !stand.nichtErreichbar.includes(r));
  return {
    gefragteRelays: stand.gefragteRelays,
    fehler: stand.nichtErreichbar,
    // Ohne Event hat kein antwortendes Relay geliefert — alle stehen ohne Treffer da.
    ohneTreffer: event ? antwortend.filter((r) => !lieferanten.includes(r)) : antwortend,
    quellen: event ? { [event.id]: lieferanten } : {},
    grund: null
  };
}
