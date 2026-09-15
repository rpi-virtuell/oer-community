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
 * Die Termin-Fixtures der FOERBICO-Quelle: die Tagung (kind:31922) und die
 * Redaktionsliste (kind:30000), deren p-Tag den Einreicher zulässt. Sie
 * gehören nicht zur Testquelle — mit `mitTerminen` treten sie zu ihr, damit
 * Menü, Startseite und Sitemap den Kalenderfall prüfen können (ADR-0034).
 */
function terminFixtures() {
  /** @typedef {import('../../../src/lib/services/spiegel.js').Event} Event */
  return {
    termine: /** @type {Event[]} */ (lesen('../termine-31922-community.json')),
    redaktion: /** @type {Event[]} */ (lesen('../liste-30000-redaktion.json')),
    community: 'ae6199bb435d70a0ecce61324ac80e7c24dedf2b0680cbd3e94983e7557746a2'
  };
}

/**
 * Ein Spiegelinhalt, wie ihn ein gültiger Lauf über die Testquelle ergäbe.
 * @param {{ ohne?: Array<{ kind: number, d?: string }>, mitTerminen?: boolean }} [lage]  Events, die fehlen sollen
 */
export function inhaltDerTestquelle(lage = {}) {
  const termine = lage.mitTerminen ? terminFixtures() : null;
  const { events, pubkey } = testquelle();
  const d = (/** @type {any} */ e) => e.tags.find((/** @type {string[]} */ t) => t[0] === 'd')?.[1];
  const bleibt = events.filter((e) => !(lage.ohne ?? []).some((o) => o.kind === e.kind && (o.d === undefined || o.d === d(e))));
  return {
    inhalt: {
      ...leererInhalt(),
      stand: { zeitpunkt: '2026-09-14T10:00:00Z', dauerMs: 1, gefragteRelays: ['wss://r/'], nichtErreichbar: [], anzahl: { artikel: 0, listen: 0, nachweise: 0, profil: 0, termine: 0 } },
      artikel: bleibt.filter((e) => e.kind === 30023),
      listen: [...bleibt.filter((e) => e.kind === 30004), ...(termine?.redaktion ?? [])],
      termine: termine?.termine ?? [],
      profil: bleibt.find((e) => e.kind === 0) ?? null
    },
    konfig: /** @type {import('../../../src/lib/konfig.js').Konfig} */ ({
      autor: pubkey, hTag: null, relays: ['wss://r/'], blossomUrl: 'https://blossom.example/', abgeloesteHosts: [],
      spiegelPfad: 'x', spiegelIntervallS: 600, spiegelStartwartezeitS: 20,
      startseiteD: 'startseite', navigationD: 'navigation', fusszeileD: 'fusszeile',
      redaktionD: 'redaktion',
      community: termine?.community ?? null, edufeedUrl: 'https://dev.edufeed.org'
    })
  };
}
