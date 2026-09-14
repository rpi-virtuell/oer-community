import { describe, expect, it } from 'vitest';
import { listeAusEvent, listeFinden } from './liste.js';
import { testquelle } from '../../../test/fixtures/testquelle/laden.js';

describe('listeAusEvent', () => {
  const { events, pubkey } = testquelle();
  const nav = events.find((e) => e.kind === 30004 && e.tags.some((t) => t[0] === 'd' && t[1] === 'navigation'));
  it('liest Titel und Ziele in Reihenfolge', () => {
    const liste = listeAusEvent(/** @type {any} */ (nav));
    expect(liste.d).toBe('navigation');
    expect(liste.titel).toBe('Hauptmenü');
    expect(liste.ziele.map((z) => z.d)).toEqual(['unser-team', 'oer-und-oep', 'startseite', 'artikel-a', 'x']);
    expect(liste.ziele[0]).toEqual({ kind: 30023, pubkey, d: 'unser-team', roh: `30023:${pubkey}:unser-team` });
  });
  it('lässt unbrauchbare a-Tags aus und behält d mit Doppelpunkt', () => {
    const e = /** @type {any} */ ({ ...nav, tags: [['d', 'x'], ['a', 'kaputt'], ['a', `abc:${pubkey}:y`], ['a', `30023:${pubkey}:mit:doppelpunkt`]] });
    expect(listeAusEvent(e).ziele.map((z) => z.d)).toEqual(['mit:doppelpunkt']);
  });
  it('listeFinden liefert die Liste zu einem d oder null', () => {
    const listen = events.filter((e) => e.kind === 30004);
    expect(listeFinden(listen, 'fusszeile')?.ziele.map((z) => z.d)).toEqual(['impressum', 'datenschutz']);
    expect(listeFinden(listen, 'gibt-es-nicht')).toBeNull();
  });
});
