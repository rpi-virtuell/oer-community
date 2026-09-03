/**
 * Ein Nostr-Event, so wie es vom Relay kommt.
 *
 * Der Typ steht hier lokal, damit das Modell nicht auf einen noch nicht
 * vorhandenen Dienst zeigt; services/relay.js liefert dieselbe Form.
 *
 * @typedef {object} Event
 * @property {string} id
 * @property {string} pubkey
 * @property {number} created_at
 * @property {number} kind
 * @property {string[][]} tags
 * @property {string} content
 * @property {string} sig
 */

/**
 * @typedef {object} Artikel
 * @property {string} id
 * @property {number} kind
 * @property {string} autor
 * @property {string} d
 * @property {string} titel
 * @property {string} zusammenfassung
 * @property {Date} veroeffentlicht
 * @property {string|null} bildUrl
 * @property {string|null} bildHash   SHA-256 aus dem x-Tag
 * @property {string[]} themen
 * @property {string} inhalt          rohes Markdown
 */

/**
 * Erster Wert eines Tags, oder null.
 *
 * @param {string[][]} tags
 * @param {string} name
 * @returns {string|null}
 */
function tagWert(tags, name) {
  const treffer = tags.find((t) => t[0] === name && t.length > 1);
  return treffer ? treffer[1] : null;
}

/**
 * Wandelt ein Event in einen Artikel.
 *
 * Anzeigedatum ist published_at, nicht created_at (CLAUDE.md).
 *
 * @param {Event} event
 * @returns {Artikel}
 */
export function artikelAusEvent(event) {
  const tags = event.tags ?? [];
  const d = tagWert(tags, 'd') ?? '';
  const published = tagWert(tags, 'published_at');
  const sekunden = published ? Number.parseInt(published, 10) : event.created_at;

  return {
    id: event.id,
    kind: event.kind,
    autor: event.pubkey,
    d,
    titel: tagWert(tags, 'title') ?? d,
    zusammenfassung: tagWert(tags, 'summary') ?? '',
    veroeffentlicht: new Date(
      (Number.isFinite(sekunden) ? sekunden : event.created_at) * 1000
    ),
    bildUrl: tagWert(tags, 'image'),
    bildHash: tagWert(tags, 'x'),
    themen: tags.filter((t) => t[0] === 't' && t.length > 1).map((t) => t[1]),
    inhalt: event.content ?? ''
  };
}
