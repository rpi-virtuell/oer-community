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
 * **Die Relay-Hinweise aus dem `naddr` werden ignoriert.** Ein `naddr`
 * kommt aus der URL und damit von aussen: Wer ihn baut, bestimmt seine
 * Hinweise. Würden sie gefragt, könnte ein Fremder den Server zu
 * beliebigen Zielen verbinden lassen — auch ins interne Netz oder auf
 * `127.0.0.1` (ADR-0016). Gefragt werden nur die konfigurierten Relays.
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
    // Bewusst ohne adresse.relays — siehe oben.
    relays,
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
