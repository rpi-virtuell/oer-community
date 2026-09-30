/**
 * Lädt einen Beitrag samt Lizenzauflösung — die gemeinsame Vorarbeit von
 * Artikelseite und Entwickleransicht.
 *
 * **Warum gemeinsam:** Beide Ansichten brauchen dieselben Wächter aus
 * ADR-0016 — Adressprüfung gegen die eigene Quelle, Relay-Hinweise aus dem
 * `naddr` ignoriert. Lägen sie zweimal vor, wäre die JSON-Route der Umweg,
 * sobald einer davon in einer Kopie vergessen wird.
 *
 * **Seit ADR-0028 wird kein Relay mehr gefragt.** Die Quelle ist der
 * Spiegel (`services/spiegel.js`) — ein vorab gebauter, vollständiger
 * Stand im Speicher. Was nicht im Spiegel steht, gibt es nicht; ein neuer
 * Lauf des Spiegels holt es nach, nicht diese Funktion.
 *
 * Diese Datei kennt die Oberfläche nicht: Sie wirft keinen SvelteKit-Fehler,
 * sondern liefert `ok: false` mit Status und Meldung. Die Route entscheidet,
 * was sie daraus macht.
 */

import { npubEncode } from 'nostr-tools/nip19';
import { inhaltAufbereiten } from '../inhalt.js';
import { ABLEHNUNG_TEXT, adressePruefen } from '../models/adresse.js';
import { lizenzPruefen } from '../models/lizenz.js';
import { personAusEvent } from '../models/profil.js';
import { abfrageAusStand, artikelAusSpiegel } from './artikel.js';
import { etagAusSpiegel, nachweiseAusSpiegel } from './lizenz.js';

/**
 * @typedef {import('../naddr.js').Adresse} Adresse
 * @typedef {import('../konfig.js').Konfig} Konfig
 * @typedef {import('../services/spiegel.js').Inhalt} Inhalt
 * @typedef {import('../services/spiegel.js').Event} Event
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
 * @property {import('../inhalt.js').Teil[]} teile
 * @property {Record<string, import('../models/lizenz.js').Ergebnis>} fliesstext  je Hash eines Textbildes
 * @property {string[]} entfernteBilder
 * @property {Record<string, PersonAnzeige>} personen  je pubkey einer Personenkarte (ADR-0039)
 * @property {string[]} fehlendeProfile  npubs der Verweise, zu denen kein kind:0 im Spiegel liegt
 */

/**
 * Eine Person, wie die Karte sie braucht: das Modell plus die gesäuberte
 * Selbstbeschreibung. Bilder im `about` fallen weg wie überall (ADR-0015).
 * @typedef {Omit<import('../models/profil.js').Person, 'about'> & { aboutHtml: string }} PersonAnzeige
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
 * @param {Inhalt} eingabe.inhalt
 * @returns {Promise<Beitrag|Absage>}
 */
export async function beitragLaden({ adresse, konfig, inhalt }) {
  // Der naddr kommt von aussen: nur die eigene Quelle wird angezeigt
  // (ADR-0016). Sonst wäre dies ein offener Nostr-Renderer.
  const zulaessig = adressePruefen(adresse, konfig);
  if (!zulaessig.ok) {
    return { ok: false, status: 404, meldung: ABLEHNUNG_TEXT[zulaessig.grund] };
  }

  if (inhalt.stand === null) {
    return {
      ok: false, status: 503,
      meldung: `Noch kein Stand vom Relay. Gefragt wurden: ${konfig.relays.join(', ')}. Verbindung und RELAYS in der .env prüfen.`
    };
  }

  const { artikel, event: artikelEvent } = artikelAusSpiegel(inhalt, { d: adresse.d });
  if (!artikel || !artikelEvent) {
    return {
      ok: false, status: 404,
      meldung: `Kein Beitrag mit d="${adresse.d}" von ${adresse.author.slice(0, 12)}… im Stand vom ${inhalt.stand.zeitpunkt}. Gefragt wurden: ${inhalt.stand.gefragteRelays.join(', ')}.`
    };
  }

  const artikelAbfrage = abfrageAusStand(inhalt, konfig, artikelEvent);
  const gesucht = artikel.bildHash ? nachweiseAusSpiegel(inhalt, artikel.bildHash) : null;
  const nachweisEvent = gesucht?.nachweis ? (gesucht.events.find((e) => e.id === gesucht.nachweis?.id) ?? null) : null;
  const lizenzAbfrage = artikel.bildHash ? abfrageAusStand(inhalt, konfig, nachweisEvent) : { ...NICHT_GEFRAGT };
  const etag = etagAusSpiegel(inhalt, artikel.bildUrl);
  const nachweis = gesucht?.nachweis ?? null;
  const hosts = konfig.abgeloesteHosts;

  const lizenz = lizenzPruefen({ bildUrl: artikel.bildUrl, bildHash: artikel.bildHash, nachweis, etag, abgeloesteHosts: hosts });
  const { teile, entfernteBilder } = inhaltAufbereiten(artikel.inhalt, { abgeloesteHosts: hosts });

  // Bilder im Fließtext mit Hash-URL (ADR-0023): je Hash einmal auflösen.
  // Zeigt der Text das Cover noch einmal — der Referenzfall —, ist das
  // derselbe Hash und derselbe Nachweis; keine zweite Auflösung.
  /** @type {Record<string, import('../models/lizenz.js').Ergebnis>} */
  const fliesstext = {};
  /** @type {Set<string>} */
  const gesehen = new Set();
  for (const teil of teile) {
    if (teil.art !== 'bild' || gesehen.has(teil.hash)) continue;
    gesehen.add(teil.hash);
    const eigener = teil.hash === artikel.bildHash ? nachweis : nachweiseAusSpiegel(inhalt, teil.hash).nachweis;
    fliesstext[teil.hash] = lizenzPruefen({
      bildUrl: teil.url, bildHash: teil.hash, nachweis: eigener,
      etag: etagAusSpiegel(inhalt, teil.url), abgeloesteHosts: hosts
    });
  }

  // Personenkarten (ADR-0039): je pubkey das Profil aus dem Spiegel. Fehlt
  // es, steht die Karte nicht leer da, sondern der Schlüssel im Hinweis.
  /** @type {Record<string, PersonAnzeige>} */
  const personen = {};
  /** @type {Set<string>} */
  const ohneProfil = new Set();
  for (const teil of teile) {
    if (teil.art !== 'person' || teil.pubkey in personen || ohneProfil.has(teil.pubkey)) continue;
    const person = personAusEvent((inhalt.personen ?? []).find((e) => e.pubkey === teil.pubkey) ?? null);
    if (!person) {
      ohneProfil.add(teil.pubkey);
      continue;
    }
    const { about, ...rest } = person;
    const aboutHtml = about
      ? inhaltAufbereiten(about).teile.map((t) => (t.art === 'html' ? t.html : '')).join('')
      : '';
    personen[teil.pubkey] = { ...rest, aboutHtml };
  }
  const fehlendeProfile = [...ohneProfil].map((p) => npubEncode(p));

  return { ok: true, artikel, artikelEvent, artikelAbfrage, lizenzEvents: gesucht?.events ?? [], lizenzAbfrage, nachweis, etag, lizenz, teile, fliesstext, entfernteBilder, personen, fehlendeProfile };
}
