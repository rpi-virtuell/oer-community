/**
 * Struktur für das Layout: Wortmarke, Logo, Menü, Fußzeile (ADR-0027).
 * Hier — und nicht im Loader — kommen die Ansichten dazu, die der Hub selbst
 * besitzt („Blog", „Themen"): Sie sind keine Seiten der Redaktion.
 */
import { inhaltAufbereiten } from '../inhalt.js';
import { artikelAusSpiegel } from '../loaders/artikel.js';
import { strukturLaden } from '../loaders/struktur.js';
import { englischVorhanden, gegenstueck } from '../loaders/uebersetzungen.js';
import { beitragsPfad } from '../models/artikel.js';
import { basisUrlBestimmen, kanonisch } from '../kanonisch.js';
import { t } from '../sprache.js';

export { kanonisch, basisUrlBestimmen } from '../kanonisch.js';

/** @typedef {import('../loaders/struktur.js').Eintrag} Eintrag */
/** @typedef {import('../loaders/struktur.js').Struktur} Struktur */
/** @typedef {{ wortmarke: string, logoUrl: string|null, menue: Eintrag[], fusszeilenLinks: Eintrag[], fusstextHtml: string|null, befund: Struktur['befund'], basisUrl: string,
 *   sprache: 'de'|'en', zweisprachig: boolean }} Layoutstruktur */

/** Ansichten des Hubs, keine Seiten — deshalb ohne d. @type {Eintrag[]} */
export const HUB_ANSICHTEN = [
  { titel: 'Blog', pfad: '/blog', d: '' },
  { titel: 'Themen', pfad: '/themen', d: '' }
];

/** Ansichten des Hubs in der Sprache der Adresse (ADR-0033). @param {'de'|'en'} sprache @returns {Eintrag[]} */
export function hubAnsichten(sprache) {
  return [
    { titel: t(sprache, 'blog'), pfad: '/blog', d: '' },
    { titel: t(sprache, 'themen'), pfad: '/themen', d: '' }
  ];
}

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

/** @param {{ konfig: import('../konfig.js').Konfig, inhalt: import('../services/spiegel.js').Inhalt, origin: string, sprache?: 'de'|'en' }} e @returns {Layoutstruktur} */
export function strukturFuerLayout({ konfig, inhalt, origin, sprache = 'de' }) {
  const s = strukturLaden(inhalt, konfig);

  /**
   * Unter /en/ steht jeder Eintrag durch sein Gegenstück, wenn es eines gibt
   * (ADR-0033, Punkt 4) — sonst bleibt der deutsche: ein Menü mit Lücken wäre
   * schlechter als eines mit deutschen Seiten. Doppelte Pfade fielen sonst
   * zusammen, wenn zwei Einträge dasselbe Gegenstück hätten
   * (`each_key_duplicate`, CLAUDE.md).
   * @param {Eintrag[]} eintraege @returns {Eintrag[]}
   */
  const inSprache = (eintraege) => {
    if (sprache === 'de') return eintraege;
    /** @type {Eintrag[]} */
    const aus = [];
    for (const e of eintraege) {
      const { artikel } = artikelAusSpiegel(inhalt, { d: e.d });
      const g = artikel ? gegenstueck(inhalt, artikel) : null;
      const eintrag = g && g.sprache === sprache ? { titel: g.titel, pfad: beitragsPfad(g), d: g.d } : e;
      if (!aus.some((x) => x.pfad === eintrag.pfad)) aus.push(eintrag);
    }
    return aus;
  };

  return {
    wortmarke: s.profil?.name ?? WORTMARKE_RUECKFALL,
    logoUrl: s.profil?.logoUrl ?? null,
    menue: [...inSprache(s.menue), ...hubAnsichten(sprache)],
    fusszeilenLinks: inSprache(s.fusszeile),
    fusstextHtml: fusstextHtml(s.profil?.fusstext ?? null),
    befund: s.befund,
    basisUrl: basisUrlBestimmen(s.profil, origin),
    sprache,
    zweisprachig: englischVorhanden(inhalt)
  };
}
