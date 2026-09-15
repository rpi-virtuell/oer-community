/**
 * Struktur für das Layout: Wortmarke, Logo, Menü, Fußzeile (ADR-0027).
 * Hier — und nicht im Loader — kommen die Ansichten dazu, die der Hub selbst
 * besitzt („Termine", „Blog", „Themen"): Sie sind keine Seiten der Redaktion.
 */
import { inhaltAufbereiten } from '../inhalt.js';
import { artikelAusSpiegel } from '../loaders/artikel.js';
import { strukturLaden } from '../loaders/struktur.js';
import { termineListe } from '../loaders/termine.js';
import { englischVorhanden, gegenstueck } from '../loaders/uebersetzungen.js';
import { beitragsPfad, istStartseitenD } from '../models/artikel.js';
import { basisUrlBestimmen, kanonisch } from '../kanonisch.js';
import { startPfad, t } from '../sprache.js';

export { kanonisch, basisUrlBestimmen } from '../kanonisch.js';

/** @typedef {import('../loaders/struktur.js').Eintrag} Eintrag */
/** @typedef {import('../loaders/struktur.js').Struktur} Struktur */
/** @typedef {{ wortmarke: string, logoUrl: string|null, menue: Eintrag[], fusszeilenLinks: Eintrag[], fusstextHtml: string|null, befund: Struktur['befund'], basisUrl: string,
 *   sprache: 'de'|'en', zweisprachig: boolean }} Layoutstruktur */

/**
 * Ansichten des Hubs in der Sprache der Adresse (ADR-0033). „Termine" steht
 * vor „Blog" — und nur, wenn es Termine gibt: Was es nicht gibt, wird auch
 * nicht angedeutet (CLAUDE.md, ADR-0034).
 * @param {'de'|'en'} sprache @param {{ termine?: boolean }} [lage] @returns {Eintrag[]}
 */
export function hubAnsichten(sprache, { termine = false } = {}) {
  return [
    ...(termine ? [{ titel: t(sprache, 'termine'), pfad: '/termine', d: '' }] : []),
    { titel: t(sprache, 'blog'), pfad: '/blog', d: '' },
    { titel: t(sprache, 'themen'), pfad: '/themen', d: '' }
  ];
}

/** Ansichten des Hubs auf Deutsch, keine Seiten — deshalb ohne d. @type {Eintrag[]} */
export const HUB_ANSICHTEN = hubAnsichten('de');

/**
 * Hat die Community überhaupt Termine — kommende oder vergangene? Menü und
 * Sitemap nennen /termine nur dann (ADR-0034); ohne Community ist der
 * Kalender abgeschaltet und die Frage erübrigt sich.
 * @param {import('../services/spiegel.js').Inhalt} inhalt
 * @param {import('../konfig.js').Konfig} konfig @param {(() => Date)} [jetzt]
 */
export function termineVorhanden(inhalt, konfig, jetzt) {
  const liste = termineListe(inhalt, konfig, { jetzt });
  return liste.kommend.length + liste.vergangen.length > 0;
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

/**
 * @param {{ konfig: import('../konfig.js').Konfig, inhalt: import('../services/spiegel.js').Inhalt,
 *   origin: string, sprache?: 'de'|'en', jetzt?: () => Date }} e
 * @returns {Layoutstruktur}
 */
export function strukturFuerLayout({ konfig, inhalt, origin, sprache = 'de', jetzt }) {
  const s = strukturLaden(inhalt, konfig);
  // Kommend oder vergangen: ein Kalender mit Vergangenem ist nicht leer.
  const termineDa = termineVorhanden(inhalt, konfig, jetzt);

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
      // Die Startseite wohnt unter / bzw. /en, nicht unter ihrem d (ADR-0029).
      const eintrag =
        g && g.sprache === sprache
          ? {
              titel: g.titel,
              pfad: istStartseitenD(g.d, konfig.startseiteD) ? startPfad(g.sprache) : beitragsPfad(g),
              d: g.d
            }
          : e;
      if (!aus.some((x) => x.pfad === eintrag.pfad)) aus.push(eintrag);
    }
    return aus;
  };

  return {
    wortmarke: s.profil?.name ?? WORTMARKE_RUECKFALL,
    logoUrl: s.profil?.logoUrl ?? null,
    menue: [...inSprache(s.menue), ...hubAnsichten(sprache, { termine: termineDa })],
    fusszeilenLinks: inSprache(s.fusszeile),
    fusstextHtml: fusstextHtml(s.profil?.fusstext ?? null),
    befund: s.befund,
    basisUrl: basisUrlBestimmen(s.profil, origin),
    sprache,
    zweisprachig: englischVorhanden(inhalt)
  };
}
