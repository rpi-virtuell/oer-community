/**
 * Sprache und Oberflächentexte des Hubs (ADR-0033). Rein — keine Importe —,
 * damit Komponenten, Routen und Loader es gleichermaßen nutzen dürfen
 * (Architekturregel wie bei kanonisch.js).
 *
 * Die Sprache eines Beitrags steht in seinem inLanguage-Tag; die Sprache
 * einer Adresse ist ihr erstes Segment: `/en` und `/en/…` sind Englisch.
 * Die Texte hier sind das ganze Chrome des Hubs — bewusst eine Tabelle, kein
 * Paraglide (ADR-0033, Punkt 6).
 */

/** @typedef {'de'|'en'} Sprache */

/** @type {readonly Sprache[]} */
export const SPRACHEN = ['de', 'en'];

/** @param {string} pfad @returns {Sprache} */
export function spracheAusPfad(pfad) {
  return pfad === '/en' || pfad.startsWith('/en/') ? 'en' : 'de';
}

/** Startseite der Sprache. @param {Sprache} sprache */
export function startPfad(sprache) {
  return sprache === 'en' ? '/en' : '/';
}

/**
 * @typedef {object} Texte
 * @property {string} blog
 * @property {string} themen
 * @property {string} lizenzUngeklaert
 * @property {string} bildNichtAngezeigt
 * @property {(n: number) => string} entfernteBilder
 * @property {string} sprache
 * @property {string} zurStartseite
 * @property {string} hauptnavigation
 * @property {string} datumsformat  BCP-47-Locale für toLocaleDateString
 */

/** @type {Record<Sprache, Texte>} */
export const TEXTE = {
  de: {
    blog: 'Blog',
    themen: 'Themen',
    lizenzUngeklaert: 'Lizenz ungeklärt',
    bildNichtAngezeigt: 'Bild nicht angezeigt.',
    entfernteBilder: (n) =>
      `${n} Bildverweis${n === 1 ? '' : 'e'} ohne Lizenznachweis wurden nicht ausgeliefert (ADR-0015):`,
    sprache: 'Sprache',
    zurStartseite: 'zur Startseite',
    hauptnavigation: 'Hauptnavigation',
    datumsformat: 'de-DE'
  },
  en: {
    blog: 'Blog',
    themen: 'Topics',
    lizenzUngeklaert: 'Licence unclear',
    bildNichtAngezeigt: 'Image not shown.',
    entfernteBilder: (n) =>
      `${n} image reference${n === 1 ? '' : 's'} without a licence record ${n === 1 ? 'was' : 'were'} not delivered (ADR-0015):`,
    sprache: 'Language',
    zurStartseite: 'to the start page',
    hauptnavigation: 'Main navigation',
    datumsformat: 'en-GB'
  }
};

/**
 * Text in einer Sprache; Funktionen werden mit den restlichen Argumenten
 * aufgerufen. Unbekannte Sprache fällt auf Deutsch zurück.
 * @template {keyof Texte} K
 * @param {Sprache} sprache @param {K} schluessel @param {...any} args
 * @returns {string}
 */
export function t(sprache, schluessel, ...args) {
  const tabelle = TEXTE[sprache] ?? TEXTE.de;
  const wert = tabelle[schluessel];
  return typeof wert === 'function' ? /** @type {any} */ (wert)(...args) : /** @type {string} */ (wert);
}
