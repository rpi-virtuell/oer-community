/**
 * Rechnet die Kontrastwerte nach, die `docs/designsystem.md` behauptet
 * (WCAG 2.1, sRGB). Die Tokens kommen aus `src/app.css` — was dort steht,
 * wird geprüft, nicht eine Kopie hier im Test.
 *
 * Grenzen: 4,5:1 für normalen Text, 3:1 für großen. Geprüft wird immer
 * gegen 4,5:1 — dann trägt die Farbe auch, wenn jemand die Schrift kleiner
 * setzt.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const appCss = readFileSync(new URL('../src/app.css', import.meta.url), 'utf8');

/** Hex-Wert eines Tokens aus :root, oder Fehler mit Namen. @param {string} name */
function token(name) {
  const treffer = appCss.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})\\b`));
  if (!treffer) throw new Error(`Token ${name} fehlt in src/app.css oder ist kein Hex-Wert`);
  return treffer[1];
}

/** @param {string} hex → [r,g,b] in 0..1 */
const kanaele = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
/** @param {number} c */
const linear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
/** Relative Leuchtdichte. @param {string} hex */
const leuchtdichte = (hex) => {
  const [r, g, b] = kanaele(hex).map(linear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
/** Kontrastverhältnis zweier Farben. @param {string} a @param {string} b */
export function kontrast(a, b) {
  const [hell, dunkel] = [leuchtdichte(a), leuchtdichte(b)].sort((x, y) => y - x);
  return (hell + 0.05) / (dunkel + 0.05);
}
/** Farbe mit Deckkraft auf Grund gemischt. @param {string} farbe @param {number} deckkraft @param {string} grund */
export function getoent(farbe, deckkraft, grund) {
  const f = kanaele(farbe);
  const g = kanaele(grund);
  return (
    '#' +
    f
      .map((c, i) => Math.round((c * deckkraft + g[i] * (1 - deckkraft)) * 255))
      .map((n) => n.toString(16).padStart(2, '0'))
      .join('')
  );
}

/**
 * Alle .svelte-Dateien unter src/ sowie src/app.css, als [Pfad, Text].
 * Eigene kleine Kopie der Idee aus architektur.test.js — zwei Testdateien
 * teilen keinen Code.
 * @returns {Array<[string, string]>}
 */
function quelldateienSvelte() {
  const wurzel = new URL('..', import.meta.url).pathname;
  /** @type {Array<[string, string]>} */
  const gefunden = [];
  /** @param {string} verzeichnis */
  function durchsuchen(verzeichnis) {
    for (const eintrag of readdirSync(verzeichnis)) {
      if (eintrag === 'node_modules' || eintrag.startsWith('.')) continue;
      const pfad = join(verzeichnis, eintrag);
      if (statSync(pfad).isDirectory()) {
        durchsuchen(pfad);
      } else if (eintrag.endsWith('.svelte')) {
        gefunden.push([relative(wurzel, pfad), readFileSync(pfad, 'utf8')]);
      }
    }
  }
  durchsuchen(join(wurzel, 'src'));
  gefunden.push(['src/app.css', appCss]);
  return gefunden;
}

const AA = 4.5;

describe('Kontrast der FOERBICO-Palette (docs/designsystem.md, ADR-0031)', () => {
  it('Fließtext und Überschriften auf Weiß und auf den Flächen', () => {
    for (const grund of ['--fb-weiss', '--fb-flaeche', '--fb-flaeche-2']) {
      expect(kontrast(token('--fb-text'), token(grund))).toBeGreaterThanOrEqual(AA);
      expect(kontrast(token('--fb-ueberschrift'), token(grund))).toBeGreaterThanOrEqual(AA);
      expect(kontrast(token('--fb-text-leise'), token(grund))).toBeGreaterThanOrEqual(AA);
    }
  });
  it('Links: --fb-primaer auf Weiß und auf --fb-flaeche', () => {
    expect(kontrast(token('--fb-primaer'), token('--fb-weiss'))).toBeGreaterThanOrEqual(AA);
    expect(kontrast(token('--fb-primaer'), token('--fb-flaeche'))).toBeGreaterThanOrEqual(AA);
  });
  it('Text auf --fb-akzent ist --fb-ueberschrift; Weiß darauf wäre zu schwach', () => {
    expect(kontrast(token('--fb-ueberschrift'), token('--fb-akzent'))).toBeGreaterThanOrEqual(AA);
    expect(kontrast('#ffffff', token('--fb-akzent'))).toBeLessThan(AA);
  });
  it('Fehlerfarbe auf Weiß und auf --fb-flaeche', () => {
    expect(kontrast(token('--fb-fehler'), token('--fb-weiss'))).toBeGreaterThanOrEqual(AA);
    expect(kontrast(token('--fb-fehler'), token('--fb-flaeche'))).toBeGreaterThanOrEqual(AA);
  });
  it('Lizenzpille: --fb-text auf 90 % Weiß trägt auch über einem schwarzen Bild (ADR-0032)', () => {
    const grund = getoent(token('--fb-weiss'), 0.9, '#000000');
    expect(kontrast(token('--fb-text'), grund)).toBeGreaterThanOrEqual(AA);
  });
  it('keine Komponente setzt Weiß auf --fb-akzent (ADR-0031)', () => {
    // Grobe, aber mechanische Prüfung: keine CSS-Regel, die --fb-akzent als
    // background und --fb-weiss als color im selben Block nennt.
    const dateien = quelldateienSvelte();
    for (const [pfad, css] of dateien) {
      for (const block of css.match(/\{[^}]*\}/g) ?? []) {
        const akzentGrund = /background(-color)?:\s*var\(--fb-akzent\)/.test(block);
        const weissText = /(^|[^-])color:\s*var\(--fb-weiss\)/.test(block);
        expect(akzentGrund && weissText, `${pfad}: Weiß auf Akzent`).toBe(false);
      }
    }
  });
});
