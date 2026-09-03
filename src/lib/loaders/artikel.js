import { artikelAusEvent } from '../models/artikel.js';
import { eventsVonAllen } from '../services/relay.js';

/**
 * @typedef {import('../naddr.js').Adresse} Adresse
 * @typedef {import('../models/artikel.js').Artikel} Artikel
 */

/**
 * Lädt einen Artikel über seine naddr-Bestandteile.
 *
 * Gefragt werden die Relay-Hinweise aus dem naddr **und** die
 * konfigurierten Relays — ein Hinweis kann veraltet sein.
 *
 * @param {{ adresse: Adresse, relays: string[] }} eingabe
 * @returns {Promise<{ artikel: Artikel|null, gefragteRelays: string[], fehler: string[] }>}
 */
export async function artikelLaden({ adresse, relays }) {
  const gefragteRelays = [...new Set([...adresse.relays, ...relays])];

  const { events, fehler } = await eventsVonAllen(gefragteRelays, {
    kinds: [adresse.kind],
    authors: [adresse.author],
    '#d': [adresse.d]
  });

  if (events.length === 0) {
    return { artikel: null, gefragteRelays, fehler };
  }

  // Ersetzbare Events: das neueste gewinnt.
  const neuestes = events.reduce((a, b) => (b.created_at > a.created_at ? b : a));
  return { artikel: artikelAusEvent(neuestes), gefragteRelays, fehler };
}
