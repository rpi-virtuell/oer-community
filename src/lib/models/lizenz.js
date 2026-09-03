/**
 * Lizenznachweis nach ADR-0013.
 *
 * license und credit sind edufeed-Konvention, nicht NIP-94 — hier aber
 * Pflicht. Ohne beide gilt ein Nachweis als nicht vorhanden.
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
 * @property {string} credit
 * @property {string|null} mime
 */

/**
 * @typedef {{ ok: true, nachweis: Nachweis }
 *   | { ok: false, grund: Grund }} Ergebnis
 */

/**
 * @typedef {'kein-bild'|'relativ'|'kein-x-tag'|'kein-nachweis'
 *   |'pflichtfeld-fehlt'|'hash-widerspruch'} Grund
 */

/** @type {Record<Grund, string>} */
export const GRUND_TEXT = {
  'kein-bild': 'Kein Bild angegeben.',
  relativ:
    'Der Bildverweis ist relativ und ließe sich nur gegen WordPress auflösen.',
  'kein-x-tag': 'Am Artikel fehlt das x-Tag — ohne Hash ist kein Nachweis auffindbar.',
  'kein-nachweis': 'Zu diesem Bild wurde auf keinem Relay ein kind:1063 gefunden.',
  'pflichtfeld-fehlt': 'Der Nachweis ist unvollständig oder gehört zu einem anderen Bild.',
  'hash-widerspruch': 'Der Hash des ausgelieferten Bildes passt nicht zum Nachweis.'
};

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
    const credit = tagWert(tags, 'credit');
    const hash = tagWert(tags, 'x');
    const url = tagWert(tags, 'url');
    // license und credit sind Pflicht (ADR-0013, Punkt 3).
    if (!license || !credit || !hash || !url) continue;

    gueltige.push({
      created_at: e.created_at ?? 0,
      nachweis: {
        id: e.id,
        hash,
        url,
        titel: tagWert(tags, 'title'),
        license,
        credit,
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
 * Die Auflösungskette aus ADR-0013.
 *
 * Nur ok:true liefert ein Bild aus. Jeder andere Fall nennt seinen Grund,
 * damit die Redaktion weiß, was fehlt.
 *
 * @param {object} eingabe
 * @param {string|null} eingabe.bildUrl
 * @param {string|null} eingabe.bildHash
 * @param {Nachweis|null} eingabe.nachweis
 * @param {string} [eingabe.etag]  Blossom liefert den Hash als etag
 * @returns {Ergebnis}
 */
export function lizenzPruefen({ bildUrl, bildHash, nachweis, etag }) {
  if (!bildUrl) return { ok: false, grund: 'kein-bild' };

  // Schritt 1: absolut?
  if (!/^https?:\/\//.test(bildUrl)) return { ok: false, grund: 'relativ' };

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
