/**
 * Prüft, ob eine naddr-Adresse zu diesem Schaufenster gehört.
 *
 * Ein `naddr` kommt aus der URL und damit von aussen. Ohne diese Prüfung
 * würde der Loader jeden Autor abfragen, den ein Besucher hineinschreibt —
 * das Schaufenster wäre ein offener Nostr-Renderer für fremde Inhalte statt
 * die Ansicht **einer** Quelle (ADR-0016). Fremdes Roh-HTML ginge dann über
 * `{@html}` mit hinaus.
 *
 * @typedef {import('../naddr.js').Adresse} Adresse
 */

/**
 * @typedef {'fremder-autor'|'unerwartetes-kind'|'keine-kennung'} Ablehnungsgrund
 */

/**
 * @typedef {{ ok: true } | { ok: false, grund: Ablehnungsgrund }} Pruefergebnis
 */

/**
 * Kinds, die dieses Schaufenster zeigt: nur Artikel (NIP-23) — Termine sind
 * nicht mehr im Zuschnitt dieses Vorhabens (ADR-0026).
 */
const ERLAUBTE_KINDS = [30023];

/** @type {Record<Ablehnungsgrund, string>} */
export const ABLEHNUNG_TEXT = {
  'fremder-autor': 'Diese Adresse gehört nicht zur Quelle dieses Schaufensters.',
  'unerwartetes-kind': 'Dieses Adressformat wird hier nicht angezeigt.',
  'keine-kennung': 'Der Adresse fehlt die Kennung des Beitrags.'
};

/**
 * @param {Adresse} adresse
 * @param {{ autor: string }} konfig
 * @returns {Pruefergebnis}
 */
export function adressePruefen(adresse, konfig) {
  // Der Autor zuerst: das strengere Kriterium, und die Ablehnung soll nicht
  // verraten, welche Kinds interessant wären.
  if (adresse.author !== konfig.autor) return { ok: false, grund: 'fremder-autor' };
  if (!ERLAUBTE_KINDS.includes(adresse.kind)) {
    return { ok: false, grund: 'unerwartetes-kind' };
  }
  if (adresse.d.trim() === '') return { ok: false, grund: 'keine-kennung' };
  return { ok: true };
}
