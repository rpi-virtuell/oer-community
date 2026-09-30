import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import * as nip19 from 'nostr-tools/nip19';
import { dateiBildspeicher, hashesSammeln, leererInhalt, spiegelErstellen } from './spiegel.js';
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
  startseiteD: 'startseite', navigationD: 'navigation', fusszeileD: 'fusszeile',
  redaktionD: 'redaktion', profilRelays: [], profilbilderPfad: 'x',
  community: null, edufeedUrl: 'https://dev.edufeed.org'
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
    expect(inhalt.stand?.anzahl).toEqual({ artikel: 1, listen: 0, nachweise: 0, profil: 1, termine: 0 });
  });

  it('fällt nur das Artikel-Relay aus, bleibt der alte Stand (ADR-0037)', async () => {
    const lage = { tot: /** @type {string[]} */ ([]) };
    const s = spiegelErstellen({ konfig: KONFIG, holen: relays(lage), etagHolen: async () => undefined, speicher: speicherAttrappe() });
    await s.auffrischen();
    const vorher = s.lesen();
    expect(vorher.artikel.length).toBeGreaterThan(0);
    // relay-rpi antwortet weiter — es führt aber keine Artikel.
    lage.tot = [RELAY];
    const { gueltig } = await s.auffrischen();
    expect(gueltig).toBe(false);
    expect(s.lesen()).toBe(vorher);
    expect(s.letzterFehlschlag()?.gefragteRelays).toEqual([RELAY]);
  });

  it('ohne bisherigen Stand genügt irgendein antwortendes Relay', async () => {
    const s = spiegelErstellen({ konfig: KONFIG, holen: relays({ tot: [RELAY] }), etagHolen: async () => undefined, speicher: speicherAttrappe() });
    const { gueltig, inhalt } = await s.auffrischen();
    expect(gueltig).toBe(true);
    expect(inhalt.artikel).toEqual([]);
  });

  it('ein Relay, das aus RELAYS gestrichen wurde, hält den alten Stand nicht fest', async () => {
    const s = spiegelErstellen({ konfig: KONFIG, holen: relays(), etagHolen: async () => undefined, speicher: speicherAttrappe() });
    await s.auffrischen();
    const ohne = spiegelErstellen({
      konfig: { ...KONFIG, relays: [RPI] }, holen: relays(), etagHolen: async () => undefined,
      speicher: speicherAttrappe(JSON.stringify(s.lesen()))
    });
    await ohne.ausDateiLaden();
    const { gueltig } = await ohne.auffrischen();
    expect(gueltig).toBe(true);
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
    // Gebaute Fassungen sind nicht signiert — hier geht es um die Blöcke, nicht um die Signatur.
    const s = spiegelErstellen({ konfig: KONFIG, holen, etagHolen: async () => undefined, speicher: speicherAttrappe(), pruefen: () => true });
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

describe('Signatur (ADR-0036)', () => {
  it('lässt ein Event mit falscher Signatur nicht herein und zählt es', async () => {
    const gefaelscht = { ...structuredClone(ARTIKEL_NEU), content: 'Nie von FOERBICO geschrieben.' };
    /** @type {import('./relay.js').eventsHolen} */
    const holen = async (url, filter) => {
      const kinds = /** @type {number[]} */ (filter.kinds);
      if (kinds.includes(30023)) return { events: url === RELAY ? [gefaelscht, structuredClone(ARTIKEL_ALT)] : [], erreicht: true };
      return { events: [], erreicht: true };
    };
    const s = spiegelErstellen({ konfig: KONFIG, holen, etagHolen: async () => undefined, speicher: speicherAttrappe() });
    const { inhalt } = await s.auffrischen();
    expect(inhalt.artikel.map((e) => e.id)).toEqual([ARTIKEL_ALT.id]);
    expect(inhalt.stand?.verworfen).toBe(1);
  });

  it('prüft auch Nachweise, Listen, Profil und Termine', async () => {
    const falsch = (/** @type {any} */ e) => ({ ...structuredClone(e), sig: '00'.repeat(64) });
    /** @type {import('./relay.js').eventsHolen} */
    const holen = async (url, filter) => {
      if (url !== RELAY) return { events: [], erreicht: true };
      const kinds = /** @type {number[]} */ (filter.kinds);
      if (kinds.includes(30023)) return { events: [structuredClone(ARTIKEL_NEU)], erreicht: true };
      if (kinds.includes(0)) return { events: [falsch(PROFIL)], erreicht: true };
      if (kinds.includes(1063)) return { events: [falsch(NACHWEIS)], erreicht: true };
      return { events: [], erreicht: true };
    };
    const s = spiegelErstellen({ konfig: KONFIG, holen, etagHolen: async () => undefined, speicher: speicherAttrappe() });
    const { inhalt } = await s.auffrischen();
    expect(inhalt.profil).toBeNull();
    expect(inhalt.nachweise).toEqual([]);
    expect(inhalt.stand?.verworfen).toBe(2);
  });
});

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
    const s = spiegelErstellen({ konfig: KONFIG, holen, etagHolen: async () => undefined, speicher: speicherAttrappe(), pruefen: () => true });
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

describe('Termine und Redaktionsliste (ADR-0034)', () => {
  const TERMIN = fixture('termine-31922-community.json')[0];
  const REDAKTION = fixture('liste-30000-redaktion.json')[0];
  const COMMUNITY = 'ae6199bb435d70a0ecce61324ac80e7c24dedf2b0680cbd3e94983e7557746a2';

  /**
   * Relay-Attrappe für den Kalender: Artikel, Termine und die Redaktionsliste.
   * Notiert nebenbei jeden gestellten Filter.
   * @param {object[]} filterProtokoll
   * @returns {import('./relay.js').eventsHolen}
   */
  const kalenderRelays = (filterProtokoll) => async (url, filter) => {
    if (url === RELAY) filterProtokoll.push(filter);
    if (url !== RELAY) return { events: [], erreicht: true };
    const kinds = /** @type {number[]} */ (filter.kinds);
    if (kinds.includes(30023)) return { events: [ARTIKEL_NEU], erreicht: true };
    if (kinds.includes(30000)) return { events: [REDAKTION], erreicht: true };
    if (kinds.includes(31922)) return { events: [TERMIN], erreicht: true };
    return { events: [], erreicht: true };
  };

  it('holt Termine der Community und die kind:30000-Liste des Autors', async () => {
    /** @type {any[]} */
    const gestellt = [];
    const s = spiegelErstellen({
      konfig: { ...KONFIG, community: COMMUNITY },
      holen: kalenderRelays(gestellt), etagHolen: async () => undefined, speicher: speicherAttrappe()
    });
    const { gueltig, inhalt } = await s.auffrischen();
    expect(gueltig).toBe(true);
    expect(gestellt).toContainEqual({ kinds: [31922, 31923], '#h': [COMMUNITY] });
    expect(gestellt).toContainEqual({ kinds: [30000], authors: [KONFIG.autor] });
    expect(inhalt.termine.map((e) => e.id)).toEqual([TERMIN.id]);
    expect(inhalt.listen.map((e) => e.id)).toContain(REDAKTION.id);
    expect(inhalt.stand?.anzahl.termine).toBe(1);
  });

  it('ohne community wird kein Termin-Filter gestellt', async () => {
    /** @type {any[]} */
    const gestellt = [];
    const s = spiegelErstellen({
      konfig: { ...KONFIG, community: null },
      holen: kalenderRelays(gestellt), etagHolen: async () => undefined, speicher: speicherAttrappe()
    });
    const { inhalt } = await s.auffrischen();
    expect(gestellt.some((f) => f.kinds.includes(31922))).toBe(false);
    expect(inhalt.termine).toEqual([]);
    expect(inhalt.stand?.anzahl.termine).toBe(0);
  });

  it('gruppiert je kind und d: kind:30000 verdrängt kein kind:30004 mit gleichem d', async () => {
    const liste30004 = { ...REDAKTION, kind: 30004, id: 'c'.repeat(64), created_at: REDAKTION.created_at + 10 };
    /** @type {import('./relay.js').eventsHolen} */
    const holen = async (url, filter) => {
      if (url !== RELAY) return { events: [], erreicht: true };
      const kinds = /** @type {number[]} */ (filter.kinds);
      if (kinds.includes(30023)) return { events: [ARTIKEL_NEU], erreicht: true };
      if (kinds.includes(30004)) return { events: [liste30004], erreicht: true };
      if (kinds.includes(30000)) return { events: [REDAKTION], erreicht: true };
      return { events: [], erreicht: true };
    };
    const s = spiegelErstellen({ konfig: { ...KONFIG, community: null }, holen, etagHolen: async () => undefined, speicher: speicherAttrappe(), pruefen: () => true });
    const { inhalt } = await s.auffrischen();
    expect(inhalt.listen.map((e) => e.id).sort()).toEqual([REDAKTION.id, liste30004.id].sort());
  });

  it('eine Datei ohne termine lädt trotzdem', async () => {
    const knapp = JSON.stringify({ stand: null, artikel: [ARTIKEL_NEU], nachweise: [] });
    const s = spiegelErstellen({ konfig: KONFIG, holen: relays(), etagHolen: async () => undefined, speicher: speicherAttrappe(knapp) });
    expect(await s.ausDateiLaden()).toBe(true);
    expect(s.lesen().termine).toEqual([]);
  });
});

describe('Profile der verwiesenen Personen und ihre Bilder (ADR-0039)', () => {
  const PERSON_A = 'a1'.repeat(32);
  const PERSON_B = 'b2'.repeat(32);
  const PROFILRELAY = 'wss://purplepag.es/';
  const npub = (/** @type {string} */ hex) => nip19.npubEncode(hex);
  const SEITE = {
    ...ARTIKEL_NEU, id: 's'.repeat(64),
    content: `## Team\n\nnostr:${npub(PERSON_A)}\n\nnostr:${npub(PERSON_B)}\n`,
    tags: [['d', 'unser-team'], ['title', 'Unser Team'], ['published_at', '1790000000'], ['l', 'seite', 'foerbico/typ']]
  };
  /** @param {string} pubkey @param {number} created_at @param {object} inhalt */
  const kind0 = (pubkey, created_at, inhalt) => ({ ...PROFIL, id: pubkey.slice(0, 8).padEnd(60, '0') + String(created_at).padStart(4, '0'), pubkey, created_at, content: JSON.stringify(inhalt) });
  const A_ALT = kind0(PERSON_A, 10, { name: 'A alt', picture: 'https://i.example/a-alt.png' });
  const A_NEU = kind0(PERSON_A, 20, { name: 'A', picture: 'https://i.example/a.png' });
  const B = kind0(PERSON_B, 5, { name: 'B' });
  const KONFIG_PROFIL = { ...KONFIG, profilRelays: [PROFILRELAY] };

  /** Bildspeicher-Attrappe im Speicher. */
  function bildspeicherAttrappe() {
    /** @type {Map<string, Uint8Array>} */
    const dateien = new Map();
    return {
      dateien,
      pfadVon: (/** @type {string} */ d) => `x/${d}`,
      vorhanden: async (/** @type {string} */ d) => dateien.has(d),
      schreiben: async (/** @type {string} */ d, /** @type {Uint8Array} */ b) => { dateien.set(d, b); }
    };
  }
  /** Attrappe des Bildabrufs: liefert ein PNG für jede Adresse. @param {string[]} [protokoll] */
  const bildHolenAttrappe = (protokoll = []) => async (/** @type {string} */ url) => {
    protokoll.push(url);
    return { bytes: new Uint8Array([1]), typ: 'image/png', hash: 'h' + url.length };
  };
  /** Relay-Attrappe: die Seite liegt auf RELAY, das neueste Profil von A nur auf dem Profil-Relay. @param {string[]} [gefragt] */
  function relaysMitSeite(gefragt = []) {
    /** @type {import('./relay.js').eventsHolen} */
    return async (url, filter) => {
      const kinds = /** @type {number[]} */ (filter.kinds);
      if (kinds.includes(30023)) return { events: url === RELAY ? [SEITE] : [], erreicht: true };
      const authors = /** @type {string[]|undefined} */ (filter.authors);
      if (kinds.includes(0) && authors?.includes(PERSON_A)) {
        gefragt.push(url);
        if (url === PROFILRELAY) return { events: [A_ALT, A_NEU], erreicht: true };
        if (url === RELAY) return { events: [A_ALT, B], erreicht: true };
        return { events: [], erreicht: true };
      }
      if (kinds.includes(0)) return { events: url === RELAY ? [PROFIL] : [], erreicht: true };
      return { events: [], erreicht: true };
    };
  }
  /** @param {Partial<Parameters<typeof spiegelErstellen>[0]>} [ab] */
  const spiegel = (ab = {}) => spiegelErstellen({
    konfig: KONFIG_PROFIL, holen: relaysMitSeite(), etagHolen: async () => undefined, speicher: speicherAttrappe(),
    bildHolen: bildHolenAttrappe(), bildspeicher: bildspeicherAttrappe(), pruefen: () => true, ...ab
  });

  it('fragt die kind:0 auch über die Profil-Relays; je Person gilt das neueste', async () => {
    /** @type {string[]} */
    const gefragt = [];
    const s = spiegel({ holen: relaysMitSeite(gefragt) });
    const { inhalt } = await s.auffrischen();
    expect(new Set(gefragt)).toEqual(new Set([RELAY, RPI, PROFILRELAY]));
    expect(inhalt.personen?.map((e) => e.pubkey).sort()).toEqual([PERSON_A, PERSON_B].sort());
    expect(inhalt.personen?.find((e) => e.pubkey === PERSON_A)?.id).toBe(A_NEU.id);
    expect(inhalt.quellen[A_NEU.id]).toEqual([PROFILRELAY]);
  });

  it('ohne Verweise wird kein Profil-Relay gefragt', async () => {
    /** @type {string[]} */
    const gefragt = [];
    /** @type {import('./relay.js').eventsHolen} */
    const holen = async (url, filter) => {
      gefragt.push(url);
      return relays()(url, filter);
    };
    const s = spiegel({ holen });
    await s.auffrischen();
    expect(gefragt).not.toContain(PROFILRELAY);
  });

  it('hält die Profilbilder auf der Platte und holt sie nur, wenn Adresse oder Datei fehlen', async () => {
    /** @type {string[]} */
    const geholt = [];
    const speicher = bildspeicherAttrappe();
    const s = spiegel({ bildHolen: bildHolenAttrappe(geholt), bildspeicher: speicher });
    const { inhalt } = await s.auffrischen();
    expect(geholt).toEqual(['https://i.example/a.png']);
    expect(inhalt.profilbilder[PERSON_A]).toEqual({ url: 'https://i.example/a.png', datei: `${PERSON_A}.png`, typ: 'image/png', hash: 'h23' });
    expect(inhalt.profilbilder[PERSON_B]).toBeUndefined();
    expect(speicher.dateien.has(`${PERSON_A}.png`)).toBe(true);
    expect(s.bildpfad(`${PERSON_A}.png`)).toBe(`x/${PERSON_A}.png`);

    // Zweiter Lauf, nichts geändert: kein neuer Abruf.
    await s.auffrischen();
    expect(geholt).toHaveLength(1);

    // Datei weg: wieder holen.
    speicher.dateien.delete(`${PERSON_A}.png`);
    await s.auffrischen();
    expect(geholt).toHaveLength(2);
  });

  it('scheitert der Abruf, bleibt das bisherige Bild stehen; ohne bisheriges gibt es keins', async () => {
    const speicher = bildspeicherAttrappe();
    const lage = { kaputt: false };
    /** @param {string} url @returns {Promise<import('./profilbilder.js').Profilbilddaten|null>} */
    const bildHolen = async (url) => (lage.kaputt ? null : bildHolenAttrappe()(url));
    const s = spiegel({ bildHolen, bildspeicher: speicher });
    await s.auffrischen();
    lage.kaputt = true;
    speicher.dateien.delete(`${PERSON_A}.png`);
    const { inhalt } = await s.auffrischen();
    expect(inhalt.profilbilder[PERSON_A]).toBeUndefined();
  });

  it('ein Bild nur aus dem Pfad, nicht aus einem Verzeichnis darüber', () => {
    const speicher = dateiBildspeicher('x');
    expect(speicher.pfadVon('../../etc/passwd')).toBe('x/passwd');
  });

  it('eine ältere Datei ohne personen/profilbilder wird aufgefüllt', async () => {
    const knapp = JSON.stringify({ stand: null, artikel: [ARTIKEL_NEU], nachweise: [] });
    const s = spiegel({ speicher: speicherAttrappe(knapp) });
    expect(await s.ausDateiLaden()).toBe(true);
    expect(s.lesen().personen).toEqual([]);
    expect(s.lesen().profilbilder).toEqual({});
  });
});
