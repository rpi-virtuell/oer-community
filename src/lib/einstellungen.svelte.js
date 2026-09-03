/**
 * Der Debug-Modus als geteilter, reaktiver Zustand.
 *
 * Absichtlich nur ein Behälter: Lesen, Schreiben und das Abfangen eines
 * gesperrten `localStorage` stehen in `einstellungen.js` und sind dort
 * geprüft. Runes werden nur im Svelte-Lauf kompiliert — Logik in einer
 * `.svelte.js` wäre vom Test nicht erreichbar.
 *
 * Startwert ist `false`, auch im Browser. Erst `ausSpeicherLaden()` holt den
 * gemerkten Wert; aufgerufen wird das in `onMount`. Käme der Startwert direkt
 * aus `localStorage`, unterschiede sich die erste Darstellung im Browser von
 * der des Servers, und Svelte meldete die Abweichung.
 */

import { debugModusLesen, debugModusSchreiben } from './einstellungen.js';

class Einstellungen {
  debugModus = $state(false);

  /** Holt den gemerkten Wert. Nur im Browser aufrufen. */
  ausSpeicherLaden() {
    this.debugModus = debugModusLesen();
  }

  /** Schaltet um und merkt den neuen Wert. */
  debugModusUmschalten() {
    this.debugModus = !this.debugModus;
    debugModusSchreiben(this.debugModus);
  }
}

export const einstellungen = new Einstellungen();
