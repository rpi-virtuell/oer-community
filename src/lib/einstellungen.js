/**
 * Einstellungen, die im Browser bleiben.
 *
 * Bisher nur der Debug-Modus: Er schaltet den Rohdaten-Bereich an der
 * Detailansicht frei. Muster übernommen von der edufeed-app
 * (`appSettings.debugMode`) — Rune plus `localStorage` —, damit die
 * Bedienung dieselbe ist (ADR-0009: Muster sollen wandern können).
 *
 * **Bewusst nicht auf dem Server.** Der Schalter betrifft nur, was ein
 * Entwickler sehen will, nicht was ausgeliefert wird. Serverseitig gerendert
 * wird die Seite ohne den Bereich; er erscheint, sobald der Browser den
 * gespeicherten Wert kennt. Die Serverdarstellung abzuschalten wäre auch
 * hier nicht die Antwort (ADR-0003) — der Beitrag bleibt ohne JavaScript
 * lesbar, nur der Debug-Bereich fehlt dann.
 *
 * **Jeder Zugriff ist gekapselt.** In einem privaten Fenster oder bei
 * blockierten Website-Daten wirft schon der Zugriff auf `localStorage` —
 * eine Einstellung darf die Seite nicht kosten.
 */

/** Schlüssel im localStorage. Ein Objekt, damit später mehr hineinpasst. */
export const SPEICHER_SCHLUESSEL = 'community-hub-einstellungen';

/**
 * Alles Gespeicherte, oder ein leeres Objekt.
 *
 * @returns {Record<string, unknown>}
 */
function gespeichertes() {
  try {
    const roh = globalThis.localStorage?.getItem(SPEICHER_SCHLUESSEL);
    if (!roh) return {};
    const gelesen = JSON.parse(roh);
    return gelesen && typeof gelesen === 'object' ? gelesen : {};
  } catch {
    // Unlesbar oder unzugänglich: Standardwerte statt Absturz.
    return {};
  }
}

/**
 * Ist der Debug-Modus eingeschaltet?
 *
 * @returns {boolean}
 */
export function debugModusLesen() {
  return gespeichertes().debugModus === true;
}

/**
 * Schaltet den Debug-Modus und merkt ihn.
 *
 * Liest zuvor das Gespeicherte, damit künftige Einstellungen nicht
 * verlorengehen.
 *
 * @param {boolean} an
 */
export function debugModusSchreiben(an) {
  try {
    globalThis.localStorage?.setItem(
      SPEICHER_SCHLUESSEL,
      JSON.stringify({ ...gespeichertes(), debugModus: an })
    );
  } catch {
    // Kein Speicher: Die Einstellung gilt dann nur für diese Seite.
  }
}
