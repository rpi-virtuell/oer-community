import { env } from '$env/dynamic/private';
import { redirect } from '@sveltejs/kit';
import { konfigLesen } from '$lib/konfig.js';
import { startLaden } from '$lib/routen/uebersicht.js';
import { spiegelHolen } from '$lib/services/spiegel.js';

export const prerender = false;

/**
 * /en: die englische Startseite (ADR-0033) — gibt es sie nicht, geht es nach
 * /. Anders als / fällt hier nichts auf den Blog zurück: der ist deutsch.
 * @type {import('./$types').PageServerLoad}
 */
export async function load() {
  const ergebnis = await startLaden({ konfig: konfigLesen(env), inhalt: spiegelHolen().lesen(), sprache: 'en' });
  // Nur zur Typverengung: der englische Zweig liefert immer eine Seite oder
  // weicht selbst aus — dann vorläufig (302), nie dauerhaft.
  if (ergebnis.art !== 'seite') redirect(302, '/');
  return ergebnis.seite;
}
