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

const ZEITSCHRANKE_MS = 8000;

/**
 * Fragt ein Relay mit einem Filter ab.
 *
 * Liefert bei Verbindungsfehler eine leere Liste statt zu werfen — ein
 * nicht erreichbares Relay ist ein Betriebszustand, kein Programmfehler.
 * Wer wissen muss, ob es klappte, nimmt eventsVonAllen.
 *
 * @param {string} relayUrl
 * @param {Filter} filter
 * @param {{ zeitschrankeMs?: number }} [optionen]
 * @returns {Promise<Event[]>}
 */
export function eventsHolen(relayUrl, filter, optionen = {}) {
  const grenze = optionen.zeitschrankeMs ?? ZEITSCHRANKE_MS;

  return new Promise((fertig) => {
    /** @type {Event[]} */
    const gesammelt = [];
    let abgeschlossen = false;
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
      fertig(gesammelt);
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
        beenden();
      }
    });

    ws.on('error', () => beenden());
    ws.on('close', () => beenden());
  });
}

/**
 * Fragt mehrere Relays parallel und führt die Ergebnisse zusammen.
 *
 * Nötig, weil ein Lizenznachweis nicht auf demselben Relay liegen muss
 * wie der Artikel (ADR-0013).
 *
 * @param {string[]} relayUrls
 * @param {Filter} filter
 * @param {{ zeitschrankeMs?: number }} [optionen]
 * @returns {Promise<{ events: Event[], fehler: string[] }>}
 */
export async function eventsVonAllen(relayUrls, filter, optionen = {}) {
  const ergebnisse = await Promise.all(
    relayUrls.map(async (url) => ({
      url,
      events: await eventsHolen(url, filter, optionen)
    }))
  );

  /** @type {Map<string, Event>} */
  const nachId = new Map();
  /** @type {string[]} */
  const fehler = [];

  for (const { url, events } of ergebnisse) {
    if (events.length === 0) fehler.push(url);
    for (const e of events) nachId.set(e.id, e);
  }

  return { events: [...nachId.values()], fehler };
}
