/**
 * sitemap.xml: alle Beiträge und Seiten mit lastmod aus dem Spiegel, dazu
 * die zwei Ansichten des Hubs selbst (/blog, /themen).
 */
import { error } from '@sveltejs/kit';
import { artikelAusEvent, beitragsPfad, istStartseitenD } from '../models/artikel.js';
import { FESTE_SEGMENTE } from '../models/feste-segmente.js';
import { leerstandMeldung } from '../models/leerstand.js';
import { startPfad } from '../sprache.js';
import { kanonisch } from './struktur.js';
import { xmlEscape } from './xml.js';

/** @typedef {import('../services/spiegel.js').Inhalt} Inhalt */
/** @typedef {import('../konfig.js').Konfig} Konfig */

/** @param {Date} d */
const tag = (d) => d.toISOString().slice(0, 10);

/**
 * @param {{ konfig: Konfig, inhalt: Inhalt, basisUrl: string }} eingabe
 * @returns {string}
 */
export function sitemapXml({ konfig, inhalt, basisUrl }) {
  const leer = leerstandMeldung(inhalt, konfig);
  if (leer) error(503, leer);
  const stand = tag(new Date(inhalt.stand?.zeitpunkt ?? Date.now()));
  // Ein Beitrag auf einem festen Segment ist unerreichbar — die Route gewinnt
  // (ADR-0029, wie der Menü-Loader). Er käme sonst als zweites <loc> für /blog.
  const eintraege = inhalt.artikel
    .map((e) => artikelAusEvent(e))
    .filter((a) => !FESTE_SEGMENTE.includes(a.d))
    .map((a) => ({
      // Jede Sprache hat ihre Startseite unter / bzw. /en (ADR-0033); ihr d
      // leitete nur dorthin weiter und gehört deshalb nicht in die Sitemap.
      loc: kanonisch(
        basisUrl,
        istStartseitenD(a.d, konfig.startseiteD) ? startPfad(a.sprache) : beitragsPfad(a)
      ),
      lastmod: tag(a.veroeffentlicht)
    }));
  eintraege.push(
    { loc: kanonisch(basisUrl, '/blog'), lastmod: stand },
    { loc: kanonisch(basisUrl, '/themen'), lastmod: stand }
  );
  const urls = eintraege
    .map((u) => `  <url>\n    <loc>${xmlEscape(u.loc)}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
