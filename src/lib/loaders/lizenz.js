import { nachweisAusEvents } from '../models/lizenz.js';
import { eventsHolen, eventsVonAllen } from '../services/relay.js';

/**
 * @typedef {import('../models/lizenz.js').Nachweis} Nachweis
 * @typedef {import('../services/relay.js').Event} Event
 * @typedef {import('../services/relay.js').Abfragegrund} Abfragegrund
 */

/**
 * Lädt den Lizenznachweis zu einem Bildhash.
 *
 * Fragt ALLE konfigurierten Relays — der Nachweis liegt nicht dort, wo
 * der Artikel liegt (ADR-0013, am Referenzfall geprüft: kind:1063 nur
 * auf relay-rpi.edufeed.org).
 *
 * `fehler` nennt nur nicht erreichbare Relays, nie eines, das antwortete und
 * den Nachweis bloß nicht besitzt — sonst käme der Erfolgsfall mit einer
 * Störungsmeldung daher. `grund` sagt, warum nichts kam, damit die
 * Oberfläche nie ohne Erklärung leer bleibt.
 *
 * @param {object} eingabe
 * @param {string} eingabe.hash
 * @param {string[]} eingabe.relays
 * @param {typeof eventsHolen} [eingabe.holen]  nur zum Prüfen austauschbar
 * `events` und `quellen` geben die Rohdaten mit heraus: welche Kandidaten es
 * gab und von welchem Relay jeder kam. Die Entwickleransicht braucht das, um
 * die Auswahl nachvollziehbar zu machen — der gewählte `nachweis` allein sagt
 * nicht, ob es Mitbewerber gab.
 *
 * @returns {Promise<{ nachweis: Nachweis|null, events: Event[],
 *   gefragteRelays: string[], fehler: string[], ohneTreffer: string[],
 *   quellen: Record<string, string[]>, grund: Abfragegrund }>}
 */
export async function lizenzLaden({ hash, relays, holen = eventsHolen }) {
  const { events, gefragt, fehler, ohneTreffer, quellen, grund } = await eventsVonAllen(
    relays,
    { kinds: [1063], '#x': [hash] },
    { holen }
  );

  return {
    nachweis: nachweisAusEvents(events),
    events,
    gefragteRelays: gefragt,
    fehler,
    ohneTreffer,
    quellen,
    grund
  };
}

// etagHolen zog nach services/blossom.js um (Task 4) — hier nur re-exportiert,
// damit bestehende Importe nicht brechen. loaders/lizenz.js wird in Task 7 ersetzt.
export { etagHolen } from '../services/blossom.js';

/**
 * Lädt die Nachweise zu **mehreren** Hashes in einer Abfrage (ADR-0023) —
 * für die Bilder im Fließtext, deren Zahl je Beitrag schwankt.
 *
 * Das Ergebnis wird nach `x` gruppiert, bevor `nachweisAusEvents` wählt:
 * Ein Nachweis zu Hash A darf nie Hash B zugeschlagen werden, nur weil er
 * in derselben Antwort kam. Ein Hash ohne Kandidaten bekommt `nachweis: null`
 * — das ist „kein Nachweis", nicht „nicht gefragt".
 *
 * @param {object} eingabe
 * @param {string[]} eingabe.hashes
 * @param {string[]} eingabe.relays
 * @param {typeof eventsHolen} [eingabe.holen]  nur zum Prüfen austauschbar
 * @returns {Promise<{
 *   nachHash: Record<string, { nachweis: Nachweis|null, events: Event[] }>,
 *   gefragteRelays: string[], fehler: string[], ohneTreffer: string[],
 *   quellen: Record<string, string[]>, grund: Abfragegrund }>}
 */
export async function lizenzenLaden({ hashes, relays, holen = eventsHolen }) {
  const gesucht = [...new Set(hashes)];
  const { events, gefragt, fehler, ohneTreffer, quellen, grund } = await eventsVonAllen(
    relays,
    { kinds: [1063], '#x': gesucht },
    { holen }
  );

  /** @type {Record<string, { nachweis: Nachweis|null, events: Event[] }>} */
  const nachHash = {};
  for (const hash of gesucht) {
    const eigene = events.filter((e) =>
      (e.tags ?? []).some((t) => t[0] === 'x' && t[1] === hash)
    );
    nachHash[hash] = { nachweis: nachweisAusEvents(eigene), events: eigene };
  }

  return { nachHash, gefragteRelays: gefragt, fehler, ohneTreffer, quellen, grund };
}
