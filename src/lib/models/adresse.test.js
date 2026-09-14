import { describe, expect, it } from 'vitest';
import { adressePruefen } from './adresse.js';

const AUTOR = '5a12b41ec15b466321e88c371be2dc47d9193f9c8bba4ab09fc50045bd35aedf';
const FREMD = 'f'.repeat(64);

/** @param {Partial<import('../naddr.js').Adresse>} teil */
function adresse(teil = {}) {
  return { kind: 30023, author: AUTOR, d: 'die-kraft-der-gemeinschaft', relays: [], ...teil };
}

describe('adressePruefen', () => {
  it('lässt die eigene Quelle durch', () => {
    expect(adressePruefen(adresse(), { autor: AUTOR })).toEqual({ ok: true });
  });

  it('weist einen fremden Autor ab', () => {
    const e = adressePruefen(adresse({ author: FREMD }), { autor: AUTOR });
    expect(e).toEqual({ ok: false, grund: 'fremder-autor' });
  });

  it('lässt kind 30023 durch', () => {
    expect(adressePruefen(adresse({ kind: 30023 }), { autor: AUTOR }).ok).toBe(true);
  });

  it('weist Termine ab — nicht mehr im Zuschnitt (ADR-0026)', () => {
    for (const kind of [31922, 31923]) {
      const e = adressePruefen(adresse({ kind }), { autor: AUTOR });
      expect(e).toEqual({ ok: false, grund: 'unerwartetes-kind' });
    }
  });

  it('weist ein unerwartetes kind ab', () => {
    const e = adressePruefen(adresse({ kind: 1 }), { autor: AUTOR });
    expect(e).toEqual({ ok: false, grund: 'unerwartetes-kind' });
  });

  it('weist eine leere d-Kennung ab', () => {
    expect(adressePruefen(adresse({ d: '' }), { autor: AUTOR })).toEqual({
      ok: false,
      grund: 'keine-kennung'
    });
  });

  it('prüft den Autor vor dem kind — der Autor ist das strengere Kriterium', () => {
    const e = adressePruefen(adresse({ author: FREMD, kind: 1 }), { autor: AUTOR });
    expect(e).toEqual({ ok: false, grund: 'fremder-autor' });
  });
});
