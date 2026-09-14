/**
 * feed.xml: RSS 2.0 der 20 neuesten Artikel aus dem Spiegel.
 *
 * Seiten sind keine Artikel — artikelListe lässt sie weg (wie /blog).
 */
import { error } from '@sveltejs/kit';
import { artikelListe } from '../loaders/uebersicht.js';
import { leerstandMeldung } from '../models/leerstand.js';
import { profilAusEvent } from '../models/profil.js';
import { kanonisch, WORTMARKE_RUECKFALL } from './struktur.js';
import { rfc822, xmlEscape } from './xml.js';

/** @typedef {import('../services/spiegel.js').Inhalt} Inhalt */
/** @typedef {import('../konfig.js').Konfig} Konfig */

/** Wortmarke des Feeds: Name aus dem Profil, sonst der Rückfall (ADR-0027/0019). @param {Inhalt} inhalt */
function strukturTitel(inhalt) {
  return profilAusEvent(inhalt.profil)?.name ?? WORTMARKE_RUECKFALL;
}

/**
 * @param {{ konfig: Konfig, inhalt: Inhalt, basisUrl: string }} eingabe
 * @returns {string}
 */
export function feedXml({ konfig, inhalt, basisUrl }) {
  const leer = leerstandMeldung(inhalt, konfig);
  if (leer) error(503, leer);
  const { karten } = artikelListe(inhalt, konfig, { seite: 1 });
  const titel = xmlEscape(strukturTitel(inhalt));
  const items = karten
    .map(
      (k) => `    <item>
      <title>${xmlEscape(k.titel)}</title>
      <link>${xmlEscape(kanonisch(basisUrl, k.pfad))}</link>
      <guid isPermaLink="true">${xmlEscape(kanonisch(basisUrl, k.pfad))}</guid>
      <pubDate>${rfc822(k.veroeffentlicht)}</pubDate>
      <description>${xmlEscape(k.zusammenfassung)}</description>
${k.themen.map((t) => `      <category>${xmlEscape(t.name)}</category>`).join('\n')}
    </item>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${titel}</title>
    <link>${xmlEscape(kanonisch(basisUrl, '/blog'))}</link>
    <description>Beiträge von ${titel}</description>
    <language>de</language>
    <lastBuildDate>${rfc822(inhalt.stand?.zeitpunkt ?? new Date().toISOString())}</lastBuildDate>
    <atom:link href="${xmlEscape(kanonisch(basisUrl, '/feed.xml'))}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}
