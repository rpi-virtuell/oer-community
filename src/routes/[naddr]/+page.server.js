import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { inhaltAufbereiten } from '$lib/inhalt.js';
import { konfigLesen } from '$lib/konfig.js';
import { naddrDekodieren } from '$lib/naddr.js';
import { ABLEHNUNG_TEXT, adressePruefen } from '$lib/models/adresse.js';
import { artikelLaden } from '$lib/loaders/artikel.js';
import { etagHolen, lizenzLaden } from '$lib/loaders/lizenz.js';
import { lizenzPruefen } from '$lib/models/lizenz.js';

export const prerender = false;

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
  // Fehlt ein Pflichtwert, bricht es hier ab — nicht mit leerer Seite.
  const konfig = konfigLesen(env);

  let adresse;
  try {
    adresse = naddrDekodieren(params.naddr);
  } catch (ursache) {
    error(400, ursache instanceof Error ? ursache.message : 'Unlesbare Adresse.');
  }

  // Der naddr kommt von aussen: nur die eigene Quelle wird angezeigt
  // (ADR-0016). Sonst waere dies ein offener Nostr-Renderer.
  const zulaessig = adressePruefen(adresse, konfig);
  if (!zulaessig.ok) {
    error(404, ABLEHNUNG_TEXT[zulaessig.grund]);
  }

  const { artikel, gefragteRelays, grund } = await artikelLaden({
    adresse,
    relays: konfig.relays
  });

  if (!artikel) {
    // `grund` unterscheidet „keines erreichbar" von „hat geantwortet und
    // nichts". Nur so heisst 404 wirklich 404.
    if (grund !== null) {
      error(
        503,
        `Kein Relay hat geantwortet. Gefragt wurden: ${gefragteRelays.join(', ')}. ` +
          'Verbindung und RELAYS in der .env prüfen.'
      );
    }
    error(
      404,
      `Kein Artikel mit d="${adresse.d}" von ${adresse.author.slice(0, 12)}… gefunden. ` +
        `Gefragt wurden: ${gefragteRelays.join(', ')}.`
    );
  }

  const { nachweis } = artikel.bildHash
    ? await lizenzLaden({ hash: artikel.bildHash, relays: konfig.relays })
    : { nachweis: null };

  const etag =
    artikel.bildUrl && /^https?:\/\//.test(artikel.bildUrl)
      ? await etagHolen(artikel.bildUrl)
      : undefined;

  const lizenz = lizenzPruefen({
    bildUrl: artikel.bildUrl,
    bildHash: artikel.bildHash,
    nachweis,
    etag
  });

  const { html, entfernteBilder } = inhaltAufbereiten(artikel.inhalt);

  return {
    artikel: {
      titel: artikel.titel,
      zusammenfassung: artikel.zusammenfassung,
      veroeffentlicht: artikel.veroeffentlicht.toISOString(),
      themen: artikel.themen,
      bildUrl: artikel.bildUrl
    },
    lizenz,
    html,
    entfernteBilder
  };
}
