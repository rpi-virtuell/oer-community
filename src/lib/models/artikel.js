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
 * @property {'de'|'en'} sprache      aus dem inLanguage-Tag, Standard de
 * @property {boolean} istSeite       Selbst-Label NIP-32 foerbico/typ = seite
 */

/**
 * Selbst-Label, das eine Seite von einem Artikel unterscheidet (ADR-0027, NIP-32).
 */
export const SEITEN_LABEL = { namensraum: 'foerbico/typ', wert: 'seite' };

/**
 * Vergleichsform eines `d`: Drei Live-Artikel tragen das Prozentzeichen
 * literal im `d`-Tag (`oer-visuelle-qualit%C3%A4t`), SvelteKit reicht den
 * Param aber dekodiert herein. Beide Seiten werden auf die dekodierte Form
 * gebracht, damit die echte oer.community-Adresse trifft (ADR-0029). Eine
 * Kodierung, die nicht dekodiert (etwa `100%-frei`), bleibt roh.
 *
 * @param {string} d
 * @returns {string}
 */
export function dNormalisieren(d) {
  try {
    return decodeURIComponent(d);
  } catch {
    return d;
  }
}

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
 * Bestimmt die Sprache aus dem inLanguage-Tag.
 *
 * @param {string|null} wert
 * @returns {'de'|'en'}
 */
function spracheAus(wert) {
  return (wert ?? '').trim().toLowerCase().startsWith('en') ? 'en' : 'de';
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
    inhalt: event.content ?? '',
    sprache: spracheAus(tagWert(tags, 'inLanguage')),
    istSeite: tags.some(
      (t) => t[0] === 'l' && t[1] === SEITEN_LABEL.wert && t[2] === SEITEN_LABEL.namensraum
    )
  };
}

/**
 * Der Pfad eines Beitrags im Hub — sein d, für englische Inhalte unter /en/
 * (ADR-0029). Die Adresse ist der Hugo-Pfad, kein naddr.
 *
 * @param {{ d: string, sprache: 'de'|'en' }} beitrag
 * @returns {string}
 */
export function beitragsPfad(beitrag) {
  const d = encodeURIComponent(dNormalisieren(beitrag.d));
  return beitrag.sprache === 'en' ? `/en/${d}` : `/${d}`;
}
