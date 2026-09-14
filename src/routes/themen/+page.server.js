import { env } from '$env/dynamic/private';
import { konfigLesen } from '$lib/konfig.js';
import { themenLaden } from '$lib/routen/uebersicht.js';
import { spiegelHolen } from '$lib/services/spiegel.js';

export const prerender = false;

/** @type {import('./$types').PageServerLoad} */
export function load() {
  return themenLaden({ konfig: konfigLesen(env), inhalt: spiegelHolen().lesen() });
}
