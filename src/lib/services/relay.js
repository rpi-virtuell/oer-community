import { WebSocket } from 'ws';

/**
 * @typedef {object} Event
 * @property {string} id
 * @property {string} pubkey
 * @property {number} created_at
 * @property {number} kind
 * @property {string[][]} tags
 * @property {string} content
 * @property {string} sig
 */

/** @typedef {Record<string, unknown>} Filter */

/**
 * Antwort eines einzelnen Relays.
 *
 * `erreicht` trennt „hat geantwortet" von „war nicht erreichbar". Ohne diese
 * Trennung gilt jedes Relay als gestört, das den Datensatz bloß nicht
 * besitzt — und ein Erfolg käme mit einer Störungsmeldung daher.
 *
 * @typedef {object} Relayantwort
 * @property {Event[]} events
 * @property {boolean} erreicht  true, sobald das Relay mit EOSE/CLOSED antwortete
 */

/**
 * Grund, warum eine Abfrage nichts liefern konnte.
 *
 * `null` heißt: mindestens ein Relay hat geantwortet, das Ergebnis ist also
 * belastbar — auch wenn es leer ist.
 *
 * @typedef {'keine-relays-konfiguriert'|'kein-relay-erreichbar'|null} Abfragegrund
 */

/** Kein Relay gefragt, weil die Liste leer war. */
export const ZUSAMMENFUEHREN_OHNE_RELAYS = 'keine-relays-konfiguriert';

/** Alle gefragten Relays waren nicht erreichbar. */
export const ZUSAMMENFUEHREN_UNERREICHBAR = 'kein-relay-erreichbar';

/** @type {Record<Exclude<Abfragegrund, null>, string>} */
export const ABFRAGEGRUND_TEXT = {
  'keine-relays-konfiguriert':
    'Es ist kein Relay konfiguriert — ohne Relay ist keine Abfrage möglich.',
  'kein-relay-erreichbar': 'Kein Relay war erreichbar.'
};

const ZEITSCHRANKE_MS = 8000;

/**
 * Fragt ein Relay mit einem Filter ab.
 *
 * Wirft bei Verbindungsfehler nicht, sondern liefert `erreicht: false` — ein
 * nicht erreichbares Relay ist ein Betriebszustand, kein Programmfehler.
 * `erreicht: true` mit leerer Liste heißt: Das Relay hat geantwortet und
 * besitzt den Datensatz nicht.
 *
 * @param {string} relayUrl
 * @param {Filter} filter
 * @param {{ zeitschrankeMs?: number }} [optionen]
 * @returns {Promise<Relayantwort>}
 */
export function eventsHolen(relayUrl, filter, optionen = {}) {
  const grenze = optionen.zeitschrankeMs ?? ZEITSCHRANKE_MS;

  return new Promise((fertig) => {
    /** @type {Event[]} */
    const gesammelt = [];
    let abgeschlossen = false;
    let erreicht = false;
    /** @type {WebSocket|null} */
    let ws = null;

    const uhr = setTimeout(() => beenden(), grenze);

    function beenden() {
      if (abgeschlossen) return;
      abgeschlossen = true;
      clearTimeout(uhr);
      try {
        ws?.close();
      } catch {
        // Schließen darf scheitern, das Ergebnis steht schon fest.
      }
      fertig({ events: gesammelt, erreicht });
    }

    try {
      ws = new WebSocket(relayUrl);
    } catch {
      beenden();
      return;
    }

    ws.on('open', () => {
      ws?.send(JSON.stringify(['REQ', 'abfrage', filter]));
    });

    ws.on('message', (rohdaten) => {
      let nachricht;
      try {
        nachricht = JSON.parse(rohdaten.toString());
      } catch {
        return;
      }
      if (!Array.isArray(nachricht)) return;

      const [art] = nachricht;
      if (art === 'EVENT' && nachricht[2]) {
        gesammelt.push(nachricht[2]);
      } else if (art === 'EOSE' || art === 'CLOSED') {
        // Eine vollständige Antwort — auch eine leere ist eine Antwort.
        erreicht = true;
        beenden();
      }
    });

    ws.on('error', () => beenden());
    ws.on('close', () => beenden());
  });
}

/**
 * @typedef {object} Sammelergebnis
 * @property {Event[]} events        dedupliziert nach id
 * @property {string[]} gefragt      alle gefragten Relays
 * @property {string[]} fehler       Relays, die nicht erreichbar waren
 * @property {string[]} ohneTreffer  Relays, die antworteten und nichts hatten
 * @property {Abfragegrund} grund    warum nichts kam, sonst null
 */

/**
 * Fragt mehrere Relays parallel und führt die Ergebnisse zusammen.
 *
 * Nötig, weil ein Lizenznachweis nicht auf demselben Relay liegen muss
 * wie der Artikel (ADR-0013).
 *
 * `fehler` nennt ausschließlich nicht erreichbare Relays. Ein Relay, das
 * antwortet und den Datensatz nicht besitzt, steht in `ohneTreffer` und ist
 * keine Störung. `grund` ist gesetzt, wenn gar keine belastbare Antwort
 * zustande kam — eine leere Relay-Liste bleibt so nicht unerklärt
 * („Nie eine leere Liste ohne Erklärung", CLAUDE.md).
 *
 * @param {string[]} relayUrls
 * @param {Filter} filter
 * @param {{ zeitschrankeMs?: number, holen?: typeof eventsHolen }} [optionen]
 * @returns {Promise<Sammelergebnis>}
 */
export async function eventsVonAllen(relayUrls, filter, optionen = {}) {
  const { holen = eventsHolen, ...abfrageoptionen } = optionen;
  const gefragt = [...new Set(relayUrls ?? [])];

  if (gefragt.length === 0) {
    return {
      events: [],
      gefragt,
      fehler: [],
      ohneTreffer: [],
      grund: ZUSAMMENFUEHREN_OHNE_RELAYS
    };
  }

  const ergebnisse = await Promise.all(
    gefragt.map(async (url) => ({
      url,
      antwort: await holen(url, filter, abfrageoptionen)
    }))
  );

  /** @type {Map<string, Event>} */
  const nachId = new Map();
  /** @type {string[]} */
  const fehler = [];
  /** @type {string[]} */
  const ohneTreffer = [];

  for (const { url, antwort } of ergebnisse) {
    if (!antwort.erreicht) {
      fehler.push(url);
    } else if (antwort.events.length === 0) {
      ohneTreffer.push(url);
    }
    for (const e of antwort.events) nachId.set(e.id, e);
  }

  const keinesErreicht = fehler.length === gefragt.length;

  return {
    events: [...nachId.values()],
    gefragt,
    fehler,
    ohneTreffer,
    grund: keinesErreicht ? ZUSAMMENFUEHREN_UNERREICHBAR : null
  };
}
