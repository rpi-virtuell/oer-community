/**
 * Reine Funktionen für kanonische URLs — ohne Server-Abhängigkeiten, damit
 * Seitenkomponenten sie importieren können, ohne die Datenschicht ins
 * Client-Bundle zu ziehen (ADR-0029).
 */

/**
 * Basis für kanonische URLs, Feed und Sitemap: die Domain des Herausgebers
 * (kind:0 website), sonst der Origin der Anfrage.
 * @param {import('./models/profil.js').Profil|null} profil @param {string} origin
 */
export function basisUrlBestimmen(profil, origin) {
  const w = profil?.website?.replace(/\/+$/, '');
  return w && w !== '' ? w : origin.replace(/\/+$/, '');
}

/** basisUrl + pfad; '/' bleibt ein Schrägstrich. @param {string} basisUrl @param {string} pfad */
export function kanonisch(basisUrl, pfad) {
  return pfad === '/' ? `${basisUrl}/` : `${basisUrl}${pfad}`;
}
