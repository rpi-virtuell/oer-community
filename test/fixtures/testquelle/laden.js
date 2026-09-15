import { readFileSync } from 'node:fs';
import { leererInhalt } from '../../../src/lib/services/spiegel.js';

const lesen = (/** @type {string} */ f) => JSON.parse(readFileSync(new URL(`./${f}`, import.meta.url), 'utf8'));

/** Alle Events der Testquelle und ihr Schlüssel. */
export function testquelle() {
  /** @type {import('../../../src/lib/services/spiegel.js').Event[]} */
  const events = lesen('events.json');
  const { pubkey } = lesen('schluessel.json');
  return { events, pubkey };
}

/**
 * Ein Spiegelinhalt, wie ihn ein gültiger Lauf über die Testquelle ergäbe.
 * @param {{ ohne?: Array<{ kind: number, d?: string }> }} [lage]  Events, die fehlen sollen
 */
export function inhaltDerTestquelle(lage = {}) {
  const { events, pubkey } = testquelle();
  const d = (/** @type {any} */ e) => e.tags.find((/** @type {string[]} */ t) => t[0] === 'd')?.[1];
  const bleibt = events.filter((e) => !(lage.ohne ?? []).some((o) => o.kind === e.kind && (o.d === undefined || o.d === d(e))));
  return {
    inhalt: {
      ...leererInhalt(),
      stand: { zeitpunkt: '2026-09-14T10:00:00Z', dauerMs: 1, gefragteRelays: ['wss://r/'], nichtErreichbar: [], anzahl: { artikel: 0, listen: 0, nachweise: 0, profil: 0, termine: 0 } },
      artikel: bleibt.filter((e) => e.kind === 30023),
      listen: bleibt.filter((e) => e.kind === 30004),
      profil: bleibt.find((e) => e.kind === 0) ?? null
    },
    konfig: /** @type {import('../../../src/lib/konfig.js').Konfig} */ ({
      autor: pubkey, hTag: null, relays: ['wss://r/'], blossomUrl: 'https://blossom.example/', abgeloesteHosts: [],
      spiegelPfad: 'x', spiegelIntervallS: 600, spiegelStartwartezeitS: 20,
      startseiteD: 'startseite', navigationD: 'navigation', fusszeileD: 'fusszeile',
      community: null, edufeedUrl: 'https://dev.edufeed.org'
    })
  };
}
