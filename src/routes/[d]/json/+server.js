import { env } from '$env/dynamic/private';
import { konfigLesen } from '$lib/konfig.js';
import { detailAlsJson } from '$lib/routen/detail-json.js';
import { spiegelHolen } from '$lib/services/spiegel.js';

export const prerender = false;

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
  const konfig = konfigLesen(env);
  const inhalt = spiegelHolen().lesen();
  return detailAlsJson({ d: params.d, sprache: 'de', konfig, inhalt });
}
