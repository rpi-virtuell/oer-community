import { artikelAusEvent } from '../models/artikel.js';
import { eventsHolen, eventsVonAllen } from '../services/relay.js';

/**
 * @typedef {import('../naddr.js').Adresse} Adresse
 * @typedef {import('../models/artikel.js').Artikel} Artikel
 * @typedef {import('../services/relay.js').Event} Event
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
 * `event` gibt das unveränderte Event mit heraus, `quellen` seine Herkunft.
 * Die Entwickleransicht zeigt beides; der aufbereitete `artikel` hat Tags und
 * Signatur schon verloren.
 *
 * @returns {Promise<{ artikel: Artikel|null, event: Event|null,
 *   gefragteRelays: string[], fehler: string[], ohneTreffer: string[],
 *   quellen: Record<string, string[]>, grund: Abfragegrund }>}
 */
export async function artikelLaden({ adresse, relays, holen = eventsHolen }) {
  const { events, gefragt, fehler, ohneTreffer, quellen, grund } = await eventsVonAllen(
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
    return {
      artikel: null,
      event: null,
      gefragteRelays: gefragt,
      fehler,
      ohneTreffer,
      quellen,
      grund
    };
  }

  // Ersetzbare Events: das neueste gewinnt.
  const neuestes = events.reduce((a, b) => (b.created_at > a.created_at ? b : a));
  return {
    artikel: artikelAusEvent(neuestes),
    event: neuestes,
    gefragteRelays: gefragt,
    fehler,
    ohneTreffer,
    // Nur die Herkunft des gewählten Events — die der verworfenen
    // Vorgängerversionen wäre hier irreführend.
    quellen: quellen[neuestes.id] ? { [neuestes.id]: quellen[neuestes.id] } : {},
    grund
  };
}
