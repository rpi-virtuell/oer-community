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

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { hashAusUrl } from '../models/lizenz.js';
import { etagHolen as etagHolenEcht } from './blossom.js';
import { eventsHolen, eventsVonAllen } from './relay.js';

// Re-Export: services/relay.js darf nur diese Datei importieren
// (Architekturtest, Task 15). Wer die Konstanten braucht, holt sie hier.
export { ABFRAGEGRUND_TEXT, ZUSAMMENFUEHREN_UNERREICHBAR } from './relay.js';

/** @typedef {import('./relay.js').Event} Event */
/** @typedef {import('../konfig.js').Konfig} Konfig */
/**
 * @typedef {object} Stand
 * @property {string} zeitpunkt
 * @property {number} dauerMs
 * @property {string[]} gefragteRelays
 * @property {string[]} nichtErreichbar
 * @property {{ artikel: number, listen: number, nachweise: number, profil: number, termine: number }} anzahl
 */
/**
 * @typedef {object} Inhalt
 * @property {Stand|null} stand
 * @property {Event[]} artikel
 * @property {Event[]} listen
 * @property {Event[]} termine  Termine der Community, kind 31922/31923 (ADR-0034)
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

/**
 * Datei auf der Platte: erst temporär schreiben, dann umbenennen — ein
 * Absturz mitten im Schreiben hinterlässt keine halbe Datei.
 * @param {string} pfad
 */
export function dateiSpeicher(pfad) {
  return {
    async lesen() {
      try {
        return await readFile(pfad, 'utf8');
      } catch {
        return null;
      }
    },
    /** @param {string} text */
    async schreiben(text) {
      await mkdir(dirname(pfad), { recursive: true });
      const tmp = `${pfad}.tmp`;
      await writeFile(tmp, text, 'utf8');
      await rename(tmp, pfad);
    }
  };
}

/** Standard-Planer: setInterval, das den Prozess nicht am Beenden hindert.
 * @param {() => unknown} fn @param {number} ms */
function intervallPlanen(fn, ms) {
  const t = setInterval(fn, ms);
  t.unref?.();
  return { stoppen: () => clearInterval(t) };
}

/** Sieht ein Objekt aus wie ein Inhalt? Mehr wird nicht geprüft — Events sind signiert, ihre Form prüft niemand hier.
 * @param {unknown} x @returns {x is Inhalt} */
function istInhalt(x) {
  return !!x && typeof x === 'object' && Array.isArray(/** @type {any} */ (x).artikel) &&
    Array.isArray(/** @type {any} */ (x).nachweise) && /** @type {any} */ (x).stand !== undefined;
}

/** @returns {Inhalt} */
export function leererInhalt() {
  return { stand: null, artikel: [], listen: [], termine: [], profil: null, nachweise: [], quellen: {}, etags: {} };
}

/** @param {string[][]} tags @param {string} name */
const tagWert = (tags, name) => tags.find((t) => t[0] === name && t.length > 1)?.[1] ?? null;

/** Neuestes created_at gewinnt, Gleichstand kleinste id — wie nachweisAusEvents. @param {Event} a @param {Event} b */
const neuer = (a, b) => (b.created_at !== a.created_at ? b.created_at - a.created_at : a.id.localeCompare(b.id));

/**
 * Ersetzbare Events zusammenführen: je Schlüssel nur das neueste.
 * @param {Event[]} events @param {(e: Event) => string} schluessel @returns {Event[]}
 */
function neuestesJe(events, schluessel) {
  /** @type {Map<string, Event>} */
  const nachSchluessel = new Map();
  for (const e of events) {
    const k = schluessel(e);
    const bisher = nachSchluessel.get(k);
    if (!bisher || neuer(bisher, e) > 0) nachSchluessel.set(k, e);
  }
  return [...nachSchluessel.values()];
}

/**
 * Ersetzbare Events eines Kinds: je d nur das neueste.
 * @param {Event[]} events @returns {Event[]}
 */
export function neuestesJeD(events) {
  return neuestesJe(events, (e) => tagWert(e.tags ?? [], 'd') ?? '');
}

/**
 * Ersetzbare Events verschiedener Kinds: je kind und d nur das neueste.
 * Nötig, seit `listen` sowohl kind:30004 (Menü, Fußzeile) als auch
 * kind:30000 (Redaktionskreis, ADR-0034) enthält — zwei Listen mit demselben
 * `d` sind verschiedene Events und dürfen einander nicht verdrängen.
 * @param {Event[]} events @returns {Event[]}
 */
export function neuestesJeKindUndD(events) {
  return neuestesJe(events, (e) => `${e.kind}:${tagWert(e.tags ?? [], 'd') ?? ''}`);
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
 * @param {ReturnType<typeof dateiSpeicher>} [eingabe.speicher]  dito
 * @param {(fn: () => unknown, ms: number) => { stoppen(): void }} [eingabe.planen]  dito
 */
export function spiegelErstellen({
  konfig, holen = eventsHolen, etagHolen = etagHolenEcht, jetzt = () => Date.now(),
  speicher = dateiSpeicher(konfig.spiegelPfad), planen = intervallPlanen
}) {
  let inhalt = leererInhalt();
  /** @type {Fehlschlag|null} */
  let fehlschlag = null;

  async function auffrischen() {
    const start = jetzt();
    const relays = konfig.relays;
    const nachAutor = (/** @type {number} */ kind) =>
      eventsVonAllen(relays, { kinds: [kind], authors: [konfig.autor] }, { holen });

    // Termine kommen aus der Community, nicht vom Autor (ADR-0034). Ohne
    // konfigurierte Community wird gar nicht erst gefragt.
    //
    // Scheitert der Termin-Abruf, bricht der Lauf nicht ab: Der Hub steht und
    // fällt mit den Artikeln (nur `a.grund` ist das Tor), der Kalender ist
    // Beiwerk. Die stummen Relays landen wie alle anderen in
    // `nichtErreichbar` — die Terminseite nennt sie, wenn die Liste leer
    // bleibt, damit „noch nichts publiziert" nicht wie eine Störung aussieht.
    const [a, l, redaktion, p, t] = await Promise.all([
      nachAutor(30023), nachAutor(30004), nachAutor(30000), nachAutor(0),
      konfig.community
        ? eventsVonAllen(relays, { kinds: [31922, 31923], '#h': [konfig.community] }, { holen })
        : Promise.resolve(
            /** @type {import('./relay.js').Sammelergebnis} */ ({
              events: [], gefragt: relays, fehler: [], ohneTreffer: [], quellen: {}, grund: null
            })
          )
    ]);

    if (a.grund !== null) {
      fehlschlag = { zeitpunkt: new Date(jetzt()).toISOString(), gefragteRelays: a.gefragt };
      return { gueltig: false, inhalt };
    }

    const artikel = neuestesJeD(a.events);
    /** @type {Record<string, string[]>} */
    const quellen = { ...a.quellen, ...l.quellen, ...redaktion.quellen, ...p.quellen, ...t.quellen };
    /** @type {Set<string>} */
    const nichtErreichbar = new Set([...a.fehler, ...l.fehler, ...redaktion.fehler, ...p.fehler, ...t.fehler]);

    /** @type {Map<string, Event>} */
    const nachweise = new Map();
    const hashes = hashesSammeln(artikel);
    for (let i = 0; i < hashes.length; i += BLOCK) {
      const n = await eventsVonAllen(relays, { kinds: [1063], '#x': hashes.slice(i, i + BLOCK) }, { holen });
      for (const e of n.events) nachweise.set(e.id, e);
      Object.assign(quellen, n.quellen);
      for (const relay of n.fehler) nichtErreichbar.add(relay);
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

    // `neuer` sortiert schon neuestes zuerst — nicht noch einmal umdrehen.
    const profil = [...p.events].sort(neuer)[0] ?? null;
    // kind:30004 und kind:30000 liegen gemeinsam in `listen` — je kind und d
    // zusammenführen, sonst verdrängte "redaktion" ein gleichnamiges Menü.
    const listen = neuestesJeKindUndD([...l.events, ...redaktion.events]);
    const termine = neuestesJeKindUndD(t.events);

    inhalt = {
      stand: {
        zeitpunkt: new Date(jetzt()).toISOString(),
        dauerMs: jetzt() - start,
        gefragteRelays: a.gefragt,
        nichtErreichbar: [...nichtErreichbar],
        anzahl: {
          artikel: artikel.length, listen: listen.length, nachweise: nachweise.size,
          profil: profil ? 1 : 0, termine: termine.length
        }
      },
      artikel, listen, termine, profil,
      nachweise: [...nachweise.values()],
      quellen, etags
    };
    fehlschlag = null;

    try {
      await speicher.schreiben(JSON.stringify(inhalt));
    } catch (ursache) {
      // Die Datei ist Komfort für den Neustart, kein Teil des Laufs.
      console.warn('Spiegel: Datei nicht geschrieben —', ursache instanceof Error ? ursache.message : ursache);
    }

    return { gueltig: true, inhalt };
  }

  async function ausDateiLaden() {
    const text = await speicher.lesen();
    if (text === null) return false;
    try {
      const geparst = JSON.parse(text);
      if (!istInhalt(geparst)) return false;
      // Eine ältere oder knappe Datei kennt listen/termine/quellen/etags noch nicht;
      // die Leerform auffüllen, statt später an fehlenden Feldern zu werfen.
      inhalt = { ...leererInhalt(), ...geparst };
      return true;
    } catch {
      return false;
    }
  }

  /** @type {{ stoppen(): void }|null} */
  let timer = null;

  async function starten() {
    await ausDateiLaden();
    const erster = auffrischen().catch((ursache) => {
      console.warn('Spiegel: erster Lauf gescheitert —', ursache instanceof Error ? ursache.message : ursache);
    });
    const frist = new Promise((fertig) => {
      const t = setTimeout(fertig, konfig.spiegelStartwartezeitS * 1000);
      t.unref?.();
    });
    await Promise.race([erster, frist]);
    timer ??= planen(() => {
      auffrischen().catch((ursache) => {
        console.warn('Spiegel: Lauf gescheitert —', ursache instanceof Error ? ursache.message : ursache);
      });
    }, konfig.spiegelIntervallS * 1000);
  }

  function stoppen() {
    timer?.stoppen();
    timer = null;
  }

  return {
    lesen: () => inhalt,
    letzterFehlschlag: () => fehlschlag,
    auffrischen,
    ausDateiLaden,
    starten,
    stoppen
  };
}

/** @typedef {ReturnType<typeof spiegelErstellen>} Spiegel */
/** @type {Spiegel|null} */
let instanz = null;

/**
 * Startet den einen Spiegel des Prozesses — aus hooks.server.js. Ein zweiter
 * Aufruf liefert denselben; niemand baut versehentlich zwei Läufe.
 * @param {Konfig} konfig
 * @param {Partial<Parameters<typeof spiegelErstellen>[0]>} [optionen]  nur zum Prüfen
 */
export function spiegelStarten(konfig, optionen = {}) {
  if (!instanz) {
    instanz = spiegelErstellen({ konfig, ...optionen });
    bereit = instanz.starten();
  }
  return instanz;
}

/** @type {Promise<void>} */
let bereit = Promise.resolve();

/** Löst auf, wenn der erste Lauf durch ist oder die Startwartezeit verstrich — für hooks.server.js. */
export function spiegelBereit() {
  return bereit;
}

/** Der laufende Spiegel — für Routen. */
export function spiegelHolen() {
  if (!instanz) {
    throw new Error('Der Spiegel läuft nicht. Er wird in src/hooks.server.js gestartet — fehlt die Datei?');
  }
  return instanz;
}

export function spiegelZuruecksetzenFuerTests() {
  instanz?.stoppen();
  instanz = null;
  bereit = Promise.resolve();
}
