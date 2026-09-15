import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { tagesbeginnBerlin, termineListe, zugelasseneAutoren } from './termine.js';
import { leererInhalt } from '../services/spiegel.js';

const fixture = (/** @type {string} */ f) => JSON.parse(readFileSync(new URL(`../../../test/fixtures/${f}`, import.meta.url), 'utf8'));
const TAGUNG = fixture('termine-31922-community.json')[0];
const REDAKTION = fixture('liste-30000-redaktion.json')[0];
const COMMUNITY = 'ae6199bb435d70a0ecce61324ac80e7c24dedf2b0680cbd3e94983e7557746a2';
const KONFIG = /** @type {any} */ ({ autor: '5a12b41ec15b466321e88c371be2dc47d9193f9c8bba4ab09fc50045bd35aedf', relays: ['wss://relay.edufeed.org/'], community: COMMUNITY, edufeedUrl: 'https://dev.edufeed.org', abgeloesteHosts: ['oer.community'], redaktionD: 'redaktion' });
const inhalt = (/** @type {Partial<import('../services/spiegel.js').Inhalt>} */ ab = {}) => ({ ...leererInhalt(), stand: /** @type {any} */ ({}), termine: [TAGUNG], listen: [REDAKTION], ...ab });
const VOR = () => new Date('2026-09-15T10:00:00Z');
const NACH = () => new Date('2027-03-01T10:00:00Z');

describe('tagesbeginnBerlin', () => {
  // Die Funktion darf nicht von der Zeitzone des Hosts abhängen — geprüft
  // wird sie deshalb auch unter TZ=America/New_York und TZ=Europe/Berlin.
  it('Sommerzeit: Mitternacht Berlin liegt 2 Stunden vor UTC-Mitternacht', () => {
    expect(tagesbeginnBerlin(new Date('2026-07-01T10:00:00Z')).toISOString()).toBe('2026-06-30T22:00:00.000Z');
  });
  it('Winterzeit: eine Stunde', () => {
    expect(tagesbeginnBerlin(new Date('2026-12-01T10:00:00Z')).toISOString()).toBe('2026-11-30T23:00:00.000Z');
  });
  it('kippt genau an der Berliner Mitternacht, nicht an der UTC-Mitternacht', () => {
    // 21:59:59Z ist in Berlin noch der 1. Juli 23:59:59 → Tagesbeginn 30.6.
    expect(tagesbeginnBerlin(new Date('2026-07-01T21:59:59Z')).toISOString()).toBe('2026-06-30T22:00:00.000Z');
    // 22:00:00Z ist in Berlin schon der 2. Juli 00:00 → Tagesbeginn 1.7.
    expect(tagesbeginnBerlin(new Date('2026-07-01T22:00:00Z')).toISOString()).toBe('2026-07-01T22:00:00.000Z');
  });
});

describe('zugelasseneAutoren', () => {
  it('sucht die Redaktionsliste nach kind UND d — ein gleichnamiges kind:30004 zählt nicht', () => {
    // Ein Menü mit demselben d, vor der echten Liste: listeFinden nähme sonst
    // das erste Event und der Redaktionskreis wäre leer.
    const menue = { ...REDAKTION, kind: 30004, id: 'a'.repeat(64), tags: [['d', 'redaktion'], ['a', `30023:${KONFIG.autor}:x`]] };
    const mit = zugelasseneAutoren(/** @type {any} */ (inhalt({ listen: [menue, REDAKTION] })), KONFIG);
    expect(mit.has('43415482fc9893454693aed3913acfda950a06eb4c072457a9df7390db56faf1')).toBe(true);
    // Und die Tagung bleibt dadurch kommend.
    expect(termineListe(inhalt({ listen: [menue, REDAKTION] }), KONFIG, { jetzt: VOR }).kommend).toHaveLength(1);
  });
});

describe('termineListe (ADR-0034)', () => {
  it('die Tagung ist kommend, weil Phillip im Redaktionskreis steht; Link in die edufeed-app', () => {
    const l = termineListe(inhalt(), KONFIG, { jetzt: VOR });
    expect(l.kommend).toHaveLength(1);
    expect(l.vergangen).toHaveLength(0);
    expect(l.kommend[0].termin.titel).toContain('Tagung');
    expect(l.kommend[0].kalenderUrl).toMatch(/^https:\/\/dev\.edufeed\.org\/calendar\/event\/naddr1/);
    // Fremdhost-Bild: ausgeliefert, Stand kein-x-tag (ADR-0022, ADR-0032).
    expect(l.kommend[0].bild?.lizenz).toEqual({ ok: false, grund: 'kein-x-tag' });
  });
  it('nach dem Termin ist er vergangen', () => {
    const l = termineListe(inhalt(), KONFIG, { jetzt: NACH });
    expect(l.kommend).toHaveLength(0);
    expect(l.vergangen).toHaveLength(1);
  });
  it('am letzten Tag zählt er noch als kommend (Ende 3.2. bis Tagesende)', () => {
    const l = termineListe(inhalt(), KONFIG, { jetzt: () => new Date('2027-02-03T15:00:00Z') });
    expect(l.kommend).toHaveLength(1);
  });
  it('ohne Redaktionsliste ist der Autor nicht zugelassen — übersprungen mit Grund', () => {
    const l = termineListe(inhalt({ listen: [] }), KONFIG, { jetzt: VOR });
    expect(l.kommend).toHaveLength(0);
    expect(l.uebersprungen[0]).toContain('nicht im Redaktionskreis');
  });
  it('falscher h-Tag oder Termin des FOERBICO-Keys ohne Liste', () => {
    const fremd = { ...TAGUNG, id: 'f'.repeat(64), tags: TAGUNG.tags.map((/** @type {string[]} */ t) => (t[0] === 'h' ? ['h', 'b'.repeat(64)] : t)) };
    expect(termineListe(inhalt({ termine: [fremd] }), KONFIG, { jetzt: VOR }).kommend).toHaveLength(0);
    const eigener = { ...TAGUNG, id: 'e'.repeat(64), pubkey: KONFIG.autor };
    expect(termineListe(inhalt({ termine: [eigener], listen: [] }), KONFIG, { jetzt: VOR }).kommend).toHaveLength(1);
  });
  it('sortiert kommend aufsteigend, vergangen absteigend', () => {
    const t = (/** @type {string} */ id, /** @type {string} */ s, /** @type {string} */ e) => ({ ...TAGUNG, id: id.repeat(64), tags: TAGUNG.tags.map((/** @type {string[]} */ x) => (x[0] === 'start' ? ['start', s] : x[0] === 'end' ? ['end', e] : x[0] === 'd' ? ['d', id] : x)) });
    const l = termineListe(inhalt({ termine: [t('1', '2027-05-01', '2027-05-02'), t('2', '2027-02-02', '2027-02-03'), t('3', '2025-01-01', '2025-01-02'), t('4', '2026-01-01', '2026-01-02')] }), KONFIG, { jetzt: VOR });
    expect(l.kommend.map((k) => k.termin.d)).toEqual(['2', '1']);
    expect(l.vergangen.map((k) => k.termin.d)).toEqual(['4', '3']);
  });
  it('ohne community in der Konfiguration: alles leer, kein Fehler', () => {
    const l = termineListe(inhalt(), { ...KONFIG, community: null }, { jetzt: VOR });
    expect(l.kommend).toEqual([]);
  });
});
