/**
 * Reine Funktionen für kanonische URLs — ohne Server-Abhängigkeiten, damit
 * Seitenkomponenten sie importieren können, ohne die Datenschicht ins
 * Client-Bundle zu ziehen (ADR-0029).
 */

/** Origin einer Adresse, oder null, wenn sie nicht parsebar ist. @param {string} adresse */
function origin(adresse) {
  try {
    return new URL(adresse).origin;
  } catch {
    return null;
  }
}

/**
 * Basis für kanonische URLs, Feed und Sitemap: die Domain des Herausgebers
 * (kind:0 website), sonst der Origin der Anfrage.
 *
 * Nur der Origin zählt: steht im Profil `https://oer.community/blog/`, wäre
 * sonst jede kanonische URL `…/blog/blog` — ein Pfad im Profilfeld darf die
 * Adressen des Hubs nicht verschieben.
 * @param {import('./models/profil.js').Profil|null} profil @param {string} herkunft
 */
export function basisUrlBestimmen(profil, herkunft) {
  const w = profil?.website?.trim();
  return (w ? origin(w) : null) ?? origin(herkunft) ?? herkunft.replace(/\/+$/, '');
}

/** basisUrl + pfad; '/' bleibt ein Schrägstrich. @param {string} basisUrl @param {string} pfad */
export function kanonisch(basisUrl, pfad) {
  return pfad === '/' ? `${basisUrl}/` : `${basisUrl}${pfad}`;
}
