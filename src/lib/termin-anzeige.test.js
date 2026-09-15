/**
 * Der Zeitraumtext eines Termins (ADR-0034). Rein und ohne Komponente
 * geprüft: Termin.svelte und NaechsteTermine.svelte zeigen dieselbe Zeile,
 * also gehört sie in ein Modul und nicht zweimal in eine Komponente.
 */
import { describe, expect, it } from 'vitest';
import { zeitraumText } from './termin-anzeige.js';

/** @param {Partial<any>} ab */
const termin = (ab = {}) => ({
  start: new Date(Date.UTC(2027, 1, 2)),
  ende: null,
  ganztaegig: true,
  ...ab
});

describe('zeitraumText (ADR-0034)', () => {
  it('ganztägig über mehrere Tage im selben Monat: nur der erste Tag als Zahl', () => {
    const t = termin({ ende: new Date(Date.UTC(2027, 1, 3)) });
    expect(zeitraumText(t, 'de')).toBe('2.–3. Februar 2027');
    expect(zeitraumText(t, 'en')).toBe('2–3 February 2027');
  });

  it('ganztägig, ein Tag: ein Datum', () => {
    expect(zeitraumText(termin(), 'de')).toBe('2. Februar 2027');
    expect(zeitraumText(termin(), 'en')).toBe('2 February 2027');
  });

  it('ganztägig über einen Monatswechsel: beide Daten voll', () => {
    const t = termin({ ende: new Date(Date.UTC(2027, 2, 1)) });
    expect(zeitraumText(t, 'de')).toBe('2. Februar 2027 – 1. März 2027');
  });

  it('zeitgebunden am selben Tag: Datum mit Uhrzeit, Ende nur als Uhrzeit', () => {
    // 10:00–11:00 Berliner Zeit im Februar (MEZ = UTC+1).
    const t = termin({
      ganztaegig: false,
      start: new Date(Date.UTC(2027, 1, 2, 9, 0)),
      ende: new Date(Date.UTC(2027, 1, 2, 10, 0))
    });
    expect(zeitraumText(t, 'de')).toContain('2. Februar 2027');
    expect(zeitraumText(t, 'de')).toContain('10:00');
    expect(zeitraumText(t, 'de')).toContain('11:00');
    // Das Datum steht nur einmal — zweimal läse sich wie zwei Termine.
    expect((zeitraumText(t, 'de').match(/Februar/g) ?? []).length).toBe(1);
  });

  it('zeitgebunden ohne Ende: nur der Beginn', () => {
    const t = termin({ ganztaegig: false, start: new Date(Date.UTC(2027, 1, 2, 9, 0)), ende: null });
    expect(zeitraumText(t, 'de')).toContain('10:00');
  });
});
