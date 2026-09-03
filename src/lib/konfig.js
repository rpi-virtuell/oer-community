/**
 * @typedef {object} Konfig
 * @property {string} autor         Autorenschlüssel der Quelle (hex, 64)
 * @property {string|null} hTag     zweites Filterkriterium, oder null
 * @property {string[]} relays      mindestens eines, alle wss://
 * @property {string} blossomUrl    Basisadresse des Bildspeichers
 */

const HEX64 = /^[0-9a-f]{64}$/;

/**
 * Liest die Konfiguration und bricht bei fehlendem Pflichtwert ab.
 * Lieber hier abbrechen als später leere Seiten liefern (CLAUDE.md).
 *
 * @param {Record<string, string|undefined>} quelle
 * @returns {Konfig}
 */
export function konfigLesen(quelle) {
  const autor = (quelle.QUELLE_AUTOR ?? '').trim();
  if (!HEX64.test(autor)) {
    throw new Error(
      'QUELLE_AUTOR fehlt oder ist kein 64-stelliger Hex-Schlüssel. ' +
        'In .env eintragen — siehe .env.example.'
    );
  }

  const relays = (quelle.RELAYS ?? '')
    .split(',')
    .map((r) => r.trim())
    .filter((r) => r.length > 0);
  if (relays.length === 0) {
    throw new Error(
      'RELAYS fehlt. Mindestens ein Relay angeben, komma-getrennt — ' +
        'z. B. wss://relay.edufeed.org/,wss://relay-rpi.edufeed.org/'
    );
  }
  const falsch = relays.filter((r) => !r.startsWith('wss://'));
  if (falsch.length > 0) {
    throw new Error(`RELAYS: keine wss-Adresse: ${falsch.join(', ')}`);
  }

  const blossomUrl = (quelle.BLOSSOM_URL ?? '').trim();
  if (!blossomUrl.startsWith('https://')) {
    throw new Error(
      'BLOSSOM_URL fehlt oder ist nicht https — z. B. https://blossom.edufeed.org/'
    );
  }

  const rohHTag = (quelle.QUELLE_H_TAG ?? '').trim();
  return { autor, hTag: rohHTag === '' ? null : rohHTag, relays, blossomUrl };
}
