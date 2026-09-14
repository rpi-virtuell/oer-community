import { env } from '$env/dynamic/private';
import { konfigLesen } from '$lib/konfig.js';
import { themaLaden, seitennummerOhneEins } from '$lib/routen/uebersicht.js';
import { spiegelHolen } from '$lib/services/spiegel.js';

export const prerender = false;

/** @type {import('./$types').PageServerLoad} */
export function load({ params }) {
  return themaLaden({
    konfig: konfigLesen(env),
    inhalt: spiegelHolen().lesen(),
    slug: params.thema,
    seite: seitennummerOhneEins(params.n, `/themen/${encodeURIComponent(params.thema)}`)
  });
}
