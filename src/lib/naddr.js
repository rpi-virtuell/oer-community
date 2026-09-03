import { decode } from 'nostr-tools/nip19';

/**
 * @typedef {object} Adresse
 * @property {number} kind
 * @property {string} author    hex
 * @property {string} d         Kennung des ersetzbaren Events
 * @property {string[]} relays  Relay-Hinweise aus dem naddr (kann leer sein)
 */

/**
 * Dekodiert eine naddr-Adresse.
 *
 * @param {string} text
 * @returns {Adresse}
 */
export function naddrDekodieren(text) {
  const eingabe = (text ?? '').trim();
  if (eingabe === '') {
    throw new Error('Keine naddr-Adresse angegeben.');
  }

  let ergebnis;
  try {
    ergebnis = decode(eingabe);
  } catch {
    throw new Error(`Keine lesbare naddr-Adresse: ${eingabe.slice(0, 24)}…`);
  }

  if (ergebnis.type !== 'naddr') {
    throw new Error(
      `Erwartet wurde eine naddr-Adresse, gefunden: ${ergebnis.type}.`
    );
  }

  const { kind, pubkey, identifier, relays } = ergebnis.data;
  return { kind, author: pubkey, d: identifier, relays: relays ?? [] };
}
