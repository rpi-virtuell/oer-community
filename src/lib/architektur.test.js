/**
 * Prüft die Architekturregeln, die mechanisch entscheidbar sind (ADR-0014).
 *
 * Diese Datei liest den Quellbaum als Text. Sie kennt keine Architektur,
 * nur Importpfade und Zuweisungen — das genügt gegen Erosion durch
 * Bequemlichkeit, nicht gegen Entschlossenheit. Siehe ADR-0014.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const wurzel = new URL('../..', import.meta.url).pathname;

/**
 * Alle Quelldateien unter einem Verzeichnis, rekursiv.
 * @param {string} verzeichnis absolut
 * @param {(pfad: string) => boolean} passt
 * @returns {string[]} Pfade relativ zur Projektwurzel
 */
function quelldateien(verzeichnis, passt) {
  /** @type {string[]} */
  const gefunden = [];
  for (const eintrag of readdirSync(verzeichnis)) {
    if (eintrag === 'node_modules' || eintrag.startsWith('.')) continue;
    const pfad = join(verzeichnis, eintrag);
    if (statSync(pfad).isDirectory()) {
      gefunden.push(...quelldateien(pfad, passt));
    } else if (passt(pfad) && !pfad.endsWith('architektur.test.js')) {
      gefunden.push(relative(wurzel, pfad));
    }
  }
  return gefunden;
}

/**
 * Zeilen einer Datei mit ihrer 1-basierten Nummer.
 * @param {string} relativerPfad
 * @returns {Array<{nr: number, text: string}>}
 */
function zeilen(relativerPfad) {
  return readFileSync(join(wurzel, relativerPfad), 'utf8')
    .split('\n')
    .map((text, i) => ({ nr: i + 1, text }));
}

/** Importquelle aus einer Zeile, oder null. @param {string} text */
function importquelle(text) {
  const treffer = text.match(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/);
  return treffer ? treffer[1] : null;
}

describe('Architekturregeln (ADR-0014)', () => {
  it('src/lib/ importiert nichts aus routes/ oder components/ (CLAUDE.md)', () => {
    const dateien = quelldateien(join(wurzel, 'src/lib'), (p) =>
      p.endsWith('.js') || p.endsWith('.svelte')
    );
    expect(dateien.length).toBeGreaterThan(0);

    /** @type {string[]} */
    const verstoesse = [];
    for (const datei of dateien) {
      for (const { nr, text } of zeilen(datei)) {
        const quelle = importquelle(text);
        if (!quelle) continue;
        const zeigtAufOberflaeche =
          /(^|\/)routes\//.test(quelle) ||
          /(^|\/)components\//.test(quelle) ||
          quelle === '$app/stores' ||
          quelle.startsWith('$app/');
        if (zeigtAufOberflaeche) {
          verstoesse.push(`${datei}:${nr} importiert '${quelle}'`);
        }
      }
    }

    expect(
      verstoesse,
      'Die Datenschicht kennt die Oberfläche nicht (CLAUDE.md, ADR-0014).\n' +
        'Der Abhängigkeitspfeil zeigt nur von routes/ und components/ nach lib/, nie zurück:\n' +
        verstoesse.join('\n')
    ).toEqual([]);
  });

  it('Relay-Kommunikation läuft nicht über nostr-tools (ADR-0009)', () => {
    const erlaubt = [/^nostr-tools\/nip19$/, /^nostr-tools\/pure$/];
    const dateien = quelldateien(join(wurzel, 'src'), (p) =>
      p.endsWith('.js') || p.endsWith('.svelte')
    );

    /** @type {string[]} */
    const verstoesse = [];
    for (const datei of dateien) {
      for (const { nr, text } of zeilen(datei)) {
        const quelle = importquelle(text);
        if (!quelle?.startsWith('nostr-tools')) continue;
        if (!erlaubt.some((muster) => muster.test(quelle))) {
          verstoesse.push(`${datei}:${nr} importiert '${quelle}'`);
        }
      }
    }

    expect(
      verstoesse,
      'nostr-tools nur für naddr-Kodierung (nip19) und Signaturprüfung (pure).\n' +
        'Nie für Relay-Kommunikation — SimplePool serialisiert fehlerhaft (ADR-0009):\n' +
        verstoesse.join('\n')
    ).toEqual([]);
  });

  it('kein ssr = false (ADR-0003)', () => {
    const dateien = quelldateien(join(wurzel, 'src'), (p) =>
      p.endsWith('.js') || p.endsWith('.svelte')
    );

    /** @type {string[]} */
    const verstoesse = [];
    for (const datei of dateien) {
      for (const { nr, text } of zeilen(datei)) {
        if (/\bssr\s*=\s*false/.test(text)) {
          verstoesse.push(`${datei}:${nr} — ${text.trim()}`);
        }
      }
    }

    expect(
      verstoesse,
      'Alle Ansichten liefern fertiges HTML mit Inhalt (ADR-0003).\n' +
        'Das Abschalten der Serverdarstellung ist hier nie die Antwort —\n' +
        'dass edufeed-app es in 40 Routen stehen hat,\n' +
        'ist eine Fehlerbehebung von März 2026, keine Architekturwahl:\n' +
        verstoesse.join('\n')
    ).toEqual([]);
  });
});
