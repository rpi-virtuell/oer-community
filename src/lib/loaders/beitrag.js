/**
 * Lädt einen Beitrag samt Lizenzauflösung — die gemeinsame Vorarbeit von
 * Artikelseite und Entwickleransicht.
 *
 * **Warum gemeinsam:** Beide Ansichten brauchen dieselben Wächter aus
 * ADR-0016 — Adressprüfung gegen die eigene Quelle, Relay-Hinweise aus dem
 * `naddr` ignoriert. Lägen sie zweimal vor, wäre die JSON-Route der Umweg,
 * sobald einer davon in einer Kopie vergessen wird.
 *
 * Diese Datei kennt die Oberfläche nicht: Sie wirft keinen SvelteKit-Fehler,
 * sondern liefert `ok: false` mit Status und Meldung. Die Route entscheidet,
 * was sie daraus macht.
 */

import { inhaltAufbereiten } from '../inhalt.js';
import { ABLEHNUNG_TEXT, adressePruefen } from '../models/adresse.js';
import { lizenzPruefen } from '../models/lizenz.js';
import { eventsHolen } from '../services/relay.js';
import { artikelLaden } from './artikel.js';
import { etagHolen as etagHolenEcht, lizenzLaden } from './lizenz.js';

/**
 * @typedef {import('../naddr.js').Adresse} Adresse
 * @typedef {import('../konfig.js').Konfig} Konfig
 * @typedef {import('../services/relay.js').Event} Event
 * @typedef {import('../models/artikel.js').Artikel} Artikel
 * @typedef {import('../models/lizenz.js').Nachweis} Nachweis
 * @typedef {import('../models/entwickleransicht.js').Abfrage} Abfrage
 */

/**
 * @typedef {object} Beitrag
 * @property {true} ok
 * @property {Artikel} artikel
 * @property {Event} artikelEvent
 * @property {Abfrage} artikelAbfrage
 * @property {Event[]} lizenzEvents
 * @property {Abfrage} lizenzAbfrage
 * @property {Nachweis|null} nachweis
 * @property {string|undefined} etag
 * @property {import('../models/lizenz.js').Ergebnis} lizenz
 * @property {string} html
 * @property {string[]} entfernteBilder
 */

/**
 * @typedef {{ ok: false, status: 400|404|503, meldung: string }} Absage
 */

/** Eine Abfrage, die gar nicht stattfand — mangels Hash (CLAUDE.md). */
const NICHT_GEFRAGT = {
  gefragteRelays: [],
  fehler: [],
  ohneTreffer: [],
  quellen: {},
  grund: null
};

/**
 * @param {object} eingabe
 * @param {Adresse} eingabe.adresse
 * @param {Konfig} eingabe.konfig
 * @param {typeof eventsHolen} [eingabe.holen]          nur zum Prüfen austauschbar
 * @param {(bildUrl: string) => Promise<string|undefined>} [eingabe.etagHolen]
 * @returns {Promise<Beitrag|Absage>}
 */
export async function beitragLaden({
  adresse,
  konfig,
  holen = eventsHolen,
  etagHolen = etagHolenEcht
}) {
  // Der naddr kommt von aussen: nur die eigene Quelle wird angezeigt
  // (ADR-0016). Sonst wäre dies ein offener Nostr-Renderer.
  const zulaessig = adressePruefen(adresse, konfig);
  if (!zulaessig.ok) {
    return { ok: false, status: 404, meldung: ABLEHNUNG_TEXT[zulaessig.grund] };
  }

  const artikelErgebnis = await artikelLaden({
    adresse,
    relays: konfig.relays,
    holen
  });

  const { artikel, event: artikelEvent, gefragteRelays, grund } = artikelErgebnis;

  if (!artikel || !artikelEvent) {
    // `grund` unterscheidet „keines erreichbar" von „hat geantwortet und
    // nichts". Nur so heisst 404 wirklich 404.
    if (grund !== null) {
      return {
        ok: false,
        status: 503,
        meldung:
          `Kein Relay hat geantwortet. Gefragt wurden: ${gefragteRelays.join(', ')}. ` +
          'Verbindung und RELAYS in der .env prüfen.'
      };
    }
    return {
      ok: false,
      status: 404,
      meldung:
        `Kein Artikel mit d="${adresse.d}" von ${adresse.author.slice(0, 12)}… gefunden. ` +
        `Gefragt wurden: ${gefragteRelays.join(', ')}.`
    };
  }

  const artikelAbfrage = {
    gefragteRelays,
    fehler: artikelErgebnis.fehler,
    ohneTreffer: artikelErgebnis.ohneTreffer,
    quellen: artikelErgebnis.quellen,
    grund
  };

  // Ohne x-Tag am Artikel gibt es keinen Lookup: kein Hash, keine Frage
  // (CLAUDE.md). Das ist eine fehlende Angabe, kein fehlender Nachweis.
  const lizenzErgebnis = artikel.bildHash
    ? await lizenzLaden({ hash: artikel.bildHash, relays: konfig.relays, holen })
    : null;

  const lizenzAbfrage = lizenzErgebnis
    ? {
        gefragteRelays: lizenzErgebnis.gefragteRelays,
        fehler: lizenzErgebnis.fehler,
        ohneTreffer: lizenzErgebnis.ohneTreffer,
        quellen: lizenzErgebnis.quellen,
        grund: lizenzErgebnis.grund
      }
    : { ...NICHT_GEFRAGT };

  const etag =
    artikel.bildUrl && /^https?:\/\//.test(artikel.bildUrl)
      ? await etagHolen(artikel.bildUrl)
      : undefined;

  const nachweis = lizenzErgebnis?.nachweis ?? null;

  const lizenz = lizenzPruefen({
    bildUrl: artikel.bildUrl,
    bildHash: artikel.bildHash,
    nachweis,
    etag
  });

  const { html, entfernteBilder } = inhaltAufbereiten(artikel.inhalt);

  return {
    ok: true,
    artikel,
    artikelEvent,
    artikelAbfrage,
    lizenzEvents: lizenzErgebnis?.events ?? [],
    lizenzAbfrage,
    nachweis,
    etag,
    lizenz,
    html,
    entfernteBilder
  };
}
