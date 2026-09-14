/**
 * Der Spiegel: alle Events, die der Hub braucht, im Speicher (ADR-0028).
 *
 * Ein Lauf baut einen vollständigen neuen Stand über ALLE konfigurierten
 * Relays und tauscht ihn atomar ein — Leser sehen nie einen halben Stand.
 * Gültig ist ein Lauf, wenn mindestens ein Relay die Artikelabfrage
 * beantwortet hat; ein ungültiger Lauf ersetzt nichts und wird als
 * Fehlschlag gemerkt, damit die Fußzeile das Alter nennen kann.
 *
 * Diese Datei ist die EINZIGE, die `services/relay.js` importiert
 * (Architekturtest). Sie kennt die Oberfläche nicht.
 */

import { hashAusUrl } from '../models/lizenz.js';
import { etagHolen as etagHolenEcht } from './blossom.js';
import { eventsHolen, eventsVonAllen } from './relay.js';

/** @typedef {import('./relay.js').Event} Event */
/** @typedef {import('../konfig.js').Konfig} Konfig */
/**
 * @typedef {object} Stand
 * @property {string} zeitpunkt
 * @property {number} dauerMs
 * @property {string[]} gefragteRelays
 * @property {string[]} nichtErreichbar
 * @property {{ artikel: number, listen: number, nachweise: number, profil: number }} anzahl
 */
/**
 * @typedef {object} Inhalt
 * @property {Stand|null} stand
 * @property {Event[]} artikel
 * @property {Event[]} listen
 * @property {Event|null} profil
 * @property {Event[]} nachweise
 * @property {Record<string, string[]>} quellen
 * @property {Record<string, string>} etags
 */
/** @typedef {{ zeitpunkt: string, gefragteRelays: string[] }} Fehlschlag */

/** Bild-Syntax in Markdown — dieselbe Regex wie inhalt.js und mdparser. */
const BILD = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
/** Relays begrenzen Filtergrößen; 50 Hashes je REQ sind überall sicher. */
const BLOCK = 50;

/** @returns {Inhalt} */
export function leererInhalt() {
  return { stand: null, artikel: [], listen: [], profil: null, nachweise: [], quellen: {}, etags: {} };
}

/** @param {string[][]} tags @param {string} name */
const tagWert = (tags, name) => tags.find((t) => t[0] === name && t.length > 1)?.[1] ?? null;

/** Neuestes created_at gewinnt, Gleichstand kleinste id — wie nachweisAusEvents. @param {Event} a @param {Event} b */
const neuer = (a, b) => (b.created_at !== a.created_at ? b.created_at - a.created_at : a.id.localeCompare(b.id));

/**
 * Ersetzbare Events: je d nur das neueste.
 * @param {Event[]} events @returns {Event[]}
 */
export function neuestesJeD(events) {
  /** @type {Map<string, Event>} */
  const nachD = new Map();
  for (const e of events) {
    const d = tagWert(e.tags ?? [], 'd') ?? '';
    const bisher = nachD.get(d);
    if (!bisher || neuer(bisher, e) > 0) nachD.set(d, e);
  }
  return [...nachD.values()];
}

/**
 * Alle Bild-URLs eines Bestands: image-Tags und Bilder im Markdown.
 * @param {Event[]} artikel @returns {string[]}
 */
export function bildUrlsSammeln(artikel) {
  /** @type {Set<string>} */
  const urls = new Set();
  for (const e of artikel) {
    const cover = tagWert(e.tags ?? [], 'image');
    if (cover) urls.add(cover);
    for (const treffer of (e.content ?? '').matchAll(BILD)) urls.add(treffer[1]);
  }
  return [...urls];
}

/**
 * Alle Hashes, zu denen ein Nachweis gesucht wird: x-Tags plus Hashes aus
 * Hash-URLs (ADR-0023). Kein Hash wird erraten.
 * @param {Event[]} artikel @returns {string[]}
 */
export function hashesSammeln(artikel) {
  /** @type {Set<string>} */
  const hashes = new Set();
  for (const e of artikel) {
    for (const t of e.tags ?? []) if (t[0] === 'x' && /^[0-9a-f]{64}$/i.test(t[1] ?? '')) hashes.add(t[1].toLowerCase());
  }
  for (const url of bildUrlsSammeln(artikel)) {
    const h = hashAusUrl(url);
    if (h) hashes.add(h);
  }
  return [...hashes];
}

/**
 * @param {object} eingabe
 * @param {Konfig} eingabe.konfig
 * @param {typeof eventsHolen} [eingabe.holen]        nur zum Prüfen austauschbar
 * @param {typeof etagHolenEcht} [eingabe.etagHolen]  dito
 * @param {() => number} [eingabe.jetzt]               dito
 */
export function spiegelErstellen({ konfig, holen = eventsHolen, etagHolen = etagHolenEcht, jetzt = () => Date.now() }) {
  let inhalt = leererInhalt();
  /** @type {Fehlschlag|null} */
  let fehlschlag = null;

  async function auffrischen() {
    const start = jetzt();
    const relays = konfig.relays;
    const nachAutor = (/** @type {number} */ kind) =>
      eventsVonAllen(relays, { kinds: [kind], authors: [konfig.autor] }, { holen });

    const [a, l, p] = await Promise.all([nachAutor(30023), nachAutor(30004), nachAutor(0)]);

    if (a.grund !== null) {
      fehlschlag = { zeitpunkt: new Date(jetzt()).toISOString(), gefragteRelays: a.gefragt };
      return { gueltig: false, inhalt };
    }

    const artikel = neuestesJeD(a.events);
    /** @type {Record<string, string[]>} */
    const quellen = { ...a.quellen, ...l.quellen, ...p.quellen };
    /** @type {Set<string>} */
    const nichtErreichbar = new Set([...a.fehler, ...l.fehler, ...p.fehler]);

    /** @type {Map<string, Event>} */
    const nachweise = new Map();
    const hashes = hashesSammeln(artikel);
    for (let i = 0; i < hashes.length; i += BLOCK) {
      const n = await eventsVonAllen(relays, { kinds: [1063], '#x': hashes.slice(i, i + BLOCK) }, { holen });
      for (const e of n.events) nachweise.set(e.id, e);
      Object.assign(quellen, n.quellen);
      for (const r of n.fehler) nichtErreichbar.add(r);
    }

    // etag nur für Bilder, zu denen es überhaupt einen Nachweis gibt — sonst
    // gibt es keinen Schritt 5, den der etag entscheiden könnte.
    const attestiert = new Set([...nachweise.values()].flatMap((e) => e.tags.filter((t) => t[0] === 'x').map((t) => t[1])));
    /** @type {Record<string, string>} */
    const etags = {};
    for (const url of bildUrlsSammeln(artikel)) {
      const h = hashAusUrl(url);
      if (!h || !attestiert.has(h)) continue;
      const etag = await etagHolen(url);
      if (etag) etags[url] = etag;
    }

    const profil = [...p.events].sort((x, y) => -neuer(x, y))[0] ?? null;
    const listen = neuestesJeD(l.events);

    inhalt = {
      stand: {
        zeitpunkt: new Date(jetzt()).toISOString(),
        dauerMs: jetzt() - start,
        gefragteRelays: a.gefragt,
        nichtErreichbar: [...nichtErreichbar],
        anzahl: { artikel: artikel.length, listen: listen.length, nachweise: nachweise.size, profil: profil ? 1 : 0 }
      },
      artikel, listen, profil,
      nachweise: [...nachweise.values()],
      quellen, etags
    };
    fehlschlag = null;
    return { gueltig: true, inhalt };
  }

  return {
    lesen: () => inhalt,
    letzterFehlschlag: () => fehlschlag,
    auffrischen
  };
}
