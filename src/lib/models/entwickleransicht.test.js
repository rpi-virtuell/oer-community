import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

import { befundErstellen } from './entwickleransicht.js';
import { nachweisAusEvents } from './lizenz.js';

/** @param {string} datei */
function fixture(datei) {
  return JSON.parse(
    readFileSync(new URL(`../../../test/fixtures/${datei}`, import.meta.url), 'utf8')
  );
}

const ARTIKEL = fixture('artikel-30023-die-kraft-der-gemeinschaft.json')[0];
const NACHWEIS = fixture('lizenz-1063-nostr-schrein.json')[0];

/** @param {string[][]} tags @param {string} name */
const tagWert = (tags, name) => tags.find((t) => t[0] === name)?.[1] ?? null;

const HASH = tagWert(ARTIKEL.tags, 'x');
const BILD_URL = tagWert(ARTIKEL.tags, 'image');

const ARTIKEL_ABFRAGE = {
  gefragteRelays: ['wss://relay.edufeed.org/', 'wss://relay-rpi.edufeed.org/'],
  fehler: [],
  ohneTreffer: ['wss://relay-rpi.edufeed.org/'],
  quellen: { [ARTIKEL.id]: ['wss://relay.edufeed.org/'] },
  grund: null
};

const LIZENZ_ABFRAGE = {
  gefragteRelays: ['wss://relay.edufeed.org/', 'wss://relay-rpi.edufeed.org/'],
  fehler: [],
  ohneTreffer: ['wss://relay.edufeed.org/'],
  quellen: { [NACHWEIS.id]: ['wss://relay-rpi.edufeed.org/'] },
  grund: null
};

/** Der vollständige Referenzfall, mit überschreibbaren Teilen. */
function referenzfall(/** @type {Record<string, unknown>} */ abweichung = {}) {
  return befundErstellen({
    artikelEvent: ARTIKEL,
    artikelAbfrage: ARTIKEL_ABFRAGE,
    bildUrl: BILD_URL,
    bildHash: HASH,
    lizenzEvents: [NACHWEIS],
    lizenzAbfrage: LIZENZ_ABFRAGE,
    nachweis: nachweisAusEvents([NACHWEIS]),
    etag: `"${HASH}"`,
    ...abweichung
  });
}

describe('befundErstellen zeigt beide Events mit ihrer Herkunft', () => {
  it('nennt zu jedem Event das Relay, das es lieferte', () => {
    const befund = referenzfall();

    expect(befund.artikel.event?.id).toBe(ARTIKEL.id);
    expect(befund.artikel.herkunft.geliefertVon).toEqual(['wss://relay.edufeed.org/']);
    expect(befund.lizenz.event?.id).toBe(NACHWEIS.id);
    expect(befund.lizenz.herkunft.geliefertVon).toEqual([
      'wss://relay-rpi.edufeed.org/'
    ]);
  });

  it('weist aus, dass der Nachweis nicht dort liegt wo der Artikel (ADR-0013)', () => {
    const befund = referenzfall();

    expect(befund.lizenz.herkunft.anderesRelayAlsArtikel).toBe(true);
  });

  it('meldet kein anderes Relay, wenn beide Events vom gleichen kamen', () => {
    const befund = referenzfall({
      artikelAbfrage: {
        ...ARTIKEL_ABFRAGE,
        quellen: { [ARTIKEL.id]: ['wss://relay.edufeed.org/'] },
        ohneTreffer: ['wss://relay-rpi.edufeed.org/']
      },
      lizenzAbfrage: {
        ...LIZENZ_ABFRAGE,
        quellen: { [NACHWEIS.id]: ['wss://relay.edufeed.org/'] },
        ohneTreffer: ['wss://relay-rpi.edufeed.org/']
      }
    });

    expect(befund.lizenz.herkunft.anderesRelayAlsArtikel).toBe(false);
  });

  it('erkennt die Trennung auch bei Ueberschneidung der Relays', () => {
    // Am 03.09.2026 am laufenden System beobachtet: Der Artikel liegt auf
    // BEIDEN Relays, der Nachweis nur auf relay-rpi. Die Aussage von
    // ADR-0013 gilt weiter — relay.edufeed.org hat den Artikel und den
    // Nachweis nicht — aber die Relay-Mengen sind nicht disjunkt.
    const befund = referenzfall({
      artikelAbfrage: {
        ...ARTIKEL_ABFRAGE,
        quellen: {
          [ARTIKEL.id]: ['wss://relay.edufeed.org/', 'wss://relay-rpi.edufeed.org/']
        },
        ohneTreffer: []
      }
    });

    expect(befund.lizenz.herkunft.anderesRelayAlsArtikel).toBe(true);
    expect(befund.lizenz.herkunft.artikelRelaysOhneNachweis).toEqual([
      'wss://relay.edufeed.org/'
    ]);
  });

  it('nennt keine Relays ohne Nachweis, wenn jedes Artikel-Relay ihn hat', () => {
    const beide = ['wss://relay.edufeed.org/', 'wss://relay-rpi.edufeed.org/'];
    const befund = referenzfall({
      artikelAbfrage: { ...ARTIKEL_ABFRAGE, quellen: { [ARTIKEL.id]: beide }, ohneTreffer: [] },
      lizenzAbfrage: { ...LIZENZ_ABFRAGE, quellen: { [NACHWEIS.id]: beide }, ohneTreffer: [] }
    });

    expect(befund.lizenz.herkunft.artikelRelaysOhneNachweis).toEqual([]);
    expect(befund.lizenz.herkunft.anderesRelayAlsArtikel).toBe(false);
  });

  it('nennt die Zahl der Kandidaten und den Grund der Auswahl', () => {
    const befund = referenzfall();

    expect(befund.lizenz.kandidaten).toBe(1);
    expect(befund.lizenz.auswahlgrund).toBe('einziger Kandidat');
  });

  it('begruendet bei mehreren Kandidaten die Wahl nach created_at', () => {
    const aelter = { ...NACHWEIS, id: 'f'.repeat(64), created_at: NACHWEIS.created_at - 100 };
    const befund = referenzfall({
      lizenzEvents: [aelter, NACHWEIS],
      nachweis: nachweisAusEvents([aelter, NACHWEIS])
    });

    expect(befund.lizenz.kandidaten).toBe(2);
    expect(befund.lizenz.event?.id).toBe(NACHWEIS.id);
    expect(befund.lizenz.auswahlgrund).toBe('neuestes created_at von 2');
  });

  it('begruendet bei gleichem created_at die Wahl nach id', () => {
    const gleichAlt = { ...NACHWEIS, id: '0'.repeat(64) };
    const befund = referenzfall({
      lizenzEvents: [NACHWEIS, gleichAlt],
      nachweis: nachweisAusEvents([NACHWEIS, gleichAlt])
    });

    expect(befund.lizenz.event?.id).toBe('0'.repeat(64));
    expect(befund.lizenz.auswahlgrund).toBe('created_at gleich, kleinste id von 2');
  });
});

describe('befundErstellen zeigt die Pruefkette aus ADR-0013', () => {
  it('meldet alle fuenf Schritte bestanden beim Referenzfall', () => {
    const befund = referenzfall();

    expect(befund.kette.ok).toBe(true);
    expect(befund.kette.grund).toBeNull();
    expect(befund.kette.schritte.map((s) => s.ok)).toEqual([true, true, true, true, true]);
  });

  it('markiert den gescheiterten Schritt und laesst die folgenden offen', () => {
    const befund = referenzfall({
      lizenzEvents: [],
      nachweis: null,
      lizenzAbfrage: { ...LIZENZ_ABFRAGE, quellen: {} }
    });

    expect(befund.kette.ok).toBe(false);
    expect(befund.kette.grund).toBe('kein-nachweis');
    // Schritte 1 und 2 bestanden, 3 gescheitert, 4 und 5 nicht mehr geprüft.
    expect(befund.kette.schritte.map((s) => s.ok)).toEqual([true, true, false, null, null]);
  });

  it('nennt zu jedem Schritt einen lesbaren Text', () => {
    const befund = referenzfall();

    for (const schritt of befund.kette.schritte) {
      expect(schritt.frage.length).toBeGreaterThan(0);
      expect(schritt.nr).toBeGreaterThan(0);
    }
  });

  it('begruendet den Abbruch bei fehlendem x-Tag als fehlende Angabe', () => {
    const befund = referenzfall({ bildHash: null, lizenzEvents: [], nachweis: null });

    expect(befund.kette.grund).toBe('kein-x-tag');
    expect(befund.kette.text).toContain('x-Tag');
  });

  it('deckt den Hash-Widerspruch auf, wenn der etag abweicht', () => {
    const befund = referenzfall({ etag: '"' + 'e'.repeat(64) + '"' });

    expect(befund.kette.ok).toBe(false);
    expect(befund.kette.grund).toBe('hash-widerspruch');
  });

  it('stellt die drei Hashes zum Vergleich nebeneinander', () => {
    const befund = referenzfall();

    expect(befund.hashes.amArtikel).toBe(HASH);
    expect(befund.hashes.amNachweis).toBe(HASH);
    expect(befund.hashes.amBild).toBe(HASH);
  });

  it('nennt den Bild-Hash null, wenn kein etag vorlag', () => {
    const befund = referenzfall({ etag: undefined });

    expect(befund.hashes.amBild).toBeNull();
    // Schritt 5 wurde uebersprungen, nicht bestanden.
    expect(befund.kette.schritte[4].ok).toBeNull();
    expect(befund.kette.ok).toBe(true);
  });
});

describe('befundErstellen liefert reine Daten, die durch load() passen', () => {
  it('gibt Events ohne Symbol-Schluessel heraus', () => {
    // Events vom Relay tragen interne Marker als Symbol-Schluessel. SvelteKit
    // serialisiert Daten aus load() und bricht daran ab (HTTP 500, am
    // laufenden System belegt) — JSON.stringify verschluckt sie dagegen
    // stumm, die JSON-Route allein deckt das also nicht auf.
    const markiert = { ...ARTIKEL, [Symbol('relay')]: 'wss://irgendwo/' };
    const befund = referenzfall({ artikelEvent: markiert });

    expect(Object.getOwnPropertySymbols(befund.artikel.event ?? {})).toEqual([]);
    expect(befund.artikel.event?.id).toBe(ARTIKEL.id);
  });

  it('gibt auch das Nachweis-Event ohne Symbole heraus', () => {
    const markiert = { ...NACHWEIS, [Symbol('relay')]: 'wss://rpi/' };
    const befund = referenzfall({
      lizenzEvents: [markiert],
      nachweis: nachweisAusEvents([markiert])
    });

    expect(Object.getOwnPropertySymbols(befund.lizenz.event ?? {})).toEqual([]);
    expect(befund.lizenz.event?.id).toBe(NACHWEIS.id);
  });

  it('behaelt alle Felder, die ein Event ausmachen', () => {
    const befund = referenzfall();

    expect(Object.keys(befund.artikel.event ?? {}).sort()).toEqual(
      ['content', 'created_at', 'id', 'kind', 'pubkey', 'sig', 'tags'].sort()
    );
  });
});

describe('befundErstellen weist die Signaturen aus', () => {
  it('bestaetigt die Signatur beider echten Events', () => {
    const befund = referenzfall();

    expect(befund.artikel.signatur).toBe('gueltig');
    expect(befund.lizenz.signatur).toBe('gueltig');
  });

  it('meldet eine verfaelschte Signatur als ungueltig', () => {
    const verfaelscht = { ...ARTIKEL, content: ARTIKEL.content + ' angefasst' };
    const befund = referenzfall({ artikelEvent: verfaelscht });

    expect(befund.artikel.signatur).toBe('ungueltig');
  });

  it('meldet veraenderte tags als ungueltig, obwohl id und sig unberuehrt sind', () => {
    // verifyEvent allein prueft sig gegen id, nicht gegen den Inhalt — ein
    // so veraendertes Event kommt ohne den Hash-Vergleich durch.
    const verfaelscht = {
      ...NACHWEIS,
      tags: NACHWEIS.tags.map((/** @type {string[]} */ t) =>
        t[0] === 'license' ? ['license', 'https://example.invalid/erfunden'] : t
      )
    };
    const befund = referenzfall({
      lizenzEvents: [verfaelscht],
      nachweis: nachweisAusEvents([verfaelscht])
    });

    expect(befund.lizenz.signatur).toBe('ungueltig');
  });

  it('meldet die Signatur eines fehlenden Events als nicht pruefbar', () => {
    const befund = referenzfall({ lizenzEvents: [], nachweis: null });

    expect(befund.lizenz.signatur).toBeNull();
  });
});

describe('befundErstellen bleibt bei fehlenden Daten aussagefaehig', () => {
  it('erklaert einen fehlenden Nachweis mit dem Abfragegrund, statt zu schweigen', () => {
    const befund = referenzfall({
      lizenzEvents: [],
      nachweis: null,
      lizenzAbfrage: {
        gefragteRelays: ['wss://a/', 'wss://b/'],
        fehler: ['wss://a/', 'wss://b/'],
        ohneTreffer: [],
        quellen: {},
        grund: 'kein-relay-erreichbar'
      }
    });

    expect(befund.lizenz.event).toBeNull();
    expect(befund.lizenz.herkunft.grund).toBe('kein-relay-erreichbar');
    expect(befund.lizenz.herkunft.grundText).toBeTruthy();
    expect(befund.lizenz.herkunft.nichtErreichbar).toEqual(['wss://a/', 'wss://b/']);
  });

  it('erklaert eine nie gestellte Abfrage, statt sie leer und stumm zu lassen', () => {
    // Ohne x-Tag wird kein Relay gefragt (CLAUDE.md). Eine leere Relay-Liste
    // ohne Erklaerung liesse den Fehler bei der Verbindung suchen statt bei
    // der fehlenden Angabe.
    const befund = referenzfall({
      bildHash: null,
      lizenzEvents: [],
      nachweis: null,
      lizenzAbfrage: {
        gefragteRelays: [],
        fehler: [],
        ohneTreffer: [],
        quellen: {},
        grund: null
      }
    });

    expect(befund.lizenz.herkunft.gefragt).toEqual([]);
    expect(befund.lizenz.herkunft.grundText).toBeTruthy();
    expect(befund.lizenz.herkunft.grundText).toContain('x-Tag');
  });

  it('nennt keine Relays "ohne Nachweis", wenn nie gefragt wurde', () => {
    // Ohne x-Tag fand keine Abfrage statt. Die Artikel-Relays als "hat den
    // Nachweis nicht" auszuweisen behauptete eine Antwort, die es nie gab —
    // am laufenden System als irreführende Zeile aufgefallen.
    const befund = referenzfall({
      bildHash: null,
      lizenzEvents: [],
      nachweis: null,
      lizenzAbfrage: {
        gefragteRelays: [],
        fehler: [],
        ohneTreffer: [],
        quellen: {},
        grund: null
      }
    });

    expect(befund.lizenz.herkunft.artikelRelaysOhneNachweis).toEqual([]);
    expect(befund.lizenz.herkunft.anderesRelayAlsArtikel).toBe(false);
  });

  it('nennt bei einem Artikel ohne Bild kein Bild als Grund', () => {
    const befund = referenzfall({
      bildUrl: null,
      bildHash: null,
      lizenzEvents: [],
      nachweis: null
    });

    expect(befund.kette.grund).toBe('kein-bild');
    expect(befund.kette.schritte[0].ok).toBe(false);
  });
});
