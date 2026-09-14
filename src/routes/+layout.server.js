import { env } from '$env/dynamic/private';
import { konfigLesen } from '$lib/konfig.js';
import { strukturFuerLayout } from '$lib/routen/struktur.js';
import { spiegelHolen } from '$lib/services/spiegel.js';

/** @type {import('./$types').LayoutServerLoad} */
export function load() {
  const spiegel = spiegelHolen();
  const inhalt = spiegel.lesen();
  const fehlschlag = spiegel.letzterFehlschlag();
  return {
    spiegelstand: {
      zeitpunkt: inhalt.stand?.zeitpunkt ?? null,
      // Nur wenn der letzte Lauf scheiterte, ist das Alter eine Nachricht (CLAUDE.md).
      veraltet: fehlschlag !== null,
      relays: fehlschlag?.gefragteRelays ?? []
    },
    // Struktur aus Nostr (ADR-0027): auch bei leerem Spiegel — dann mit Rückfällen.
    struktur: strukturFuerLayout({ konfig: konfigLesen(env), inhalt })
  };
}
