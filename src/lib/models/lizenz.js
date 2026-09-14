/**
 * Lizenznachweis nach ADR-0013, geändert durch ADR-0022.
 *
 * license und credit sind edufeed-Konvention, nicht NIP-94. **Pflicht ist
 * allein `license`** (ADR-0022, Punkt 1) — wie in der edufeed-app, die beim
 * Lesen ebenfalls nur darauf besteht und `credit` anzeigt, wenn es da ist.
 * Beim Schreiben verlangen edufeed-app und foerbico-editor weiterhin beides;
 * der Hub ist lesend und entscheidet nicht, was publiziert wird.
 *
 * @typedef {import('../services/relay.js').Event} Event
 */

/**
 * @typedef {object} Nachweis
 * @property {string} id
 * @property {string} hash
 * @property {string} url
 * @property {string|null} titel
 * @property {string} license
 * @property {string|null} credit
 * @property {string|null} beschreibung  content des Events, Titelquelle nach dem title-Tag
 * @property {string|null} quelle        source-Tag: Fundort des Originals
 * @property {string|null} alt           alt-Tag: Screenreader-Beschreibung — nicht der Titel
 * @property {string|null} urheberUrl    authorUrl — Zusatz-Tag außerhalb NIP-94 (bildattribution.md)
 * @property {string|null} bearbeitung   modification — Zusatz-Tag (bildattribution.md)
 * @property {KiWert|null} ki            ai-Tag: KI-Beteiligung (ADR-0025); fremde Werte → null
 * @property {string|null} mime
 */

/**
 * Liegt die URL auf einem Host, den der Hub ersetzt? Subdomains zählen mit
 * (`www.oer.community`), Teilstrings nicht (`notoer.community`).
 * @param {string} url
 * @param {string[]} hosts
 * @returns {boolean}
 */
export function hostAbgeloest(url, hosts) {
  if (!hosts || hosts.length === 0) return false;
  let hostname;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }
  return hosts.some((h) => hostname === h || hostname.endsWith(`.${h}`));
}

/**
 * KI-Beteiligung nach edufeed-Wiki „license-events-nope" (2026-09-10), die
 * Werte folgen den EU-AI-Office-Icons: `generated` = vollständig KI-generiert,
 * `modified` = bestehendes Werk mit KI teilweise verändert. Nur diese zwei
 * Werte bedeuten etwas; jeder andere gilt als „nicht deklariert" (ADR-0025).
 *
 * @typedef {'generated'|'modified'} KiWert
 */

/** @type {readonly KiWert[]} */
export const KI_WERTE = ['generated', 'modified'];

/**
 * @param {string|null} wert
 * @returns {KiWert|null}
 */
export function kiWert(wert) {
  return wert === 'generated' || wert === 'modified' ? wert : null;
}

/**
 * @typedef {{ ok: true, nachweis: Nachweis }
 *   | { ok: false, grund: Grund }} Ergebnis
 */

/**
 * @typedef {'kein-bild'|'relativ'|'abgeloester-host'|'kein-x-tag'|'kein-nachweis'
 *   |'pflichtfeld-fehlt'|'hash-widerspruch'} Grund
 */

/** @type {Record<Grund, string>} */
export const GRUND_TEXT = {
  'kein-bild': 'Kein Bild angegeben.',
  relativ:
    'Der Bildverweis ist relativ und ließe sich nur gegen WordPress auflösen.',
  'abgeloester-host':
    'Das Bild liegt auf einem Host, den dieser Hub ablöst — dort gibt es es bald nicht mehr. ' +
    'Es gehört auf Blossom, mit Lizenznachweis (ADR-0030).',
  'kein-x-tag': 'Am Artikel fehlt das x-Tag — ohne Hash ist kein Nachweis auffindbar.',
  'kein-nachweis': 'Zu diesem Bild wurde auf keinem Relay ein kind:1063 gefunden.',
  'pflichtfeld-fehlt':
    'Dem Nachweis fehlt die Lizenzangabe, oder er gehört zu einem anderen Bild.',
  'hash-widerspruch': 'Der Hash des ausgelieferten Bildes passt nicht zum Nachweis.'
};

/** Hash-URL (Blossom, BUD-01): letztes Pfadsegment ist der SHA-256, Endung optional. */
const HASH_IM_PFAD = /\/([0-9a-f]{64})(?:\.[a-z0-9]+)?$/i;

/**
 * SHA-256 aus einer Hash-URL — oder null, wenn der Pfad keinen trägt.
 *
 * Dieselbe Regel wie redaktion-longform.md (Z. 26), edufeeds
 * `getSha256FromURL` und `mdparser/events/article.ts`: Eine Bild-URL ohne
 * Hash im Pfad ist kein Zeiger auf einen Nachweis (ADR-0023). Relative oder
 * kaputte URLs ergeben null, keinen Fehler.
 *
 * @param {string|null|undefined} url
 * @returns {string|null}
 */
export function hashAusUrl(url) {
  if (!url) return null;
  let pfad;
  try {
    pfad = new URL(url).pathname;
  } catch {
    return null;
  }
  const treffer = pfad.match(HASH_IM_PFAD);
  return treffer ? treffer[1].toLowerCase() : null;
}

/**
 * @param {string[][]} tags
 * @param {string} name
 * @returns {string|null}
 */
function tagWert(tags, name) {
  const treffer = tags.find((t) => t[0] === name && t.length > 1);
  return treffer ? treffer[1] : null;
}

/**
 * Wählt aus kind:1063-Events den gültigen Nachweis.
 *
 * Neuestes created_at gewinnt, Gleichstand nach id (ADR-0010).
 *
 * @param {Event[]} events
 * @returns {Nachweis|null}
 */
export function nachweisAusEvents(events) {
  /** @type {{ nachweis: Nachweis, created_at: number }[]} */
  const gueltige = [];

  for (const e of events ?? []) {
    const tags = e.tags ?? [];
    const license = tagWert(tags, 'license');
    const hash = tagWert(tags, 'x');
    const url = tagWert(tags, 'url');
    // Pflicht ist allein license (ADR-0022, Punkt 1); credit ist optional.
    if (!license || !hash || !url) continue;

    const beschreibung = (e.content ?? '').trim();

    gueltige.push({
      created_at: e.created_at ?? 0,
      nachweis: {
        id: e.id,
        hash,
        url,
        titel: tagWert(tags, 'title'),
        license,
        credit: tagWert(tags, 'credit'),
        beschreibung: beschreibung || null,
        quelle: tagWert(tags, 'source'),
        alt: tagWert(tags, 'alt'),
        // Zusatz-Tags, wie der foerbico-editor sie schreibt (bildattribution.md).
        urheberUrl: tagWert(tags, 'authorUrl'),
        bearbeitung: tagWert(tags, 'modification'),
        ki: kiWert(tagWert(tags, 'ai')),
        mime: tagWert(tags, 'm')
      }
    });
  }

  if (gueltige.length === 0) return null;

  const nachAlter = [...gueltige].sort((a, b) => {
    const diff = b.created_at - a.created_at;
    return diff !== 0 ? diff : a.nachweis.id.localeCompare(b.nachweis.id);
  });

  return nachAlter[0].nachweis;
}

/**
 * Die Auflösungskette aus ADR-0013, erweitert durch ADR-0030.
 *
 * Nur ok:true liefert ein Bild aus. Jeder andere Fall nennt seinen Grund,
 * damit die Redaktion weiß, was fehlt.
 *
 * @param {object} eingabe
 * @param {string|null} eingabe.bildUrl
 * @param {string|null} eingabe.bildHash
 * @param {Nachweis|null} eingabe.nachweis
 * @param {string} [eingabe.etag]  Blossom liefert den Hash als etag
 * @param {string[]} [eingabe.abgeloesteHosts]  Hosts, die dieser Hub ablöst (ADR-0030)
 * @returns {Ergebnis}
 */
export function lizenzPruefen({ bildUrl, bildHash, nachweis, etag, abgeloesteHosts = [] }) {
  if (!bildUrl) return { ok: false, grund: 'kein-bild' };

  // Schritt 1: absolut?
  if (!/^https?:\/\//.test(bildUrl)) return { ok: false, grund: 'relativ' };

  // Schritt 1b: Host, den der Hub ersetzt? Dann ist das Bild so tot wie ein
  // relativer Pfad (ADR-0030) — geprüft vor dem x-Tag, weil die Frage nach
  // dem Nachweis sich für dieses Bild nicht mehr stellt.
  if (hostAbgeloest(bildUrl, abgeloesteHosts)) return { ok: false, grund: 'abgeloester-host' };

  // Schritt 2: Hash am Artikel?
  if (!bildHash) return { ok: false, grund: 'kein-x-tag' };

  // Schritt 3: Nachweis gefunden?
  if (!nachweis) return { ok: false, grund: 'kein-nachweis' };

  // Schritt 4: Pflichtfelder da (in nachweisAusEvents geprüft) und
  // der Nachweis gehört zu diesem Bild?
  if (nachweis.hash !== bildHash) return { ok: false, grund: 'pflichtfeld-fehlt' };

  // Schritt 5: Hash gegen das gelieferte Bild, falls ein etag vorliegt.
  if (etag) {
    const sauber = etag.replace(/^W\//, '').replace(/"/g, '').trim();
    if (sauber !== bildHash) return { ok: false, grund: 'hash-widerspruch' };
  }

  return { ok: true, nachweis };
}
