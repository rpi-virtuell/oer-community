/**
 * Prüft die Debug-Ansicht in der Darstellung, die der Server ausliefert
 * (ADR-0003). Serverseitig gerendert, ohne DOM — was hier im HTML steht,
 * steht auch ohne JavaScript da.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { render } from 'svelte/server';

import DebugBereich from '../src/lib/komponenten/DebugBereich.svelte';
import { befundErstellen } from '../src/lib/models/entwickleransicht.js';
import { nachweisAusEvents } from '../src/lib/models/lizenz.js';

/** @param {string} datei */
const fixture = (datei) =>
  JSON.parse(readFileSync(new URL(`./fixtures/${datei}`, import.meta.url), 'utf8'));

const ARTIKEL = fixture('artikel-30023-die-kraft-der-gemeinschaft.json')[0];
const NACHWEIS = fixture('lizenz-1063-nostr-schrein.json')[0];

/** @param {string[][]} tags @param {string} name */
const tagWert = (tags, name) => tags.find((t) => t[0] === name)?.[1] ?? null;

const HASH = tagWert(ARTIKEL.tags, 'x');
const NADDR = 'naddr1beispiel';

const RELAY = 'wss://relay.edufeed.org/';
const RPI = 'wss://relay-rpi.edufeed.org/';

/** @param {Record<string, unknown>} abweichung */
function befund(abweichung = {}) {
  return befundErstellen({
    artikelEvent: ARTIKEL,
    artikelAbfrage: {
      gefragteRelays: [RELAY, RPI],
      fehler: [],
      ohneTreffer: [],
      quellen: { [ARTIKEL.id]: [RELAY, RPI] },
      grund: null
    },
    bildUrl: tagWert(ARTIKEL.tags, 'image'),
    bildHash: HASH,
    lizenzEvents: [NACHWEIS],
    lizenzAbfrage: {
      gefragteRelays: [RELAY, RPI],
      fehler: [],
      ohneTreffer: [RELAY],
      quellen: { [NACHWEIS.id]: [RPI] },
      grund: null
    },
    nachweis: nachweisAusEvents([NACHWEIS]),
    etag: `"${HASH}"`,
    ...abweichung
  });
}

/**
 * @param {Record<string, unknown>} [abweichung]
 * @param {boolean} [offen]
 */
const html = (abweichung, offen = false) =>
  render(DebugBereich, {
    props: { befund: befund(abweichung), naddr: NADDR, offenStart: offen }
  }).body;

describe('DebugBereich, zugeklappt', () => {
  it('zeigt den Titel, aber noch keine Rohdaten', () => {
    const body = html();

    expect(body).toContain('Debug-Informationen');
    // Zugeklappt: keine Signatur, kein Rohobjekt im HTML.
    expect(body).not.toContain('Prüfkette');
    expect(body).not.toContain(ARTIKEL.sig);
  });

  it('zeigt die Aktiv-Marke erst beim Aufklappen', () => {
    expect(html()).not.toContain('Aktiv');
  });
});

describe('DebugBereich, aufgeklappt', () => {
  it('zeigt die Aktiv-Marke', () => {
    expect(html(undefined, true)).toContain('Aktiv');
  });

  it('zeigt beide Events mit ihren Ids', () => {
    const body = html(undefined, true);

    expect(body).toContain('kind:30023');
    expect(body).toContain('kind:1063');
    // Gekuerzt dargestellt, voller Wert im title-Attribut.
    expect(body).toContain(ARTIKEL.id.slice(0, 8));
    expect(body).toContain(NACHWEIS.id.slice(0, 8));
  });

  it('nennt das Relay, das den Nachweis lieferte — und das ohne ihn', () => {
    const body = html(undefined, true);

    expect(body).toContain('relay-rpi.edufeed.org');
    expect(body).toContain('hat den Beitrag, nicht den Nachweis');
  });

  it('zeigt alle fuenf Schritte der Kette', () => {
    const body = html(undefined, true);

    expect(body).toContain('Prüfkette');
    for (const frage of [
      'Ist ein Bild angegeben',
      'x-Tag mit dem Hash',
      'kind:1063 gefunden',
      // Seit ADR-0022 ist credit optional; Schritt 4 fragt nur nach der Lizenz.
      'eine Lizenzangabe',
      'Hash des ausgelieferten Bildes'
    ]) {
      expect(body).toContain(frage);
    }
  });

  it('stellt die drei Hashes zum Vergleich nebeneinander', () => {
    const body = html(undefined, true);

    expect(body).toContain('am Beitrag (x-Tag)');
    expect(body).toContain('am Nachweis');
    expect(body).toContain('am gelieferten Bild (etag)');
  });

  it('verweist auf die JSON-Route mit demselben naddr', () => {
    const body = html(undefined, true);

    expect(body).toContain(`href="/${NADDR}/json"`);
  });

  it('gibt die Signatur beider Events als gueltig aus', () => {
    const body = html(undefined, true);

    expect(body.match(/gueltig/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it('erklaert einen fehlenden Nachweis statt eine leere Kachel zu zeigen', () => {
    const body = html({ lizenzEvents: [], nachweis: null }, true);

    expect(body).toContain('Kein Nachweis aufgelöst');
    expect(body).not.toContain('kind:1063 ' + NACHWEIS.id);
  });
});

describe('DebugBereich rendert jeden Kettenzustand ohne zu werfen', () => {
  it('bei vollstaendig bestandener Kette', () => {
    expect(() => html()).not.toThrow();
    expect(befund().kette.ok).toBe(true);
  });

  it('bei fehlendem Nachweis', () => {
    const abweichung = { lizenzEvents: [], nachweis: null };
    expect(() => html(abweichung)).not.toThrow();
    expect(befund(abweichung).kette.grund).toBe('kein-nachweis');
  });

  it('bei fehlendem x-Tag', () => {
    const abweichung = { bildHash: null, lizenzEvents: [], nachweis: null };
    expect(() => html(abweichung)).not.toThrow();
    expect(befund(abweichung).kette.grund).toBe('kein-x-tag');
  });

  it('bei einem Artikel ohne Bild', () => {
    const abweichung = { bildUrl: null, bildHash: null, lizenzEvents: [], nachweis: null };
    expect(() => html(abweichung)).not.toThrow();
    expect(befund(abweichung).kette.grund).toBe('kein-bild');
  });

  it('wenn kein Relay erreichbar war', () => {
    const abweichung = {
      lizenzEvents: [],
      nachweis: null,
      lizenzAbfrage: {
        gefragteRelays: [RELAY, RPI],
        fehler: [RELAY, RPI],
        ohneTreffer: [],
        quellen: {},
        grund: 'kein-relay-erreichbar'
      }
    };
    expect(() => html(abweichung)).not.toThrow();
    expect(befund(abweichung).lizenz.herkunft.grundText).toBeTruthy();
  });
});
