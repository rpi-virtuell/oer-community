/**
 * Startet den Spiegel mit dem Prozess (ADR-0028). `init` läuft einmal vor
 * der ersten Anfrage; `spiegelStarten` wartet höchstens
 * SPIEGEL_STARTWARTEZEIT_S auf den ersten Lauf und geht dann ans Netz —
 * mit der Datei, oder leer mit Meldung.
 *
 * Fehlt ein Pflichtwert der Konfiguration, bricht `konfigLesen` hier ab —
 * beim Start, nicht später mit leeren Seiten.
 */
import { env } from '$env/dynamic/private';
import { konfigLesen } from '$lib/konfig.js';
import { spiegelBereit, spiegelStarten } from '$lib/services/spiegel.js';
import { spracheAusPfad } from '$lib/sprache.js';

/** @type {import('@sveltejs/kit').ServerInit} */
export async function init() {
  spiegelStarten(konfigLesen(env));
  // Erst antworten, wenn der erste Lauf durch ist oder die Frist verstrich.
  await spiegelBereit();
}

/**
 * `<html lang>` je Antwort aus der Sprache der Adresse (ADR-0033) — der
 * Platzhalter %lang% in app.html wird hier gefüllt.
 * @type {import('@sveltejs/kit').Handle}
 */
export async function handle({ event, resolve }) {
  const lang = spracheAusPfad(event.url.pathname);
  return resolve(event, { transformPageChunk: ({ html }) => html.replace('%lang%', lang) });
}
