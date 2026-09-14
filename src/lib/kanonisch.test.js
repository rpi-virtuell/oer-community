import { describe, expect, it } from 'vitest';
import { basisUrlBestimmen, kanonisch } from './kanonisch.js';

describe('kanonisch', () => {
  it('setzt den Pfad an die Basis; / bleibt ein Schrägstrich', () => {
    expect(kanonisch('https://oer.community', '/canva')).toBe('https://oer.community/canva');
    expect(kanonisch('https://oer.community', '/')).toBe('https://oer.community/');
  });
});

describe('basisUrlBestimmen', () => {
  it('nimmt die website aus dem Profil ohne Schrägstrich', () => {
    expect(basisUrlBestimmen({ name: 'X', logoUrl: null, fusstext: null, website: 'https://oer.community/' }, 'https://o')).toBe(
      'https://oer.community'
    );
  });

  it('fällt auf den Origin zurück, wenn keine website gesetzt ist', () => {
    expect(basisUrlBestimmen(null, 'https://hub.example/')).toBe('https://hub.example');
    expect(basisUrlBestimmen({ name: 'X', logoUrl: null, fusstext: null, website: '' }, 'https://hub.example')).toBe(
      'https://hub.example'
    );
  });
});
