import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { hashesSammeln, leererInhalt, spiegelErstellen } from './spiegel.js';
import { hashAusUrl } from '../models/lizenz.js';

/** @param {string} datei */
const fixture = (datei) =>
  JSON.parse(readFileSync(new URL(`../../../test/fixtures/${datei}`, import.meta.url), 'utf8'));

const ARTIKEL_ALT = fixture('artikel-30023-die-kraft-der-gemeinschaft.json')[0];
const ARTIKEL_NEU = fixture('artikel-30023-die-kraft-der-gemeinschaft-2026-09-07.json')[0];
const NACHWEIS = fixture('lizenz-1063-nostr-schrein.json')[0];
const PROFIL = fixture('profil-0-foerbico.json')[0];
const BESTAND = fixture('foerbico-artikel-30023.json');

const RELAY = 'wss://relay.edufeed.org/';
const RPI = 'wss://relay-rpi.edufeed.org/';
const KONFIG = {
  autor: ARTIKEL_ALT.pubkey, hTag: null, relays: [RELAY, RPI],
  blossomUrl: 'https://blossom.edufeed.org/', abgeloesteHosts: ['oer.community'],
  spiegelPfad: 'x.json', spiegelIntervallS: 600, spiegelStartwartezeitS: 20,
  startseiteD: 'startseite', navigationD: 'navigation', fusszeileD: 'fusszeile'
};

/**
 * Relay-Attrappe: relay hat beide Artikelfassungen und das Profil, relay-rpi
 * nur den Nachweis — wie in Wirklichkeit (ADR-0013).
 * @param {{ tot?: string[] }} [lage]
 */
function relays(lage = {}) {
  /** @type {import('./relay.js').eventsHolen} */
  return async (url, filter) => {
    if (lage.tot?.includes(url)) return { events: [], erreicht: false };
    const kinds = /** @type {number[]} */ (filter.kinds);
    if (kinds.includes(30023)) return { events: url === RELAY ? [ARTIKEL_ALT, ARTIKEL_NEU] : [], erreicht: true };
    if (kinds.includes(0)) return { events: url === RELAY ? [PROFIL] : [], erreicht: true };
    if (kinds.includes(1063)) {
      const gesucht = /** @type {string[]} */ (filter['#x']);
      const passt = NACHWEIS.tags.some((/** @type {string[]} */ t) => t[0] === 'x' && gesucht.includes(t[1]));
      return { events: url === RPI && passt ? [NACHWEIS] : [], erreicht: true };
    }
    return { events: [], erreicht: true };
  };
}

describe('hashesSammeln', () => {
  it('nimmt x-Tags und Hash-URLs aus Text und image, ohne Dubletten', () => {
    const hashes = hashesSammeln([ARTIKEL_NEU]);
    expect(hashes).toContain(ARTIKEL_NEU.tags.find((/** @type {string[]} */ t) => t[0] === 'x')[1]);
    expect(new Set(hashes).size).toBe(hashes.length);
  });
  it('liefert für den Altbestand ohne x nichts Erfundenes', () => {
    // Fixture-Anpassung (Task 4): Der ursprüngliche Filter prüfte nur den
    // Content auf einen losen Hex-String, ignorierte aber Hash-URLs im
    // image-Tag (Cover). Drei Artikel im Bestand haben genau das — ein
    // Blossom-Cover ohne x-Tag, dessen Hash laut ADR-0023 trotzdem aus der
    // URL aufgelöst wird. Der Filter muss dieselbe Quelle ausschließen wie
    // hashesSammeln sie zieht (image-Tag und Markdown-Bilder), sonst prüft
    // der Test etwas anderes als die Funktion tatsächlich tut.
    const ohneX = BESTAND.filter((/** @type {{ tags: string[][], content: string }} */ e) => {
      if (e.tags.some((t) => t[0] === 'x')) return false;
      const cover = e.tags.find((t) => t[0] === 'image')?.[1];
      return !(cover && hashAusUrl(cover));
    });
    expect(hashesSammeln(ohneX)).toEqual([]);
  });
});

describe('spiegelErstellen().auffrischen', () => {
  it('führt ersetzbare Events zusammen: neuestes created_at je d gewinnt', async () => {
    const s = spiegelErstellen({ konfig: KONFIG, holen: relays(), etagHolen: async () => undefined, speicher: speicherAttrappe() });
    const { gueltig, inhalt } = await s.auffrischen();
    expect(gueltig).toBe(true);
    expect(inhalt.artikel).toHaveLength(1);
    expect(inhalt.artikel[0].id).toBe(ARTIKEL_NEU.id);
    expect(inhalt.profil?.id).toBe(PROFIL.id);
  });

  it('holt die Nachweise über alle Relays und merkt sich die Herkunft', async () => {
    const s = spiegelErstellen({ konfig: KONFIG, holen: relays(), etagHolen: async () => undefined, speicher: speicherAttrappe() });
    const { inhalt } = await s.auffrischen();
    expect(inhalt.nachweise.map((e) => e.id)).toEqual([NACHWEIS.id]);
    expect(inhalt.quellen[NACHWEIS.id]).toEqual([RPI]);
    expect(inhalt.quellen[ARTIKEL_NEU.id]).toEqual([RELAY]);
  });

  it('fragt den etag nur für attestierte Bild-URLs', async () => {
    const etagHolen = vi.fn(async () => '"abc"');
    const s = spiegelErstellen({ konfig: KONFIG, holen: relays(), etagHolen, speicher: speicherAttrappe() });
    const { inhalt } = await s.auffrischen();
    const cover = ARTIKEL_NEU.tags.find((/** @type {string[]} */ t) => t[0] === 'image')[1];
    expect(etagHolen).toHaveBeenCalledWith(cover);
    expect(inhalt.etags[cover]).toBe('"abc"');
  });

  it('ein Lauf ohne antwortendes Relay ist ungültig und ersetzt nichts', async () => {
    const lage = { tot: /** @type {string[]} */ ([]) };
    const s = spiegelErstellen({ konfig: KONFIG, holen: relays(lage), etagHolen: async () => undefined, speicher: speicherAttrappe() });
    await s.auffrischen();
    const vorher = s.lesen();
    lage.tot = [RELAY, RPI];
    const { gueltig } = await s.auffrischen();
    expect(gueltig).toBe(false);
    expect(s.lesen()).toBe(vorher);
    expect(s.letzterFehlschlag()?.gefragteRelays).toEqual([RELAY, RPI]);
    const nie = spiegelErstellen({ konfig: KONFIG, holen: relays(lage), etagHolen: async () => undefined, speicher: speicherAttrappe() });
    await nie.auffrischen();
    expect(nie.lesen()).toEqual(leererInhalt());
  });

  it('ein Relay tot, eines antwortet: gültig, das tote steht im Stand', async () => {
    const s = spiegelErstellen({ konfig: KONFIG, holen: relays({ tot: [RPI] }), etagHolen: async () => undefined, speicher: speicherAttrappe() });
    const { gueltig, inhalt } = await s.auffrischen();
    expect(gueltig).toBe(true);
    expect(inhalt.stand?.nichtErreichbar).toEqual([RPI]);
    expect(inhalt.nachweise).toEqual([]);
    expect(inhalt.stand?.anzahl).toEqual({ artikel: 1, listen: 0, nachweise: 0, profil: 1 });
  });

  it('fragt Nachweise in Blöcken zu höchstens 50 Hashes', async () => {
    // Fixture-Anpassung (Task 4): content muss mit überschrieben werden —
    // ARTIKEL_NEU trägt im Markdown ein Blossom-Bild mit eigenem Hash
    // (ADR-0023). Ohne das würden alle 120 Fassungen diesen einen Hash
    // zusätzlich zu ihrem x-Tag beisteuern: 121 statt 120 Hashes, macht die
    // Blockgrößen 50/50/21 statt der hier erwarteten 50/50/20.
    const viele = Array.from({ length: 120 }, (_, i) => ({
      ...ARTIKEL_NEU, id: `id${i}`, content: '',
      tags: [['d', `d${i}`], ['x', String(i).padStart(64, '0')]]
    }));
    /** @type {number[]} */
    const groessen = [];
    /** @type {import('./relay.js').eventsHolen} */
    const holen = async (url, filter) => {
      if (/** @type {number[]} */ (filter.kinds).includes(30023)) return { events: url === RELAY ? viele : [], erreicht: true };
      if (/** @type {number[]} */ (filter.kinds).includes(1063) && url === RELAY) groessen.push(/** @type {string[]} */ (filter['#x']).length);
      return { events: [], erreicht: true };
    };
    const s = spiegelErstellen({ konfig: KONFIG, holen, etagHolen: async () => undefined, speicher: speicherAttrappe() });
    await s.auffrischen();
    expect(groessen).toEqual([50, 50, 20]);
  });
});

/** Speicher-Attrappe im Speicher. */
function speicherAttrappe(/** @type {string|null} */ anfang = null) {
  let text = anfang;
  return {
    lesen: async () => text,
    schreiben: async (/** @type {string} */ t) => { text = t; },
    inhalt: () => text
  };
}

describe('Profilwahl', () => {
  it('behält das neueste kind:0, nicht das älteste', async () => {
    const alt = { ...PROFIL, id: 'a'.repeat(64), created_at: 1 };
    const neu = { ...PROFIL, id: 'b'.repeat(64), created_at: 5 };
    /** @type {import('./relay.js').eventsHolen} */
    const holen = async (url, filter) => {
      const kinds = /** @type {number[]} */ (filter.kinds);
      if (kinds.includes(0)) return { events: url === RELAY ? [alt, neu] : [], erreicht: true };
      return { events: [], erreicht: true };
    };
    const s = spiegelErstellen({ konfig: KONFIG, holen, etagHolen: async () => undefined, speicher: speicherAttrappe() });
    const { inhalt } = await s.auffrischen();
    expect(inhalt.profil?.id).toBe(neu.id);
  });
});

describe('Spiegel und Datei', () => {
  it('schreibt nach einem gültigen Lauf und liest beim Start zurück', async () => {
    const speicher = speicherAttrappe();
    const s = spiegelErstellen({ konfig: KONFIG, holen: relays(), etagHolen: async () => undefined, speicher });
    await s.auffrischen();
    expect(speicher.inhalt()).toContain(ARTIKEL_NEU.id);

    const neu = spiegelErstellen({ konfig: KONFIG, holen: relays({ tot: [RELAY, RPI] }), etagHolen: async () => undefined, speicher });
    expect(await neu.ausDateiLaden()).toBe(true);
    expect(neu.lesen().artikel[0].id).toBe(ARTIKEL_NEU.id);
    expect(neu.lesen().stand?.zeitpunkt).toBeTruthy();
  });

  it('füllt eine Datei ohne listen/quellen/etags auf, statt später zu werfen', async () => {
    const knapp = JSON.stringify({ stand: null, artikel: [ARTIKEL_NEU], nachweise: [] });
    const s = spiegelErstellen({ konfig: KONFIG, holen: relays(), etagHolen: async () => undefined, speicher: speicherAttrappe(knapp) });
    expect(await s.ausDateiLaden()).toBe(true);
    expect(s.lesen().quellen).toEqual({});
    expect(s.lesen().etags).toEqual({});
    expect(s.lesen().listen).toEqual([]);
    expect(s.lesen().profil).toBeNull();
  });

  it('eine kaputte oder fremde Datei wird ignoriert', async () => {
    const s = spiegelErstellen({ konfig: KONFIG, holen: relays(), etagHolen: async () => undefined, speicher: speicherAttrappe('{"nix":1}') });
    expect(await s.ausDateiLaden()).toBe(false);
    const k = spiegelErstellen({ konfig: KONFIG, holen: relays(), etagHolen: async () => undefined, speicher: speicherAttrappe('kein json') });
    expect(await k.ausDateiLaden()).toBe(false);
  });

  it('ein ungültiger Lauf schreibt die Datei nicht', async () => {
    const speicher = speicherAttrappe('ALT');
    const s = spiegelErstellen({ konfig: KONFIG, holen: relays({ tot: [RELAY, RPI] }), etagHolen: async () => undefined, speicher });
    await s.auffrischen();
    expect(speicher.inhalt()).toBe('ALT');
  });
});

describe('starten', () => {
  it('lädt die Datei, wartet den ersten Lauf ab und plant den Timer', async () => {
    /** @type {Array<{ fn: () => unknown, ms: number }>} */
    const geplant = [];
    const s = spiegelErstellen({
      konfig: KONFIG, holen: relays(), etagHolen: async () => undefined, speicher: speicherAttrappe(),
      planen: (fn, ms) => { geplant.push({ fn, ms }); return { stoppen: () => {} }; }
    });
    await s.starten();
    expect(s.lesen().artikel).toHaveLength(1);
    expect(geplant).toEqual([{ fn: expect.any(Function), ms: 600_000 }]);
  });

  it('geht nach der Startwartezeit ans Netz, auch wenn der Lauf hängt', async () => {
    /** @type {import('./relay.js').eventsHolen} */
    const haengt = () => new Promise(() => {});
    const s = spiegelErstellen({
      konfig: { ...KONFIG, spiegelStartwartezeitS: 1 }, holen: haengt, etagHolen: async () => undefined,
      speicher: speicherAttrappe(), planen: () => ({ stoppen: () => {} })
    });
    vi.useFakeTimers();
    const fertig = s.starten();
    await vi.advanceTimersByTimeAsync(1000);
    await fertig;
    vi.useRealTimers();
    expect(s.lesen()).toEqual(leererInhalt());
  });
});

describe('Singleton', () => {
  it('spiegelHolen wirft vor dem Start und liefert danach immer dasselbe', async () => {
    const { spiegelBereit, spiegelHolen, spiegelStarten, spiegelZuruecksetzenFuerTests } = await import('./spiegel.js');
    spiegelZuruecksetzenFuerTests();
    expect(() => spiegelHolen()).toThrow(/hooks\.server\.js/);
    const a = spiegelStarten({ ...KONFIG, relays: [] }, { speicher: speicherAttrappe(), planen: () => ({ stoppen: () => {} }) });
    const b = spiegelStarten({ ...KONFIG, relays: [] });
    expect(a).toBe(b);
    expect(spiegelHolen()).toBe(a);
    await spiegelBereit();
    expect(a.letzterFehlschlag()?.gefragteRelays).toEqual([]);
    spiegelZuruecksetzenFuerTests();
  });
});
