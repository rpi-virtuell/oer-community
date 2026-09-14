import { env } from '$env/dynamic/private';
import { konfigLesen } from '$lib/konfig.js';
import { detailLaden } from '$lib/routen/detail.js';
import { spiegelHolen } from '$lib/services/spiegel.js';

export const prerender = false;

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
  const konfig = konfigLesen(env);
  const { seite } = await detailLaden({ d: params.d, sprache: 'en', konfig, inhalt: spiegelHolen().lesen() });
  return seite;
}
