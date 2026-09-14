/**
 * Struktur für das Layout: Wortmarke, Logo, Menü, Fußzeile (ADR-0027).
 * Hier — und nicht im Loader — kommen die Ansichten dazu, die der Hub selbst
 * besitzt („Blog", „Themen"): Sie sind keine Seiten der Redaktion.
 */
import { inhaltAufbereiten } from '../inhalt.js';
import { strukturLaden } from '../loaders/struktur.js';

/** @typedef {import('../loaders/struktur.js').Eintrag} Eintrag */
/** @typedef {import('../loaders/struktur.js').Struktur} Struktur */
/** @typedef {{ wortmarke: string, logoUrl: string|null, menue: Eintrag[], fusszeilenLinks: Eintrag[], fusstextHtml: string|null, befund: Struktur['befund'] }} Layoutstruktur */

/** Ansichten des Hubs, keine Seiten — deshalb ohne d. @type {Eintrag[]} */
export const HUB_ANSICHTEN = [
  { titel: 'Blog', pfad: '/blog', d: '' },
  { titel: 'Themen', pfad: '/themen', d: '' }
];

/** Bis ein Profil mit Namen da ist (ersetzt die Vorläufigkeit aus ADR-0019 durch einen Rückfall). */
export const WORTMARKE_RUECKFALL = 'Community-Hub';

/**
 * Der Fußtext ist Markdown ohne Bilder (Spec): Bild-Teile fallen weg, das
 * HTML kommt gesäubert aus inhaltAufbereiten — nur so darf es in {@html}.
 * @param {string|null} markdown
 */
export function fusstextHtml(markdown) {
  if (!markdown) return null;
  const html = inhaltAufbereiten(markdown).teile.filter((t) => t.art === 'html').map((t) => t.html).join('').trim();
  return html === '' ? null : html;
}

/** @param {{ konfig: import('../konfig.js').Konfig, inhalt: import('../services/spiegel.js').Inhalt }} e @returns {Layoutstruktur} */
export function strukturFuerLayout({ konfig, inhalt }) {
  const s = strukturLaden(inhalt, konfig);
  return {
    wortmarke: s.profil?.name ?? WORTMARKE_RUECKFALL,
    logoUrl: s.profil?.logoUrl ?? null,
    menue: [...s.menue, ...HUB_ANSICHTEN],
    fusszeilenLinks: s.fusszeile,
    fusstextHtml: fusstextHtml(s.profil?.fusstext ?? null),
    befund: s.befund
  };
}
