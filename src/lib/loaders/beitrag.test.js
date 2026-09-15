import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

import { beitragLaden } from './beitrag.js';
import { leererInhalt } from '../services/spiegel.js';

/** @param {string} datei */
function fixture(datei) {
  return JSON.parse(
    readFileSync(new URL(`../../../test/fixtures/${datei}`, import.meta.url), 'utf8')
  );
}

const ARTIKEL = fixture('artikel-30023-die-kraft-der-gemeinschaft.json')[0];
const NACHWEIS = fixture('lizenz-1063-nostr-schrein.json')[0];

const KONFIG = {
  autor: ARTIKEL.pubkey,
  hTag: null,
  relays: ['wss://relay.edufeed.org/', 'wss://relay-rpi.edufeed.org/'],
  blossomUrl: 'https://blossom.edufeed.org/',
  abgeloesteHosts: ['oer.community'],
  spiegelPfad: 'daten/spiegel.json',
  spiegelIntervallS: 600,
  spiegelStartwartezeitS: 20,
  startseiteD: 'startseite',
  navigationD: 'navigation',
  fusszeileD: 'fusszeile',
  redaktionD: 'redaktion',
  community: null,
  edufeedUrl: 'https://dev.edufeed.org'
};

const ADRESSE = {
  kind: 30023,
  author: ARTIKEL.pubkey,
  d: 'die-kraft-der-gemeinschaft',
  relays: []
};

/**
 * Spiegelinhalt wie in Wirklichkeit: Artikel von relay, Nachweis von relay-rpi.
 * @param {{ ohneNachweis?: boolean, etag?: string|undefined }} [optionen]
 */
function inhaltWieEcht({ ohneNachweis = false, etag = undefined } = {}) {
  return {
    ...leererInhalt(),
    stand: {
      zeitpunkt: '2026-09-14T10:00:00Z',
      dauerMs: 3,
      gefragteRelays: KONFIG.relays,
      nichtErreichbar: [],
      anzahl: { artikel: 1, listen: 0, nachweise: ohneNachweis ? 0 : 1, profil: 0, termine: 0 }
    },
    artikel: [ARTIKEL],
    nachweise: ohneNachweis ? [] : [NACHWEIS],
    quellen: { [ARTIKEL.id]: [KONFIG.relays[0]], [NACHWEIS.id]: [KONFIG.relays[1]] },
    etags: etag
      ? { [ARTIKEL.tags.find((/** @type {string[]} */ t) => t[0] === 'image')[1]]: etag }
      : {}
  };
}

describe('beitragLaden traegt die Wächter aus ADR-0016 mit', () => {
  it('lehnt einen fremden Autor ab, ohne dass es eine Relay-Zählung gibt', async () => {
    const ergebnis = await beitragLaden({
      adresse: { ...ADRESSE, author: 'b'.repeat(64) },
      konfig: KONFIG,
      inhalt: inhaltWieEcht()
    });

    expect(ergebnis.ok).toBe(false);
    expect(ergebnis.ok === false && ergebnis.status).toBe(404);
  });

  it('Relay-Hinweise im naddr ändern das Ergebnis nicht — es wird ohnehin kein Relay gefragt', async () => {
    const mitFremdenHinweisen = await beitragLaden({
      adresse: { ...ADRESSE, relays: ['wss://boese/'] },
      konfig: KONFIG,
      inhalt: inhaltWieEcht()
    });
    const ohneHinweise = await beitragLaden({
      adresse: ADRESSE,
      konfig: KONFIG,
      inhalt: inhaltWieEcht()
    });

    expect(mitFremdenHinweisen.ok).toBe(true);
    expect(ohneHinweise.ok).toBe(true);
    if (mitFremdenHinweisen.ok && ohneHinweise.ok) {
      expect(mitFremdenHinweisen.artikel.titel).toBe(ohneHinweise.artikel.titel);
    }
  });

  it('meldet 503, wenn kein Relay erreichbar war (leerer Spiegel)', async () => {
    const ergebnis = await beitragLaden({ adresse: ADRESSE, konfig: KONFIG, inhalt: leererInhalt() });

    expect(ergebnis.ok === false && ergebnis.status).toBe(503);
    expect(ergebnis.ok === false && ergebnis.meldung).toContain(KONFIG.relays[0]);
  });

  it('meldet 404 für unbekanntes d, mit dem Stand des Spiegels in der Meldung', async () => {
    const ergebnis = await beitragLaden({
      adresse: { ...ADRESSE, d: 'gibt-es-nicht' },
      konfig: KONFIG,
      inhalt: inhaltWieEcht()
    });

    expect(ergebnis.ok === false && ergebnis.status).toBe(404);
    expect(ergebnis.ok === false && ergebnis.meldung).toContain('gibt-es-nicht');
  });
});

describe('beitragLaden liefert den Referenzfall vollstaendig', () => {
  it('loest die Lizenz auf und gibt die Rohdaten mit', async () => {
    const ergebnis = await beitragLaden({
      adresse: ADRESSE,
      konfig: KONFIG,
      inhalt: inhaltWieEcht()
    });

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;

    expect(ergebnis.artikel.titel).toContain('Kraft der Gemeinschaft');
    expect(ergebnis.lizenz.ok).toBe(true);
    if (ergebnis.lizenz.ok) expect(ergebnis.lizenz.nachweis.credit).toBe('Comenius-Institut');
    expect(ergebnis.artikelEvent.id).toBe(ARTIKEL.id);
    expect(ergebnis.lizenzEvents).toHaveLength(1);
    // Der Nachweis kam vom anderen Relay als der Artikel (ADR-0013).
    expect(ergebnis.lizenzAbfrage.quellen[NACHWEIS.id]).toEqual([KONFIG.relays[1]]);
    expect(ergebnis.artikelAbfrage.quellen[ARTIKEL.id]).toEqual([KONFIG.relays[0]]);
  });

  it('meldet kein-nachweis, wenn der Spiegel keinen Nachweis zum Hash hat', async () => {
    const ergebnis = await beitragLaden({
      adresse: ADRESSE,
      konfig: KONFIG,
      inhalt: inhaltWieEcht({ ohneNachweis: true })
    });

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(ergebnis.lizenz.ok === false && ergebnis.lizenz.grund).toBe('kein-nachweis');
  });

  it('meldet hash-widerspruch, wenn der gemerkte etag nicht zum Hash passt', async () => {
    const ergebnis = await beitragLaden({
      adresse: ADRESSE,
      konfig: KONFIG,
      inhalt: inhaltWieEcht({ etag: '"deadbeef"' })
    });

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(ergebnis.lizenz.ok === false && ergebnis.lizenz.grund).toBe('hash-widerspruch');
  });

  it('fragt den Lizenznachweis nicht ab, wenn kein x-Tag vorliegt', async () => {
    const ohneHash = {
      ...ARTIKEL,
      tags: ARTIKEL.tags.filter((/** @type {string[]} */ t) => t[0] !== 'x')
    };
    const inhalt = { ...inhaltWieEcht(), artikel: [ohneHash] };

    const ergebnis = await beitragLaden({ adresse: ADRESSE, konfig: KONFIG, inhalt });

    expect(ergebnis.ok).toBe(true);
    // Ohne Hash keine Frage — das ist eine fehlende Angabe, kein fehlender
    // Nachweis (CLAUDE.md).
    expect(ergebnis.ok === true && ergebnis.lizenzAbfrage.gefragteRelays).toEqual([]);
    expect(ergebnis.ok === true && ergebnis.lizenz.ok === false && ergebnis.lizenz.grund).toBe(
      'kein-x-tag'
    );
  });
});

describe('beitragLaden löst Fließtextbilder mit Hash-URL auf (ADR-0023)', () => {
  const ARTIKEL_NEU = fixture('artikel-30023-die-kraft-der-gemeinschaft-2026-09-07.json')[0];
  const COVER_HASH = NACHWEIS.tags.find((/** @type {string[]} */ t) => t[0] === 'x')[1];

  /** Wie inhaltWieEcht, aber mit dem Artikel vom 07.09. (Blossom-Bild im Text). */
  function inhaltMitFliesstextbild() {
    return {
      ...leererInhalt(),
      stand: {
        zeitpunkt: '2026-09-14T10:00:00Z',
        dauerMs: 3,
        gefragteRelays: KONFIG.relays,
        nichtErreichbar: [],
        anzahl: { artikel: 1, listen: 0, nachweise: 1, profil: 0, termine: 0 }
      },
      artikel: [ARTIKEL_NEU],
      nachweise: [NACHWEIS],
      quellen: { [ARTIKEL_NEU.id]: [KONFIG.relays[0]], [NACHWEIS.id]: [KONFIG.relays[1]] },
      etags: {}
    };
  }

  it('liefert Teile statt HTML — mit einem Bild-Teil für das Blossom-Bild im Text, dessen Hash im Cover-Hash der Referenzfixture steckt', async () => {
    const ergebnis = await beitragLaden({
      adresse: ADRESSE,
      konfig: KONFIG,
      inhalt: inhaltMitFliesstextbild()
    });

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;

    const bilder = ergebnis.teile.filter((t) => t.art === 'bild');
    expect(bilder.length).toBeGreaterThan(0);
    expect(Object.keys(ergebnis.fliesstext)).toContain(COVER_HASH);
    expect(ergebnis.fliesstext[COVER_HASH]?.ok).toBe(true);
  });

  const HASH2 = 'c'.repeat(64);

  /** Artikel vom 07.09. mit einem zweiten, synthetischen Bild-Hash im Text. */
  function artikelMitZweitemHash() {
    return {
      ...ARTIKEL_NEU,
      content: `${ARTIKEL_NEU.content}\n\n![Zweites](https://blossom.edufeed.org/${HASH2}.png)\n`
    };
  }

  it('löst einen zweiten Hash unabhängig vom Cover auf — ohne eigenen Nachweis bleibt er kein-nachweis', async () => {
    const inhalt = { ...inhaltMitFliesstextbild(), artikel: [artikelMitZweitemHash()] };

    const ergebnis = await beitragLaden({ adresse: ADRESSE, konfig: KONFIG, inhalt });

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;

    expect(ergebnis.fliesstext[COVER_HASH]?.ok).toBe(true);
    // Der Nachweis des Covers darf dem zweiten, fremden Hash nicht
    // zugeschlagen werden — ohne eigenen Nachweis bleibt er kein-nachweis.
    expect(ergebnis.fliesstext[HASH2]).toEqual({ ok: false, grund: 'kein-nachweis' });
  });

  it('löst einen zweiten Hash mit eigenem Nachweis unabhängig vom Cover auf', async () => {
    const NACHWEIS2 = {
      ...NACHWEIS,
      id: 'd'.repeat(64),
      content: '',
      tags: [
        ['url', `https://blossom.edufeed.org/${HASH2}.png`],
        ['x', HASH2],
        ['license', 'https://creativecommons.org/publicdomain/zero/1.0/'],
        ['credit', 'Zweite Quelle']
      ]
    };
    const inhalt = {
      ...inhaltMitFliesstextbild(),
      artikel: [artikelMitZweitemHash()],
      nachweise: [NACHWEIS, NACHWEIS2],
      quellen: {
        ...inhaltMitFliesstextbild().quellen,
        [NACHWEIS2.id]: [KONFIG.relays[1]]
      }
    };

    const ergebnis = await beitragLaden({ adresse: ADRESSE, konfig: KONFIG, inhalt });

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;

    expect(ergebnis.fliesstext[COVER_HASH]?.ok).toBe(true);
    expect(ergebnis.fliesstext[HASH2]?.ok).toBe(true);
    if (ergebnis.fliesstext[HASH2]?.ok) {
      expect(ergebnis.fliesstext[HASH2].nachweis.hash).toBe(HASH2);
      // Die Zuordnung ist je Hash geprüft: Der Cover-Nachweis wird dem
      // zweiten Bild nicht untergeschoben, obwohl beide im selben Lauf
      // aufgelöst werden.
      expect(ergebnis.fliesstext[HASH2].nachweis.hash).not.toBe(COVER_HASH);
    }
  });
});
