import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { abfrageAusStand, artikelAusSpiegel } from './artikel.js';
import { leererInhalt } from '../services/spiegel.js';

const fixture = (/** @type {string} */ f) => JSON.parse(readFileSync(new URL(`../../../test/fixtures/${f}`, import.meta.url), 'utf8'));
const ARTIKEL = fixture('artikel-30023-die-kraft-der-gemeinschaft-2026-09-07.json')[0];
const RELAY = 'wss://relay.edufeed.org/';
const RPI = 'wss://relay-rpi.edufeed.org/';
const KONFIG = /** @type {any} */ ({ autor: ARTIKEL.pubkey, relays: [RELAY, RPI] });

const inhalt = {
  ...leererInhalt(),
  stand: { zeitpunkt: '2026-09-14T10:00:00Z', dauerMs: 5, gefragteRelays: [RELAY, RPI], nichtErreichbar: [RPI], anzahl: { artikel: 1, listen: 0, nachweise: 0, profil: 0, termine: 0 } },
  artikel: [ARTIKEL],
  quellen: { [ARTIKEL.id]: [RELAY] }
};

describe('artikelAusSpiegel', () => {
  it('findet den Artikel über d', () => {
    const { artikel, event } = artikelAusSpiegel(inhalt, { d: 'die-kraft-der-gemeinschaft' });
    expect(artikel?.titel).toContain('Kraft');
    expect(event?.id).toBe(ARTIKEL.id);
  });
  it('liefert null für unbekanntes d und für die falsche Sprache', () => {
    expect(artikelAusSpiegel(inhalt, { d: 'gibt-es-nicht' }).artikel).toBeNull();
    expect(artikelAusSpiegel(inhalt, { d: 'die-kraft-der-gemeinschaft', sprache: 'en' }).artikel).toBeNull();
  });

  // Drei Live-Artikel tragen das Prozentzeichen literal im d-Tag; SvelteKit
  // dekodiert den Param, bevor er hier ankommt (ADR-0029).
  it('findet ein prozent-kodiertes d über seine dekodierte Form', () => {
    const kodiert = { ...ARTIKEL, id: 'f'.repeat(64), tags: [['d', 'oer-visuelle-qualit%C3%A4t'], ['title', 'Visuelle Qualität']] };
    const mitKodiertem = { ...inhalt, artikel: [ARTIKEL, kodiert] };
    expect(artikelAusSpiegel(mitKodiertem, { d: 'oer-visuelle-qualität' }).event?.id).toBe(kodiert.id);
    expect(artikelAusSpiegel(mitKodiertem, { d: 'oer-visuelle-qualit%C3%A4t' }).event?.id).toBe(kodiert.id);
  });
});

describe('abfrageAusStand', () => {
  it('übersetzt den Stand in die Form der Entwickleransicht', () => {
    const a = abfrageAusStand(inhalt, KONFIG, ARTIKEL);
    expect(a).toEqual({ gefragteRelays: [RELAY, RPI], fehler: [RPI], ohneTreffer: [], quellen: { [ARTIKEL.id]: [RELAY] }, grund: null });
  });
  it('ein Relay, das antwortete und das Event nicht hatte, steht in ohneTreffer', () => {
    const beide = { ...inhalt, stand: { ...inhalt.stand, nichtErreichbar: [] } };
    expect(abfrageAusStand(beide, KONFIG, ARTIKEL).ohneTreffer).toEqual([RPI]);
  });
  // Ohne Treffer heißt: die antwortenden Relays hatten das Event nicht. Ein
  // leeres ohneTreffer behauptete, alle hätten geliefert.
  it('ohne Event stehen alle antwortenden Relays in ohneTreffer', () => {
    const a = abfrageAusStand(inhalt, KONFIG, null);
    expect(a.ohneTreffer).toEqual([RELAY]);
    const beide = { ...inhalt, stand: { ...inhalt.stand, nichtErreichbar: [] } };
    expect(abfrageAusStand(beide, KONFIG, null).ohneTreffer).toEqual([RELAY, RPI]);
  });

  it('ohne Stand: alle Relays gefragt, keines erreichbar', () => {
    const a = abfrageAusStand(leererInhalt(), KONFIG, null);
    expect(a.grund).toBe('kein-relay-erreichbar');
    expect(a.fehler).toEqual([RELAY, RPI]);
  });
});
