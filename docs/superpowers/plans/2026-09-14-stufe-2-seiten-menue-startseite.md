# Stufe 2: Seiten, Menü, Fußzeile, Startseite, Kopf aus `kind:0` — Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Seitenstruktur von oer.community kommt aus Nostr: Wortmarke und Logo aus `kind:0`, Hauptmenü und Fußzeilenlinks aus `kind:30004`, Seiten als `kind:30023` mit Selbst-Label, die Startseite unter `d = startseite` — mit ehrlichen Rückfällen, solange Events fehlen.

**Architecture:** Der Spiegel hält `listen` (30004) und `profil` (kind:0) schon seit Stufe 1. Neue Modelle (`profil.js`, `liste.js`) lesen die Events, ein Loader (`loaders/struktur.js`) löst Listenziele gegen den Spiegel auf und meldet, was fehlt; `routen/struktur.js` macht daraus Layout-Daten (Wortmarke, Logo, Menü samt Hub-Ansichten, Fußtext, Befund), die `+layout.server.js` an Kopf- und Fußzeile gibt. `/` rendert die Startseite als Seite, sonst wie bisher den Blog mit Hinweis. Geprüft wird gegen signierte Fixtures eines Testschlüssels, weil der Bestand diese Events noch nicht hat.

**Tech Stack:** SvelteKit 2 (Svelte 5 Runes), JavaScript mit JSDoc unter `checkJs`+`strict`, Vitest mit `svelte/server`, `nostr-tools/pure` nur zum Signieren der Fixtures.

**Spec:** `docs/superpowers/specs/2026-09-14-oer-community-aus-nostr-design.md` — Abschnitte „Routen" (`/`, `/en`), „Struktur aus Nostr", „Darstellung" (Kopfzeile, Seite, Fußzeile, `<title>`), „Fehlerfälle" (fehlende Liste/Startseite), „Tests" (Testschlüssel-Fixtures), „Konfiguration" (`STARTSEITE_D`, `NAVIGATION_D`, `FUSSZEILE_D`); ADR-0027. **Nicht hier:** FOERBICO-Farben (Stufe 3), Feed/Sitemap/`trailingSlash`/kanonische URLs (Stufe 4).

## Global Constraints

- Oberfläche, Code, Bezeichner, Commits auf **Deutsch**; Nostr-Namen (`kind`, `tags`, `d`, `a`, `about`, `picture`) bleiben englisch.
- **Die Datenschicht kennt die Oberfläche nicht:** nichts unter `src/lib/loaders/`, `models/`, `services/` importiert aus `routes/`, `components/` oder `$app/` — das gilt auch für `src/lib/komponenten/` (Architekturtest prüft `src/lib`). Der aktuelle Pfad für `aria-current` kommt deshalb als Prop aus `+layout.svelte`.
- **Nur `services/spiegel.js` importiert `services/relay.js`** (ADR-0028). Kein Loader und keine Route fragt ein Relay.
- **Nichts andeuten, was es nicht gibt** (CLAUDE.md): Fehlt eine Liste, fehlen die Links — kein Platzhalter-Menü. Fehlt die Startseite, zeigt `/` den Blog mit Hinweis.
- **Nie eine leere Fläche ohne Erklärung:** Jeder Rückfall steht im Struktur-Befund der Entwickleransicht (Fußzeile im Debug-Modus).
- `{@html}` nur für HTML, das durch `inhaltAufbereiten` (sanitize-html) gelaufen ist.
- Tests ohne Netz und ohne Platte; Fixtures in `test/fixtures/`. Neue Funktionen kommen mit Prüfung.
- Vor jedem Commit `pnpm check && pnpm test` grün, Ausgabe ohne Warnungen. Trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Arbeitsbranch `feat/stufe-2-struktur` von `dev`; Worktree unter `.claude/worktrees/`.

## Dateistruktur

| Datei | Zuständigkeit |
|---|---|
| `src/lib/konfig.js` (ändern) | `startseiteD`, `navigationD`, `fusszeileD` |
| `test/fixtures/testquelle/erzeugen.mjs` (neu), `test/fixtures/testquelle/events.json` (neu), `test/fixtures/README.md` (ändern) | signierte Events eines Testschlüssels: Profil, Seiten, Artikel, Listen |
| `src/lib/models/profil.js` (neu) | `kind:0` → Wortmarke, Logo, Fußtext, Website |
| `src/lib/models/liste.js` (neu) | `kind:30004` → Ziele aus `a`-Tags |
| `src/lib/loaders/struktur.js` (neu) | Menü, Fußzeilenlinks, Startseite gegen den Spiegel auflösen; Befund |
| `src/lib/routen/struktur.js` (neu) | Layout-Daten: Wortmarke, Logo, Menü + Hub-Ansichten, Fußtext-HTML, Befund |
| `src/routes/+layout.server.js`, `+layout.svelte` (ändern) | Struktur laden, an Kopf- und Fußzeile geben, `aktuellerPfad` |
| `src/lib/komponenten/Kopfzeile.svelte`, `Fusszeile.svelte` (ändern) | Logo, Wortmarke, Menü mit `aria-current`; Fußtext, Links, Struktur-Befund im Debug-Modus |
| `src/lib/komponenten/Detail.svelte` (ändern) | Seiten ohne Datum, Themen, Cover, Vorspann; `<title>` mit Wortmarke |
| `src/routes/+page.server.js`, `+page.svelte`, `src/lib/routen/uebersicht.js` (ändern) | `/` als Startseite oder Blog |
| `src/routes/en/+page.server.js` (neu) | `/en` → `/` |
| `src/routes/+error.svelte`, Übersichts-`+page.svelte` (ändern) | `<title>` mit Wortmarke |
| `CLAUDE.md`, `docs/STATUS.md` | nachziehen |

---

### Task 0: Branch und Worktree

- [ ] `git -C /Users/joerglohrer/repositories/community-hub worktree add .claude/worktrees/feat-stufe-2-struktur -b feat/stufe-2-struktur dev`, dort `pnpm install --frozen-lockfile && pnpm check && pnpm test` — Expected: 276 Tests grün, `svelte-check` ohne Befund.

---

### Task 1: Konfiguration: `STARTSEITE_D`, `NAVIGATION_D`, `FUSSZEILE_D`

**Files:** Modify `src/lib/konfig.js`, `src/lib/konfig.test.js`, `.env.example`

**Interfaces:** `Konfig` bekommt `startseiteD: string` (Standard `startseite`), `navigationD: string` (`navigation`), `fusszeileD: string` (`fusszeile`).

- [ ] **Step 1: Failing test** in `konfig.test.js` anhängen:

```js
describe('konfigLesen: Struktur-Kennungen (ADR-0027)', () => {
  const GUELTIG = { QUELLE_AUTOR: 'a'.repeat(64), RELAYS: 'wss://relay.edufeed.org/', BLOSSOM_URL: 'https://blossom.edufeed.org/' };
  it('nimmt die Konventionen als Standard', () => {
    const k = konfigLesen(GUELTIG);
    expect(k.startseiteD).toBe('startseite');
    expect(k.navigationD).toBe('navigation');
    expect(k.fusszeileD).toBe('fusszeile');
  });
  it('lässt andere Namen zu, getrimmt; leer heißt Standard', () => {
    const k = konfigLesen({ ...GUELTIG, STARTSEITE_D: ' start ', NAVIGATION_D: '', FUSSZEILE_D: 'footer' });
    expect(k.startseiteD).toBe('start');
    expect(k.navigationD).toBe('navigation');
    expect(k.fusszeileD).toBe('footer');
  });
});
```

- [ ] **Step 2:** `pnpm vitest run src/lib/konfig.test.js` — FAIL.
- [ ] **Step 3: Implementieren.** Typedef um die drei Felder ergänzen (Kommentar „Konvention mit Standard, damit ein zweiter Mandant andere Namen wählen kann (ADR-0027)"), Helfer:

```js
/** Kennung mit Standard: getrimmt; leer oder nicht gesetzt heißt Standard. @param {string|undefined} roh @param {string} standard */
const kennung = (roh, standard) => (roh ?? '').trim() || standard;
```

und im `return`: `startseiteD: kennung(quelle.STARTSEITE_D, 'startseite'), navigationD: kennung(quelle.NAVIGATION_D, 'navigation'), fusszeileD: kennung(quelle.FUSSZEILE_D, 'fusszeile')`. `.env.example` bekommt nach dem Spiegel-Block:

```
# ── Struktur aus Nostr (ADR-0027) ───────────────────────────────────────
# Kennungen (d) der Events, aus denen Menü, Fußzeile und Startseite kommen.
# Konventionen mit Standard; ein zweiter Mandant kann andere wählen.
STARTSEITE_D=startseite
NAVIGATION_D=navigation
FUSSZEILE_D=fusszeile
```

Alle Stellen, die `Konfig`-Objekte von Hand bauen (`grep -rn "spiegelStartwartezeitS:" src test`), bekommen die drei Felder.

- [ ] **Step 4:** `pnpm check && pnpm test` grün. **Step 5:** Commit „Konfiguration: Kennungen für Startseite, Menü und Fußzeile (ADR-0027)".

---

### Task 2: Testschlüssel-Fixtures

**Files:** Create `test/fixtures/testquelle/erzeugen.mjs`, `test/fixtures/testquelle/events.json`; Modify `test/fixtures/README.md`

**Interfaces:** `events.json` ist ein Array signierter Events eines Testschlüssels; `test/fixtures/testquelle/schluessel.json` enthält `{ "pubkey": "<hex>" }` (nur der öffentliche). Tests laden beide und setzen `konfig.autor = pubkey`. Enthaltene Events (alle `created_at: 1789400000`, Kennungen fest):

| kind | d | Besonderheit |
|---|---|---|
| 0 | — | `{"name":"Testquelle","display_name":"TQ","picture":"https://blossom.example/logo.png","about":"CC BY **Testquelle** — [Impressum](https://example.org/impressum)","website":"https://test.example"}` |
| 30023 | `startseite` | Seite (Label), Titel „Willkommen", Inhalt Markdown mit einem Absatz |
| 30023 | `impressum` | Seite, Titel „Impressum" |
| 30023 | `unser-team` | Seite, Titel „Unser Team", `inLanguage de` |
| 30023 | `our-team` | Seite, Titel „Our team", `inLanguage en` |
| 30023 | `artikel-a` | Artikel (kein Label), Titel „Artikel A", `published_at 1789300000`, `t` „Testthema" |
| 30004 | `navigation` | `a`: unser-team, `oer-und-oep` (fehlt im Spiegel), startseite (soll übersprungen werden), artikel-a, sowie `30023:<fremder pubkey>:x` (fremde Quelle) |
| 30004 | `fusszeile` | `a`: impressum, `datenschutz` (fehlt) |

- [ ] **Step 1: Skript** `test/fixtures/testquelle/erzeugen.mjs`:

```js
/**
 * Erzeugt die Fixtures der Testquelle: signierte Events eines Wegwerf-Schlüssels,
 * mit dem der Hub Seiten, Listen und Profil prüfen kann, bevor der FOERBICO-Key
 * sie publiziert (Spec 14.09., „Tests"). Aufruf: node test/fixtures/testquelle/erzeugen.mjs
 * Der geheime Schlüssel steht nur hier und ist wertlos — er signiert nichts Echtes.
 */
import { writeFileSync } from 'node:fs';
import { finalizeEvent, getPublicKey } from 'nostr-tools/pure';

const GEHEIM = Uint8Array.from(Buffer.from('7f9c2ba4e88f827d616045507605853ed73b8093f6efbc88eb1a6eacfa66ef26', 'hex'));
const PUBKEY = getPublicKey(GEHEIM);
const FREMD = 'b'.repeat(64);
const ZEIT = 1789400000;
const SEITE = [['L', 'foerbico/typ'], ['l', 'seite', 'foerbico/typ']];
const a = (/** @type {string} */ d, pk = PUBKEY) => ['a', `30023:${pk}:${d}`];

/** @param {number} kind @param {string[][]} tags @param {string} content */
const ev = (kind, tags, content) => finalizeEvent({ kind, created_at: ZEIT, tags, content }, GEHEIM);

const events = [
  ev(0, [], JSON.stringify({ name: 'Testquelle', display_name: 'TQ', picture: 'https://blossom.example/logo.png', about: 'CC BY **Testquelle** — [Impressum](https://example.org/impressum)', website: 'https://test.example' })),
  ev(30023, [['d', 'startseite'], ['title', 'Willkommen'], ['published_at', String(ZEIT)], ['inLanguage', 'de'], ...SEITE], 'Willkommen bei der **Testquelle**.\n\nZweiter Absatz.'),
  ev(30023, [['d', 'impressum'], ['title', 'Impressum'], ['published_at', String(ZEIT)], ['inLanguage', 'de'], ...SEITE], 'Verantwortlich: Testquelle.'),
  ev(30023, [['d', 'unser-team'], ['title', 'Unser Team'], ['published_at', String(ZEIT)], ['inLanguage', 'de'], ...SEITE], 'Drei Menschen.'),
  ev(30023, [['d', 'our-team'], ['title', 'Our team'], ['published_at', String(ZEIT)], ['inLanguage', 'en'], ...SEITE], 'Three people.'),
  ev(30023, [['d', 'artikel-a'], ['title', 'Artikel A'], ['summary', 'Anriss A', 'de'], ['published_at', '1789300000'], ['inLanguage', 'de'], ['t', 'Testthema']], 'Text von Artikel A.'),
  ev(30004, [['d', 'navigation'], ['title', 'Hauptmenü'], a('unser-team'), a('oer-und-oep'), a('startseite'), a('artikel-a'), a('x', FREMD)], ''),
  ev(30004, [['d', 'fusszeile'], ['title', 'Fußzeile'], a('impressum'), a('datenschutz')], '')
];

writeFileSync(new URL('./events.json', import.meta.url), JSON.stringify(events, null, 2) + '\n');
writeFileSync(new URL('./schluessel.json', import.meta.url), JSON.stringify({ pubkey: PUBKEY }, null, 2) + '\n');
console.log(`${events.length} Events für ${PUBKEY.slice(0, 12)}… geschrieben`);
```

Ausführen: `node test/fixtures/testquelle/erzeugen.mjs`. Beide JSON-Dateien committen.

- [ ] **Step 2: Test** `test/fixtures/testquelle/fixtures.test.js` — prüft, dass alle Events gültig signiert sind und zum Schlüssel gehören:

```js
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { verifyEvent } from 'nostr-tools/pure';

const lesen = (/** @type {string} */ f) => JSON.parse(readFileSync(new URL(`./${f}`, import.meta.url), 'utf8'));

describe('Fixtures der Testquelle', () => {
  const events = lesen('events.json');
  const { pubkey } = lesen('schluessel.json');
  it('sind gültig signiert und stammen alle vom Testschlüssel', () => {
    expect(events.length).toBe(8);
    for (const e of events) {
      expect(verifyEvent(e)).toBe(true);
      expect(e.pubkey).toBe(pubkey);
    }
  });
  it('enthalten die Kinds, die Stufe 2 braucht', () => {
    expect(events.map((/** @type {any} */ e) => e.kind).sort((a, b) => a - b)).toEqual([0, 30004, 30004, 30023, 30023, 30023, 30023, 30023]);
  });
});
```

`vitest.config.js` `include` um `test/fixtures/**/*.test.js` erweitern, falls das Muster `test/**/*.test.js` es nicht schon trifft (es trifft). Test-Helfer für spätere Tasks in `test/fixtures/testquelle/laden.js`:

```js
import { readFileSync } from 'node:fs';
import { leererInhalt } from '../../../src/lib/services/spiegel.js';

const lesen = (/** @type {string} */ f) => JSON.parse(readFileSync(new URL(`./${f}`, import.meta.url), 'utf8'));

/** Alle Events der Testquelle und ihr Schlüssel. */
export function testquelle() {
  /** @type {import('../../../src/lib/services/spiegel.js').Event[]} */
  const events = lesen('events.json');
  const { pubkey } = lesen('schluessel.json');
  return { events, pubkey };
}

/**
 * Ein Spiegelinhalt, wie ihn ein gültiger Lauf über die Testquelle ergäbe.
 * @param {{ ohne?: Array<{ kind: number, d?: string }> }} [lage]  Events, die fehlen sollen
 */
export function inhaltDerTestquelle(lage = {}) {
  const { events, pubkey } = testquelle();
  const d = (/** @type {any} */ e) => e.tags.find((/** @type {string[]} */ t) => t[0] === 'd')?.[1];
  const bleibt = events.filter((e) => !(lage.ohne ?? []).some((o) => o.kind === e.kind && (o.d === undefined || o.d === d(e))));
  return {
    inhalt: {
      ...leererInhalt(),
      stand: { zeitpunkt: '2026-09-14T10:00:00Z', dauerMs: 1, gefragteRelays: ['wss://r/'], nichtErreichbar: [], anzahl: { artikel: 0, listen: 0, nachweise: 0, profil: 0 } },
      artikel: bleibt.filter((e) => e.kind === 30023),
      listen: bleibt.filter((e) => e.kind === 30004),
      profil: bleibt.find((e) => e.kind === 0) ?? null
    },
    konfig: /** @type {import('../../../src/lib/konfig.js').Konfig} */ ({
      autor: pubkey, hTag: null, relays: ['wss://r/'], blossomUrl: 'https://blossom.example/', abgeloesteHosts: [],
      spiegelPfad: 'x', spiegelIntervallS: 600, spiegelStartwartezeitS: 20,
      startseiteD: 'startseite', navigationD: 'navigation', fusszeileD: 'fusszeile'
    })
  };
}
```

- [ ] **Step 3: README** `test/fixtures/README.md`: Abschnitt „Testquelle" — warum (Bestand hat keine Seiten/Listen), Schlüssel ist Wegwerf, Neu-Erzeugen ändert Signaturen und IDs (deshalb nur bei Bedarf), Tabelle der Events wie oben.
- [ ] **Step 4:** `pnpm check && pnpm test` grün. **Step 5:** Commit „Fixtures: Testquelle mit Profil, Seiten, Artikel und Listen".

---

### Task 3: Modell `profil.js`

**Files:** Create `src/lib/models/profil.js`, `src/lib/models/profil.test.js`

**Interfaces:**
```js
/** @typedef {{ name: string|null, logoUrl: string|null, fusstext: string|null, website: string|null }} Profil */
export function profilAusEvent(event: Event|null): Profil|null
```
`name` = `name`, sonst `display_name`; `logoUrl`/`website` nur `https://`-URLs; `fusstext` = `about` getrimmt; unlesbarer `content` → `null`.

- [ ] **Step 1: Failing test:**

```js
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { profilAusEvent } from './profil.js';
import { testquelle } from '../../../test/fixtures/testquelle/laden.js';

const FOERBICO = JSON.parse(readFileSync(new URL('../../../test/fixtures/profil-0-foerbico.json', import.meta.url), 'utf8'))[0];

describe('profilAusEvent', () => {
  it('liest name, picture, about, website aus der Testquelle', () => {
    const profil = profilAusEvent(testquelle().events.find((e) => e.kind === 0) ?? null);
    expect(profil).toEqual({ name: 'Testquelle', logoUrl: 'https://blossom.example/logo.png', fusstext: 'CC BY **Testquelle** — [Impressum](https://example.org/impressum)', website: 'https://test.example' });
  });
  it('fällt auf display_name zurück und lässt Fehlendes null (FOERBICO-Fixture vom 03.09.)', () => {
    expect(profilAusEvent(FOERBICO)).toEqual({ name: 'Foerbico', logoUrl: null, fusstext: null, website: null });
  });
  it('ohne Event oder mit kaputtem JSON: null', () => {
    expect(profilAusEvent(null)).toBeNull();
    expect(profilAusEvent(/** @type {any} */ ({ ...FOERBICO, content: '{kaputt' }))).toBeNull();
  });
  it('nimmt keine http- oder javascript-Adressen als Logo', () => {
    const e = /** @type {any} */ ({ ...FOERBICO, content: JSON.stringify({ name: 'X', picture: 'javascript:alert(1)', website: 'http://unsicher' }) });
    expect(profilAusEvent(e)).toEqual({ name: 'X', logoUrl: null, fusstext: null, website: null });
  });
});
```

- [ ] **Step 2:** FAIL. **Step 3: Implementieren:**

```js
/**
 * Das Profil des Herausgebers (kind:0) — Wortmarke, Logo, Fußtext, Domain
 * (ADR-0027). Der `about`-Text ist Markdown; gerendert wird er in der
 * Routen-Schicht über `inhaltAufbereiten`, nie ungesäubert.
 */
/** @typedef {import('../services/relay.js').Event} Event */
/** @typedef {{ name: string|null, logoUrl: string|null, fusstext: string|null, website: string|null }} Profil */

/** @param {unknown} w */
const text = (w) => (typeof w === 'string' && w.trim() !== '' ? w.trim() : null);
/** Nur https — ein Logo von http oder javascript: wäre ein Angriffsweg im <img src>. @param {unknown} w */
const https = (w) => { const t = text(w); return t && /^https:\/\//i.test(t) ? t : null; };

/** @param {Event|null} event @returns {Profil|null} */
export function profilAusEvent(event) {
  if (!event) return null;
  let roh;
  try { roh = JSON.parse(event.content ?? ''); } catch { return null; }
  if (!roh || typeof roh !== 'object') return null;
  return {
    name: text(roh.name) ?? text(roh.display_name),
    logoUrl: https(roh.picture),
    fusstext: text(roh.about),
    website: https(roh.website)
  };
}
```

- [ ] **Step 4:** grün. **Step 5:** Commit „Modell: Profil aus kind:0 (ADR-0027)".

---

### Task 4: Modell `liste.js`

**Files:** Create `src/lib/models/liste.js`, `src/lib/models/liste.test.js`

**Interfaces:**
```js
/** @typedef {{ kind: number, pubkey: string, d: string, roh: string }} Listenziel */
/** @typedef {{ d: string, titel: string|null, ziele: Listenziel[] }} Liste */
export function listeAusEvent(event: Event): Liste
export function listeFinden(listen: Event[], d: string): Liste|null
```
`a`-Tags `kind:pubkey:d` (erste zwei Doppelpunkte trennen; `d` darf Doppelpunkte enthalten); unbrauchbare Tags werden ausgelassen; Reihenfolge bleibt.

- [ ] **Step 1: Failing test:**

```js
import { describe, expect, it } from 'vitest';
import { listeAusEvent, listeFinden } from './liste.js';
import { testquelle } from '../../../test/fixtures/testquelle/laden.js';

describe('listeAusEvent', () => {
  const { events, pubkey } = testquelle();
  const nav = events.find((e) => e.kind === 30004 && e.tags.some((t) => t[0] === 'd' && t[1] === 'navigation'));
  it('liest Titel und Ziele in Reihenfolge', () => {
    const liste = listeAusEvent(/** @type {any} */ (nav));
    expect(liste.d).toBe('navigation');
    expect(liste.titel).toBe('Hauptmenü');
    expect(liste.ziele.map((z) => z.d)).toEqual(['unser-team', 'oer-und-oep', 'startseite', 'artikel-a', 'x']);
    expect(liste.ziele[0]).toEqual({ kind: 30023, pubkey, d: 'unser-team', roh: `30023:${pubkey}:unser-team` });
  });
  it('lässt unbrauchbare a-Tags aus und behält d mit Doppelpunkt', () => {
    const e = /** @type {any} */ ({ ...nav, tags: [['d', 'x'], ['a', 'kaputt'], ['a', `abc:${pubkey}:y`], ['a', `30023:${pubkey}:mit:doppelpunkt`]] });
    expect(listeAusEvent(e).ziele.map((z) => z.d)).toEqual(['mit:doppelpunkt']);
  });
  it('listeFinden liefert die Liste zu einem d oder null', () => {
    const listen = events.filter((e) => e.kind === 30004);
    expect(listeFinden(listen, 'fusszeile')?.ziele.map((z) => z.d)).toEqual(['impressum', 'datenschutz']);
    expect(listeFinden(listen, 'gibt-es-nicht')).toBeNull();
  });
});
```

- [ ] **Step 2:** FAIL. **Step 3: Implementieren:**

```js
/**
 * Kuratierungslisten (NIP-51 kind:30004) — Hauptmenü und Fußzeilenlinks
 * (ADR-0027). Die Liste nennt Ziele; ob es sie gibt, entscheidet der Loader
 * gegen den Spiegel, nicht das Modell.
 */
/** @typedef {import('../services/relay.js').Event} Event */
/** @typedef {{ kind: number, pubkey: string, d: string, roh: string }} Listenziel */
/** @typedef {{ d: string, titel: string|null, ziele: Listenziel[] }} Liste */

/** @param {string[][]} tags @param {string} name */
const tagWert = (tags, name) => tags.find((t) => t[0] === name && t.length > 1)?.[1] ?? null;

/** `kind:pubkey:d` — d darf Doppelpunkte enthalten, deshalb nur zweimal trennen. @param {string} roh @returns {Listenziel|null} */
export function zielAusKoordinate(roh) {
  const erster = roh.indexOf(':');
  const zweiter = erster === -1 ? -1 : roh.indexOf(':', erster + 1);
  if (zweiter === -1) return null;
  const kind = Number(roh.slice(0, erster));
  const pubkey = roh.slice(erster + 1, zweiter);
  const d = roh.slice(zweiter + 1);
  if (!Number.isInteger(kind) || !/^[0-9a-f]{64}$/i.test(pubkey) || d === '') return null;
  return { kind, pubkey: pubkey.toLowerCase(), d, roh };
}

/** @param {Event} event @returns {Liste} */
export function listeAusEvent(event) {
  const tags = event.tags ?? [];
  /** @type {Listenziel[]} */
  const ziele = [];
  for (const t of tags) {
    if (t[0] !== 'a' || !t[1]) continue;
    const ziel = zielAusKoordinate(t[1]);
    if (ziel) ziele.push(ziel);
  }
  return { d: tagWert(tags, 'd') ?? '', titel: tagWert(tags, 'title'), ziele };
}

/** @param {Event[]} listen @param {string} d @returns {Liste|null} */
export function listeFinden(listen, d) {
  const event = listen.find((e) => tagWert(e.tags ?? [], 'd') === d);
  return event ? listeAusEvent(event) : null;
}
```

- [ ] **Step 4:** grün. **Step 5:** Commit „Modell: Kuratierungslisten kind:30004 (ADR-0027)".

---

### Task 5: Loader `struktur.js`

**Files:** Create `src/lib/loaders/struktur.js`, `src/lib/loaders/struktur.test.js`

**Interfaces:**
```js
/** @typedef {{ titel: string, pfad: string, d: string }} Eintrag */
/** @typedef {{
 *   profil: Profil|null,
 *   menue: Eintrag[], fusszeile: Eintrag[],
 *   startseite: { artikel: Artikel, event: Event }|null,
 *   befund: {
 *     profil: 'ok'|'fehlt', navigation: 'ok'|'fehlt', fusszeile: 'ok'|'fehlt', startseite: 'ok'|'fehlt',
 *     erwartet: { profil: string, navigation: string, fusszeile: string, startseite: string },
 *     uebersprungen: string[]
 *   } }} Struktur */
export function strukturLaden(inhalt: Inhalt, konfig: Konfig): Struktur
```
Regeln: Ziel wird übersprungen (und im Befund genannt) bei fremdem `pubkey`, anderem `kind` als 30023, fehlendem Beitrag im Spiegel, oder wenn `d === konfig.startseiteD` („Startseite steht nicht im Menü"). Beschriftung = `titel` des Beitrags, Pfad = `beitragsPfad`.

- [ ] **Step 1: Failing test:**

```js
import { describe, expect, it } from 'vitest';
import { strukturLaden } from './struktur.js';
import { inhaltDerTestquelle } from '../../../test/fixtures/testquelle/laden.js';

describe('strukturLaden', () => {
  it('löst Menü und Fußzeile gegen den Spiegel auf und meldet Übersprungenes', () => {
    const { inhalt, konfig } = inhaltDerTestquelle();
    const s = strukturLaden(inhalt, konfig);
    expect(s.menue).toEqual([
      { titel: 'Unser Team', pfad: '/unser-team', d: 'unser-team' },
      { titel: 'Artikel A', pfad: '/artikel-a', d: 'artikel-a' }
    ]);
    expect(s.fusszeile).toEqual([{ titel: 'Impressum', pfad: '/impressum', d: 'impressum' }]);
    expect(s.befund.uebersprungen).toEqual([
      'navigation: „oer-und-oep“ liegt nicht im Spiegel',
      'navigation: „startseite“ steht nicht im Menü — das Logo verlinkt dorthin',
      `navigation: 30023:${'b'.repeat(64)}:x gehört nicht zur Quelle`,
      'fusszeile: „datenschutz“ liegt nicht im Spiegel'
    ]);
    expect(s.befund).toMatchObject({ profil: 'ok', navigation: 'ok', fusszeile: 'ok', startseite: 'ok' });
    expect(s.startseite?.artikel.titel).toBe('Willkommen');
    expect(s.profil?.name).toBe('Testquelle');
  });
  it('englische Seiten bekommen den /en/-Pfad', () => {
    const { inhalt, konfig } = inhaltDerTestquelle();
    const nav = inhalt.listen.find((e) => e.tags.some((t) => t[1] === 'navigation'));
    if (nav) nav.tags.push(['a', `30023:${konfig.autor}:our-team`]);
    expect(strukturLaden(inhalt, konfig).menue.at(-1)).toEqual({ titel: 'Our team', pfad: '/en/our-team', d: 'our-team' });
  });
  it('fehlende Events: leere Listen, Befund „fehlt“ mit dem erwarteten Event', () => {
    const { inhalt, konfig } = inhaltDerTestquelle({ ohne: [{ kind: 30004 }, { kind: 0 }, { kind: 30023, d: 'startseite' }] });
    const s = strukturLaden(inhalt, konfig);
    expect(s.menue).toEqual([]);
    expect(s.fusszeile).toEqual([]);
    expect(s.profil).toBeNull();
    expect(s.startseite).toBeNull();
    expect(s.befund).toMatchObject({ profil: 'fehlt', navigation: 'fehlt', fusszeile: 'fehlt', startseite: 'fehlt' });
    expect(s.befund.erwartet.navigation).toBe(`kind:30004 mit d = "navigation" von ${konfig.autor.slice(0, 12)}…`);
    expect(s.befund.erwartet.startseite).toBe(`kind:30023 mit d = "startseite" von ${konfig.autor.slice(0, 12)}…`);
  });
});
```

- [ ] **Step 2:** FAIL. **Step 3: Implementieren:**

```js
/**
 * Die Seitenstruktur aus dem Spiegel (ADR-0027): Profil, Menü, Fußzeile,
 * Startseite. Was fehlt, steht im Befund — nie eine leere Fläche ohne
 * Erklärung (CLAUDE.md). Kennt die Oberfläche nicht: liefert Einträge,
 * keine Links; „Blog" und „Themen" hängt die Routen-Schicht an.
 */
import { beitragsPfad } from '../models/artikel.js';
import { listeFinden } from '../models/liste.js';
import { profilAusEvent } from '../models/profil.js';
import { artikelAusSpiegel } from './artikel.js';

/** @typedef {import('../services/spiegel.js').Inhalt} Inhalt */
/** @typedef {import('../services/spiegel.js').Event} Event */
/** @typedef {import('../konfig.js').Konfig} Konfig */
/** @typedef {import('../models/artikel.js').Artikel} Artikel */
/** @typedef {import('../models/profil.js').Profil} Profil */
/** @typedef {{ titel: string, pfad: string, d: string }} Eintrag */
/** @typedef {'ok'|'fehlt'} Vorhanden */
/**
 * @typedef {object} Struktur
 * @property {Profil|null} profil
 * @property {Eintrag[]} menue
 * @property {Eintrag[]} fusszeile
 * @property {{ artikel: Artikel, event: Event }|null} startseite
 * @property {{ profil: Vorhanden, navigation: Vorhanden, fusszeile: Vorhanden, startseite: Vorhanden,
 *   erwartet: { profil: string, navigation: string, fusszeile: string, startseite: string },
 *   uebersprungen: string[] }} befund
 */

/**
 * @param {Inhalt} inhalt @param {Konfig} konfig @param {string} listenD
 * @param {string[]} uebersprungen  wird ergänzt
 * @returns {{ eintraege: Eintrag[], vorhanden: Vorhanden }}
 */
function eintraegeAufloesen(inhalt, konfig, listenD, uebersprungen) {
  const liste = listeFinden(inhalt.listen, listenD);
  if (!liste) return { eintraege: [], vorhanden: 'fehlt' };
  /** @type {Eintrag[]} */
  const eintraege = [];
  for (const ziel of liste.ziele) {
    if (ziel.kind !== 30023 || ziel.pubkey !== konfig.autor) {
      uebersprungen.push(`${listenD}: ${ziel.roh} gehört nicht zur Quelle`);
      continue;
    }
    if (ziel.d === konfig.startseiteD) {
      uebersprungen.push(`${listenD}: „${ziel.d}“ steht nicht im Menü — das Logo verlinkt dorthin`);
      continue;
    }
    const { artikel } = artikelAusSpiegel(inhalt, { d: ziel.d });
    if (!artikel) {
      uebersprungen.push(`${listenD}: „${ziel.d}“ liegt nicht im Spiegel`);
      continue;
    }
    eintraege.push({ titel: artikel.titel, pfad: beitragsPfad(artikel), d: artikel.d });
  }
  return { eintraege, vorhanden: 'ok' };
}

/** @param {Inhalt} inhalt @param {Konfig} konfig @returns {Struktur} */
export function strukturLaden(inhalt, konfig) {
  /** @type {string[]} */
  const uebersprungen = [];
  const profil = profilAusEvent(inhalt.profil);
  const menue = eintraegeAufloesen(inhalt, konfig, konfig.navigationD, uebersprungen);
  const fusszeile = eintraegeAufloesen(inhalt, konfig, konfig.fusszeileD, uebersprungen);
  const start = artikelAusSpiegel(inhalt, { d: konfig.startseiteD });
  const wer = `von ${konfig.autor.slice(0, 12)}…`;
  return {
    profil,
    menue: menue.eintraege,
    fusszeile: fusszeile.eintraege,
    startseite: start.artikel && start.event ? { artikel: start.artikel, event: start.event } : null,
    befund: {
      profil: profil ? 'ok' : 'fehlt',
      navigation: menue.vorhanden,
      fusszeile: fusszeile.vorhanden,
      startseite: start.artikel ? 'ok' : 'fehlt',
      erwartet: {
        profil: `kind:0 ${wer}`,
        navigation: `kind:30004 mit d = "${konfig.navigationD}" ${wer}`,
        fusszeile: `kind:30004 mit d = "${konfig.fusszeileD}" ${wer}`,
        startseite: `kind:30023 mit d = "${konfig.startseiteD}" ${wer}`
      },
      uebersprungen
    }
  };
}
```

- [ ] **Step 4:** grün. **Step 5:** Commit „Loader: Struktur aus Profil, Listen und Startseite mit Befund (ADR-0027)".

---

### Task 6: Routen-Schicht `struktur.js` und Layout-Daten

**Files:** Create `src/lib/routen/struktur.js`, `src/lib/routen/struktur.test.js`; Modify `src/routes/+layout.server.js`

**Interfaces:**
```js
/** @typedef {{ wortmarke: string, logoUrl: string|null, menue: Eintrag[], fusszeilenLinks: Eintrag[],
 *   fusstextHtml: string|null, befund: Struktur['befund'] }} Layoutstruktur */
export const HUB_ANSICHTEN = [{ titel: 'Blog', pfad: '/blog', d: '' }, { titel: 'Themen', pfad: '/themen', d: '' }]
export const WORTMARKE_RUECKFALL = 'Community-Hub'
export function strukturFuerLayout({ konfig, inhalt }): Layoutstruktur
```
`+layout.server.js` liefert zusätzlich zu `spiegelstand` das Objekt `struktur: Layoutstruktur`.

- [ ] **Step 1: Failing test** `src/lib/routen/struktur.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { HUB_ANSICHTEN, WORTMARKE_RUECKFALL, strukturFuerLayout } from './struktur.js';
import { inhaltDerTestquelle } from '../../../test/fixtures/testquelle/laden.js';

describe('strukturFuerLayout', () => {
  it('hängt Blog und Themen hinter das Menü und rendert den Fußtext als HTML', () => {
    const s = strukturFuerLayout(inhaltDerTestquelle());
    expect(s.wortmarke).toBe('Testquelle');
    expect(s.logoUrl).toBe('https://blossom.example/logo.png');
    expect(s.menue.map((e) => e.pfad)).toEqual(['/unser-team', '/artikel-a', '/blog', '/themen']);
    expect(s.fusszeilenLinks.map((e) => e.pfad)).toEqual(['/impressum']);
    expect(s.fusstextHtml).toContain('<strong>Testquelle</strong>');
    expect(s.fusstextHtml).toContain('href="https://example.org/impressum"');
    expect(s.fusstextHtml).not.toContain('<img');
  });
  it('ohne Profil und Listen: Rückfall-Wortmarke, nur Hub-Ansichten, kein Fußtext', () => {
    const s = strukturFuerLayout(inhaltDerTestquelle({ ohne: [{ kind: 0 }, { kind: 30004 }] }));
    expect(s.wortmarke).toBe(WORTMARKE_RUECKFALL);
    expect(s.logoUrl).toBeNull();
    expect(s.menue).toEqual(HUB_ANSICHTEN);
    expect(s.fusszeilenLinks).toEqual([]);
    expect(s.fusstextHtml).toBeNull();
    expect(s.befund.navigation).toBe('fehlt');
  });
  it('ein Bild im about-Text wird nicht gerendert, der Rest schon', () => {
    const { inhalt, konfig } = inhaltDerTestquelle();
    if (inhalt.profil) inhalt.profil = { ...inhalt.profil, content: JSON.stringify({ name: 'X', about: 'Text ![b](https://blossom.example/abc.png) Ende' }) };
    const s = strukturFuerLayout({ inhalt, konfig });
    expect(s.fusstextHtml).toContain('Text');
    expect(s.fusstextHtml).not.toContain('<img');
  });
});
```

- [ ] **Step 2:** FAIL. **Step 3: Implementieren** `src/lib/routen/struktur.js`:

```js
/**
 * Struktur für das Layout: Wortmarke, Logo, Menü, Fußzeile (ADR-0027).
 * Hier — und nicht im Loader — kommen die Ansichten dazu, die der Hub selbst
 * besitzt („Blog", „Themen"): Sie sind keine Seiten der Redaktion.
 */
import { inhaltAufbereiten } from '../inhalt.js';
import { strukturLaden } from '../loaders/struktur.js';

/** @typedef {import('../loaders/struktur.js').Eintrag} Eintrag */
/** @typedef {import('../loaders/struktur.js').Struktur} Struktur */
/** @typedef {{ wortmarke: string, logoUrl: string|null, menue: Eintrag[], fusszeilenLinks: Eintrag[], fusstextHtml: string|null, befund: Struktur['befund'] }} Layoutstruktur */

/** Ansichten des Hubs, keine Seiten — deshalb ohne d. @type {Eintrag[]} */
export const HUB_ANSICHTEN = [
  { titel: 'Blog', pfad: '/blog', d: '' },
  { titel: 'Themen', pfad: '/themen', d: '' }
];

/** Bis ein Profil mit Namen da ist (ersetzt die Vorläufigkeit aus ADR-0019 durch einen Rückfall). */
export const WORTMARKE_RUECKFALL = 'Community-Hub';

/**
 * Der Fußtext ist Markdown ohne Bilder (Spec): Bild-Teile fallen weg, das
 * HTML kommt gesäubert aus inhaltAufbereiten — nur so darf es in {@html}.
 * @param {string|null} markdown
 */
export function fusstextHtml(markdown) {
  if (!markdown) return null;
  const html = inhaltAufbereiten(markdown).teile.filter((t) => t.art === 'html').map((t) => t.html).join('').trim();
  return html === '' ? null : html;
}

/** @param {{ konfig: import('../konfig.js').Konfig, inhalt: import('../services/spiegel.js').Inhalt }} e @returns {Layoutstruktur} */
export function strukturFuerLayout({ konfig, inhalt }) {
  const s = strukturLaden(inhalt, konfig);
  return {
    wortmarke: s.profil?.name ?? WORTMARKE_RUECKFALL,
    logoUrl: s.profil?.logoUrl ?? null,
    menue: [...s.menue, ...HUB_ANSICHTEN],
    fusszeilenLinks: s.fusszeile,
    fusstextHtml: fusstextHtml(s.profil?.fusstext ?? null),
    befund: s.befund
  };
}
```

`src/routes/+layout.server.js`:

```js
import { env } from '$env/dynamic/private';
import { konfigLesen } from '$lib/konfig.js';
import { strukturFuerLayout } from '$lib/routen/struktur.js';
import { spiegelHolen } from '$lib/services/spiegel.js';

/** @type {import('./$types').LayoutServerLoad} */
export function load() {
  const spiegel = spiegelHolen();
  const inhalt = spiegel.lesen();
  const fehlschlag = spiegel.letzterFehlschlag();
  return {
    spiegelstand: {
      zeitpunkt: inhalt.stand?.zeitpunkt ?? null,
      veraltet: fehlschlag !== null,
      relays: fehlschlag?.gefragteRelays ?? []
    },
    // Struktur aus Nostr (ADR-0027): auch bei leerem Spiegel — dann mit Rückfällen.
    struktur: strukturFuerLayout({ konfig: konfigLesen(env), inhalt })
  };
}
```

Ein Routentest für das Layout in `test/uebersicht-routen.test.js` (gleiches Muster `lade('../src/routes/+layout.server.js', {}, inhalt)`): mit `inhaltDerTestquelle().inhalt` und `UMGEBUNG.QUELLE_AUTOR` auf den Testschlüssel gesetzt → `struktur.wortmarke === 'Testquelle'`; mit `leererInhalt()` → `struktur.wortmarke === 'Community-Hub'` und kein Fehler (das Layout wirft nie; die Seiten melden den Leerstand).

- [ ] **Step 4:** `pnpm check && pnpm test` grün. **Step 5:** Commit „Layout: Struktur aus Nostr mit Hub-Ansichten und Fußtext-HTML".

---

### Task 7: Kopfzeile: Logo, Wortmarke, Menü, `aria-current`

**Files:** Modify `src/lib/komponenten/Kopfzeile.svelte`, `src/routes/+layout.svelte`, `test/oberflaeche.test.js`

**Interfaces:** Props `wortmarke: string`, `logoUrl?: string|null`, `menue: Eintrag[]`, `aktuellerPfad?: string` (Standard `'/'`). Ein Eintrag ist aktuell, wenn `aktuellerPfad === pfad` oder `aktuellerPfad` mit `pfad + '/'` beginnt (`/blog/seite/2` → Blog).

- [ ] **Step 1: Failing tests** in `test/oberflaeche.test.js` (bestehende Kopfzeilen-Tests umstellen — `render(Kopfzeile, { props })` mit den neuen Props):

```js
const MENUE = [{ titel: 'Unser Team', pfad: '/unser-team', d: 'unser-team' }, { titel: 'Blog', pfad: '/blog', d: '' }, { titel: 'Themen', pfad: '/themen', d: '' }];
it('Kopfzeile: Logo und Wortmarke verlinken auf /, Menü aus der Struktur, aktueller Eintrag markiert', () => {
  const { body } = render(Kopfzeile, { props: { wortmarke: 'Testquelle', logoUrl: 'https://blossom.example/logo.png', menue: MENUE, aktuellerPfad: '/blog/seite/2' } });
  expect(body).toContain('<img src="https://blossom.example/logo.png"');
  expect(body).toContain('Testquelle');
  expect(body).toContain('href="/unser-team"');
  expect(body).toMatch(/href="\/blog"[^>]*aria-current="page"|aria-current="page"[^>]*href="\/blog"/);
  expect(body).not.toMatch(/href="\/themen"[^>]*aria-current/);
});
it('Kopfzeile ohne Logo: nur Wortmarke, kein <img>', () => {
  const { body } = render(Kopfzeile, { props: { wortmarke: 'Community-Hub', logoUrl: null, menue: MENUE } });
  expect(body).not.toContain('<img');
  expect(body).toContain('Community-Hub');
});
```

- [ ] **Step 2:** FAIL. **Step 3: Implementieren** `Kopfzeile.svelte`:

```svelte
<script>
  /**
   * Kopfzeile: Logo und Wortmarke aus kind:0, Menü aus kind:30004 plus die
   * Ansichten des Hubs (ADR-0027). Nichts hier ist hart verdrahtet außer dem
   * Link auf / — der gehört dem Logo. Der aktuelle Pfad kommt als Prop, weil
   * Komponenten unter src/lib nichts aus $app importieren (ADR-0014).
   *
   * @type {{ wortmarke: string, logoUrl?: string|null,
   *   menue: import('$lib/loaders/struktur.js').Eintrag[], aktuellerPfad?: string }}
   */
  let { wortmarke, logoUrl = null, menue, aktuellerPfad = '/' } = $props();
  /** @param {string} pfad */
  const aktuell = (pfad) => aktuellerPfad === pfad || aktuellerPfad.startsWith(`${pfad}/`);
</script>

<header class="kopf">
  <div class="innen">
    <a href="/" class="marke" aria-label="{wortmarke} — zur Startseite">
      {#if logoUrl}<img src={logoUrl} alt="" class="logo" />{/if}
      <span>{wortmarke}</span>
    </a>
    <nav aria-label="Hauptnavigation" class="nav">
      {#each menue as eintrag (eintrag.pfad)}
        <a href={eintrag.pfad} aria-current={aktuell(eintrag.pfad) ? 'page' : undefined}>{eintrag.titel}</a>
      {/each}
    </nav>
  </div>
</header>
```

Styles: `.marke` bekommt `display: flex; align-items: center; gap: 12px;`, `.logo { height: 48px; width: auto; }`, `.nav a[aria-current] { text-decoration: underline; text-underline-offset: 0.3em; }`, der Verlauf (`--verlauf`) auf `.marke span` entfällt; bei schmalen Bildschirmen `.innen { flex-wrap: wrap; gap: 12px; }` und `.nav { flex-wrap: wrap; }`.

`+layout.svelte`:

```svelte
<script>
  import '../app.css';
  import { page } from '$app/state';
  import Kopfzeile from '$lib/komponenten/Kopfzeile.svelte';
  import Fusszeile from '$lib/komponenten/Fusszeile.svelte';
  /** @type {{ children: import('svelte').Snippet, data: import('./$types').LayoutData }} */
  let { children, data } = $props();
</script>

<Kopfzeile wortmarke={data.struktur.wortmarke} logoUrl={data.struktur.logoUrl} menue={data.struktur.menue} aktuellerPfad={page.url.pathname} />
```

(Fußzeile folgt in Task 8; bis dahin bleibt der bisherige Aufruf.)

- [ ] **Step 4:** grün. **Step 5:** Commit „Kopfzeile: Logo, Wortmarke und Menü aus Nostr (ADR-0027)".

---

### Task 8: Fußzeile: Fußtext, Links, Struktur-Befund

**Files:** Modify `src/lib/komponenten/Fusszeile.svelte`, `src/routes/+layout.svelte`, `test/oberflaeche.test.js`

**Interfaces:** Props `wortmarke: string`, `fusstextHtml?: string|null`, `links?: Eintrag[]`, `befund?: Struktur['befund']|null`, `spiegelstand` wie bisher. Ohne `fusstextHtml` steht der bisherige Satz („Schaufenster für Beiträge im Nostr-Netz …"). Im Debug-Modus erscheint unter dem Schalter der Struktur-Befund: je Baustein „ok" oder „fehlt — erwartet: …", dazu die übersprungenen Ziele.

- [ ] **Step 1: Failing tests:**

```js
const BEFUND = { profil: 'ok', navigation: 'fehlt', fusszeile: 'ok', startseite: 'fehlt',
  erwartet: { profil: 'kind:0 von abc…', navigation: 'kind:30004 mit d = "navigation" von abc…', fusszeile: 'kind:30004 mit d = "fusszeile" von abc…', startseite: 'kind:30023 mit d = "startseite" von abc…' },
  uebersprungen: ['fusszeile: „datenschutz“ liegt nicht im Spiegel'] };
it('Fußzeile: Fußtext-HTML, Links und Wortmarke', () => {
  const { body } = render(Fusszeile, { props: { wortmarke: 'Testquelle', fusstextHtml: '<p>CC BY <strong>Testquelle</strong></p>', links: [{ titel: 'Impressum', pfad: '/impressum', d: 'impressum' }], befund: BEFUND } });
  expect(body).toContain('<strong>Testquelle</strong>');
  expect(body).toContain('href="/impressum"');
  expect(body).not.toContain('Schaufenster für Beiträge');
});
it('Fußzeile ohne Fußtext zeigt den Rückfallsatz; der Befund erscheint nur im Debug-Modus', () => {
  const zu = render(Fusszeile, { props: { wortmarke: 'Community-Hub', befund: BEFUND } }).body;
  expect(zu).toContain('Schaufenster für Beiträge');
  expect(zu).not.toContain('erwartet:');
  const offen = render(Fusszeile, { props: { wortmarke: 'Community-Hub', befund: BEFUND, debugStart: true } }).body;
  expect(offen).toContain('kind:30004 mit d = "navigation"');
  expect(offen).toContain('datenschutz');
});
```

`debugStart` ist eine reine Test-Prop nach dem Muster `offenStart` in `DebugBereich.svelte`: Serverseitig ist der Debug-Modus aus, und ohne diesen Einstieg wäre der aufgeklappte Befund nicht prüfbar.

- [ ] **Step 2:** FAIL. **Step 3: Implementieren.** Script:

```js
  /**
   * @type {{ wortmarke: string, fusstextHtml?: string|null,
   *   links?: import('$lib/loaders/struktur.js').Eintrag[],
   *   befund?: import('$lib/loaders/struktur.js').Struktur['befund']|null,
   *   spiegelstand?: { zeitpunkt: string|null, veraltet: boolean, relays: string[] },
   *   debugStart?: boolean }}
   */
  let { wortmarke, fusstextHtml = null, links = [], befund = null,
    spiegelstand = { zeitpunkt: null, veraltet: false, relays: [] }, debugStart = false } = $props();
  const debug = $derived(einstellungen.debugModus || debugStart);
  const BAUSTEINE = /** @type {const} */ ([['profil', 'Profil (Wortmarke, Logo, Fußtext)'], ['navigation', 'Hauptmenü'], ['fusszeile', 'Fußzeilenlinks'], ['startseite', 'Startseite']]);
```

Markup: `<p class="marke">{wortmarke}</p>`; dann `{#if fusstextHtml}<div class="text">{@html fusstextHtml}</div>{:else}<p class="text">Schaufenster …</p>{/if}`; `{#if links.length > 0}<ul class="links">{#each links as l (l.pfad)}<li><a href={l.pfad}>{l.titel}</a></li>{/each}</ul>{/if}`; Stand-Block wie bisher; Werkzeug-Block wie bisher; danach:

```svelte
    {#if debug && befund}
      <section class="befund" aria-label="Struktur aus Nostr">
        <h2>Struktur aus Nostr (ADR-0027)</h2>
        <ul>
          {#each BAUSTEINE as [schluessel, name] (schluessel)}
            <li>{name}: {befund[schluessel] === 'ok' ? 'ok' : `fehlt — erwartet: ${befund.erwartet[schluessel]}`}</li>
          {/each}
        </ul>
        {#if befund.uebersprungen.length > 0}
          <p>Übersprungene Listenziele:</p>
          <ul>{#each befund.uebersprungen as z (z)}<li>{z}</li>{/each}</ul>
        {/if}
      </section>
    {/if}
```

Der Kommentar „Kein Relay-Name im Text" im Kopf der Datei wird ergänzt: der Befund nennt erwartete Events und Kennungen, keine Relays. Styles: `.links { display: flex; gap: 16px; list-style: none; padding: 0; margin: 16px 0 0; }`, `.links a { color: var(--rl-weiss); }`, `.text :global(a) { color: var(--rl-weiss); text-decoration: underline; }`, `.befund { margin-top: 20px; font-family: var(--schrift-label); font-size: 0.86rem; }`, `.befund h2 { font-size: 1rem; color: var(--rl-weiss); margin: 0 0 6px; }`, `.befund ul { padding-left: 1.2em; }`. Der Verlauf auf `.marke span` entfällt.

`+layout.svelte`: `<Fusszeile wortmarke={data.struktur.wortmarke} fusstextHtml={data.struktur.fusstextHtml} links={data.struktur.fusszeilenLinks} befund={data.struktur.befund} spiegelstand={data.spiegelstand} />`.

- [ ] **Step 4:** grün (bestehende Fußzeilen-Tests brauchen jetzt `wortmarke`). **Step 5:** Commit „Fußzeile: Fußtext und Links aus Nostr, Struktur-Befund im Debug-Modus".

---

### Task 9: Seiten-Darstellung und `<title>` mit Wortmarke

**Files:** Modify `src/lib/komponenten/Detail.svelte`, `src/routes/+error.svelte`, die fünf Übersichts-`+page.svelte` (`/`, `/blog`, `/blog/seite/[n]`, `/themen/[thema]`, `/themen/[thema]/seite/[n]`) und `src/routes/themen/+page.svelte`, `test/oberflaeche.test.js`, `test/uebersicht.test.js`

**Interfaces:** `Detail.svelte` bekommt Props `data` (wie bisher) und `wortmarke: string`, optional `nurWortmarke?: boolean` (Startseite: `<title>` ist nur die Wortmarke). Ist `data.artikel.istSeite`, entfallen Datum, Themen, Cover und Vorspann; Titel und Inhalt bleiben, die Entwickleransicht auch. `<title>` ist `{titel} · {wortmarke}`. Übersichten: `{ueberschrift} · {data.struktur.wortmarke}`; Themenübersicht `Themen · {wortmarke}`; Fehlerseite `Fehler {status} · {page.data.struktur?.wortmarke ?? 'Community-Hub'}`.

- [ ] **Step 1: Failing tests** in `test/oberflaeche.test.js` (Artikelseite rendert `Detail` direkt):

```js
it('eine Seite zeigt Titel und Inhalt, aber kein Datum, keine Themen, kein Cover', () => {
  const { body, head } = render(Detail, { props: { data: seitendaten({ artikel: { ...seitendaten().artikel, istSeite: true, themen: ['X'], bildUrl: 'https://blossom.edufeed.org/abc.jpg' } }), wortmarke: 'Testquelle' } });
  expect(body).toContain('<h1>');
  expect(body).not.toContain('<time');
  expect(body).not.toContain('class="marker"');
  expect(body).not.toContain('<img');
  expect(head).toContain('<title>Die Kraft der Gemeinschaft · Testquelle</title>');
});
it('ein Artikel behält Datum und Themen; die Startseite trägt nur die Wortmarke im Titel', () => {
  const artikel = render(Detail, { props: { data: seitendaten(), wortmarke: 'Testquelle' } });
  expect(artikel.body).toContain('<time');
  const start = render(Detail, { props: { data: seitendaten({ artikel: { ...seitendaten().artikel, istSeite: true, titel: 'Willkommen' } }), wortmarke: 'Testquelle', nurWortmarke: true } });
  expect(start.head).toContain('<title>Testquelle</title>');
});
```

(`seitendaten()` existiert; falls es `titel` nicht überschreiben lässt, minimal erweitern.) In `test/uebersicht.test.js` prüft der Themen-Komponententest `<title>Themen · Testquelle</title>` mit `data.struktur.wortmarke`.

- [ ] **Step 2:** FAIL. **Step 3: Implementieren.** `Detail.svelte`: Props `let { data, wortmarke, nurWortmarke = false } = $props();`, `<title>{nurWortmarke ? wortmarke : `${data.artikel.titel} · ${wortmarke}`}</title>`; Kopfbereich:

```svelte
  <header class="detail-kopf">
    <h1>{data.artikel.titel}</h1>
    {#if !data.artikel.istSeite}
      <div class="metazeile"> …Datum und Themen wie bisher… </div>
    {/if}
  </header>
  {#if !data.artikel.istSeite}
    <Bildbereich … />
    {#if data.artikel.zusammenfassung}<p class="vorspann">…</p>{/if}
  {/if}
```

`src/routes/[d]/+page.svelte` und `src/routes/en/[d]/+page.svelte`: `<Detail {data} wortmarke={data.struktur.wortmarke} />` — `data` einer Seite enthält die Layout-Daten (`struktur`), der lokale Typ in `Detail.svelte` bleibt auf die Seitenfelder beschränkt; die Route reicht `data.struktur.wortmarke` getrennt hinein. Übersichts-`+page.svelte`: `<title>{data.ueberschrift} · {data.struktur.wortmarke}</title>`. `+error.svelte`: `import { page } from '$app/state'; const wortmarke = $derived(page.data?.struktur?.wortmarke ?? 'Community-Hub');`.

- [ ] **Step 4:** grün. **Step 5:** Commit „Seiten ohne Datum und Cover; Seitentitel mit Wortmarke".

---

### Task 10: Startseite unter `/`, `/en` leitet auf `/`

**Files:** Modify `src/lib/routen/uebersicht.js`, `src/routes/+page.server.js`, `src/routes/+page.svelte`, `test/uebersicht-routen.test.js`; Create `src/routes/en/+page.server.js`

**Interfaces:** `startLaden({ konfig, inhalt })` liefert entweder `{ art: 'seite', seite: <detailLaden().seite> }` oder `{ art: 'blog', …blogLaden(), hinweis }` (wie heute). `detailLaden` wird mit `d: konfig.startseiteD, sprache: 'de'` aufgerufen; ein `naddr`-Segment kann hier nicht vorkommen.

- [ ] **Step 1: Failing tests** in `test/uebersicht-routen.test.js`:

```js
it('/ zeigt die Startseite als Seite, wenn sie publiziert ist', async () => {
  const { inhalt } = inhaltDerTestquelle();   // UMGEBUNG.QUELLE_AUTOR muss dafür der Testschlüssel sein — siehe Hilfsfunktion lade(…, { autor })
  const daten = await lade('../src/routes/+page.server.js', {}, inhalt, testquelle().pubkey);
  expect(daten.art).toBe('seite');
  expect(daten.seite.artikel.titel).toBe('Willkommen');
  expect(daten.seite.artikel.istSeite).toBe(true);
});
it('/ zeigt den Blog mit Hinweis, wenn die Startseite fehlt', async () => {
  const { inhalt } = inhaltDerTestquelle({ ohne: [{ kind: 30023, d: 'startseite' }] });
  const daten = await lade('../src/routes/+page.server.js', {}, inhalt, testquelle().pubkey);
  expect(daten.art).toBe('blog');
  expect(daten.hinweis).toContain('startseite');
});
it('/en leitet dauerhaft auf /', async () => {
  await expect(lade('../src/routes/en/+page.server.js', {})).rejects.toMatchObject({ status: 301, location: '/' });
});
```

Die Hilfsfunktion `lade` bekommt einen vierten Parameter `autor` (Standard FOERBICO), der `UMGEBUNG.QUELLE_AUTOR` für diesen Aufruf setzt (`vi.doMock('$env/dynamic/private', …)` je Aufruf, wie `vi.resetModules()` es ohnehin verlangt).

- [ ] **Step 2:** FAIL. **Step 3: Implementieren.** `routen/uebersicht.js`:

```js
import { detailLaden } from './detail.js';

/**
 * `/`: die Startseite (kind:30023, d = STARTSEITE_D) als Seite — oder, solange
 * sie fehlt, der Blog mit dem Hinweis, welches Event erwartet wird (ADR-0027).
 * @param {{ konfig: Konfig, inhalt: Inhalt }} e
 */
export async function startLaden({ konfig, inhalt }) {
  leerOderWeiter(konfig, inhalt);
  const { artikel } = artikelAusSpiegel(inhalt, { d: konfig.startseiteD });
  if (artikel) {
    const { seite } = await detailLaden({ d: konfig.startseiteD, sprache: artikel.sprache, konfig, inhalt });
    return /** @type {const} */ ({ art: 'seite', seite });
  }
  const blog = blogLaden({ konfig, inhalt, seite: 1 });
  return /** @type {const} */ ({
    art: 'blog', ...blog, ueberschrift: 'Beiträge',
    hinweis: `Es ist noch keine Startseite publiziert: erwartet wird ein kind:30023 mit d = "${konfig.startseiteD}" unter dem Autor dieser Quelle. Bis dahin steht hier der Blog.`
  });
}
```

(`artikelAusSpiegel` aus `../loaders/artikel.js` importieren.) `+page.server.js`: `export async function load() { return startLaden(…); }`. `+page.svelte`:

```svelte
<script>
  import Detail from '$lib/komponenten/Detail.svelte';
  import Uebersicht from '$lib/komponenten/Uebersicht.svelte';
  /** @type {{ data: import('./$types').PageData }} */
  let { data } = $props();
</script>

{#if data.art === 'seite'}
  <Detail data={data.seite} wortmarke={data.struktur.wortmarke} nurWortmarke />
{:else}
  <svelte:head><title>{data.struktur.wortmarke}</title></svelte:head>
  <Uebersicht karten={data.karten} seite={data.seite} seiten={data.seiten} basis={data.basis} ueberschrift={data.ueberschrift} hinweis={data.hinweis} />
{/if}
```

Achtung Namenskollision: im Blog-Zweig ist `data.seite` die Seitennummer, im Seiten-Zweig das Seitenobjekt — `svelte-check` prüft das über die diskriminierte Union `art`. Wenn es sich sperrt, den Blog-Zweig auf `seitennummer` umbenennen (`{ ...blog, seitennummer: blog.seite }`) und `Uebersicht seite={data.seitennummer}` geben.

`src/routes/en/+page.server.js`:

```js
import { redirect } from '@sveltejs/kit';
/** /en ohne d: Es gibt keine englische Startseite (Spec) — dorthin, wo die Startseite ist. */
export function load() {
  redirect(301, '/');
}
```

- [ ] **Step 4:** `pnpm check && pnpm test` grün; `pnpm dev` (Port 5199): `/` zeigt weiter den Blog mit Hinweis (live gibt es noch keine Startseite), Kopfzeile zeigt „FOERBICO" mit Logo (kind:0 live), `/en` → 301 `/`. **Step 5:** Commit „Startseite aus Nostr unter /, /en leitet auf / (ADR-0027)".

---

### Task 11: Dokumentation und Abschluss

**Files:** Modify `CLAUDE.md`, `docs/STATUS.md`, `docs/entscheidungen/0019-wortmarke-vorlaeufig-community-hub.md` (nur Statuszeile: „ersetzt durch ADR-0026/ADR-0027" — angenommene ADRs werden nicht umgeschrieben, die Statuszeile darf den Nachfolger nennen)

- [ ] **Step 1: CLAUDE.md:** Absatz „Zum Namen": Wortmarke kommt aus `kind:0` (`name`), Rückfall „Community-Hub" (ADR-0027); Abschnitt „Der Spiegel" um einen Satz: „Menü und Fußzeile sind Kuratierungslisten `kind:30004` (`d = navigation`, `d = fusszeile`), die Startseite ist die Seite `d = startseite`; alle drei Kennungen sind Konfiguration mit Standard (`NAVIGATION_D`, `FUSSZEILE_D`, `STARTSEITE_D`). Fehlt etwas, zeigt die Fußzeile im Debug-Modus den Struktur-Befund." Unter „Wiederkehrende Fallen": „Das Menü beschriftet Einträge mit dem Seitentitel; Ziele außerhalb des Spiegels oder fremder Quellen werden übersprungen und im Befund genannt." Fixtures-Absatz in „Arbeitsweise": Testquelle erwähnen (`test/fixtures/testquelle/`).
- [ ] **Step 2: STATUS.md:** Eintrag oben („2026-09-14 (spät) — Stufe 2: Struktur aus Nostr"): Passiert (Modelle, Loader, Layout, Kopf/Fuß, Startseite, `/en`, Testquelle-Fixtures, Testzahl), Wo steht es (live: Wortmarke/Logo aus `kind:0` sichtbar; Menü, Fußzeile, Startseite zeigen Rückfälle, bis mdparser publiziert — die vier Punkte aus der Spec), Nächster Schritt (mdparser-Punkte 1–4 und Profil-`about`; danach Stufe 3 Gestaltung).
- [ ] **Step 3:** `pnpm check && pnpm test`, `pnpm build`, Rauchtest des Builds wie in Stufe 1. **Step 4:** Commit „Doku: Struktur aus Nostr in CLAUDE.md und STATUS (Stufe 2)". Danach `superpowers:finishing-a-development-branch`.

---

## Selbstprüfung gegen die Spec (Stufe-2-Anteil)

| Spec-Anforderung | Task |
|---|---|
| `/` = Startseite `d = startseite`; Rückfall Blog mit Hinweis | 10 |
| `/en` → `/` | 10 |
| Seiten: Selbst-Label (Stufe 1), keine Datum/Themen/Cover, Entwickleransicht bleibt | 9 |
| Menü `30004 d=navigation`, Beschriftung = Seitentitel, Hub-Ansichten angehängt, fehlende Ziele übersprungen und genannt, Startseite nicht im Menü | 4, 5, 6, 7 |
| Fußzeilenlinks `30004 d=fusszeile` | 5, 6, 8 |
| Wortmarke `name`/`display_name`, Logo `picture`, Fußtext `about` (Markdown ohne Bilder), Domain `website` gelesen (genutzt in Stufe 4) | 3, 6, 7, 8 |
| Rückfälle ohne leere Fläche; Hinweis in der Entwickleransicht | 5, 6, 8, 10 |
| `<title>` `<Seitentitel> · <Wortmarke>`, Startseite nur Wortmarke | 9, 10 |
| Konfiguration `STARTSEITE_D`, `NAVIGATION_D`, `FUSSZEILE_D` | 1 |
| Testschlüssel-Fixtures mit Skript und README | 2 |
| Kein Sprachumschalter, keine englische Startseite | 10 (nur Redirect) |

Nicht hier: FOERBICO-Tokens, Feed, Sitemap, kanonische URLs mit `website`, `trailingSlash`, mdparser-Arbeiten.
