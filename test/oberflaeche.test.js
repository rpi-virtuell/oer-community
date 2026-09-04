/**
 * Prüft Kopfzeile, Fußzeile und Artikelseite in der Darstellung, die der
 * Server ausliefert (ADR-0003) — ohne DOM, mit `svelte/server`.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { render } from 'svelte/server';

import Kopfzeile from '../src/lib/komponenten/Kopfzeile.svelte';
import Fusszeile from '../src/lib/komponenten/Fusszeile.svelte';
import Artikelseite from '../src/routes/[naddr]/+page.svelte';
import { GRUND_TEXT } from '../src/lib/models/lizenz.js';

/** @type {any} */
const ARTIKEL = JSON.parse(
  readFileSync(
    new URL('./fixtures/artikel-30023-die-kraft-der-gemeinschaft.json', import.meta.url),
    'utf8'
  )
)[0];

const VEROEFFENTLICHT = new Date(1788433547 * 1000).toISOString();

/** @param {Partial<Record<string, unknown>>} abweichung */
function seitendaten(abweichung = {}) {
  return /** @type {any} */ ({
    naddr: 'naddr1beispiel',
    artikel: {
      titel: 'Die Kraft der Gemeinschaft',
      zusammenfassung: 'Wahre Stärke liegt in Prozessen.',
      veroeffentlicht: VEROEFFENTLICHT,
      themen: ['OER', 'Community'],
      bildUrl: null
    },
    lizenz: { ok: false, grund: 'kein-nachweis' },
    html: '<p>Absatz.</p>',
    entfernteBilder: ['nosTr-schrein.jpg'],
    befund: null,
    ...abweichung
  });
}

describe('Kopfzeile', () => {
  const { body } = render(Kopfzeile);

  it('trägt die Wortmarke und führt zur Startseite', () => {
    expect(body).toMatch(/<a[^>]+href="\/"/);
    expect(body).toContain('reli');
    expect(body).toContain('lab');
  });

  it('bietet keine Navigation an — es gibt nichts, wohin (CLAUDE.md)', () => {
    expect(body).not.toMatch(/<nav\b/);
  });
});

describe('Fußzeile', () => {
  const { body } = render(Fusszeile);

  it('trägt die Wortmarke und den Debug-Schalter', () => {
    expect(body).toContain('reli');
    expect(body).toMatch(/type="checkbox"/);
  });

  it('nennt kein Relay — Adressen sind Konfiguration, kein Code', () => {
    expect(body).not.toContain('wss://');
    expect(body).not.toContain('edufeed.org');
  });
});

describe('Artikelseite', () => {
  it('setzt das Datum maschinenlesbar als <time>', () => {
    const { body } = render(Artikelseite, { props: { data: seitendaten() } });
    expect(body).toMatch(new RegExp(`<time[^>]+datetime="${VEROEFFENTLICHT.slice(0, 10)}`));
  });

  it('zeigt jedes Thema als Marker in der Metazeile', () => {
    const { body } = render(Artikelseite, { props: { data: seitendaten() } });
    for (const thema of ['OER', 'Community']) {
      expect(body).toMatch(new RegExp(`class="marker[^"]*"[^>]*>\\s*${thema}`));
    }
  });

  it('erklärt ein fehlendes Bild und die entfernten Bildverweise', () => {
    const { body } = render(Artikelseite, { props: { data: seitendaten() } });
    expect(body).toContain(GRUND_TEXT['kein-nachweis']);
    expect(body).toContain('nosTr-schrein.jpg');
  });

  it('zeigt bei kein-bild keinen Hinweis — kein Bild ist kein Fehler', () => {
    const { body } = render(Artikelseite, {
      props: { data: seitendaten({ lizenz: { ok: false, grund: 'kein-bild' }, entfernteBilder: [] }) }
    });
    expect(body).not.toContain('Bild nicht angezeigt');
  });
});
