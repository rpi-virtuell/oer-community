import { describe, expect, it } from 'vitest';
import { spracheAusPfad, startPfad, t, TEXTE } from './sprache.js';

describe('sprache.js (ADR-0033)', () => {
  it('liest die Sprache aus dem Pfad: /en und /en/… sind Englisch, alles andere Deutsch', () => {
    expect(spracheAusPfad('/')).toBe('de');
    expect(spracheAusPfad('/blog')).toBe('de');
    expect(spracheAusPfad('/en')).toBe('en');
    expect(spracheAusPfad('/en/')).toBe('en');
    expect(spracheAusPfad('/en/conference')).toBe('en');
    expect(spracheAusPfad('/entwurf')).toBe('de');
  });
  it('kennt die Startseite je Sprache', () => {
    expect(startPfad('de')).toBe('/');
    expect(startPfad('en')).toBe('/en');
  });
  it('liefert Texte in beiden Sprachen, Rückfall Deutsch', () => {
    expect(t('de', 'themen')).toBe('Themen');
    expect(t('en', 'themen')).toBe('Topics');
    expect(t('en', 'lizenzUngeklaert')).toBe('Licence unclear');
    // Jeder deutsche Schlüssel hat ein englisches Gegenstück.
    expect(Object.keys(TEXTE.en).sort()).toEqual(Object.keys(TEXTE.de).sort());
  });
});
