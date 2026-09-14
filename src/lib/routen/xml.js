/**
 * Kleine XML-Helfer für feed.xml und sitemap.xml — kein XML-Parser als
 * Abhängigkeit, nur die zwei Bausteine, die beide Formate brauchen.
 */

/** Escapt die fünf XML-Sonderzeichen. @param {string} text */
export function xmlEscape(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** RFC 822 für RSS pubDate/lastBuildDate. @param {string} iso */
export function rfc822(iso) {
  return new Date(iso).toUTCString();
}
