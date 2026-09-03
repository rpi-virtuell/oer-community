import { artikelAusEvent } from '../models/artikel.js';
import { eventsHolen, eventsVonAllen } from '../services/relay.js';

/**
 * @typedef {import('../naddr.js').Adresse} Adresse
 * @typedef {import('../models/artikel.js').Artikel} Artikel
 * @typedef {import('../services/relay.js').Abfragegrund} Abfragegrund
 */

/**
 * Lädt einen Artikel über seine naddr-Bestandteile.
 *
 * Gefragt werden die Relay-Hinweise aus dem naddr **und** die
 * konfigurierten Relays — ein Hinweis kann veraltet sein.
 *
 * `fehler` nennt nur nicht erreichbare Relays; ein Relay, das antwortet und
 * den Artikel nicht besitzt, ist keine Störung. `grund` nennt die Ursache,
 * wenn keine belastbare Antwort zustande kam.
 *
 * @param {object} eingabe
 * @param {Adresse} eingabe.adresse
 * @param {string[]} eingabe.relays
 * @param {typeof eventsHolen} [eingabe.holen]  nur zum Prüfen austauschbar
 * @returns {Promise<{ artikel: Artikel|null, gefragteRelays: string[],
 *   fehler: string[], grund: Abfragegrund }>}
 */
export async function artikelLaden({ adresse, relays, holen = eventsHolen }) {
  const { events, gefragt, fehler, grund } = await eventsVonAllen(
    [...adresse.relays, ...relays],
    {
      kinds: [adresse.kind],
      authors: [adresse.author],
      '#d': [adresse.d]
    },
    { holen }
  );

  if (events.length === 0) {
    return { artikel: null, gefragteRelays: gefragt, fehler, grund };
  }

  // Ersetzbare Events: das neueste gewinnt.
  const neuestes = events.reduce((a, b) => (b.created_at > a.created_at ? b : a));
  return { artikel: artikelAusEvent(neuestes), gefragteRelays: gefragt, fehler, grund };
}
