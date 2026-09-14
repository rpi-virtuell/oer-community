/**
 * HEAD gegen Blossom; der etag ist der SHA-256 (BUD-01).
 */

/**
 * Holt den etag eines Bildes per HEAD, für Schritt 5 der Prüfkette.
 *
 * Blossom liefert den SHA-256 als etag — die Prüfung kostet damit keinen
 * Download. Scheitert die Anfrage, wird Schritt 5 übersprungen.
 *
 * @param {string} bildUrl
 * @returns {Promise<string|undefined>}
 */
export async function etagHolen(bildUrl) {
  try {
    const antwort = await fetch(bildUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    return antwort.headers.get('etag') ?? undefined;
  } catch {
    return undefined;
  }
}
