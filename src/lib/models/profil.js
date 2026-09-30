/**
 * Das Profil des Herausgebers (kind:0) — Wortmarke, Logo, Fußtext, Domain
 * (ADR-0027). Der `about`-Text ist Markdown; gerendert wird er in der
 * Routen-Schicht über `inhaltAufbereiten`, nie ungesäubert.
 */
import { decode } from 'nostr-tools/nip19';

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

/**
 * Ein Mensch aus dem Team, aus seinem eigenen kind:0 (ADR-0039) — Bild,
 * Name, Selbstbeschreibung und Kontakt pflegt jede Person selbst, nicht die
 * Redaktion. `about` ist Markdown wie beim Profil der Quelle und wird erst
 * in der Routen-Schicht über `inhaltAufbereiten` gerendert.
 *
 * `email` steht in keinem NIP, wird aber von einigen Clients geschrieben;
 * übernommen wird es nur, wenn es wie eine Adresse aussieht — es landet in
 * einem `mailto:`.
 *
 * @typedef {{ pubkey: string, name: string|null, bildUrl: string|null, about: string|null,
 *   website: string|null, email: string|null, nip05: string|null }} Person
 */

/** @param {unknown} w */
const email = (w) => { const t = text(w); return t && /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(t) ? t : null; };

/** @param {Event|null} event @returns {Person|null} */
export function personAusEvent(event) {
  if (!event || event.kind !== 0) return null;
  let roh;
  try { roh = JSON.parse(event.content ?? ''); } catch { return null; }
  if (!roh || typeof roh !== 'object') return null;
  return {
    pubkey: event.pubkey,
    name: text(roh.display_name) ?? text(roh.name),
    bildUrl: https(roh.picture),
    about: text(roh.about),
    website: https(roh.website),
    email: email(roh.email),
    nip05: text(roh.nip05)
  };
}

/**
 * Ein Personenverweis nach NIP-27, allein auf seiner Zeile:
 * `nostr:npub1…` oder `nostr:nprofile1…`. Nur so wird er zur Karte — ein
 * Verweis mitten im Satz bleibt Text.
 */
export const PERSONENVERWEIS = /^[ \t]*nostr:((?:npub|nprofile)1[02-9ac-hj-np-z]+)[ \t]*$/gm;

/**
 * Der Hex-Schlüssel hinter einem npub/nprofile — null, wenn er sich nicht
 * dekodieren lässt. Relay-Hinweise im nprofile werden ignoriert: gefragt
 * werden die konfigurierten Relays (ADR-0016).
 * @param {string} bech32 @returns {string|null}
 */
export function pubkeyAusVerweis(bech32) {
  try {
    const r = decode(bech32);
    if (r.type === 'npub') return r.data;
    if (r.type === 'nprofile') return r.data.pubkey;
  } catch { /* unlesbar: kein Verweis */ }
  return null;
}

/**
 * Alle Personen, auf die ein Markdown-Text als Karte verweist — in der
 * Reihenfolge des Textes, ohne Dubletten.
 * @param {string} markdown @returns {string[]}
 */
export function personenVerweise(markdown) {
  /** @type {Set<string>} */
  const pubkeys = new Set();
  for (const t of (markdown ?? '').matchAll(PERSONENVERWEIS)) {
    const p = pubkeyAusVerweis(t[1]);
    if (p) pubkeys.add(p);
  }
  return [...pubkeys];
}
