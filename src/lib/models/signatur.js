/**
 * Ist ein Event echt? Signatur **und** Event-Hash (ADR-0017, ADR-0036).
 *
 * **`verifyEvent` allein genügt nicht.** Es prüft `sig` gegen `id` — nicht
 * gegen den Inhalt. Wer `content` oder `tags` verändert und `id` und `sig`
 * unangetastet lässt, kommt damit durch (am Referenzfall belegt). Erst der
 * Vergleich mit `getEventHash` — die `id` als SHA-256 über die
 * NIP-01-Serialisierung — bindet die Signatur an den Inhalt.
 *
 * Eine Stelle für beide Nutzer: Der Spiegel lässt nur echte Events herein,
 * die Entwickleransicht zeigt denselben Befund. Zwei Implementierungen
 * würden auseinanderlaufen.
 *
 * `verifyEvent` merkt sich sein Ergebnis am Objekt (ein Symbol, das
 * Spread-Kopien mitnehmen) und prüft dann nicht mehr. Deshalb wird eine
 * frische Kopie der NIP-01-Felder geprüft, nie das übergebene Objekt.
 *
 * `verifyEvent` wirft bei unvollständigen Feldern — das ist kein
 * Absturzgrund, sondern das Ergebnis „nicht echt".
 */

import { getEventHash, verifyEvent } from 'nostr-tools/pure';

/** @typedef {import('../services/relay.js').Event} Event */

/**
 * @param {Event|null|undefined} event
 * @returns {boolean}
 */
export function echtesEvent(event) {
  if (!event || typeof event !== 'object') return false;
  try {
    const { id, pubkey, created_at, kind, tags, content, sig } = event;
    const frisch = { id, pubkey, created_at, kind, tags, content, sig };
    return getEventHash(frisch) === id && verifyEvent(frisch);
  } catch {
    return false;
  }
}
