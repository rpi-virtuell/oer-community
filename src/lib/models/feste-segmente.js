/**
 * Die festen Segmente der ersten Pfadebene (ADR-0029): Adressen, die der Hub
 * selbst belegt und die deshalb kein `d` eines Beitrags sein dürfen. Ein `d`,
 * das einem davon gleicht, wäre unerreichbar — die Route gewönne.
 *
 * Die Liste steht im Modell und nicht in `routen/`, weil auch der Loader sie
 * braucht (`loaders/struktur.js` überspringt solche Listenziele) und ein
 * Loader nichts aus `routen/` importiert (CLAUDE.md, ADR-0014).
 * `src/lib/routen/feste-segmente.js` re-exportiert sie für die Routen-Schicht.
 *
 * @type {readonly string[]}
 */
export const FESTE_SEGMENTE = Object.freeze(['blog', 'themen', 'en', 'feed.xml', 'sitemap.xml']);
