import { spiegelHolen } from '$lib/services/spiegel.js';

/** @type {import('./$types').LayoutServerLoad} */
export function load() {
  const spiegel = spiegelHolen();
  const stand = spiegel.lesen().stand;
  const fehlschlag = spiegel.letzterFehlschlag();
  return {
    spiegelstand: {
      zeitpunkt: stand?.zeitpunkt ?? null,
      // Nur wenn der letzte Lauf scheiterte, ist das Alter eine Nachricht (CLAUDE.md).
      veraltet: fehlschlag !== null,
      relays: fehlschlag?.gefragteRelays ?? []
    }
  };
}
