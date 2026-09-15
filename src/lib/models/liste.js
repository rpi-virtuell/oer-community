/**
 * Kuratierungslisten (NIP-51 kind:30004) — Hauptmenü und Fußzeilenlinks
 * (ADR-0027). Die Liste nennt Ziele; ob es sie gibt, entscheidet der Loader
 * gegen den Spiegel, nicht das Modell.
 */
/** @typedef {import('../services/relay.js').Event} Event */
/** @typedef {{ kind: number, pubkey: string, d: string, roh: string }} Listenziel */
/** @typedef {{ d: string, titel: string|null, ziele: Listenziel[], personen: string[] }} Liste */

/** @param {string[][]} tags @param {string} name */
const tagWert = (tags, name) => tags.find((t) => t[0] === name && t.length > 1)?.[1] ?? null;

/** `kind:pubkey:d` — d darf Doppelpunkte enthalten, deshalb nur zweimal trennen. @param {string} roh @returns {Listenziel|null} */
export function zielAusKoordinate(roh) {
  const erster = roh.indexOf(':');
  const zweiter = erster === -1 ? -1 : roh.indexOf(':', erster + 1);
  if (zweiter === -1) return null;
  const kind = Number(roh.slice(0, erster));
  const pubkey = roh.slice(erster + 1, zweiter);
  const d = roh.slice(zweiter + 1);
  if (!Number.isInteger(kind) || !/^[0-9a-f]{64}$/i.test(pubkey) || d === '') return null;
  return { kind, pubkey: pubkey.toLowerCase(), d, roh };
}

/** @param {Event} event @returns {Liste} */
export function listeAusEvent(event) {
  const tags = event.tags ?? [];
  /** @type {Listenziel[]} */
  const ziele = [];
  for (const t of tags) {
    if (t[0] !== 'a' || !t[1]) continue;
    const ziel = zielAusKoordinate(t[1]);
    if (ziel) ziele.push(ziel);
  }
  // p-Tags: Personenlisten (kind:30000) wie der Redaktionskreis (ADR-0034).
  // Menü- und Fußzeilenlisten haben keine — dann bleibt das Feld leer.
  const personen = tags
    .filter((t) => t[0] === 'p' && typeof t[1] === 'string' && /^[0-9a-f]{64}$/i.test(t[1]))
    .map((t) => t[1].toLowerCase());
  return { d: tagWert(tags, 'd') ?? '', titel: tagWert(tags, 'title'), ziele, personen };
}

/** @param {Event[]} listen @param {string} d @returns {Liste|null} */
export function listeFinden(listen, d) {
  const event = listen.find((e) => tagWert(e.tags ?? [], 'd') === d);
  return event ? listeAusEvent(event) : null;
}
