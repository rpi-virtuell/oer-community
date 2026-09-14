import { env } from '$env/dynamic/private';
import { konfigLesen } from '$lib/konfig.js';
import { feedXml } from '$lib/routen/feed.js';
import { basisUrlBestimmen } from '$lib/routen/struktur.js';
import { profilAusEvent } from '$lib/models/profil.js';
import { spiegelHolen } from '$lib/services/spiegel.js';

export const prerender = false;

/** @type {import('./$types').RequestHandler} */
export function GET({ url }) {
  const konfig = konfigLesen(env);
  const inhalt = spiegelHolen().lesen();
  const basisUrl = basisUrlBestimmen(profilAusEvent(inhalt.profil), url.origin);
  return new Response(feedXml({ konfig, inhalt, basisUrl }), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=600' }
  });
}
