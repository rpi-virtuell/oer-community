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
import { readFileSync } from 'node:fs';

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

const AA = 4.5;

describe('Kontrast der Tokens (docs/designsystem.md, ADR-0018)', () => {
  it('Fließtext-Links: --rpi auf Weiß (Punkt 1)', () => {
    expect(kontrast(token('--rpi'), token('--rl-weiss'))).toBeGreaterThanOrEqual(AA);
  });

  it('Amber-Marker: --marker-amber-text auf 16 % Amber (Punkt 2)', () => {
    const flaeche = getoent(token('--amber'), 0.16, token('--rl-weiss'));
    expect(kontrast(token('--marker-amber-text'), flaeche)).toBeGreaterThanOrEqual(AA);
  });

  it('Aufmacher: Weiß an beiden Enden des dunklen Verlaufs (Punkt 3)', () => {
    expect(kontrast('#ffffff', token('--aufmacher-start'))).toBeGreaterThanOrEqual(AA);
    expect(kontrast('#ffffff', token('--aufmacher-ende'))).toBeGreaterThanOrEqual(AA);
  });

  it('Fußzeile: --fuss-text auf --fau', () => {
    expect(kontrast(token('--fuss-text'), token('--fau'))).toBeGreaterThanOrEqual(AA);
  });

  it('aktive Zustände tragen --fau auf --relilab und --amber', () => {
    expect(kontrast(token('--fau'), token('--relilab'))).toBeGreaterThanOrEqual(AA);
    expect(kontrast(token('--fau'), token('--amber'))).toBeGreaterThanOrEqual(AA);
  });
});
