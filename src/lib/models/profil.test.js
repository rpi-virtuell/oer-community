import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { profilAusEvent } from './profil.js';
import { testquelle } from '../../../test/fixtures/testquelle/laden.js';

const FOERBICO = JSON.parse(readFileSync(new URL('../../../test/fixtures/profil-0-foerbico.json', import.meta.url), 'utf8'))[0];

describe('profilAusEvent', () => {
  it('liest name, picture, about, website aus der Testquelle', () => {
    const profil = profilAusEvent(testquelle().events.find((e) => e.kind === 0) ?? null);
    expect(profil).toEqual({ name: 'Testquelle', logoUrl: 'https://blossom.example/logo.png', fusstext: 'CC BY **Testquelle** — [Impressum](https://example.org/impressum)', website: 'https://test.example' });
  });
  it('fällt auf display_name zurück und lässt Fehlendes null (FOERBICO-Fixture vom 03.09.)', () => {
    expect(profilAusEvent(FOERBICO)).toEqual({ name: 'Foerbico', logoUrl: null, fusstext: null, website: null });
  });
  it('ohne Event oder mit kaputtem JSON: null', () => {
    expect(profilAusEvent(null)).toBeNull();
    expect(profilAusEvent(/** @type {any} */ ({ ...FOERBICO, content: '{kaputt' }))).toBeNull();
  });
  it('nimmt keine http- oder javascript-Adressen als Logo', () => {
    const e = /** @type {any} */ ({ ...FOERBICO, content: JSON.stringify({ name: 'X', picture: 'javascript:alert(1)', website: 'http://unsicher' }) });
    expect(profilAusEvent(e)).toEqual({ name: 'X', logoUrl: null, fusstext: null, website: null });
  });
});
