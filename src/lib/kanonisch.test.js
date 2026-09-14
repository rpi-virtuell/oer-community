import { describe, expect, it } from 'vitest';
import { basisUrlBestimmen, kanonisch } from './kanonisch.js';

/** @param {string|undefined} website */
const profil = (website) => /** @type {any} */ ({ name: 'X', logoUrl: null, fusstext: null, website: website ?? null });

describe('kanonisch', () => {
  it('setzt den Pfad an die Basis; / bleibt ein Schrägstrich', () => {
    expect(kanonisch('https://oer.community', '/canva')).toBe('https://oer.community/canva');
    expect(kanonisch('https://oer.community', '/')).toBe('https://oer.community/');
  });
});

describe('basisUrlBestimmen', () => {
  it('nimmt die website aus dem Profil ohne Schrägstrich', () => {
    expect(basisUrlBestimmen(profil('https://oer.community/'), 'https://o')).toBe('https://oer.community');
  });

  it('nimmt nur den Origin der website — Pfad, Abfrage und Anker fallen weg', () => {
    expect(basisUrlBestimmen(profil('https://oer.community/blog/?x=1#top'), 'https://o')).toBe('https://oer.community');
    expect(basisUrlBestimmen(profil('https://oer.community/blog/'), 'https://o')).toBe('https://oer.community');
    expect(basisUrlBestimmen(profil('https://oer.community'), 'https://o')).toBe('https://oer.community');
    expect(basisUrlBestimmen(profil('https://oer.community:8443/x'), 'https://o')).toBe('https://oer.community:8443');
  });

  it('eine unparsebare website fällt auf den Origin zurück', () => {
    expect(basisUrlBestimmen(profil('nicht/eine/url'), 'https://hub.example/')).toBe('https://hub.example');
  });

  it('fällt auf den Origin zurück, wenn keine website gesetzt ist', () => {
    expect(basisUrlBestimmen(null, 'https://hub.example/')).toBe('https://hub.example');
    expect(basisUrlBestimmen(profil(''), 'https://hub.example')).toBe('https://hub.example');
  });

  it('nimmt auch vom Origin nur den Origin', () => {
    expect(basisUrlBestimmen(null, 'https://hub.example/pfad?x=1')).toBe('https://hub.example');
    expect(basisUrlBestimmen(null, 'unparsebar/')).toBe('unparsebar');
  });
});
