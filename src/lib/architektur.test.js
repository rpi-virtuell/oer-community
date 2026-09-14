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

/**
 * Importquelle nur aus echten Modulanweisungen (keine JSDoc-Typimporte in Kommentaren).
 * Prüft nur Zeilen, deren getrimmter Text mit `import ` oder `export ` beginnt
 * (oder `import{`/`export{`), und greift dann die Quelle in `from '…'`.
 *
 * JSDoc-Typimporte der Form `@typedef {import(…).X} Y` werden ignoriert,
 * da sie nur zur Compile-Zeit ausgewertet werden — kein Laufzeitzugriff auf Relays.
 * @param {string} text
 */
function anweisungsquelle(text) {
  const getrimmter = text.trim();
  // Nur echte Modulanweisungen, nicht JSDoc-Kommentare
  if (!/^(import|export)\s*[\s({]/.test(getrimmter)) {
    return null;
  }
  return importquelle(text);
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

  it('nur services/spiegel.js importiert services/relay.js (ADR-0028)', () => {
    const dateien = quelldateien(join(wurzel, 'src'), (p) => (p.endsWith('.js') || p.endsWith('.svelte')) && !p.endsWith('.test.js'));
    /** @type {string[]} */
    const verstoesse = [];
    for (const datei of dateien) {
      if (datei.endsWith('services/spiegel.js') || datei.endsWith('services/relay.js')) continue;
      for (const { nr, text } of zeilen(datei)) {
        const quelle = anweisungsquelle(text);
        if (quelle && /services\/relay(\.js)?$/.test(quelle)) verstoesse.push(`${datei}:${nr} importiert '${quelle}'`);
      }
    }
    expect(verstoesse, 'Jede Anfrage rendert aus dem Spiegel, nie direkt vom Relay (ADR-0028):\n' + verstoesse.join('\n')).toEqual([]);
  });
});

describe('Gestaltungsregeln (ADR-0004, docs/designsystem.md)', () => {
  const appCss = readFileSync(join(wurzel, 'src/app.css'), 'utf8');

  /** Alle @font-face-Blöcke aus app.css. */
  const fontFaces = appCss.match(/@font-face\s*\{[^}]*\}/g) ?? [];

  it('deklariert genau die Schrift des Designsystems lokal', () => {
    const familien = fontFaces
      .map((block) => block.match(/font-family:\s*['"]?([^;'"]+)/)?.[1].trim())
      .filter(Boolean);
    expect(new Set(familien)).toEqual(new Set(['Roboto Condensed']));
  });

  it('jede Schriftdatei aus @font-face liegt in static/', () => {
    /** @type {string[]} */
    const fehlend = [];
    for (const block of fontFaces) {
      for (const [, pfad] of block.matchAll(/url\(\s*['"]?(\/[^)'"]+)['"]?\s*\)/g)) {
        try {
          statSync(join(wurzel, 'static', pfad));
        } catch {
          fehlend.push(pfad);
        }
      }
    }
    expect(fontFaces.length).toBeGreaterThan(0);
    expect(fehlend, 'Schriften werden lokal ausgeliefert (designsystem.md):\n' + fehlend.join('\n')).toEqual([]);
  });

  it('lädt keine Schrift von Google (Schulnetze, Datenschutz)', () => {
    const dateien = quelldateien(join(wurzel, 'src'), (p) =>
      /\.(js|svelte|css|html)$/.test(p)
    );
    /** @type {string[]} */
    const verstoesse = [];
    for (const datei of dateien) {
      for (const { nr, text } of zeilen(datei)) {
        if (/fonts\.g(oogleapis|static)\.com/.test(text)) {
          verstoesse.push(`${datei}:${nr} — ${text.trim()}`);
        }
      }
    }
    expect(
      verstoesse,
      'Das Mockup nutzt das CDN, der Client nicht (designsystem.md):\n' + verstoesse.join('\n')
    ).toEqual([]);
  });
});
