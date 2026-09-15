import { env } from '$env/dynamic/private';
import { konfigLesen } from '$lib/konfig.js';
import { strukturFuerLayout } from '$lib/routen/struktur.js';
import { spiegelHolen } from '$lib/services/spiegel.js';
import { spracheAusPfad } from '$lib/sprache.js';

/** @type {import('./$types').LayoutServerLoad} */
export function load({ url }) {
  const spiegel = spiegelHolen();
  const inhalt = spiegel.lesen();
  const fehlschlag = spiegel.letzterFehlschlag();
  // Die Sprache der Adresse: /en und /en/… sind Englisch (ADR-0033).
  const sprache = spracheAusPfad(url.pathname);
  return {
    spiegelstand: {
      zeitpunkt: inhalt.stand?.zeitpunkt ?? null,
      // Nur wenn der letzte Lauf scheiterte, ist das Alter eine Nachricht (CLAUDE.md).
      veraltet: fehlschlag !== null,
      relays: fehlschlag?.gefragteRelays ?? []
    },
    // Struktur aus Nostr (ADR-0027): auch bei leerem Spiegel — dann mit Rückfällen.
    // basisUrl (ADR-0029): kind:0 website, sonst der Origin dieser Anfrage.
    struktur: strukturFuerLayout({ konfig: konfigLesen(env), inhalt, origin: url.origin, sprache })
  };
}
