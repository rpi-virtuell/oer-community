# Kalender aus der Community — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Der Hub zeigt die Termine der Community rpi-virtuell (NIP-52, `kind:31922`/`31923` mit `h`-Tag der Community), eingereicht von Mitgliedern des Redaktionskreises — als Terminseite `/termine` und als Block „Nächste Termine" auf der Startseite. Die Abschlusstagung (Phillips Event) ist der erste Eintrag.

**Architecture:** Der Spiegel holt zusätzlich alle Termin-Events mit dem `h`-Tag der Community und die Redaktionsliste (`kind:30000`, `d = redaktion`) des FOERBICO-Keys. Das Modell `models/termin.js` liest die NIP-52-Felder über `applesauce-common/helpers`. Der Loader `loaders/termine.js` filtert auf Autoren aus dem Redaktionskreis (plus FOERBICO und Community-Key), teilt in kommend/vergangen und sortiert wie CLAUDE.md es vorgibt. Routen-Schicht `routen/termine.js`, Route `/termine`, Komponenten `Termin.svelte` und `Termine.svelte`; die Startseite bekommt den Block unter dem Text; der Menüpunkt „Termine" erscheint nur, wenn es Termine gibt.

**Tech Stack:** SvelteKit 2, Svelte 5 Runes, JSDoc `checkJs`+`strict`, Vitest mit `svelte/server`, `applesauce-common/helpers` (NIP-52), `nostr-tools/nip19` (naddr für den Link in die edufeed-app).

**Spec:** `docs/entscheidungen/0034-kalender-aus-der-community.md` (Task 1; hält die Besprechung vom 15.09. mit Gina und Ludger fest). Ergänzt ADR-0012 (Quelle je Inhaltsart) und nimmt für Termine die Ausnahme aus ADR-0026 zurück.

## Global Constraints

- Deutsch für Bezeichner, Kommentare, Commits; Nostr-Namen (`kind`, `d`, `h`, `start`, `end`, `location`) englisch. Chrome-Texte nur über `src/lib/sprache.js` (de und en).
- Datenschicht importiert nichts aus routes/components/$app; nur `services/spiegel.js` importiert `services/relay.js`; `.svelte` importiert zur Laufzeit nichts aus `lib/routen|loaders|services`; nur `routen/*.js` wirft `error()/redirect()`; kein `nostr-tools` für Relay-Kommunikation (`nip19` zum Kodieren ist erlaubt).
- NIP-52-Felder über `applesauce-common/helpers` lesen (`getCalendarEventTitle`, `getCalendarEventStart`, `getCalendarEventEnd`, `getCalendarEventLocations`, `getCalendarEventSummary`), nicht von Hand aus den Tags (ADR-0009). Erst prüfen, welche davon in der installierten Version exportiert sind (`grep -o "export function getCalendarEvent[A-Za-z]*" node_modules/applesauce-common/dist/helpers/calendar*.js`); fehlt eine, den Tag selbst lesen und das im Report nennen.
- Zwei Kriterien für Community-Inhalte (ADR-0012): `#h` der Community **und** Autor aus dem Redaktionskreis (`kind:30000`, `d = redaktion`, `p`-Tags) oder FOERBICO-Key oder Community-Key. Der Spiegel speichert alle Events mit `#h` roh; der Loader filtert.
- Konfiguration: `COMMUNITY_PUBKEY` (64 Hex, Standard `ae6199bb435d70a0ecce61324ac80e7c24dedf2b0680cbd3e94983e7557746a2`, leer schaltet den Kalender ab), `EDUFEED_URL` (Standard `https://dev.edufeed.org`, ohne Schrägstrich am Ende). Bestehendes `QUELLE_H_TAG`/`hTag` bleibt unberührt.
- Sortierung (CLAUDE.md): kommend `start` aufsteigend, vergangen `start` absteigend. „Kommend" heißt: `end` (oder `start`, wenn kein `end`) liegt nicht vor heute 00:00 Uhr Europe/Berlin.
- Nie eine leere Liste ohne Erklärung; was es nicht gibt, wird nicht angedeutet: Menüpunkt und Startseitenblock nur bei vorhandenen Terminen, `/termine` erklärt sonst, was erwartet wird.
- Bilder von Terminen laufen durch `lizenzPruefen` und tragen die Lizenzpille (ADR-0032); Fremdhosts erscheinen mit „Lizenz ungeklärt" (`kein-x-tag`), abgelöste Hosts nicht.
- Komponenten nur mit `--fb-*`-Token, kein Hex im `<style>`.
- Vor jedem Commit `pnpm check && pnpm test` grün; Trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`; keine Subagents aus Implementer-Sicht; kein bare `git stash`.

## Dateistruktur

| Datei | Verantwortung |
|---|---|
| `docs/entscheidungen/0034-kalender-aus-der-community.md` (neu) | Entscheidung |
| `src/lib/konfig.js`, `.env.example` | `community`, `edufeedUrl` |
| `src/lib/services/spiegel.js` | holt `termine` (`#h`) und `kind:30000` des Autors in `listen` |
| `src/lib/models/termin.js` (neu) | `terminAusEvent` → `Termin`; `naddrFuerTermin` |
| `src/lib/models/feste-segmente.js` | `termine` |
| `src/lib/loaders/termine.js` (neu) | `termineListe(inhalt, konfig, { jetzt })` → `{ kommend, vergangen, autoren }` |
| `src/lib/routen/termine.js` (neu) | `termineLaden`, `naechsteTermine` |
| `src/lib/routen/struktur.js`, `src/lib/routen/sitemap.js` | Menüpunkt und Sitemap nur mit Terminen |
| `src/lib/routen/uebersicht.js` | `startLaden` liefert `naechste` |
| `src/lib/sprache.js` | Texte `termine`, `naechsteTermine`, `alleTermine`, `imKalender`, `keineTermine`, `ganztaegig`, `vergangen` |
| `src/lib/komponenten/Termin.svelte`, `Termine.svelte` (neu) | ein Termin als Artikel, die Liste kommend/vergangen |
| `src/routes/termine/+page.server.js`, `+page.svelte` (neu); `src/routes/+page.svelte`, `src/routes/en/+page.svelte` | Terminseite; Block auf beiden Startseiten |
| `test/fixtures/termine-31922-community.json`, `test/fixtures/liste-30000-redaktion.json` (liegen schon da) | echte Events: Phillips Tagung, Redaktionskreis |
| Tests | `src/lib/models/termin.test.js`, `src/lib/loaders/termine.test.js`, `src/lib/services/spiegel.test.js` (ergänzen), `test/termine.test.js` (Routen + Komponenten), `test/oberflaeche.test.js`, `src/lib/routen/sitemap.test.js` |
| `CLAUDE.md`, `docs/STATUS.md`, `docs/betrieb.md` | Regeln, Logbuch, Konfiguration |

---

### Task 1: ADR-0034, Konfiguration, Spiegel, Modell

**Files:**
- Create: `docs/entscheidungen/0034-kalender-aus-der-community.md`
- Modify: `src/lib/konfig.js`, `.env.example`, `src/lib/services/spiegel.js`, `src/lib/models/feste-segmente.js`
- Create: `src/lib/models/termin.js`
- Test: `src/lib/konfig.test.js` (falls vorhanden, sonst in `src/lib/services/spiegel.test.js` mitprüfen), `src/lib/services/spiegel.test.js`, `src/lib/models/termin.test.js`

**Interfaces:**
- Produces: `Konfig.community: string|null`, `Konfig.edufeedUrl: string`; `Inhalt.termine: Event[]`, `Stand.anzahl.termine: number`; `Inhalt.listen` enthält zusätzlich die `kind:30000`-Listen des Autors; `terminAusEvent(event): Termin` mit `{ id, autor, d, kind, titel, zusammenfassung, inhalt, start: Date, ende: Date|null, ganztaegig: boolean, orte: string[], bildUrl: string|null, bildHash: string|null, community: string|null }`; `naddrFuerTermin(termin, relays): string`; `FESTE_SEGMENTE` enthält `termine`.

- [ ] **Step 1: ADR anlegen**

```markdown
# ADR-0034: Termine kommen aus der Community — Quelle je Inhaltsart

**Status:** angenommen (2026-09-15, Besprechung Jörg, Gina, Ludger)
**Beteiligte:** Jörg, Gina, Ludger

Ergänzt ADR-0012 (FOERBICO als Quelle) und nimmt für Termine die
Einschränkung aus ADR-0026 zurück („Termine entfallen").

## Kontext

ADR-0026 hat Termine aus dem Zuschnitt genommen, weil FOERBICO selbst keine
publiziert. Inzwischen liegt die Abschlusstagung „Offen. Vernetzt.
Zukunft." (2. bis 3. Februar 2027, Frankfurt) als NIP-52-Event auf dem
Relay — angelegt von Phillip in der edufeed-app, `kind:31922`, mit dem
`h`-Tag der Communikey-Community **rpi-virtuell**
(`ae6199bb435d70a0ecce61324ac80e7c24dedf2b0680cbd3e94983e7557746a2`).
FOERBICO ist in dieser Community Publisher neben den anderen Mitgliedern;
derselbe `h`-Tag steht an einem FOERBICO-Artikel.

Die Besprechung am 15.09.2026 hat festgelegt: Für Artikel und Seiten
bleibt der FOERBICO-Key die Quelle. Für Termine, später auch Material,
Lesezeichen und Sammlungen, ist die Community rpi-virtuell die Quelle.
Zuerst wird das oer.community-Schaufenster fertig gebaut (Repository und
Adresse werden zu `oer-community` umbenannt); der eigentliche Community-Hub
folgt danach auf diesen Erfahrungen.

## Entscheidung

1. **Quelle je Inhaltsart.** Artikel, Seiten, Listen, Profil: der
   FOERBICO-Key (`QUELLE_AUTOR`, ADR-0012). Termine: die Community
   (`COMMUNITY_PUBKEY`, Standard rpi-virtuell; leer schaltet den Kalender
   ab). Der Spiegel holt `kind:31922` und `31923` mit `#h` der Community.
2. **Zwei Kriterien, wie ADR-0012 es für Bot-Quellen verlangt.** Ein
   Termin erscheint, wenn er den `h`-Tag trägt **und** sein Autor im
   Redaktionskreis steht (`kind:30000`, `d = redaktion`, unter dem
   FOERBICO-Key) — oder FOERBICO bzw. der Community-Key selbst ist. Der
   `h`-Tag allein ließe jeden herein, der ihn setzt. Wenn der Hub die
   Publisher-Rolle der Community lesen kann, ersetzt sie den Redaktionskreis.
3. **Zwei Ansichten, keine Eingabe.** `/termine` zeigt kommende Termine
   (`start` aufsteigend) und vergangene (`start` absteigend); die Startseite
   zeigt bis zu drei kommende unter ihrem Text. Anmelden, Zusagen und
   Bearbeiten geschieht in der edufeed-app; der Hub verlinkt dorthin
   (`EDUFEED_URL/calendar/event/<naddr>`).
4. **Der Menüpunkt „Termine" und der Startseitenblock erscheinen nur,
   wenn es Termine gibt.** `/termine` ohne Termine erklärt, welche Events
   erwartet werden (ADR-0027, Muster Struktur-Befund).
5. **Bilder von Terminen** folgen ADR-0022 und ADR-0032: ausgeliefert mit
   Lizenzpille; abgelöste Hosts nicht (ADR-0030). Das Bild der Tagung liegt
   auf einem Fremdhost und erscheint deshalb mit „Lizenz ungeklärt".

## Konsequenzen

- CLAUDE.md: Termine sind wieder im Zuschnitt, aber mit anderer Quelle als
  Artikel. Kinds `31922`/`31923` kommen zurück in die Kind-Liste, mit
  Sortierregel.
- Die Redaktionsliste ist damit doppelt bedeutsam: Freigabe von Beiträgen
  (ADR-0021) und Sichtbarkeit von Terminen. Wer Termine einreichen soll,
  muss in der Liste stehen — `mdparser sync redaktion` publiziert sie.
- **Woran wir merken, dass es falsch war:** Wenn Community-Mitglieder außerhalb
  des Redaktionskreises Termine einreichen und sich wundern, dass sie fehlen
  — dann ist die Publisher-Rolle der Community die richtige Quelle, nicht eine
  längere Liste.
```

- [ ] **Step 2: Failing Tests**

`src/lib/models/termin.test.js`:

```js
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { naddrFuerTermin, terminAusEvent } from './termin.js';

/** @type {any} */
const TAGUNG = JSON.parse(readFileSync(new URL('../../../test/fixtures/termine-31922-community.json', import.meta.url), 'utf8'))[0];

describe('terminAusEvent (ADR-0034, NIP-52)', () => {
  it('liest die Abschlusstagung: ganztägig, 2.–3. Februar 2027, Frankfurt, Community', () => {
    const t = terminAusEvent(TAGUNG);
    expect(t.kind).toBe(31922);
    expect(t.ganztaegig).toBe(true);
    expect(t.titel).toContain('FOERBICO Tagung Frankfurt');
    expect(t.start.toISOString().slice(0, 10)).toBe('2027-02-02');
    expect(t.ende?.toISOString().slice(0, 10)).toBe('2027-02-03');
    expect(t.orte).toEqual(['Frankfurt, Hesse, Germany']);
    expect(t.community).toBe('ae6199bb435d70a0ecce61324ac80e7c24dedf2b0680cbd3e94983e7557746a2');
    expect(t.bildUrl).toMatch(/^https:\/\/assets\.uni-frankfurt\.de\//);
    expect(t.bildHash).toBeNull();
    expect(t.autor).toBe(TAGUNG.pubkey);
    expect(t.d).toBe('event-1784115786770-514zxlkhy');
  });
  it('zeitgebunden: start/end als Unix-Sekunden, nicht ganztägig', () => {
    const ev = /** @type {any} */ ({ ...TAGUNG, kind: 31923, tags: [['d', 'x'], ['title', 'T'], ['start', '1790000000'], ['end', '1790003600']] });
    const t = terminAusEvent(ev);
    expect(t.ganztaegig).toBe(false);
    expect(t.start.getTime()).toBe(1790000000 * 1000);
    expect(t.ende?.getTime()).toBe(1790003600 * 1000);
    expect(t.orte).toEqual([]);
    expect(t.community).toBeNull();
  });
  it('naddr für den Link in die edufeed-app', () => {
    const n = naddrFuerTermin(terminAusEvent(TAGUNG), ['wss://relay.edufeed.org/']);
    expect(n).toMatch(/^naddr1/);
  });
});
```

Dazu in `src/lib/services/spiegel.test.js` (Muster der bestehenden Tests dort mit `holen`-Attrappe) ein Fall: Mit `konfig.community` gesetzt fragt der Spiegel `{ kinds: [31922, 31923], '#h': [community] }` und `{ kinds: [30000], authors: [autor] }`; `inhalt.termine` enthält das Event, `inhalt.listen` das `kind:30000`-Event, `stand.anzahl.termine === 1`. Mit `community: null` wird kein Termin-Filter gestellt und `termine` ist `[]`.

- [ ] **Step 3: Rot laufen lassen.**

- [ ] **Step 4: Konfiguration** — `src/lib/konfig.js`: Typedef `community: string|null` („Community, deren Termine der Hub zeigt (ADR-0034); null = kein Kalender") und `edufeedUrl: string`. In `konfigLesen`:

```js
  // ADR-0034: Standard ist die Community rpi-virtuell. Ein leerer Wert
  // schaltet den Kalender bewusst ab — leer ist nicht "nicht gesetzt".
  const rohCommunity = quelle.COMMUNITY_PUBKEY === undefined
    ? 'ae6199bb435d70a0ecce61324ac80e7c24dedf2b0680cbd3e94983e7557746a2'
    : quelle.COMMUNITY_PUBKEY.trim().toLowerCase();
  if (rohCommunity !== '' && !HEX64.test(rohCommunity)) {
    throw new Error('COMMUNITY_PUBKEY muss leer oder ein 64-stelliger Hex-Schlüssel sein.');
  }
  const community = rohCommunity === '' ? null : rohCommunity;
  const edufeedUrl = ((quelle.EDUFEED_URL ?? '').trim() || 'https://dev.edufeed.org').replace(/\/+$/, '');
  if (!edufeedUrl.startsWith('https://')) throw new Error('EDUFEED_URL muss mit https:// beginnen.');
```

und beide in die Rückgabe. `.env.example` nach dem Block „Struktur aus Nostr":

```
# ── Kalender aus der Community (ADR-0034) ──────────────────────────────
# Termine (kind 31922/31923) mit diesem h-Tag, eingereicht von Mitgliedern
# des Redaktionskreises. Leer lassen schaltet den Kalender ab.
COMMUNITY_PUBKEY=ae6199bb435d70a0ecce61324ac80e7c24dedf2b0680cbd3e94983e7557746a2
# Wohin „Im Kalender öffnen" führt (Anmelden, Zusagen geschieht dort).
EDUFEED_URL=https://dev.edufeed.org
```

Die Test-Konfigurationen (`test/fixtures/testquelle/laden.js`, `test/uebersicht-routen.test.js` `umgebung`, Mocks mit `/** @type {any} */`) bekommen `community: null` bzw. `edufeedUrl: 'https://dev.edufeed.org'`, wo `svelte-check` es verlangt.

- [ ] **Step 5: Spiegel** — `src/lib/services/spiegel.js`: Typedefs `Inhalt.termine: Event[]`, `Stand.anzahl.termine: number`; `leererInhalt()` mit `termine: []`; in `auffrischen`:

```js
    const [a, l, r, p, t] = await Promise.all([
      nachAutor(30023), nachAutor(30004), nachAutor(30000), nachAutor(0),
      konfig.community
        ? eventsVonAllen(relays, { kinds: [31922, 31923], '#h': [konfig.community] }, { holen })
        : Promise.resolve({ events: [], quellen: {}, fehler: [], gefragt: relays, grund: null })
    ]);
```

`quellen` und `nichtErreichbar` um `r` und `t` erweitern; `listen = neuestesJeD([...l.events, ...r.events])` — Achtung: `neuestesJeD` gruppiert nach `d`; `kind:30004 d=navigation` und `kind:30000 d=redaktion` kollidieren nicht, aber zur Sicherheit nach `kind:d` gruppieren, falls die Funktion nur `d` nimmt (dann eine Variante `neuestesJeKindUndD` einführen und für `listen` nutzen). `termine = neuestesJeD(t.events)` ebenfalls je `kind:d`. `anzahl.termine: termine.length`. Der Datei-Rückweg `istInhalt` bleibt tolerant: fehlt `termine` in einer alten Datei, ergänzt `{ ...leererInhalt(), ...geparst }` es.

- [ ] **Step 6: Modell** — `src/lib/models/termin.js`:

```js
/**
 * Ein Termin nach NIP-52 (ADR-0034): kind 31922 ganztägig (start/end als
 * YYYY-MM-DD), kind 31923 zeitgebunden (Unix-Sekunden). Die Felder liest
 * applesauce-common (ADR-0009); die Community steht im h-Tag.
 */
import {
  getCalendarEventEnd, getCalendarEventLocations, getCalendarEventStart,
  getCalendarEventSummary, getCalendarEventTitle
} from 'applesauce-common/helpers';
import { naddrEncode } from 'nostr-tools/nip19';

/** @typedef {import('./artikel.js').Event} Event */
/**
 * @typedef {object} Termin
 * @property {string} id
 * @property {string} autor
 * @property {string} d
 * @property {31922|31923} kind
 * @property {string} titel
 * @property {string} zusammenfassung
 * @property {string} inhalt          content (Markdown/Text)
 * @property {Date} start
 * @property {Date|null} ende
 * @property {boolean} ganztaegig
 * @property {string[]} orte
 * @property {string|null} bildUrl
 * @property {string|null} bildHash
 * @property {string|null} community  h-Tag
 */

/** @param {string[][]} tags @param {string} name */
const tagWert = (tags, name) => tags.find((t) => t[0] === name && t.length > 1)?.[1] ?? null;

/** @param {Event} event @returns {Termin} */
export function terminAusEvent(event) {
  const tags = event.tags ?? [];
  const ev = /** @type {any} */ (event);
  const start = getCalendarEventStart(ev);
  const ende = getCalendarEventEnd(ev);
  return {
    id: event.id, autor: event.pubkey, d: tagWert(tags, 'd') ?? '',
    kind: event.kind === 31922 ? 31922 : 31923,
    titel: getCalendarEventTitle(ev) ?? tagWert(tags, 'd') ?? '',
    zusammenfassung: getCalendarEventSummary(ev) ?? '',
    inhalt: event.content ?? '',
    start: new Date((start ?? event.created_at) * 1000),
    ende: ende === undefined ? null : new Date(ende * 1000),
    ganztaegig: event.kind === 31922,
    orte: getCalendarEventLocations(ev),
    bildUrl: tagWert(tags, 'image'),
    bildHash: tagWert(tags, 'x'),
    community: tagWert(tags, 'h')
  };
}

/** Adresse des Termins für den Link in die edufeed-app. @param {Termin} termin @param {string[]} relays */
export function naddrFuerTermin(termin, relays) {
  return naddrEncode({ kind: termin.kind, pubkey: termin.autor, identifier: termin.d, relays: relays.slice(0, 2) });
}
```

Falls `getCalendarEventStart` für `kind:31922` kein Unix-Datum liefert (Datum als `YYYY-MM-DD` im Tag), das Datum als UTC-Mitternacht selbst parsen (`Date.UTC`) und das im Report nennen; die Tests erwarten für die Tagung `2027-02-02` bzw. `2027-02-03` in UTC.

`src/lib/models/feste-segmente.js`: `'termine'` aufnehmen (die Liste ist alphabetisch nicht nötig; nach `themen`).

- [ ] **Step 7: Tests, Check** — `pnpm vitest run src/lib/models/termin.test.js src/lib/services/spiegel.test.js src/lib/konfig.test.js && pnpm check && pnpm test`. Tests, die `anzahl` oder `leererInhalt()` strukturell vergleichen, um `termine` ergänzen.

- [ ] **Step 8: Commit**

```bash
git add docs/entscheidungen/0034-kalender-aus-der-community.md src/lib/konfig.js .env.example src/lib/services/spiegel.js src/lib/models/termin.js src/lib/models/feste-segmente.js src/lib test
git commit -m "ADR-0034: Termine aus der Community — Konfiguration, Spiegel holt Termine und Redaktionsliste, Modell Termin

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Loader, Routen-Schicht, Terminseite

**Files:**
- Create: `src/lib/loaders/termine.js`, `src/lib/routen/termine.js`, `src/lib/komponenten/Termin.svelte`, `src/lib/komponenten/Termine.svelte`, `src/routes/termine/+page.server.js`, `src/routes/termine/+page.svelte`
- Modify: `src/lib/sprache.js` (+ Test), `src/lib/routen/feste-segmente.js` (nur falls es eine eigene Liste hält)
- Test: `src/lib/loaders/termine.test.js`, `test/termine.test.js`

**Interfaces:**
- Consumes: Task 1.
- Produces: `termineListe(inhalt, konfig, { jetzt = () => new Date() })` → `{ kommend: Terminkarte[], vergangen: Terminkarte[], zugelassen: number, uebersprungen: string[] }` mit `Terminkarte = { termin: Termin, bild: { url, alt, lizenz }|null, naddr: string, kalenderUrl: string }`; `termineLaden({ konfig, inhalt, jetzt })` (503 bei Leerstand, sonst Liste mit `hinweis` bei leer); `naechsteTermine({ konfig, inhalt, jetzt, anzahl = 3 })` → `Terminkarte[]`; Texte: `termine` (Termine/Events), `naechsteTermine` (Nächste Termine/Upcoming events), `alleTermine` (Alle Termine/All events), `imKalender` (Im edufeed-Kalender öffnen/Open in the edufeed calendar), `vergangen` (Vergangene Termine/Past events), `ganztaegig` (ganztägig/all day), `keineTermine` → Funktion `(community) => string`.

- [ ] **Step 1: Failing Tests**

`src/lib/loaders/termine.test.js`:

```js
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { termineListe } from './termine.js';
import { leererInhalt } from '../services/spiegel.js';

const fixture = (/** @type {string} */ f) => JSON.parse(readFileSync(new URL(`../../../test/fixtures/${f}`, import.meta.url), 'utf8'));
const TAGUNG = fixture('termine-31922-community.json')[0];
const REDAKTION = fixture('liste-30000-redaktion.json')[0];
const COMMUNITY = 'ae6199bb435d70a0ecce61324ac80e7c24dedf2b0680cbd3e94983e7557746a2';
const KONFIG = /** @type {any} */ ({ autor: '5a12b41ec15b466321e88c371be2dc47d9193f9c8bba4ab09fc50045bd35aedf', relays: ['wss://relay.edufeed.org/'], community: COMMUNITY, edufeedUrl: 'https://dev.edufeed.org', abgeloesteHosts: ['oer.community'] });
const inhalt = (/** @type {Partial<import('../services/spiegel.js').Inhalt>} */ ab = {}) => ({ ...leererInhalt(), stand: /** @type {any} */ ({}), termine: [TAGUNG], listen: [REDAKTION], ...ab });
const VOR = () => new Date('2026-09-15T10:00:00Z');
const NACH = () => new Date('2027-03-01T10:00:00Z');

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
```

`test/termine.test.js` (Routen mit dem `lade`-Muster aus `test/uebersicht-routen.test.js` — Helfer dort kopieren, nicht importieren; Komponenten mit `svelte/server`):

```js
// Routen
describe('/termine (ADR-0034)', () => {
  it('liefert kommende und vergangene Termine', async () => { /* lade('../src/routes/termine/+page.server.js', {}, inhaltMitTerminen()) → data.kommend.length 1, data.ueberschrift 'Termine' */ });
  it('ohne Termine: Hinweis, kein Fehler', async () => { /* data.kommend [], data.hinweis enthält 'kind:31922' und die Community-Kennung gekürzt */ });
  it('Leerstand des Spiegels → 503', async () => { /* inhalt ohne stand → rejects status 503 */ });
});
// Komponenten
describe('Termine.svelte / Termin.svelte', () => {
  it('rendert Titel, Zeitraum, Ort, Bild mit Pille und den Kalender-Link', () => { /* body enthält 'FOERBICO Tagung Frankfurt', '2.' und 'Februar 2027', 'Frankfurt, Hesse, Germany', 'class="pille ungeklaert', href des kalenderUrl mit rel="noopener" */ });
  it('vergangene Termine unter eigener Überschrift, englische Texte bei sprache en', () => { /* 'Vergangene Termine' bzw. 'Past events' */ });
});
```

Die Kommentare sind die Assertions in Kurzform — im Test ausformulieren.

- [ ] **Step 2: Rot laufen lassen.**

- [ ] **Step 3: Texte** — `src/lib/sprache.js` Typedef und beide Tabellen ergänzen:

```js
    termine: 'Termine', naechsteTermine: 'Nächste Termine', alleTermine: 'Alle Termine',
    vergangen: 'Vergangene Termine', ganztaegig: 'ganztägig', imKalender: 'Im edufeed-Kalender öffnen',
    keineTermine: (community) => `Es sind noch keine Termine publiziert: erwartet werden kind:31922 oder kind:31923 mit dem h-Tag der Community ${community} von Mitgliedern des Redaktionskreises.`,
```

```js
    termine: 'Events', naechsteTermine: 'Upcoming events', alleTermine: 'All events',
    vergangen: 'Past events', ganztaegig: 'all day', imKalender: 'Open in the edufeed calendar',
    keineTermine: (community) => `No events published yet: expected are kind:31922 or kind:31923 with the h tag of community ${community}, submitted by members of the editorial board.`,
```

Test in `src/lib/sprache.test.js`: `t('en','termine') === 'Events'`, `t('de','keineTermine','ae61…')` enthält `ae61…`.

- [ ] **Step 4: Loader** — `src/lib/loaders/termine.js`:

```js
/**
 * Termine der Community (ADR-0034): h-Tag und Autor aus dem Redaktionskreis
 * — zwei Kriterien, nie eines allein (ADR-0012). Kommend/vergangen nach dem
 * Kalendertag Europe/Berlin; Bilder mit Lizenzstand wie überall.
 */
import { lizenzPruefen, NICHT_ZEIGBAR } from '../models/lizenz.js';
import { listeFinden } from '../models/liste.js';
import { naddrFuerTermin, terminAusEvent } from '../models/termin.js';
import { etagAusSpiegel, nachweiseAusSpiegel } from './lizenz.js';

/** @typedef {import('../services/spiegel.js').Inhalt} Inhalt */
/** @typedef {import('../konfig.js').Konfig} Konfig */
/** @typedef {import('../models/termin.js').Termin} Termin */
/** @typedef {{ termin: Termin, bild: { url: string, alt: string, lizenz: import('../models/lizenz.js').Ergebnis }|null, naddr: string, kalenderUrl: string }} Terminkarte */

export const REDAKTION_D = 'redaktion';

/** Beginn des heutigen Tages in Europe/Berlin, als UTC-Zeitpunkt. @param {Date} jetzt */
export function tagesbeginnBerlin(jetzt) {
  const teile = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(jetzt);
  // en-CA liefert YYYY-MM-DD; Mitternacht Berlin liegt je nach Sommerzeit 1 oder 2 Stunden vor UTC-Mitternacht.
  const utcMitternacht = new Date(`${teile}T00:00:00Z`);
  const versatzMin = new Date(utcMitternacht.toLocaleString('en-US', { timeZone: 'Europe/Berlin' })).getTime() - utcMitternacht.getTime();
  return new Date(utcMitternacht.getTime() - versatzMin);
}

/** Zugelassene Autoren: Redaktionskreis (p-Tags) plus FOERBICO und Community. @param {Inhalt} inhalt @param {Konfig} konfig */
export function zugelasseneAutoren(inhalt, konfig) {
  const liste = listeFinden(inhalt.listen, REDAKTION_D);
  const personen = liste?.personen ?? [];
  return new Set([konfig.autor, ...(konfig.community ? [konfig.community] : []), ...personen]);
}
```

`listeAusEvent` in `src/lib/models/liste.js` liest bisher nur `a`-Tags; um `personen: string[]` (die `p`-Tags, 64 Hex, klein) ergänzen — `Liste` bekommt das Feld, bestehende Tests bleiben (leeres Array bei Menü-Listen).

```js
/** Ein ganztägiger Termin endet am Ende seines letzten Tages; `end` nach NIP-52 ist exklusiv, deshalb nicht +1. @param {Termin} t */
function letzterZeitpunkt(t) {
  const basis = t.ende ?? t.start;
  return t.ganztaegig ? new Date(basis.getTime() + 24 * 3600 * 1000) : basis;
}

/**
 * @param {Inhalt} inhalt @param {Konfig} konfig @param {{ jetzt?: () => Date }} [optionen]
 * @returns {{ kommend: Terminkarte[], vergangen: Terminkarte[], zugelassen: number, uebersprungen: string[] }}
 */
export function termineListe(inhalt, konfig, { jetzt = () => new Date() } = {}) {
  /** @type {string[]} */
  const uebersprungen = [];
  if (!konfig.community) return { kommend: [], vergangen: [], zugelassen: 0, uebersprungen };
  const autoren = zugelasseneAutoren(inhalt, konfig);
  const grenze = tagesbeginnBerlin(jetzt());
  /** @type {Terminkarte[]} */
  const karten = [];
  for (const event of inhalt.termine) {
    const termin = terminAusEvent(event);
    if (termin.community !== konfig.community) { uebersprungen.push(`${termin.d}: h-Tag gehört nicht zur Community`); continue; }
    if (!autoren.has(termin.autor)) { uebersprungen.push(`${termin.d}: Autor ${termin.autor.slice(0, 12)}… nicht im Redaktionskreis`); continue; }
    karten.push({ termin, bild: bild(inhalt, konfig, termin), naddr: naddrFuerTermin(termin, konfig.relays), kalenderUrl: `${konfig.edufeedUrl}/calendar/event/${naddrFuerTermin(termin, konfig.relays)}` });
  }
  const kommend = karten.filter((k) => letzterZeitpunkt(k.termin) > grenze).sort((a, b) => a.termin.start.getTime() - b.termin.start.getTime());
  const vergangen = karten.filter((k) => letzterZeitpunkt(k.termin) <= grenze).sort((a, b) => b.termin.start.getTime() - a.termin.start.getTime());
  return { kommend, vergangen, zugelassen: autoren.size, uebersprungen };
}
```

`bild(inhalt, konfig, termin)` wie `cover()` in `loaders/uebersicht.js` (Kopie der Logik mit `termin.bildUrl/bildHash/titel`; `NICHT_ZEIGBAR` → null). Ganztägige Termine: NIP-52 sagt `end` ist exklusiv (der Tag nach dem letzten Tag); Phillips Event trägt `end 2027-02-03` — edufeed schreibt offenbar den letzten Tag inklusiv. Ruling: beide Lesarten überleben mit `+24h` auf `ende`; die Anzeige zeigt `start` bis `ende` als Datum ohne Korrektur.

- [ ] **Step 5: Routen-Schicht** — `src/lib/routen/termine.js`:

```js
import { error } from '@sveltejs/kit';
import { termineListe } from '../loaders/termine.js';
import { leerstandMeldung } from '../models/leerstand.js';
import { t } from '../sprache.js';

/** @param {{ konfig: import('../konfig.js').Konfig, inhalt: import('../services/spiegel.js').Inhalt, jetzt?: () => Date, sprache?: 'de'|'en' }} e */
export function termineLaden({ konfig, inhalt, jetzt, sprache = 'de' }) {
  const leer = leerstandMeldung(inhalt, konfig);
  if (leer) error(503, leer);
  const liste = termineListe(inhalt, konfig, { jetzt });
  const hinweis = liste.kommend.length + liste.vergangen.length === 0
    ? t(sprache, 'keineTermine', konfig.community ? `${konfig.community.slice(0, 12)}…` : '(nicht konfiguriert)')
    : null;
  return { ...liste, ueberschrift: t(sprache, 'termine'), hinweis, basis: '/termine' };
}

/** Die nächsten Termine für die Startseite. @param {{ konfig: import('../konfig.js').Konfig, inhalt: import('../services/spiegel.js').Inhalt, jetzt?: () => Date, anzahl?: number }} e */
export function naechsteTermine({ konfig, inhalt, jetzt, anzahl = 3 }) {
  return termineListe(inhalt, konfig, { jetzt }).kommend.slice(0, anzahl);
}
```

- [ ] **Step 6: Komponenten** — `Termin.svelte` (Props `karte: Terminkarte`, `sprache = 'de'`): `<article class="termin" id={karte.termin.d}>` mit `<h2>`, `<p class="metazeile">` (Zeitraum: ganztägig `2.–3. Februar 2027` bzw. mit Uhrzeit `toLocaleString(t(sprache,'datumsformat'), { timeZone: 'Europe/Berlin', … })`; Ort(e) mit `·`), optional `<Bildbereich lizenz={karte.bild.lizenz} titel={karte.termin.titel} bildUrl={karte.bild.url} {sprache} />` (Bildbereich rendert die Pille), Zusammenfassung oder Inhalt als Text (kein `{@html}`; Absätze per `split('\n\n')`), Link `<a class="marker" href={karte.kalenderUrl} rel="noopener" target="_blank">{t(sprache,'imKalender')}</a>`. `Termine.svelte` (Props `kommend`, `vergangen`, `ueberschrift`, `hinweis`, `sprache`): Kopf wie `Uebersicht.svelte`, Hinweis-Absatz bei leer, Liste kommend, dann `<h2>{t(sprache,'vergangen')}</h2>` nur wenn vorhanden. Styles nur mit Token; `.termin { border-bottom: 1px solid var(--fb-rahmen); padding-bottom: 24px; margin-bottom: 24px; }`.

- [ ] **Step 7: Route** — `src/routes/termine/+page.server.js` wie `/blog`, ruft `termineLaden({ konfig, inhalt: spiegelHolen().lesen() })` (Sprache `de`: die Terminseite hat keine englische Adresse — Ruling: eine Liste, englische Startseite verlinkt dieselbe Seite). `+page.svelte`: `<title>{data.ueberschrift} · {data.struktur.wortmarke}</title>`, canonical `/termine`, `<Termine kommend={data.kommend} vergangen={data.vergangen} ueberschrift={data.ueberschrift} hinweis={data.hinweis} />`.

- [ ] **Step 8: Tests, Check, volle Suite** — `pnpm vitest run src/lib/loaders/termine.test.js test/termine.test.js src/lib/sprache.test.js src/lib/models/liste.test.js && pnpm check && pnpm test`.

- [ ] **Step 9: Commit**

```bash
git add src/lib/loaders/termine.js src/lib/routen/termine.js src/lib/komponenten/Termin.svelte src/lib/komponenten/Termine.svelte src/routes/termine src/lib/sprache.js src/lib/models/liste.js src/lib test
git commit -m "Terminseite /termine: Termine der Community aus dem Redaktionskreis, kommend und vergangen (ADR-0034)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Startseite, Menü, Sitemap, Doku

**Files:**
- Modify: `src/lib/routen/uebersicht.js` (`startLaden`), `src/routes/+page.svelte`, `src/routes/en/+page.svelte`, `src/lib/routen/struktur.js` (`hubAnsichten`/`strukturFuerLayout`), `src/lib/routen/sitemap.js`, `CLAUDE.md`, `docs/STATUS.md`, `docs/betrieb.md`
- Create: `src/lib/komponenten/NaechsteTermine.svelte`
- Test: `test/uebersicht-routen.test.js`, `test/uebersicht.test.js` (Struktur), `src/lib/routen/sitemap.test.js`, `test/oberflaeche.test.js`

**Interfaces:**
- Consumes: Task 2 (`naechsteTermine`, `Terminkarte`, Texte).
- Produces: `startLaden` liefert zusätzlich `naechste: Terminkarte[]` (in beiden Zweigen `art: 'seite'` und `art: 'blog'`); `strukturFuerLayout` bekommt `termineVorhanden` aus `termineListe(inhalt, konfig)` und hängt `{ titel: t(sprache,'termine'), pfad: '/termine', d: '' }` vor „Blog" an, nur wenn kommende oder vergangene Termine existieren; Sitemap nennt `/termine` unter derselben Bedingung.

- [ ] **Step 1: Failing Tests** — Struktur: mit `termine: [TAGUNG]` und Redaktionsliste im Inhalt enthält `menue` `/termine` mit Titel „Termine" (en: „Events"); ohne Termine nicht. `startLaden` mit Terminen: `data.naechste[0].termin.titel` enthält „Tagung"; ohne: `[]`. Sitemap: `/termine` genau einmal mit Terminen, gar nicht ohne. Oberfläche: `NaechsteTermine` rendert `h2` „Nächste Termine", je Termin Titel, Datum und Link `/termine#<d>`, plus „Alle Termine" → `/termine`; mit `karten: []` rendert es nichts.

- [ ] **Step 2: Rot.**

- [ ] **Step 3: Startseite** — `startLaden`: `const naechste = naechsteTermine({ konfig, inhalt });` in beide Rückgaben. `src/routes/+page.svelte` und `src/routes/en/+page.svelte`: nach `<Detail …/>` `<NaechsteTermine karten={data.naechste} sprache={data.struktur.sprache} />` (im `art === 'blog'`-Zweig ebenfalls nach der Übersicht). `NaechsteTermine.svelte` (Props `karten`, `sprache = 'de'`): `{#if karten.length > 0}<section class="naechste"><h2>{t(sprache,'naechsteTermine')}</h2><ul>…<li><a href={`/termine#${k.termin.d}`}>{k.termin.titel}</a> <span class="metazeile">{datum}</span></li>…</ul><p><a href="/termine">{t(sprache,'alleTermine')}</a></p></section>{/if}` — Datum wie in `Termin.svelte` (Helfer `zeitraumText(termin, sprache)` in `src/lib/termin-anzeige.js`, rein, von beiden Komponenten genutzt; Test dafür in `src/lib/termin-anzeige.test.js`: ganztägig `2.–3. Februar 2027` / `2–3 February 2027`, eintägig `2. Februar 2027`, zeitgebunden mit Uhrzeit `10:00–11:00 Uhr` / `10:00–11:00`).

- [ ] **Step 4: Menü und Sitemap** — `struktur.js`: `hubAnsichten(sprache, { termine = false } = {})` stellt `Termine` voran, wenn `termine`; `strukturFuerLayout` berechnet `const termineVorhanden = termineListe(inhalt, konfig).kommend.length + …vergangen.length > 0` (Import aus `../loaders/termine.js`). `sitemap.js`: `/termine` unter derselben Bedingung.

- [ ] **Step 5: Doku** — CLAUDE.md: Abschnitt „Daten": Filter-Block um Termine ergänzen (`{ kinds: [31922, 31923], "#h": ["ae6199bb…"] }` plus Autor im Redaktionskreis, ADR-0034), Kind-Liste um `31922`/`31923`, „Sortierung" um die Terminregel, Zuschnitt-Satz „Termine sind nicht im Zuschnitt (ADR-0026)" → „Termine kommen aus der Community (ADR-0034)". `docs/betrieb.md`: `COMMUNITY_PUBKEY`, `EDUFEED_URL` in der `.env`-Tabelle. STATUS-Eintrag „2026-09-15 — Kalender aus der Community (ADR-0034)" mit Befund (Phillips Tagung, Redaktionskreis-Kriterium, Startseitenblock, Menü nur mit Terminen) und den Besprechungsentscheidungen (Quelle je Inhaltsart, Umbenennung zu oer-community, Community-Hub später).

- [ ] **Step 6: Tests, Check, Build** — `pnpm check && pnpm test && pnpm build`.

- [ ] **Step 7: Commit**

```bash
git add -A src test CLAUDE.md docs/STATUS.md docs/betrieb.md
git commit -m "Nächste Termine auf der Startseite, Menüpunkt und Sitemap nur mit Terminen, Doku (ADR-0034)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```
