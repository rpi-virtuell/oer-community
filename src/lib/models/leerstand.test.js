import { describe, expect, it } from 'vitest';
import { leerstandMeldung } from './leerstand.js';
import { leererInhalt } from '../services/spiegel.js';

const KONFIG = /** @type {import('../konfig.js').Konfig} */ ({
  autor: 'a'.repeat(64), hTag: null, relays: ['wss://r1/', 'wss://r2/'], blossomUrl: 'https://b/',
  abgeloesteHosts: [], spiegelPfad: 'x', spiegelIntervallS: 600, spiegelStartwartezeitS: 20,
  startseiteD: 'startseite', navigationD: 'navigation', fusszeileD: 'fusszeile',
  redaktionD: 'redaktion',
  community: null, edufeedUrl: 'https://dev.edufeed.org'
});

describe('leerstandMeldung', () => {
  it('nennt die Relays, wenn noch nie ein Lauf gelang', () => {
    const m = leerstandMeldung(leererInhalt(), KONFIG);
    expect(m).toContain('wss://r1/, wss://r2/');
    expect(m).toContain('weiter');
  });
  it('nennt den Autor, wenn Relays antworteten, aber nichts von ihm haben', () => {
    const inhalt = { ...leererInhalt(), stand: { zeitpunkt: '2026-09-14T10:00:00Z', dauerMs: 1, gefragteRelays: KONFIG.relays, nichtErreichbar: [], anzahl: { artikel: 0, listen: 0, nachweise: 0, profil: 0, termine: 0 } } };
    expect(leerstandMeldung(inhalt, KONFIG)).toContain('aaaaaaaaaaaa…');
  });
  it('ist null, sobald Artikel da sind', () => {
    const inhalt = { ...leererInhalt(), stand: { zeitpunkt: 'x', dauerMs: 1, gefragteRelays: [], nichtErreichbar: [], anzahl: { artikel: 1, listen: 0, nachweise: 0, profil: 0, termine: 0 } }, artikel: [/** @type {any} */ ({ id: '1', tags: [] })] };
    expect(leerstandMeldung(inhalt, KONFIG)).toBeNull();
  });
});
