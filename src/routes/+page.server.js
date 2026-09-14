import { env } from '$env/dynamic/private';
import { konfigLesen } from '$lib/konfig.js';
import { startLaden } from '$lib/routen/uebersicht.js';
import { spiegelHolen } from '$lib/services/spiegel.js';

export const prerender = false;

/** @type {import('./$types').PageServerLoad} */
export async function load() {
  return startLaden({ konfig: konfigLesen(env), inhalt: spiegelHolen().lesen() });
}
