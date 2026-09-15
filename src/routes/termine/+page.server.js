import { env } from '$env/dynamic/private';
import { konfigLesen } from '$lib/konfig.js';
import { termineLaden } from '$lib/routen/termine.js';
import { spiegelHolen } from '$lib/services/spiegel.js';

export const prerender = false;

/**
 * Die Terminseite gibt es einmal, auf Deutsch: ein Kalender, eine Liste —
 * die englische Startseite verlinkt dieselbe Seite (ADR-0034).
 * @type {import('./$types').PageServerLoad}
 */
export function load() {
  return termineLaden({ konfig: konfigLesen(env), inhalt: spiegelHolen().lesen() });
}
