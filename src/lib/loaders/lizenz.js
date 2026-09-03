import { nachweisAusEvents } from '../models/lizenz.js';
import { eventsVonAllen } from '../services/relay.js';

/** @typedef {import('../models/lizenz.js').Nachweis} Nachweis */

/**
 * Lädt den Lizenznachweis zu einem Bildhash.
 *
 * Fragt ALLE konfigurierten Relays — der Nachweis liegt nicht dort, wo
 * der Artikel liegt (ADR-0013, am Referenzfall geprüft: kind:1063 nur
 * auf relay-rpi.edufeed.org).
 *
 * @param {{ hash: string, relays: string[] }} eingabe
 * @returns {Promise<{ nachweis: Nachweis|null, fehler: string[] }>}
 */
export async function lizenzLaden({ hash, relays }) {
  const { events, fehler } = await eventsVonAllen(relays, {
    kinds: [1063],
    '#x': [hash]
  });
  return { nachweis: nachweisAusEvents(events), fehler };
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
