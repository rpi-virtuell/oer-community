/**
 * Die Terminseite /termine (ADR-0034). Wie alle Übersichten liest sie aus dem
 * Spiegel; nur hier wird geworfen (ADR-0014).
 */
import { error } from '@sveltejs/kit';
import { termineListe } from '../loaders/termine.js';
import { leerstandMeldung } from '../models/leerstand.js';
import { t } from '../sprache.js';

/** @typedef {import('../konfig.js').Konfig} Konfig */
/** @typedef {import('../services/spiegel.js').Inhalt} Inhalt */

/** @param {{ konfig: Konfig, inhalt: Inhalt, jetzt?: () => Date, sprache?: 'de'|'en' }} e */
export function termineLaden({ konfig, inhalt, jetzt, sprache = 'de' }) {
  const leer = leerstandMeldung(inhalt, konfig);
  if (leer) error(503, leer);
  const liste = termineListe(inhalt, konfig, { jetzt });
  /** @type {string|null} */
  let hinweis = null;
  if (liste.kommend.length + liste.vergangen.length === 0) {
    hinweis = t(sprache, 'keineTermine', konfig.community ? `${konfig.community.slice(0, 12)}…` : '(nicht konfiguriert)');
    // Ein leerer Kalender kann auch an der Verbindung liegen. Ohne diesen
    // Zusatz sähe „noch nichts publiziert" genauso aus wie „ein Relay hat
    // geschwiegen" — nie eine leere Liste ohne Erklärung (CLAUDE.md).
    const stumm = inhalt.stand?.nichtErreichbar ?? [];
    if (stumm.length > 0) hinweis += ` ${t(sprache, 'relaysNichtErreichbar', stumm)}`;
  }
  return { ...liste, ueberschrift: t(sprache, 'termine'), hinweis, basis: '/termine' };
}

/** Die nächsten Termine für die Startseite. @param {{ konfig: Konfig, inhalt: Inhalt, jetzt?: () => Date, anzahl?: number }} e */
export function naechsteTermine({ konfig, inhalt, jetzt, anzahl = 3 }) {
  return termineListe(inhalt, konfig, { jetzt }).kommend.slice(0, anzahl);
}
