import { nachweisAusEvents } from '../models/lizenz.js';
import { eventsHolen, eventsVonAllen } from '../services/relay.js';

/**
 * @typedef {import('../models/lizenz.js').Nachweis} Nachweis
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
 * @returns {Promise<{ nachweis: Nachweis|null, gefragteRelays: string[],
 *   fehler: string[], grund: Abfragegrund }>}
 */
export async function lizenzLaden({ hash, relays, holen = eventsHolen }) {
  const { events, gefragt, fehler, grund } = await eventsVonAllen(
    relays,
    { kinds: [1063], '#x': [hash] },
    { holen }
  );

  return {
    nachweis: nachweisAusEvents(events),
    gefragteRelays: gefragt,
    fehler,
    grund
  };
}

/**
 * Holt den etag eines Bildes per HEAD, für Schritt 5 der Prüfkette.
 *
 * Blossom liefert den SHA-256 als etag — die Prüfung kostet damit keinen
 * Download. Scheitert die Anfrage, wird Schritt 5 übersprungen.
 *
 * @param {string} bildUrl
 * @returns {Promise<string|undefined>}
 */
export async function etagHolen(bildUrl) {
  try {
    const antwort = await fetch(bildUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    return antwort.headers.get('etag') ?? undefined;
  } catch {
    return undefined;
  }
}
