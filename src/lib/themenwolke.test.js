import { describe, expect, it } from 'vitest';
import { groessenstufe } from './themenwolke.js';

describe('groessenstufe (Themenwolke)', () => {
  it('teilt Häufigkeiten in fünf Stufen ein: das häufigste Thema ist 5, ein einzelner Treffer 1', () => {
    expect(groessenstufe(12, 12)).toBe(5);
    expect(groessenstufe(1, 12)).toBe(1);
    expect(groessenstufe(6, 12)).toBe(3);
  });
  it('das Maximum ist immer 5; kommt jedes Thema nur einmal vor, steht alles in der Mitte', () => {
    expect(groessenstufe(4, 4)).toBe(5);
    expect(groessenstufe(1, 1)).toBe(3);
  });
  it('bleibt bei 1, wenn Anzahl oder Maximum unsinnig sind', () => {
    expect(groessenstufe(0, 12)).toBe(1);
    expect(groessenstufe(3, 0)).toBe(1);
  });
});
