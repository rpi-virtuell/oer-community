import { describe, expect, it } from 'vitest';
import { themaNormalisieren, themenSlug, themenTabelle, themenTabelleLesen } from './themen.js';

describe('themenTabelleLesen', () => {
  it('bildet jede Schreibweise auf die Anzeigeform ab, die Anzeigeform auf sich selbst', () => {
    const t = themenTabelleLesen('{"Open Educational Resources (OER)": ["OER", "oer"]}');
    expect(t.get('oer')).toBe('Open Educational Resources (OER)');
    expect(t.get('open educational resources (oer)')).toBe('Open Educational Resources (OER)');
  });
  it('wirft, wenn eine Schreibweise zweimal vorkommt', () => {
    expect(() => themenTabelleLesen('{"A": ["x"], "B": ["x"]}')).toThrow(/x/);
  });
});

describe('themaNormalisieren', () => {
  const t = themenTabelleLesen('{"OER-Communities": ["OER-Community"]}');
  it('ersetzt bekannte Schreibweisen, unabhängig von Groß/Klein und Leerraum', () => {
    expect(themaNormalisieren(' oer-community ', t)).toBe('OER-Communities');
  });
  it('lässt Unbekanntes, wie es ist (getrimmt)', () => {
    expect(themaNormalisieren(' Theologie ', t)).toBe('Theologie');
  });
});

describe('themenSlug', () => {
  it('kleinschreibt, löst Umlaute auf, ersetzt Rest durch Bindestrich', () => {
    expect(themenSlug('Open Educational Resources (OER)')).toBe('open-educational-resources-oer');
    expect(themenSlug('Religionspädagogik')).toBe('religionspaedagogik');
    expect(themenSlug('KI & Ethik')).toBe('ki-ethik');
    expect(themenSlug('  ß  ')).toBe('ss');
  });
});

describe('daten/themen.json', () => {
  it('ist lesbar und ohne Dubletten', () => {
    expect(themenTabelle().size).toBeGreaterThan(0);
  });
});
