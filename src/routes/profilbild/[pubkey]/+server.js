/** Profilbild einer verwiesenen Person, gehalten vom Spiegel (ADR-0039). */
import { spiegelHolen } from '$lib/services/spiegel.js';
import { profilbildAntwort } from '$lib/routen/profilbild.js';

export const prerender = false;

/** @type {import('./$types').RequestHandler} */
export async function GET({ params, request }) {
  const spiegel = spiegelHolen();
  return profilbildAntwort({
    pubkey: params.pubkey,
    ifNoneMatch: request.headers.get('if-none-match'),
    inhalt: spiegel.lesen(),
    bildpfad: spiegel.bildpfad
  });
}
