/**
 * Das Profil des Herausgebers (kind:0) — Wortmarke, Logo, Fußtext, Domain
 * (ADR-0027). Der `about`-Text ist Markdown; gerendert wird er in der
 * Routen-Schicht über `inhaltAufbereiten`, nie ungesäubert.
 */
/** @typedef {import('../services/relay.js').Event} Event */
/** @typedef {{ name: string|null, logoUrl: string|null, fusstext: string|null, website: string|null }} Profil */

/** @param {unknown} w */
const text = (w) => (typeof w === 'string' && w.trim() !== '' ? w.trim() : null);
/** Nur https — ein Logo von http oder javascript: wäre ein Angriffsweg im <img src>. @param {unknown} w */
const https = (w) => { const t = text(w); return t && /^https:\/\//i.test(t) ? t : null; };

/** @param {Event|null} event @returns {Profil|null} */
export function profilAusEvent(event) {
  if (!event) return null;
  let roh;
  try { roh = JSON.parse(event.content ?? ''); } catch { return null; }
  if (!roh || typeof roh !== 'object') return null;
  return {
    name: text(roh.name) ?? text(roh.display_name),
    logoUrl: https(roh.picture),
    fusstext: text(roh.about),
    website: https(roh.website)
  };
}
