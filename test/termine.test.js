/**
 * Die Terminseite /termine (ADR-0034): Routen-Schicht mit dem lade-Muster aus
 * test/uebersicht-routen.test.js (Helfer bewusst kopiert, nicht importiert),
 * Komponenten mit `svelte/server` — dieselbe Darstellung, die der Server
 * ausliefert (ADR-0003).
 */
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { render } from 'svelte/server';
import { leererInhalt } from '../src/lib/services/spiegel.js';
import { termineListe } from '../src/lib/loaders/termine.js';
import { naechsteTermine } from '../src/lib/routen/termine.js';
import Termine from '../src/lib/komponenten/Termine.svelte';
import Termin from '../src/lib/komponenten/Termin.svelte';
import NaechsteTermine from '../src/lib/komponenten/NaechsteTermine.svelte';

/** @type {any[]} */
const artikelEvents = JSON.parse(
  readFileSync(new URL('./fixtures/foerbico-artikel-30023.json', import.meta.url), 'utf8')
);
/** @type {any[]} */
const terminEvents = JSON.parse(
  readFileSync(new URL('./fixtures/termine-31922-community.json', import.meta.url), 'utf8')
);
/** @type {any[]} */
const redaktionEvents = JSON.parse(
  readFileSync(new URL('./fixtures/liste-30000-redaktion.json', import.meta.url), 'utf8')
);

const FOERBICO_AUTOR = '5a12b41ec15b466321e88c371be2dc47d9193f9c8bba4ab09fc50045bd35aedf';
const COMMUNITY = 'ae6199bb435d70a0ecce61324ac80e7c24dedf2b0680cbd3e94983e7557746a2';
const RELAY = 'wss://relay.edufeed.org/';
const RPI = 'wss://relay-rpi.edufeed.org/';

const umgebung = () => ({
  QUELLE_AUTOR: FOERBICO_AUTOR,
  RELAYS: `${RELAY},${RPI}`,
  BLOSSOM_URL: 'https://blossom.edufeed.org/',
  REDAKTION_D: 'redaktion',
  COMMUNITY_PUBKEY: COMMUNITY,
  EDUFEED_URL: 'https://dev.edufeed.org'
});

/** @param {Partial<any>} ab */
function inhaltMitTerminen(ab = {}) {
  return {
    ...leererInhalt(),
    stand: {
      zeitpunkt: '2026-09-15T10:00:00Z',
      dauerMs: 3,
      gefragteRelays: [RELAY, RPI],
      nichtErreichbar: [],
      anzahl: { artikel: artikelEvents.length, listen: 1, nachweise: 0, profil: 0, termine: 1 }
    },
    artikel: artikelEvents,
    listen: redaktionEvents,
    termine: terminEvents,
    ...ab
  };
}

/**
 * Lädt ein Routenmodul frisch, mit gemocktem Spiegel und gemockter Umgebung.
 * @param {string} modulpfad @param {Record<string, string>} params @param {unknown} [inhalt]
 * @param {Partial<ReturnType<typeof umgebung>>} [umgebungAb]
 */
async function lade(modulpfad, params, inhalt = inhaltMitTerminen(), umgebungAb = {}) {
  vi.resetModules();
  vi.doMock('$env/dynamic/private', () => ({ env: { ...umgebung(), ...umgebungAb } }));
  vi.doMock('$lib/services/spiegel.js', async () => {
    const echt = await import('../src/lib/services/spiegel.js');
    return { ...echt, spiegelHolen: () => ({ lesen: () => inhalt, letzterFehlschlag: () => null }) };
  });
  const { load } = await import(modulpfad);
  return load(/** @type {any} */ ({ params, url: new URL('https://hub.example/termine') }));
}

describe('/termine (ADR-0034)', () => {
  it('liefert kommende und vergangene Termine', async () => {
    const daten = await lade('../src/routes/termine/+page.server.js', {});
    expect(daten.ueberschrift).toBe('Termine');
    expect(daten.basis).toBe('/termine');
    expect(daten.hinweis).toBeNull();
    // Die Tagung liegt 2027 — von 2026 aus gesehen kommend.
    expect(daten.kommend).toHaveLength(1);
    expect(daten.vergangen).toHaveLength(0);
    expect(daten.kommend[0].termin.titel).toContain('FOERBICO Tagung Frankfurt');
  });

  it('ohne Termine: Hinweis, kein Fehler', async () => {
    const daten = await lade('../src/routes/termine/+page.server.js', {}, inhaltMitTerminen({ termine: [] }));
    expect(daten.kommend).toEqual([]);
    expect(daten.vergangen).toEqual([]);
    expect(daten.hinweis).toContain('kind:31922');
    expect(daten.hinweis).toContain(COMMUNITY.slice(0, 12));
  });

  it('nennt nicht erreichbare Relays, damit ein leerer Kalender nicht wie „noch nichts" aussieht', async () => {
    const stand = { ...inhaltMitTerminen().stand, nichtErreichbar: [RPI] };
    const daten = await lade('../src/routes/termine/+page.server.js', {}, inhaltMitTerminen({ termine: [], stand }));
    expect(daten.hinweis).toContain(RPI);
  });

  it('COMMUNITY_PUBKEY leer: Hinweis nennt „abgeschaltet", nicht „publiziert"', async () => {
    const daten = await lade(
      '../src/routes/termine/+page.server.js', {},
      inhaltMitTerminen({ termine: [] }), { COMMUNITY_PUBKEY: '' }
    );
    expect(daten.kommend).toEqual([]);
    expect(daten.vergangen).toEqual([]);
    expect(daten.hinweis).toContain('abgeschaltet');
    expect(daten.hinweis).not.toContain('publiziert');
  });

  it('Leerstand des Spiegels → 503', async () => {
    await expect(
      lade('../src/routes/termine/+page.server.js', {}, { ...leererInhalt(), stand: null })
    ).rejects.toMatchObject({ status: 503 });
  });
});

describe('naechsteTermine (Block der Startseite, Task 3)', () => {
  const KONFIG = /** @type {any} */ ({
    autor: FOERBICO_AUTOR, relays: [RELAY], community: COMMUNITY,
    edufeedUrl: 'https://dev.edufeed.org', abgeloesteHosts: ['oer.community'], redaktionD: 'redaktion'
  });
  const inhalt = /** @type {any} */ (inhaltMitTerminen());
  it('liefert höchstens `anzahl` kommende Termine, standardmäßig drei', () => {
    expect(naechsteTermine({ konfig: KONFIG, inhalt, jetzt: () => new Date('2026-09-15T10:00:00Z') })).toHaveLength(1);
    expect(naechsteTermine({ konfig: KONFIG, inhalt, jetzt: () => new Date('2026-09-15T10:00:00Z'), anzahl: 0 })).toHaveLength(0);
  });
  it('nimmt nur kommende, nie vergangene Termine', () => {
    expect(naechsteTermine({ konfig: KONFIG, inhalt, jetzt: () => new Date('2027-03-01T10:00:00Z') })).toEqual([]);
  });
});

describe('Termine.svelte / Termin.svelte', () => {
  const KONFIG = /** @type {any} */ ({
    autor: FOERBICO_AUTOR, relays: [RELAY], community: COMMUNITY,
    edufeedUrl: 'https://dev.edufeed.org', abgeloesteHosts: ['oer.community'], redaktionD: 'redaktion'
  });
  const liste = (/** @type {() => Date} */ jetzt) =>
    termineListe(/** @type {any} */ (inhaltMitTerminen()), KONFIG, { jetzt });

  it('rendert Titel, Zeitraum, Ort, Bild mit Pille und den Kalender-Link', () => {
    const l = liste(() => new Date('2026-09-15T10:00:00Z'));
    const { body } = render(Termine, {
      props: { kommend: l.kommend, vergangen: l.vergangen, ueberschrift: 'Termine', hinweis: null }
    });
    expect(body).toContain('FOERBICO Tagung Frankfurt');
    expect(body).toContain('Februar 2027');
    expect(body).toMatch(/2\.\s*(–|&ndash;|-)/);
    expect(body).toContain('Frankfurt, Hesse, Germany');
    // Das Bild liegt auf einem Fremdhost ohne x-Tag: ausgeliefert mit Pille
    // „Lizenz ungeklärt" (ADR-0022, ADR-0032).
    expect(body).toContain('class="pille ungeklaert');
    expect(body).toContain('Lizenz ungeklärt');
    expect(body).toContain(`href="${l.kommend[0].kalenderUrl}"`);
    expect(body).toContain('rel="noopener"');
    expect(body).toContain('Im edufeed-Kalender öffnen');
    expect(body).toContain('ganztägig');
    // Gliederung: h1 Seitentitel, h2 Abschnitt, h3 Termin (Fix-Runde 1).
    expect(body).toMatch(/<h2[^>]*>Nächste Termine<\/h2>/);
    expect(body).toMatch(/<h3[^>]*>[^<]*FOERBICO Tagung Frankfurt/);
  });

  it('vergangene Termine unter eigener Überschrift, englische Texte bei sprache en', () => {
    const l = liste(() => new Date('2027-03-01T10:00:00Z'));
    expect(l.vergangen).toHaveLength(1);
    const deutsch = render(Termine, {
      props: { kommend: l.kommend, vergangen: l.vergangen, ueberschrift: 'Termine', hinweis: null }
    }).body;
    expect(deutsch).toContain('Vergangene Termine');
    // Ohne kommende Termine steht die Überschrift „Nächste Termine" nicht da.
    expect(deutsch).not.toContain('Nächste Termine');
    const englisch = render(Termine, {
      props: { kommend: l.kommend, vergangen: l.vergangen, ueberschrift: 'Events', hinweis: null, sprache: 'en' }
    }).body;
    expect(englisch).toContain('Past events');
    expect(englisch).not.toContain('Upcoming events');
    expect(englisch).toContain('Open in the edufeed calendar');
    expect(englisch).not.toContain('Vergangene Termine');
  });

  it('zeitgebundener Termin (kind:31923): Uhrzeit in Berliner Zeit, Ende am selben Tag nur als Uhrzeit', () => {
    const karte = /** @type {any} */ ({
      bild: null, kalenderUrl: 'https://dev.edufeed.org/calendar/event/naddr1x',
      termin: {
        d: 'werkstatt', titel: 'Werkstatt', zusammenfassung: '', inhalt: 'Erster Absatz\n\nZweiter Absatz',
        start: new Date('2027-02-02T09:00:00Z'), ende: new Date('2027-02-02T17:00:00Z'),
        ganztaegig: false, orte: ['Online']
      }
    });
    const { body } = render(Termin, { props: { karte } });
    // 09:00 UTC ist im Februar 10:00 in Berlin; das Datum steht nur einmal.
    expect(body).toContain('2. Februar 2027');
    expect(body).toContain('10:00');
    expect(body).toContain('18:00');
    expect(body.match(/2\. Februar 2027/g)).toHaveLength(1);
    expect(body).not.toContain('ganztägig');
    expect(body).toContain('Online');
    // Absätze als Text, kein {@html}.
    expect(body).toContain('<p class="svelte');
    expect(body).toContain('Zweiter Absatz');
  });

  it('Anker sind kodiert: Start-Link und Karten-id stimmen auch bei Sonderzeichen im d überein', () => {
    const karte = /** @type {any} */ ({
      bild: null, kalenderUrl: 'https://dev.edufeed.org/calendar/event/naddr1x',
      termin: {
        d: 'a#b', titel: 'Sonderzeichen-Termin', zusammenfassung: '', inhalt: 'Text',
        start: new Date('2027-02-02T09:00:00Z'), ende: null, ganztaegig: true, orte: []
      }
    });
    const start = render(NaechsteTermine, { props: { karten: [karte] } });
    expect(start.body).toContain('href="/termine#a%23b"');
    const eintrag = render(Termin, { props: { karte } });
    expect(eintrag.body).toContain('id="a%23b"');
  });

  it('zeigt den Hinweis, wenn nichts da ist — nie eine leere Liste ohne Erklärung', () => {
    const { body } = render(Termine, {
      props: { kommend: [], vergangen: [], ueberschrift: 'Termine', hinweis: 'Es sind noch keine Termine publiziert.' }
    });
    expect(body).toContain('Es sind noch keine Termine publiziert.');
  });
});
