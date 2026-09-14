/**
 * Warum der Spiegel nichts zu zeigen hat — nie eine leere Seite ohne
 * Erklärung (CLAUDE.md). Zwei Fälle, zwei Schuldige: Verbindung oder Daten.
 *
 * @param {import('../services/spiegel.js').Inhalt} inhalt
 * @param {import('../konfig.js').Konfig} konfig
 * @returns {string|null}
 */
export function leerstandMeldung(inhalt, konfig) {
  if (inhalt.stand === null) {
    return (
      'Noch keine Inhalte geladen: Bisher hat kein Relay geantwortet. ' +
      `Gefragt wurden: ${konfig.relays.join(', ')}. Der Dienst versucht es weiter; ` +
      'Verbindung und RELAYS in der .env prüfen.'
    );
  }
  if (inhalt.artikel.length === 0) {
    return (
      `Die Relays ${inhalt.stand.gefragteRelays.join(', ')} haben geantwortet, aber keinen ` +
      `Beitrag von ${konfig.autor.slice(0, 12)}… geliefert. QUELLE_AUTOR in der .env prüfen.`
    );
  }
  return null;
}
