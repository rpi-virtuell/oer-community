# Stufe 1: Spiegel, Blog, `/[d]`, Themen — Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Der Hub rendert nie mehr direkt vom Relay, zeigt erstmals eine Artikelübersicht mit Themen und adressiert Beiträge über ihr `d`; `naddr` leitet weiter.

**Architecture:** Ein Spiegel im Node-Prozess (`services/spiegel.js`) lädt beim Start und alle zehn Minuten alle Events des Autors über alle Relays, hält sie im Speicher und als JSON-Datei; Loader lesen ausschließlich aus ihm. Routen unter `/[d]`, `/blog`, `/themen` bauen aus dem Spiegel Seiten; die bestehende Detailansicht samt Entwickleransicht zieht von `/[naddr]` nach `/[d]` um.

**Tech Stack:** SvelteKit 2 (Svelte 5 Runes), JavaScript mit JSDoc unter `checkJs`+`strict`, Vitest mit `svelte/server`, `ws` für Relays, `nostr-tools/nip19` nur für `naddr`.

**Spec:** `docs/superpowers/specs/2026-09-14-oer-community-aus-nostr-design.md` — dieser Plan setzt Stufe 1 um (Abschnitte „Routen", „Datenschicht: der Spiegel", „Bilder", „Fehlerfälle", „Tests", „Konfiguration"). Seiten, Menü, Fußzeile aus `kind:0`/`30004`, Startseite, `/en/`-Menüführung, Gestaltung, Feed und Sitemap sind Stufe 2 bis 4 und **nicht** hier.

## Global Constraints

- Oberfläche, Code, Bezeichner, Commits auf **Deutsch**; Nostr-Namen (`kind`, `tags`, `d`, `x`, `published_at`, `naddr`) bleiben englisch (CLAUDE.md).
- **Die Datenschicht kennt die Oberfläche nicht:** nichts unter `src/lib/loaders/`, `models/`, `services/` importiert aus `routes/` oder `$app/` (ADR-0014, geprüft in `src/lib/architektur.test.js`).
- **Kein Loader und keine Route spricht selbst mit einem Relay** — nur `services/spiegel.js` importiert `services/relay.js` (ADR-0028; Regel kommt in Task 15 in den Architekturtest).
- **Applesauce/eigener Code für Relays, nie `nostr-tools` für Relay-Kommunikation** (ADR-0009). Erlaubt: `nostr-tools/nip19`, `nostr-tools/pure`.
- **Kein `ssr = false`** (ADR-0003). Komponenten werden mit `svelte/server` getestet.
- **Events werden nie verändert.** Säuberung nur beim Rendern.
- **Nie eine leere Liste ohne Erklärung.** Jede Meldung nennt Relays oder Autor.
- Tests laufen **ohne Netz** gegen Fixtures in `test/fixtures/`. Neue Funktionen kommen mit Prüfung.
- Vor jedem Commit: `pnpm check && pnpm test` grün.
- Commits enden mit `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Arbeitsbranch: `feat/stufe-1-spiegel` von `dev`.

## Dateistruktur

| Datei | Zuständigkeit |
|---|---|
| `src/lib/konfig.js` (ändern) | neue Werte `abgeloesteHosts`, `spiegelPfad`, `spiegelIntervallS`, `spiegelStartwartezeitS` |
| `src/lib/models/lizenz.js` (ändern) | Grund `abgeloester-host`, `hostAbgeloest()` |
| `src/lib/models/artikel.js` (ändern) | `sprache`, `istSeite`, `beitragsPfad()` |
| `src/lib/models/entwickleransicht.js` (ändern) | Schritt 1 kennt `abgeloester-host`; `abgeloesteHosts` durchreichen |
| `src/lib/models/leerstand.js` (neu) | Meldung, wenn der Spiegel leer ist |
| `src/lib/services/blossom.js` (neu) | `etagHolen` (aus `loaders/lizenz.js` verschoben) |
| `src/lib/services/spiegel.js` (neu) | Spiegel: auffrischen, zusammenführen, Datei, Timer, Singleton |
| `src/lib/loaders/artikel.js` (ersetzen) | `artikelAusSpiegel`, `abfrageAusStand` |
| `src/lib/loaders/lizenz.js` (ersetzen) | `nachweiseAusSpiegel`, `etagAusSpiegel` |
| `src/lib/loaders/beitrag.js` (ändern) | liest aus dem Spiegelinhalt statt vom Relay |
| `src/lib/loaders/uebersicht.js` (neu) | `artikelListe`, `themenListe` |
| `src/lib/themen.js` (neu), `daten/themen.json` (neu) | Normalisierung, Slugs |
| `src/hooks.server.js` (neu) | startet den Spiegel |
| `src/routes/+layout.server.js` (neu) | Stand des Spiegels für die Fußzeile |
| `src/routes/[d]/…` (verschoben aus `[naddr]/`) | Detail, JSON, `naddr`-Weiterleitung |
| `src/routes/blog/…`, `src/routes/themen/…`, `src/routes/+page.*` | Übersichten |
| `src/lib/komponenten/Karte.svelte`, `Uebersicht.svelte` (neu) | Kartenliste und Seitenzahlen |
| `src/lib/komponenten/Kopfzeile.svelte`, `Fusszeile.svelte`, `Bildbereich.svelte`, `DebugBereich.svelte` (ändern) | Navigation, Stand, abgelöste Hosts, Spiegel-Stand |
| `src/lib/architektur.test.js` (ändern) | Regel „nur der Spiegel spricht mit Relays" |
| `CLAUDE.md`, `docs/betrieb.md`, `docs/STATUS.md`, `.env.example` | nachziehen |

---

### Task 0: Branch anlegen

- [ ] **Step 1: Branch von `dev`**

```bash
git checkout dev && git pull --ff-only && git checkout -b feat/stufe-1-spiegel
pnpm install && pnpm check && pnpm test
```

Expected: 190 Tests grün, `svelte-check` ohne Befund. Wenn nicht, erst das klären.

---

### Task 1: Konfiguration erweitern

**Files:**
- Modify: `src/lib/konfig.js`
- Modify: `src/lib/konfig.test.js`
- Modify: `.env.example`

**Interfaces:**
- Produces: `Konfig` bekommt `abgeloesteHosts: string[]`, `spiegelPfad: string`, `spiegelIntervallS: number`, `spiegelStartwartezeitS: number`.

- [ ] **Step 1: Failing tests**

An `src/lib/konfig.test.js` anhängen:

```js
describe('konfigLesen: Spiegel und abgelöste Hosts (Spec 14.09.)', () => {
  const GUELTIG = {
    QUELLE_AUTOR: 'a'.repeat(64),
    RELAYS: 'wss://relay.edufeed.org/',
    BLOSSOM_URL: 'https://blossom.edufeed.org/'
  };

  it('nimmt Standardwerte, wenn nichts gesetzt ist', () => {
    const k = konfigLesen(GUELTIG);
    expect(k.abgeloesteHosts).toEqual(['oer.community']);
    expect(k.spiegelPfad).toBe('daten/spiegel.json');
    expect(k.spiegelIntervallS).toBe(600);
    expect(k.spiegelStartwartezeitS).toBe(20);
  });

  it('liest mehrere Hosts, klein und ohne Leerzeichen', () => {
    const k = konfigLesen({ ...GUELTIG, ABGELOESTE_HOSTS: ' OER.community , alt.example ' });
    expect(k.abgeloesteHosts).toEqual(['oer.community', 'alt.example']);
  });

  it('leere ABGELOESTE_HOSTS heißt: keiner', () => {
    expect(konfigLesen({ ...GUELTIG, ABGELOESTE_HOSTS: '' }).abgeloesteHosts).toEqual([]);
  });

  it('bricht ab, wenn ein Intervall keine positive Ganzzahl ist', () => {
    expect(() => konfigLesen({ ...GUELTIG, SPIEGEL_INTERVALL_S: 'zehn' })).toThrow(/SPIEGEL_INTERVALL_S/);
    expect(() => konfigLesen({ ...GUELTIG, SPIEGEL_STARTWARTEZEIT_S: '0' })).toThrow(/SPIEGEL_STARTWARTEZEIT_S/);
  });
});
```

- [ ] **Step 2: Run** `pnpm vitest run src/lib/konfig.test.js` — Expected: FAIL (`abgeloesteHosts` undefined).

- [ ] **Step 3: Implementieren** in `src/lib/konfig.js`. Typedef erweitern und vor `return` einfügen:

```js
/**
 * @typedef {object} Konfig
 * @property {string} autor
 * @property {string|null} hTag
 * @property {string[]} relays
 * @property {string} blossomUrl
 * @property {string[]} abgeloesteHosts       Bild-Hosts, die der Hub ersetzt (ADR-0030)
 * @property {string} spiegelPfad             JSON-Datei des Spiegels (ADR-0028)
 * @property {number} spiegelIntervallS       Abstand zwischen zwei Läufen
 * @property {number} spiegelStartwartezeitS  wie lange der Start auf den ersten Lauf wartet
 */

/**
 * Positive Ganzzahl aus der Umgebung, mit Standard. Ein gesetzter, aber
 * unbrauchbarer Wert bricht ab — stiller Rückfall auf den Standard würde
 * eine Fehlkonfiguration verstecken.
 * @param {string|undefined} roh @param {number} standard @param {string} name
 */
function positiveGanzzahl(roh, standard, name) {
  const text = (roh ?? '').trim();
  if (text === '') return standard;
  const wert = Number(text);
  if (!Number.isInteger(wert) || wert <= 0) {
    throw new Error(`${name} muss eine positive Ganzzahl sein, ist aber "${text}".`);
  }
  return wert;
}
```

und im Rumpf:

```js
  // ADR-0030: Standard ist die Domain, die der Hub ablöst. Ein leerer Wert
  // schaltet die Regel bewusst ab — leer ist nicht "nicht gesetzt".
  const abgeloesteHosts =
    quelle.ABGELOESTE_HOSTS === undefined
      ? ['oer.community']
      : quelle.ABGELOESTE_HOSTS.split(',').map((h) => h.trim().toLowerCase()).filter(Boolean);

  const spiegelPfad = (quelle.SPIEGEL_PFAD ?? '').trim() || 'daten/spiegel.json';
  const spiegelIntervallS = positiveGanzzahl(quelle.SPIEGEL_INTERVALL_S, 600, 'SPIEGEL_INTERVALL_S');
  const spiegelStartwartezeitS = positiveGanzzahl(
    quelle.SPIEGEL_STARTWARTEZEIT_S, 20, 'SPIEGEL_STARTWARTEZEIT_S'
  );

  const rohHTag = (quelle.QUELLE_H_TAG ?? '').trim();
  return {
    autor, hTag: rohHTag === '' ? null : rohHTag, relays, blossomUrl,
    abgeloesteHosts, spiegelPfad, spiegelIntervallS, spiegelStartwartezeitS
  };
```

- [ ] **Step 4: `.env.example`** ergänzen (nach dem Bilder-Block):

```
# ── Spiegel (ADR-0028) ──────────────────────────────────────────────────
# Jede Anfrage rendert aus dem Spiegel, nie direkt vom Relay. Die Datei
# hält den letzten gültigen Stand über Neustarts.
SPIEGEL_PFAD=daten/spiegel.json
SPIEGEL_INTERVALL_S=600
SPIEGEL_STARTWARTEZEIT_S=20

# ── Abgelöste Bild-Hosts (ADR-0030) ─────────────────────────────────────
# Bilder von diesen Hosts gelten als unaufgelöst: entfernt und gezählt.
# Leer lassen schaltet die Regel ab.
ABGELOESTE_HOSTS=oer.community
```

und `RELAYS` in der Vorlage auf alle drei setzen:
`RELAYS=wss://relay.edufeed.org/,wss://relay-rpi.edufeed.org/,wss://amb-relay.edufeed.org/`

Alle anderen Tests, die `KONFIG`-Objekte von Hand bauen (`beitrag.test.js`, `adresse.test.js`), bekommen die vier neuen Felder — sonst meckert `svelte-check`. Suche: `grep -rn "blossomUrl:" src test`.

- [ ] **Step 5: Run** `pnpm check && pnpm test` — Expected: grün.

- [ ] **Step 6: Commit**

```bash
git add src/lib/konfig.js src/lib/konfig.test.js .env.example src/lib/loaders/beitrag.test.js src/lib/models/adresse.test.js
git commit -m "Konfiguration: Spiegel-Werte und abgelöste Bild-Hosts (ADR-0028, ADR-0030)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Abgelöste Hosts in der Lizenzkette (ADR-0030)

**Files:**
- Modify: `src/lib/models/lizenz.js`, `src/lib/models/lizenz.test.js`
- Modify: `src/lib/models/entwickleransicht.js`, `src/lib/models/entwickleransicht.test.js`
- Modify: `src/lib/komponenten/Bildbereich.svelte`, `test/oberflaeche.test.js`

**Interfaces:**
- Produces: `hostAbgeloest(url: string, hosts: string[]): boolean`; `Grund` erweitert um `'abgeloester-host'`; `lizenzPruefen({ bildUrl, bildHash, nachweis, etag, abgeloesteHosts = [] })`; `befundErstellen({ …, abgeloesteHosts = [] })`.

- [ ] **Step 1: Failing tests** in `src/lib/models/lizenz.test.js` anhängen:

```js
import { hostAbgeloest } from './lizenz.js';

describe('abgelöste Hosts (ADR-0030)', () => {
  it('erkennt den Host samt Subdomains, aber nicht Teilstrings', () => {
    expect(hostAbgeloest('https://oer.community/x.jpg', ['oer.community'])).toBe(true);
    expect(hostAbgeloest('https://www.oer.community/x.jpg', ['oer.community'])).toBe(true);
    expect(hostAbgeloest('https://OER.COMMUNITY/x.jpg', ['oer.community'])).toBe(true);
    expect(hostAbgeloest('https://notoer.community/x.jpg', ['oer.community'])).toBe(false);
    expect(hostAbgeloest('https://blossom.edufeed.org/x.jpg', ['oer.community'])).toBe(false);
    expect(hostAbgeloest('kaputt', ['oer.community'])).toBe(false);
  });

  it('lizenzPruefen meldet abgeloester-host vor dem x-Tag', () => {
    const e = lizenzPruefen({
      bildUrl: 'https://oer.community/bild.jpg',
      bildHash: null,
      nachweis: null,
      abgeloesteHosts: ['oer.community']
    });
    expect(e.ok).toBe(false);
    if (!e.ok) expect(e.grund).toBe('abgeloester-host');
  });

  it('ohne Hostliste bleibt alles wie bisher', () => {
    const e = lizenzPruefen({ bildUrl: 'https://oer.community/bild.jpg', bildHash: null, nachweis: null });
    if (!e.ok) expect(e.grund).toBe('kein-x-tag');
  });
});
```

In `entwickleransicht.test.js`:

```js
it('Schritt 1 scheitert bei abgelöstem Host, alles danach ungeprüft', () => {
  const b = befundErstellen({
    artikelEvent: ARTIKEL, artikelAbfrage: ABFRAGE, bildUrl: 'https://oer.community/b.jpg',
    bildHash: null, lizenzEvents: [], lizenzAbfrage: ABFRAGE, nachweis: null,
    abgeloesteHosts: ['oer.community']
  });
  expect(b.kette.grund).toBe('abgeloester-host');
  expect(b.kette.schritte.map((s) => s.ok)).toEqual([false, null, null, null, null]);
});
```

(`ARTIKEL` und `ABFRAGE` gibt es in der Datei schon; die Namen prüfen und übernehmen.)

In `test/oberflaeche.test.js` bei den Bildbereich-Fällen:

```js
it('zeigt für ein Bild von einem abgelösten Host kein <img>, sondern den Hinweis', () => {
  const { body } = render(Bildbereich, {
    props: { lizenz: { ok: false, grund: 'abgeloester-host' }, titel: 'T', bildUrl: 'https://oer.community/b.jpg' }
  });
  expect(body).not.toContain('<img');
  expect(body).toContain(GRUND_TEXT['abgeloester-host']);
});
```

- [ ] **Step 2: Run** `pnpm vitest run src/lib/models test/oberflaeche.test.js` — Expected: FAIL.

- [ ] **Step 3: Implementieren.** `models/lizenz.js`:

```js
/**
 * @typedef {'kein-bild'|'relativ'|'abgeloester-host'|'kein-x-tag'|'kein-nachweis'
 *   |'pflichtfeld-fehlt'|'hash-widerspruch'} Grund
 */

// in GRUND_TEXT ergänzen:
  'abgeloester-host':
    'Das Bild liegt auf einem Host, den dieser Hub ablöst — dort gibt es es bald nicht mehr. ' +
    'Es gehört auf Blossom, mit Lizenznachweis (ADR-0030).',

/**
 * Liegt die URL auf einem Host, den der Hub ersetzt? Subdomains zählen mit
 * (`www.oer.community`), Teilstrings nicht (`notoer.community`).
 * @param {string} url @param {string[]} hosts
 */
export function hostAbgeloest(url, hosts) {
  if (!hosts || hosts.length === 0) return false;
  let hostname;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }
  return hosts.some((h) => hostname === h || hostname.endsWith(`.${h}`));
}
```

`lizenzPruefen` bekommt `abgeloesteHosts = []` und nach Schritt 1:

```js
  // Schritt 1b: Host, den der Hub ersetzt? Dann ist das Bild so tot wie ein
  // relativer Pfad (ADR-0030) — geprüft vor dem x-Tag, weil die Frage nach
  // dem Nachweis sich für dieses Bild nicht mehr stellt.
  if (hostAbgeloest(bildUrl, abgeloesteHosts)) return { ok: false, grund: 'abgeloester-host' };
```

`entwickleransicht.js`: `KETTE[0].gruende = ['kein-bild', 'relativ', 'abgeloester-host']`, Frage: `'Ist ein Bild angegeben, absolut adressiert und nicht von einem abgelösten Host?'`; `befundErstellen` nimmt `abgeloesteHosts = []` an und reicht es an `lizenzPruefen` durch.

`Bildbereich.svelte`:

```js
  const NICHT_ZEIGBAR = ['kein-bild', 'relativ', 'abgeloester-host'];
  const zeigbar = $derived(Boolean(quelle) && (lizenz.ok || !NICHT_ZEIGBAR.includes(lizenz.grund)));
```

und der `{:else if}`-Zweig: `lizenz.ok === false && (lizenz.grund === 'relativ' || lizenz.grund === 'abgeloester-host')`.

- [ ] **Step 4: Run** `pnpm check && pnpm test` — Expected: grün.

- [ ] **Step 5: Commit** `git commit -am "Bilder von abgelösten Hosts gelten als unaufgelöst (ADR-0030)" ` mit Co-Authored-By-Zeile.

---

### Task 3: Artikelmodell: Sprache, Seite, Pfad

**Files:**
- Modify: `src/lib/models/artikel.js`, `src/lib/models/artikel.test.js`

**Interfaces:**
- Produces: `Artikel.sprache: 'de'|'en'`, `Artikel.istSeite: boolean`, `beitragsPfad(artikel: {d, sprache}): string`, `SEITEN_LABEL = { namensraum: 'foerbico/typ', wert: 'seite' }`.

- [ ] **Step 1: Failing tests** anhängen:

```js
import { beitragsPfad } from './artikel.js';

describe('Sprache, Seite und Pfad (Spec 14.09.)', () => {
  const basis = { id: 'x', pubkey: 'p', created_at: 1, kind: 30023, content: '', sig: 's' };

  it('liest inLanguage, Standard de, en auch als en-US', () => {
    expect(artikelAusEvent({ ...basis, tags: [['d', 'a']] }).sprache).toBe('de');
    expect(artikelAusEvent({ ...basis, tags: [['d', 'a'], ['inLanguage', 'en']] }).sprache).toBe('en');
    expect(artikelAusEvent({ ...basis, tags: [['d', 'a'], ['inLanguage', 'en-US']] }).sprache).toBe('en');
    // mdparser schrieb bei 19 Artikeln "d" — das ist deutsch, kein Fehler hier.
    expect(artikelAusEvent({ ...basis, tags: [['d', 'a'], ['inLanguage', 'd']] }).sprache).toBe('de');
  });

  it('erkennt eine Seite am Selbst-Label foerbico/typ = seite', () => {
    const seite = artikelAusEvent({
      ...basis, tags: [['d', 'impressum'], ['L', 'foerbico/typ'], ['l', 'seite', 'foerbico/typ']]
    });
    expect(seite.istSeite).toBe(true);
    const fremd = artikelAusEvent({ ...basis, tags: [['d', 'x'], ['l', 'seite', 'anderer/raum']] });
    expect(fremd.istSeite).toBe(false);
  });

  it('baut den Pfad aus Sprache und d', () => {
    expect(beitragsPfad({ d: 'canva', sprache: 'de' })).toBe('/canva');
    expect(beitragsPfad({ d: 'our-team', sprache: 'en' })).toBe('/en/our-team');
    expect(beitragsPfad({ d: 'ä ö', sprache: 'de' })).toBe('/%C3%A4%20%C3%B6');
  });
});
```

- [ ] **Step 2: Run** — Expected: FAIL.

- [ ] **Step 3: Implementieren** in `models/artikel.js`:

```js
/** Selbst-Label, das eine Seite von einem Artikel unterscheidet (ADR-0027, NIP-32). */
export const SEITEN_LABEL = { namensraum: 'foerbico/typ', wert: 'seite' };

/** @param {string|null} wert */
function spracheAus(wert) {
  return (wert ?? '').trim().toLowerCase().startsWith('en') ? 'en' : 'de';
}

// in artikelAusEvent ergänzen:
    sprache: spracheAus(tagWert(tags, 'inLanguage')),
    istSeite: tags.some(
      (t) => t[0] === 'l' && t[1] === SEITEN_LABEL.wert && t[2] === SEITEN_LABEL.namensraum
    ),

/**
 * Der Pfad eines Beitrags im Hub — sein d, für englische Inhalte unter /en/
 * (ADR-0029). Die Adresse ist der Hugo-Pfad, kein naddr.
 * @param {{ d: string, sprache: 'de'|'en' }} beitrag
 */
export function beitragsPfad(beitrag) {
  const d = encodeURIComponent(beitrag.d);
  return beitrag.sprache === 'en' ? `/en/${d}` : `/${d}`;
}
```

Typedef `Artikel` um `sprache` und `istSeite` ergänzen.

- [ ] **Step 4: Run** `pnpm check && pnpm test` — grün. **Step 5: Commit** „Artikelmodell: Sprache, Seiten-Label, Beitragspfad (ADR-0027, ADR-0029)".

---

### Task 4: Spiegel — auffrischen und zusammenführen

**Files:**
- Create: `src/lib/services/blossom.js` (verschobenes `etagHolen`)
- Create: `src/lib/services/spiegel.js`, `src/lib/services/spiegel.test.js`
- Modify: `src/lib/loaders/lizenz.js` (Import von `etagHolen` entfernen — die Datei wird in Task 7 ohnehin ersetzt; hier nur den Export aus `blossom.js` re-exportieren, damit nichts bricht: `export { etagHolen } from '../services/blossom.js';`)

**Interfaces:**
- Consumes: `eventsVonAllen(relays, filter, { holen })` aus `services/relay.js`; `hashAusUrl` aus `models/lizenz.js`.
- Produces:

```js
/** @typedef {object} Stand
 *  @property {string} zeitpunkt            ISO-8601
 *  @property {number} dauerMs
 *  @property {string[]} gefragteRelays
 *  @property {string[]} nichtErreichbar    Relays ohne Antwort in irgendeiner Abfrage des Laufs
 *  @property {{ artikel: number, listen: number, nachweise: number, profil: number }} anzahl */
/** @typedef {object} Inhalt
 *  @property {Stand|null} stand
 *  @property {Event[]} artikel             kind:30023, neuestes je d (Seiten eingeschlossen)
 *  @property {Event[]} listen              kind:30004, neuestes je d
 *  @property {Event|null} profil           kind:0
 *  @property {Event[]} nachweise           kind:1063, alle, dedupliziert nach id
 *  @property {Record<string,string[]>} quellen   Event-id → Relays, die es lieferten
 *  @property {Record<string,string>} etags       Bild-URL → etag */
/** @typedef {{ zeitpunkt: string, gefragteRelays: string[] }} Fehlschlag */
export function leererInhalt(): Inhalt
export function hashesSammeln(artikel: Event[]): string[]
export function bildUrlsSammeln(artikel: Event[]): string[]
export function spiegelErstellen({ konfig, holen?, etagHolen?, jetzt? }): {
  lesen(): Inhalt,
  letzterFehlschlag(): Fehlschlag|null,
  auffrischen(): Promise<{ gueltig: boolean, inhalt: Inhalt }>
}
```

- [ ] **Step 1: `services/blossom.js`** anlegen — Inhalt ist die bisherige Funktion `etagHolen` aus `loaders/lizenz.js`, unverändert, mit Kopfkommentar „HEAD gegen Blossom; der etag ist der SHA-256 (BUD-01)". In `loaders/lizenz.js` die Funktion löschen und `export { etagHolen } from '../services/blossom.js';` einsetzen.

- [ ] **Step 2: Failing tests** `src/lib/services/spiegel.test.js`:

```js
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { hashesSammeln, leererInhalt, spiegelErstellen } from './spiegel.js';

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
  spiegelPfad: 'x.json', spiegelIntervallS: 600, spiegelStartwartezeitS: 20
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
      const passt = NACHWEIS.tags.some((t) => t[0] === 'x' && gesucht.includes(t[1]));
      return { events: url === RPI && passt ? [NACHWEIS] : [], erreicht: true };
    }
    return { events: [], erreicht: true };
  };
}

describe('hashesSammeln', () => {
  it('nimmt x-Tags und Hash-URLs aus Text und image, ohne Dubletten', () => {
    const hashes = hashesSammeln([ARTIKEL_NEU]);
    expect(hashes).toContain(ARTIKEL_NEU.tags.find((t) => t[0] === 'x')[1]);
    expect(new Set(hashes).size).toBe(hashes.length);
  });
  it('liefert für den Altbestand ohne x nichts Erfundenes', () => {
    const ohneX = BESTAND.filter((e) => !e.tags.some((t) => t[0] === 'x') && !/[0-9a-f]{64}/.test(e.content));
    expect(hashesSammeln(ohneX)).toEqual([]);
  });
});

describe('spiegelErstellen().auffrischen', () => {
  it('führt ersetzbare Events zusammen: neuestes created_at je d gewinnt', async () => {
    const s = spiegelErstellen({ konfig: KONFIG, holen: relays(), etagHolen: async () => undefined });
    const { gueltig, inhalt } = await s.auffrischen();
    expect(gueltig).toBe(true);
    expect(inhalt.artikel).toHaveLength(1);
    expect(inhalt.artikel[0].id).toBe(ARTIKEL_NEU.id);
    expect(inhalt.profil?.id).toBe(PROFIL.id);
  });

  it('holt die Nachweise über alle Relays und merkt sich die Herkunft', async () => {
    const s = spiegelErstellen({ konfig: KONFIG, holen: relays(), etagHolen: async () => undefined });
    const { inhalt } = await s.auffrischen();
    expect(inhalt.nachweise.map((e) => e.id)).toEqual([NACHWEIS.id]);
    expect(inhalt.quellen[NACHWEIS.id]).toEqual([RPI]);
    expect(inhalt.quellen[ARTIKEL_NEU.id]).toEqual([RELAY]);
  });

  it('fragt den etag nur für attestierte Bild-URLs', async () => {
    const etagHolen = vi.fn(async () => '"abc"');
    const s = spiegelErstellen({ konfig: KONFIG, holen: relays(), etagHolen });
    const { inhalt } = await s.auffrischen();
    const cover = ARTIKEL_NEU.tags.find((t) => t[0] === 'image')[1];
    expect(etagHolen).toHaveBeenCalledWith(cover);
    expect(inhalt.etags[cover]).toBe('"abc"');
  });

  it('ein Lauf ohne antwortendes Relay ist ungültig und ersetzt nichts', async () => {
    const lage = { tot: /** @type {string[]} */ ([]) };
    const s = spiegelErstellen({ konfig: KONFIG, holen: relays(lage), etagHolen: async () => undefined });
    await s.auffrischen();
    const vorher = s.lesen();
    lage.tot = [RELAY, RPI];
    const { gueltig } = await s.auffrischen();
    expect(gueltig).toBe(false);
    expect(s.lesen()).toBe(vorher);
    expect(s.letzterFehlschlag()?.gefragteRelays).toEqual([RELAY, RPI]);
    const nie = spiegelErstellen({ konfig: KONFIG, holen: relays(lage), etagHolen: async () => undefined });
    await nie.auffrischen();
    expect(nie.lesen()).toEqual(leererInhalt());
  });

  it('ein Relay tot, eines antwortet: gültig, das tote steht im Stand', async () => {
    const s = spiegelErstellen({ konfig: KONFIG, holen: relays({ tot: [RPI] }), etagHolen: async () => undefined });
    const { gueltig, inhalt } = await s.auffrischen();
    expect(gueltig).toBe(true);
    expect(inhalt.stand?.nichtErreichbar).toEqual([RPI]);
    expect(inhalt.nachweise).toEqual([]);
    expect(inhalt.stand?.anzahl).toEqual({ artikel: 1, listen: 0, nachweise: 0, profil: 1 });
  });

  it('fragt Nachweise in Blöcken zu höchstens 50 Hashes', async () => {
    const viele = Array.from({ length: 120 }, (_, i) => ({
      ...ARTIKEL_NEU, id: `id${i}`,
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
    const s = spiegelErstellen({ konfig: KONFIG, holen, etagHolen: async () => undefined });
    await s.auffrischen();
    expect(groessen).toEqual([50, 50, 20]);
  });
});
```

- [ ] **Step 3: Run** `pnpm vitest run src/lib/services/spiegel.test.js` — FAIL (Modul fehlt).

- [ ] **Step 4: Implementieren** `src/lib/services/spiegel.js`:

```js
/**
 * Der Spiegel: alle Events, die der Hub braucht, im Speicher (ADR-0028).
 *
 * Ein Lauf baut einen vollständigen neuen Stand über ALLE konfigurierten
 * Relays und tauscht ihn atomar ein — Leser sehen nie einen halben Stand.
 * Gültig ist ein Lauf, wenn mindestens ein Relay die Artikelabfrage
 * beantwortet hat; ein ungültiger Lauf ersetzt nichts und wird als
 * Fehlschlag gemerkt, damit die Fußzeile das Alter nennen kann.
 *
 * Diese Datei ist die EINZIGE, die `services/relay.js` importiert
 * (Architekturtest). Sie kennt die Oberfläche nicht.
 */

import { hashAusUrl } from '../models/lizenz.js';
import { etagHolen as etagHolenEcht } from './blossom.js';
import { eventsHolen, eventsVonAllen } from './relay.js';

/** @typedef {import('./relay.js').Event} Event */
/** @typedef {import('../konfig.js').Konfig} Konfig */
/**
 * @typedef {object} Stand
 * @property {string} zeitpunkt
 * @property {number} dauerMs
 * @property {string[]} gefragteRelays
 * @property {string[]} nichtErreichbar
 * @property {{ artikel: number, listen: number, nachweise: number, profil: number }} anzahl
 */
/**
 * @typedef {object} Inhalt
 * @property {Stand|null} stand
 * @property {Event[]} artikel
 * @property {Event[]} listen
 * @property {Event|null} profil
 * @property {Event[]} nachweise
 * @property {Record<string, string[]>} quellen
 * @property {Record<string, string>} etags
 */
/** @typedef {{ zeitpunkt: string, gefragteRelays: string[] }} Fehlschlag */

/** Bild-Syntax in Markdown — dieselbe Regex wie inhalt.js und mdparser. */
const BILD = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
/** Relays begrenzen Filtergrößen; 50 Hashes je REQ sind überall sicher. */
const BLOCK = 50;

/** @returns {Inhalt} */
export function leererInhalt() {
  return { stand: null, artikel: [], listen: [], profil: null, nachweise: [], quellen: {}, etags: {} };
}

/** @param {string[][]} tags @param {string} name */
const tagWert = (tags, name) => tags.find((t) => t[0] === name && t.length > 1)?.[1] ?? null;

/** Neuestes created_at gewinnt, Gleichstand kleinste id — wie nachweisAusEvents. @param {Event} a @param {Event} b */
const neuer = (a, b) => (b.created_at !== a.created_at ? b.created_at - a.created_at : a.id.localeCompare(b.id));

/**
 * Ersetzbare Events: je d nur das neueste.
 * @param {Event[]} events @returns {Event[]}
 */
export function neuestesJeD(events) {
  /** @type {Map<string, Event>} */
  const nachD = new Map();
  for (const e of events) {
    const d = tagWert(e.tags ?? [], 'd') ?? '';
    const bisher = nachD.get(d);
    if (!bisher || neuer(bisher, e) > 0) nachD.set(d, e);
  }
  return [...nachD.values()];
}

/**
 * Alle Bild-URLs eines Bestands: image-Tags und Bilder im Markdown.
 * @param {Event[]} artikel @returns {string[]}
 */
export function bildUrlsSammeln(artikel) {
  /** @type {Set<string>} */
  const urls = new Set();
  for (const e of artikel) {
    const cover = tagWert(e.tags ?? [], 'image');
    if (cover) urls.add(cover);
    for (const treffer of (e.content ?? '').matchAll(BILD)) urls.add(treffer[1]);
  }
  return [...urls];
}

/**
 * Alle Hashes, zu denen ein Nachweis gesucht wird: x-Tags plus Hashes aus
 * Hash-URLs (ADR-0023). Kein Hash wird erraten.
 * @param {Event[]} artikel @returns {string[]}
 */
export function hashesSammeln(artikel) {
  /** @type {Set<string>} */
  const hashes = new Set();
  for (const e of artikel) {
    for (const t of e.tags ?? []) if (t[0] === 'x' && /^[0-9a-f]{64}$/i.test(t[1] ?? '')) hashes.add(t[1].toLowerCase());
  }
  for (const url of bildUrlsSammeln(artikel)) {
    const h = hashAusUrl(url);
    if (h) hashes.add(h);
  }
  return [...hashes];
}

/**
 * @param {object} eingabe
 * @param {Konfig} eingabe.konfig
 * @param {typeof eventsHolen} [eingabe.holen]        nur zum Prüfen austauschbar
 * @param {typeof etagHolenEcht} [eingabe.etagHolen]  dito
 * @param {() => number} [eingabe.jetzt]               dito
 */
export function spiegelErstellen({ konfig, holen = eventsHolen, etagHolen = etagHolenEcht, jetzt = () => Date.now() }) {
  let inhalt = leererInhalt();
  /** @type {Fehlschlag|null} */
  let fehlschlag = null;

  async function auffrischen() {
    const start = jetzt();
    const relays = konfig.relays;
    const nachAutor = (/** @type {number} */ kind) =>
      eventsVonAllen(relays, { kinds: [kind], authors: [konfig.autor] }, { holen });

    const [a, l, p] = await Promise.all([nachAutor(30023), nachAutor(30004), nachAutor(0)]);

    if (a.grund !== null) {
      fehlschlag = { zeitpunkt: new Date(jetzt()).toISOString(), gefragteRelays: a.gefragt };
      return { gueltig: false, inhalt };
    }

    const artikel = neuestesJeD(a.events);
    /** @type {Record<string, string[]>} */
    const quellen = { ...a.quellen, ...l.quellen, ...p.quellen };
    /** @type {Set<string>} */
    const nichtErreichbar = new Set([...a.fehler, ...l.fehler, ...p.fehler]);

    /** @type {Map<string, Event>} */
    const nachweise = new Map();
    const hashes = hashesSammeln(artikel);
    for (let i = 0; i < hashes.length; i += BLOCK) {
      const n = await eventsVonAllen(relays, { kinds: [1063], '#x': hashes.slice(i, i + BLOCK) }, { holen });
      for (const e of n.events) nachweise.set(e.id, e);
      Object.assign(quellen, n.quellen);
      for (const r of n.fehler) nichtErreichbar.add(r);
    }

    // etag nur für Bilder, zu denen es überhaupt einen Nachweis gibt — sonst
    // gibt es keinen Schritt 5, den der etag entscheiden könnte.
    const attestiert = new Set([...nachweise.values()].flatMap((e) => e.tags.filter((t) => t[0] === 'x').map((t) => t[1])));
    /** @type {Record<string, string>} */
    const etags = {};
    for (const url of bildUrlsSammeln(artikel)) {
      const h = hashAusUrl(url);
      if (!h || !attestiert.has(h)) continue;
      const etag = await etagHolen(url);
      if (etag) etags[url] = etag;
    }

    const profil = [...p.events].sort((x, y) => -neuer(x, y))[0] ?? null;
    const listen = neuestesJeD(l.events);

    inhalt = {
      stand: {
        zeitpunkt: new Date(jetzt()).toISOString(),
        dauerMs: jetzt() - start,
        gefragteRelays: a.gefragt,
        nichtErreichbar: [...nichtErreichbar],
        anzahl: { artikel: artikel.length, listen: listen.length, nachweise: nachweise.size, profil: profil ? 1 : 0 }
      },
      artikel, listen, profil,
      nachweise: [...nachweise.values()],
      quellen, etags
    };
    fehlschlag = null;
    return { gueltig: true, inhalt };
  }

  return {
    lesen: () => inhalt,
    letzterFehlschlag: () => fehlschlag,
    auffrischen
  };
}
```

Hinweis zum Profil-Sortierer: `neuer(a,b) > 0` heißt „b ist neuer"; für „neuestes zuerst" sortiert `-neuer`. Wenn der Test zum Profil kippt, das Vorzeichen prüfen, nicht raten.

- [ ] **Step 5: Run** `pnpm check && pnpm test` — grün. **Step 6: Commit** „Spiegel: Läufe über alle Relays, Zusammenführen, Nachweise, Etags (ADR-0028)".

---

### Task 5: Spiegel — Datei, Start, Timer, Singleton

**Files:**
- Modify: `src/lib/services/spiegel.js`, `src/lib/services/spiegel.test.js`
- Modify: `.gitignore` (+ `daten/spiegel.json`), Create: `daten/.gitkeep`

**Interfaces:**
- Produces:

```js
export function dateiSpeicher(pfad: string): { lesen(): Promise<string|null>, schreiben(text: string): Promise<void> }
// spiegelErstellen bekommt zusätzlich { speicher?, planen?: (fn, ms) => { stoppen(): void } }
// und liefert zusätzlich:
//   ausDateiLaden(): Promise<boolean>
//   starten(): Promise<void>     // Datei laden, ersten Lauf anstoßen, höchstens startwartezeit warten, Timer planen
//   stoppen(): void
export function spiegelStarten(konfig: Konfig, optionen?): Spiegel   // Singleton, idempotent; stößt starten() an
export function spiegelBereit(): Promise<void>                       // das starten()-Promise des Singletons
export function spiegelHolen(): Spiegel                              // wirft, wenn nie gestartet
export function spiegelZuruecksetzenFuerTests(): void
```

- [ ] **Step 1: Failing tests** anhängen:

```js
/** Speicher-Attrappe im Speicher. */
function speicherAttrappe(/** @type {string|null} */ anfang = null) {
  let text = anfang;
  return {
    lesen: async () => text,
    schreiben: async (/** @type {string} */ t) => { text = t; },
    inhalt: () => text
  };
}

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
```

- [ ] **Step 2: Run** — FAIL.

- [ ] **Step 3: Implementieren.** In `spiegel.js` ergänzen:

```js
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

/**
 * Datei auf der Platte: erst temporär schreiben, dann umbenennen — ein
 * Absturz mitten im Schreiben hinterlässt keine halbe Datei.
 * @param {string} pfad
 */
export function dateiSpeicher(pfad) {
  return {
    async lesen() {
      try {
        return await readFile(pfad, 'utf8');
      } catch {
        return null;
      }
    },
    /** @param {string} text */
    async schreiben(text) {
      await mkdir(dirname(pfad), { recursive: true });
      const tmp = `${pfad}.tmp`;
      await writeFile(tmp, text, 'utf8');
      await rename(tmp, pfad);
    }
  };
}

/** Standard-Planer: setInterval, das den Prozess nicht am Beenden hindert.
 * @param {() => unknown} fn @param {number} ms */
function intervallPlanen(fn, ms) {
  const t = setInterval(fn, ms);
  t.unref?.();
  return { stoppen: () => clearInterval(t) };
}

/** Sieht ein Objekt aus wie ein Inhalt? Mehr wird nicht geprüft — Events sind signiert, ihre Form prüft niemand hier.
 * @param {unknown} x @returns {x is Inhalt} */
function istInhalt(x) {
  return !!x && typeof x === 'object' && Array.isArray(/** @type {any} */ (x).artikel) &&
    Array.isArray(/** @type {any} */ (x).nachweise) && /** @type {any} */ (x).stand !== undefined;
}
```

`spiegelErstellen` erweitern: Parameter `speicher = dateiSpeicher(konfig.spiegelPfad)`, `planen = intervallPlanen`; in `auffrischen` nach dem Setzen von `inhalt`:

```js
    try {
      await speicher.schreiben(JSON.stringify(inhalt));
    } catch (ursache) {
      // Die Datei ist Komfort für den Neustart, kein Teil des Laufs.
      console.warn('Spiegel: Datei nicht geschrieben —', ursache instanceof Error ? ursache.message : ursache);
    }
```

und neue Methoden:

```js
  async function ausDateiLaden() {
    const text = await speicher.lesen();
    if (text === null) return false;
    try {
      const geparst = JSON.parse(text);
      if (!istInhalt(geparst)) return false;
      inhalt = geparst;
      return true;
    } catch {
      return false;
    }
  }

  /** @type {{ stoppen(): void }|null} */
  let timer = null;

  async function starten() {
    await ausDateiLaden();
    const erster = auffrischen().catch((ursache) => {
      console.warn('Spiegel: erster Lauf gescheitert —', ursache instanceof Error ? ursache.message : ursache);
    });
    const frist = new Promise((fertig) => setTimeout(fertig, konfig.spiegelStartwartezeitS * 1000).unref?.());
    await Promise.race([erster, frist]);
    timer ??= planen(() => {
      auffrischen().catch((ursache) => {
        console.warn('Spiegel: Lauf gescheitert —', ursache instanceof Error ? ursache.message : ursache);
      });
    }, konfig.spiegelIntervallS * 1000);
  }

  function stoppen() {
    timer?.stoppen();
    timer = null;
  }

  return { lesen: () => inhalt, letzterFehlschlag: () => fehlschlag, auffrischen, ausDateiLaden, starten, stoppen };
```

`setTimeout(...).unref?.()` gibt in Node den Timer zurück; damit die Promise-Auflösung stimmt: `new Promise((fertig) => { const t = setTimeout(fertig, ms); t.unref?.(); })`.

Singleton am Dateiende:

```js
/** @typedef {ReturnType<typeof spiegelErstellen>} Spiegel */
/** @type {Spiegel|null} */
let instanz = null;

/**
 * Startet den einen Spiegel des Prozesses — aus hooks.server.js. Ein zweiter
 * Aufruf liefert denselben; niemand baut versehentlich zwei Läufe.
 * @param {Konfig} konfig
 * @param {Partial<Parameters<typeof spiegelErstellen>[0]>} [optionen]  nur zum Prüfen
 */
export function spiegelStarten(konfig, optionen = {}) {
  if (!instanz) {
    instanz = spiegelErstellen({ konfig, ...optionen });
    bereit = instanz.starten();
  }
  return instanz;
}

/** @type {Promise<void>} */
let bereit = Promise.resolve();

/** Löst auf, wenn der erste Lauf durch ist oder die Startwartezeit verstrich — für hooks.server.js. */
export function spiegelBereit() {
  return bereit;
}

/** Der laufende Spiegel — für Routen. */
export function spiegelHolen() {
  if (!instanz) {
    throw new Error('Der Spiegel läuft nicht. Er wird in src/hooks.server.js gestartet — fehlt die Datei?');
  }
  return instanz;
}

export function spiegelZuruecksetzenFuerTests() {
  instanz?.stoppen();
  instanz = null;
  bereit = Promise.resolve();
}
```

`.gitignore`: Zeile `daten/spiegel.json` und `daten/spiegel.json.tmp`. `daten/.gitkeep` anlegen (leer).

- [ ] **Step 4: Run** `pnpm check && pnpm test` — grün. **Step 5: Commit** „Spiegel: Datei, Start mit Wartezeit, Timer, Singleton (ADR-0028)".

---

### Task 6: `hooks.server.js` und Leerstandsmeldung

**Files:**
- Create: `src/hooks.server.js`
- Create: `src/lib/models/leerstand.js`, `src/lib/models/leerstand.test.js`

**Interfaces:**
- Produces: `leerstandMeldung(inhalt: Inhalt, konfig: Konfig): string|null`.

- [ ] **Step 1: Failing test** `src/lib/models/leerstand.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { leerstandMeldung } from './leerstand.js';
import { leererInhalt } from '../services/spiegel.js';

const KONFIG = /** @type {import('../konfig.js').Konfig} */ ({
  autor: 'a'.repeat(64), hTag: null, relays: ['wss://r1/', 'wss://r2/'], blossomUrl: 'https://b/',
  abgeloesteHosts: [], spiegelPfad: 'x', spiegelIntervallS: 600, spiegelStartwartezeitS: 20
});

describe('leerstandMeldung', () => {
  it('nennt die Relays, wenn noch nie ein Lauf gelang', () => {
    const m = leerstandMeldung(leererInhalt(), KONFIG);
    expect(m).toContain('wss://r1/, wss://r2/');
    expect(m).toContain('weiter');
  });
  it('nennt den Autor, wenn Relays antworteten, aber nichts von ihm haben', () => {
    const inhalt = { ...leererInhalt(), stand: { zeitpunkt: '2026-09-14T10:00:00Z', dauerMs: 1, gefragteRelays: KONFIG.relays, nichtErreichbar: [], anzahl: { artikel: 0, listen: 0, nachweise: 0, profil: 0 } } };
    expect(leerstandMeldung(inhalt, KONFIG)).toContain('aaaaaaaaaaaa…');
  });
  it('ist null, sobald Artikel da sind', () => {
    const inhalt = { ...leererInhalt(), stand: { zeitpunkt: 'x', dauerMs: 1, gefragteRelays: [], nichtErreichbar: [], anzahl: { artikel: 1, listen: 0, nachweise: 0, profil: 0 } }, artikel: [/** @type {any} */ ({ id: '1', tags: [] })] };
    expect(leerstandMeldung(inhalt, KONFIG)).toBeNull();
  });
});
```

- [ ] **Step 2: Run** — FAIL.

- [ ] **Step 3: Implementieren** `src/lib/models/leerstand.js`:

```js
/**
 * Warum der Spiegel nichts zu zeigen hat — nie eine leere Seite ohne
 * Erklärung (CLAUDE.md). Zwei Fälle, zwei Schuldige: Verbindung oder Daten.
 *
 * @param {import('../services/spiegel.js').Inhalt} inhalt
 * @param {import('../konfig.js').Konfig} konfig
 * @returns {string|null}
 */
export function leerstandMeldung(inhalt, konfig) {
  if (inhalt.stand === null) {
    return (
      'Noch keine Inhalte geladen: Bisher hat kein Relay geantwortet. ' +
      `Gefragt wurden: ${konfig.relays.join(', ')}. Der Dienst versucht es weiter; ` +
      'Verbindung und RELAYS in der .env prüfen.'
    );
  }
  if (inhalt.artikel.length === 0) {
    return (
      `Die Relays ${inhalt.stand.gefragteRelays.join(', ')} haben geantwortet, aber keinen ` +
      `Beitrag von ${konfig.autor.slice(0, 12)}… geliefert. QUELLE_AUTOR in der .env prüfen.`
    );
  }
  return null;
}
```

`src/hooks.server.js`:

```js
/**
 * Startet den Spiegel mit dem Prozess (ADR-0028). `init` läuft einmal vor
 * der ersten Anfrage; `spiegelStarten` wartet höchstens
 * SPIEGEL_STARTWARTEZEIT_S auf den ersten Lauf und geht dann ans Netz —
 * mit der Datei, oder leer mit Meldung.
 *
 * Fehlt ein Pflichtwert der Konfiguration, bricht `konfigLesen` hier ab —
 * beim Start, nicht später mit leeren Seiten.
 */
import { env } from '$env/dynamic/private';
import { konfigLesen } from '$lib/konfig.js';
import { spiegelHolen, spiegelStarten } from '$lib/services/spiegel.js';

/** @type {import('@sveltejs/kit').ServerInit} */
export async function init() {
  spiegelStarten(konfigLesen(env));
  // Erst antworten, wenn der erste Lauf durch ist oder die Frist verstrich.
  await spiegelBereit();
}
```

Import entsprechend: `import { spiegelBereit, spiegelStarten } from '$lib/services/spiegel.js';`.

- [ ] **Step 4: Run** `pnpm check && pnpm test` — grün. `pnpm dev` kurz starten: Konsole ohne Fehler, `daten/spiegel.json` entsteht innerhalb von 20 s. **Step 5: Commit** „Spiegel startet mit dem Prozess; Leerstandsmeldung nennt Relay oder Autor".

---

### Task 7: Loader lesen aus dem Spiegel

**Files:**
- Replace: `src/lib/loaders/artikel.js`, `src/lib/loaders/artikel.test.js`
- Replace: `src/lib/loaders/lizenz.js`, `src/lib/loaders/lizenz.test.js`
- Modify: `src/lib/loaders/beitrag.js`, `src/lib/loaders/beitrag.test.js`

**Interfaces:**
- Produces:

```js
// loaders/artikel.js
export function artikelAusSpiegel(inhalt: Inhalt, { d: string, sprache?: 'de'|'en'|null }): { artikel: Artikel|null, event: Event|null }
export function abfrageAusStand(inhalt: Inhalt, konfig: Konfig, event: Event|null): Abfrage
// loaders/lizenz.js
export function nachweiseAusSpiegel(inhalt: Inhalt, hash: string): { nachweis: Nachweis|null, events: Event[] }
export function etagAusSpiegel(inhalt: Inhalt, url: string|null): string|undefined
export { etagHolen } from '../services/blossom.js'  // bleibt für den Spiegel
// loaders/beitrag.js
export async function beitragLaden({ adresse, konfig, inhalt }): Promise<Beitrag|Absage>
```

`Abfrage` ist der Typ aus `models/entwickleransicht.js`: `{ gefragteRelays, fehler, ohneTreffer, quellen, grund }`.

- [ ] **Step 1: Failing tests.** `artikel.test.js` neu schreiben:

```js
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { abfrageAusStand, artikelAusSpiegel } from './artikel.js';
import { leererInhalt } from '../services/spiegel.js';

const fixture = (/** @type {string} */ f) => JSON.parse(readFileSync(new URL(`../../../test/fixtures/${f}`, import.meta.url), 'utf8'));
const ARTIKEL = fixture('artikel-30023-die-kraft-der-gemeinschaft-2026-09-07.json')[0];
const RELAY = 'wss://relay.edufeed.org/';
const RPI = 'wss://relay-rpi.edufeed.org/';
const KONFIG = /** @type {any} */ ({ autor: ARTIKEL.pubkey, relays: [RELAY, RPI] });

const inhalt = {
  ...leererInhalt(),
  stand: { zeitpunkt: '2026-09-14T10:00:00Z', dauerMs: 5, gefragteRelays: [RELAY, RPI], nichtErreichbar: [RPI], anzahl: { artikel: 1, listen: 0, nachweise: 0, profil: 0 } },
  artikel: [ARTIKEL],
  quellen: { [ARTIKEL.id]: [RELAY] }
};

describe('artikelAusSpiegel', () => {
  it('findet den Artikel über d', () => {
    const { artikel, event } = artikelAusSpiegel(inhalt, { d: 'die-kraft-der-gemeinschaft' });
    expect(artikel?.titel).toContain('Kraft');
    expect(event?.id).toBe(ARTIKEL.id);
  });
  it('liefert null für unbekanntes d und für die falsche Sprache', () => {
    expect(artikelAusSpiegel(inhalt, { d: 'gibt-es-nicht' }).artikel).toBeNull();
    expect(artikelAusSpiegel(inhalt, { d: 'die-kraft-der-gemeinschaft', sprache: 'en' }).artikel).toBeNull();
  });
});

describe('abfrageAusStand', () => {
  it('übersetzt den Stand in die Form der Entwickleransicht', () => {
    const a = abfrageAusStand(inhalt, KONFIG, ARTIKEL);
    expect(a).toEqual({ gefragteRelays: [RELAY, RPI], fehler: [RPI], ohneTreffer: [], quellen: { [ARTIKEL.id]: [RELAY] }, grund: null });
  });
  it('ein Relay, das antwortete und das Event nicht hatte, steht in ohneTreffer', () => {
    const beide = { ...inhalt, stand: { ...inhalt.stand, nichtErreichbar: [] } };
    expect(abfrageAusStand(beide, KONFIG, ARTIKEL).ohneTreffer).toEqual([RPI]);
  });
  it('ohne Stand: alle Relays gefragt, keines erreichbar', () => {
    const a = abfrageAusStand(leererInhalt(), KONFIG, null);
    expect(a.grund).toBe('kein-relay-erreichbar');
    expect(a.fehler).toEqual([RELAY, RPI]);
  });
});
```

`lizenz.test.js` neu:

```js
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { etagAusSpiegel, nachweiseAusSpiegel } from './lizenz.js';
import { leererInhalt } from '../services/spiegel.js';

const fixture = (/** @type {string} */ f) => JSON.parse(readFileSync(new URL(`../../../test/fixtures/${f}`, import.meta.url), 'utf8'));
const NACHWEIS = fixture('lizenz-1063-nostr-schrein.json')[0];
const CAESAR = fixture('lizenz-1063-caesar-scheibe.json')[0];
const HASH = NACHWEIS.tags.find((/** @type {string[]} */ t) => t[0] === 'x')[1];

const inhalt = { ...leererInhalt(), nachweise: [NACHWEIS, CAESAR], etags: { 'https://blossom.edufeed.org/x.jpg': '"e"' } };

describe('nachweiseAusSpiegel', () => {
  it('gibt nur die Kandidaten zum Hash zurück und wählt daraus', () => {
    const { nachweis, events } = nachweiseAusSpiegel(inhalt, HASH);
    expect(events.map((e) => e.id)).toEqual([NACHWEIS.id]);
    expect(nachweis?.hash).toBe(HASH);
  });
  it('kein Kandidat: null und leere Liste', () => {
    expect(nachweiseAusSpiegel(inhalt, 'f'.repeat(64))).toEqual({ nachweis: null, events: [] });
  });
});

describe('etagAusSpiegel', () => {
  it('liefert den gemerkten etag oder undefined', () => {
    expect(etagAusSpiegel(inhalt, 'https://blossom.edufeed.org/x.jpg')).toBe('"e"');
    expect(etagAusSpiegel(inhalt, 'https://blossom.edufeed.org/y.jpg')).toBeUndefined();
    expect(etagAusSpiegel(inhalt, null)).toBeUndefined();
  });
});
```

`beitrag.test.js`: `holen`-Attrappen durch einen `inhalt` ersetzen. Die Hilfe oben in der Datei:

```js
import { leererInhalt } from '../services/spiegel.js';

/** Spiegelinhalt wie in Wirklichkeit: Artikel von relay, Nachweis von relay-rpi. */
function inhaltWieEcht({ ohneNachweis = false, etag = undefined } = {}) {
  return {
    ...leererInhalt(),
    stand: { zeitpunkt: '2026-09-14T10:00:00Z', dauerMs: 3, gefragteRelays: KONFIG.relays, nichtErreichbar: [], anzahl: { artikel: 1, listen: 0, nachweise: ohneNachweis ? 0 : 1, profil: 0 } },
    artikel: [ARTIKEL],
    nachweise: ohneNachweis ? [] : [NACHWEIS],
    quellen: { [ARTIKEL.id]: [KONFIG.relays[0]], [NACHWEIS.id]: [KONFIG.relays[1]] },
    etags: etag ? { [ARTIKEL.tags.find((/** @type {string[]} */ t) => t[0] === 'image')[1]]: etag } : {}
  };
}
```

Bestehende Fälle umschreiben:
- „lehnt fremden Autor ab, ohne ein Relay zu fragen" → `beitragLaden({ adresse: {…fremd}, konfig: KONFIG, inhalt: inhaltWieEcht() })` ergibt 404; die Relay-Zählung entfällt (es gibt keine).
- „fragt nie die Relays aus dem naddr" → entfällt als Test (es wird nichts gefragt); stattdessen: „Relay-Hinweise im naddr ändern das Ergebnis nicht": gleiche Adresse mit `relays: ['wss://boese/']` liefert denselben Artikel.
- „503, wenn kein Relay erreichbar" → `inhalt: leererInhalt()` ergibt `status: 503`, Meldung enthält `KONFIG.relays[0]`.
- 404 für unbekanntes `d` mit Stand.
- Erfolgsfall: `lizenz.ok === true`, `nachweis.credit === 'Comenius-Institut'`.
- Ohne Nachweis: `grund === 'kein-nachweis'`.
- Etag-Widerspruch: `inhaltWieEcht({ etag: '"deadbeef"' })` → `grund === 'hash-widerspruch'`.
- Fließtextbilder: Referenzfixture 07.09. (`artikel-30023-die-kraft-der-gemeinschaft-2026-09-07.json`) → `Object.keys(fliesstext)` enthält den Cover-Hash.

- [ ] **Step 2: Run** — FAIL.

- [ ] **Step 3: Implementieren.** `loaders/artikel.js` komplett:

```js
import { artikelAusEvent } from '../models/artikel.js';
import { ZUSAMMENFUEHREN_UNERREICHBAR } from '../services/relay.js';
```

**Halt:** `services/relay.js` darf nur der Spiegel importieren. Die Konstante wird deshalb in `spiegel.js` re-exportiert: `export { ZUSAMMENFUEHREN_UNERREICHBAR, ABFRAGEGRUND_TEXT } from './relay.js';` — und `entwickleransicht.js` importiert `ABFRAGEGRUND_TEXT` künftig aus `../services/spiegel.js`. Der Architekturtest in Task 15 prüft auf den Importpfad `services/relay.js`; Re-Exporte durch den Spiegel sind der vorgesehene Weg.

```js
import { artikelAusEvent } from '../models/artikel.js';
import { ZUSAMMENFUEHREN_UNERREICHBAR } from '../services/spiegel.js';

/**
 * @typedef {import('../services/spiegel.js').Inhalt} Inhalt
 * @typedef {import('../services/spiegel.js').Event} Event
 * @typedef {import('../konfig.js').Konfig} Konfig
 * @typedef {import('../models/artikel.js').Artikel} Artikel
 * @typedef {import('../models/entwickleransicht.js').Abfrage} Abfrage
 */

/** @param {string[][]} tags @param {string} name */
const tagWert = (tags, name) => tags.find((t) => t[0] === name && t.length > 1)?.[1] ?? null;

/**
 * Ein Beitrag aus dem Spiegel über sein d (ADR-0029) — optional nur in einer
 * Sprache. Kein Relay wird gefragt; was nicht im Spiegel ist, gibt es nicht.
 *
 * @param {Inhalt} inhalt
 * @param {{ d: string, sprache?: 'de'|'en'|null }} suche
 * @returns {{ artikel: Artikel|null, event: Event|null }}
 */
export function artikelAusSpiegel(inhalt, { d, sprache = null }) {
  for (const event of inhalt.artikel) {
    if (tagWert(event.tags ?? [], 'd') !== d) continue;
    const artikel = artikelAusEvent(event);
    if (sprache && artikel.sprache !== sprache) continue;
    return { artikel, event };
  }
  return { artikel: null, event: null };
}

/**
 * Der Stand des Spiegels in der Form, die die Entwickleransicht seit dem
 * ersten Durchstich kennt — dieselbe Auskunft, ehrlich datiert (ADR-0028).
 * `ohneTreffer` sind Relays, die im Lauf antworteten, dieses Event aber
 * nicht lieferten.
 *
 * @param {Inhalt} inhalt @param {Konfig} konfig @param {Event|null} event
 * @returns {Abfrage}
 */
export function abfrageAusStand(inhalt, konfig, event) {
  const stand = inhalt.stand;
  if (!stand) {
    return { gefragteRelays: konfig.relays, fehler: konfig.relays, ohneTreffer: [], quellen: {}, grund: ZUSAMMENFUEHREN_UNERREICHBAR };
  }
  const lieferanten = event ? (inhalt.quellen[event.id] ?? []) : [];
  const antwortend = stand.gefragteRelays.filter((r) => !stand.nichtErreichbar.includes(r));
  return {
    gefragteRelays: stand.gefragteRelays,
    fehler: stand.nichtErreichbar,
    ohneTreffer: event ? antwortend.filter((r) => !lieferanten.includes(r)) : [],
    quellen: event ? { [event.id]: lieferanten } : {},
    grund: null
  };
}
```

`loaders/lizenz.js` komplett:

```js
import { nachweisAusEvents } from '../models/lizenz.js';
export { etagHolen } from '../services/blossom.js';

/** @typedef {import('../services/spiegel.js').Inhalt} Inhalt */

/**
 * Die Kandidaten zu einem Hash aus dem Spiegel und der gewählte Nachweis.
 * Nach x gefiltert, bevor gewählt wird — ein Nachweis zu Hash A darf nie
 * Hash B zugeschlagen werden (ADR-0023).
 * @param {Inhalt} inhalt @param {string} hash
 */
export function nachweiseAusSpiegel(inhalt, hash) {
  const events = inhalt.nachweise.filter((e) => (e.tags ?? []).some((t) => t[0] === 'x' && t[1] === hash));
  return { nachweis: nachweisAusEvents(events), events };
}

/** @param {Inhalt} inhalt @param {string|null} url */
export function etagAusSpiegel(inhalt, url) {
  return url ? inhalt.etags[url] : undefined;
}
```

`loaders/beitrag.js`: Signatur `beitragLaden({ adresse, konfig, inhalt })`; Imports `artikelAusSpiegel, abfrageAusStand`, `nachweiseAusSpiegel, etagAusSpiegel`; `lizenzPruefen` überall mit `abgeloesteHosts: konfig.abgeloesteHosts`. Rumpf nach dem Wächter:

```js
  if (inhalt.stand === null) {
    return {
      ok: false, status: 503,
      meldung: `Noch kein Stand vom Relay. Gefragt wurden: ${konfig.relays.join(', ')}. Verbindung und RELAYS in der .env prüfen.`
    };
  }

  const { artikel, event: artikelEvent } = artikelAusSpiegel(inhalt, { d: adresse.d });
  if (!artikel || !artikelEvent) {
    return {
      ok: false, status: 404,
      meldung: `Kein Beitrag mit d="${adresse.d}" von ${adresse.author.slice(0, 12)}… im Stand vom ${inhalt.stand.zeitpunkt}. Gefragt wurden: ${inhalt.stand.gefragteRelays.join(', ')}.`
    };
  }

  const artikelAbfrage = abfrageAusStand(inhalt, konfig, artikelEvent);
  const gesucht = artikel.bildHash ? nachweiseAusSpiegel(inhalt, artikel.bildHash) : null;
  const nachweisEvent = gesucht?.nachweis ? (gesucht.events.find((e) => e.id === gesucht.nachweis?.id) ?? null) : null;
  const lizenzAbfrage = artikel.bildHash ? abfrageAusStand(inhalt, konfig, nachweisEvent) : { ...NICHT_GEFRAGT };
  const etag = etagAusSpiegel(inhalt, artikel.bildUrl);
  const nachweis = gesucht?.nachweis ?? null;
  const hosts = konfig.abgeloesteHosts;

  const lizenz = lizenzPruefen({ bildUrl: artikel.bildUrl, bildHash: artikel.bildHash, nachweis, etag, abgeloesteHosts: hosts });
  const { teile, entfernteBilder } = inhaltAufbereiten(artikel.inhalt);

  /** @type {Record<string, import('../models/lizenz.js').Ergebnis>} */
  const fliesstext = {};
  /** @type {Set<string>} */
  const gesehen = new Set();
  for (const teil of teile) {
    if (teil.art !== 'bild' || gesehen.has(teil.hash)) continue;
    gesehen.add(teil.hash);
    const eigener = teil.hash === artikel.bildHash ? nachweis : nachweiseAusSpiegel(inhalt, teil.hash).nachweis;
    fliesstext[teil.hash] = lizenzPruefen({
      bildUrl: teil.url, bildHash: teil.hash, nachweis: eigener,
      etag: etagAusSpiegel(inhalt, teil.url), abgeloesteHosts: hosts
    });
  }

  return { ok: true, artikel, artikelEvent, artikelAbfrage, lizenzEvents: gesucht?.events ?? [], lizenzAbfrage, nachweis, etag, lizenz, teile, fliesstext, entfernteBilder };
```

`models/adresse.js`: `ERLAUBTE_KINDS = [30023]` — Termine sind nicht mehr im Zuschnitt (ADR-0026); Test in `adresse.test.js` anpassen (31923 wird jetzt abgelehnt).

- [ ] **Step 4: Run** `pnpm check && pnpm test` — grün. Die Routen unter `[naddr]` kompilieren noch, weil sie erst in Task 8 umziehen; `svelte-check` meldet dort den geänderten Aufruf von `beitragLaden` — das ist erwartet und wird in Task 8 behoben. Wenn `pnpm check` deshalb rot ist: Task 8 direkt anschließen und erst dann committen.

- [ ] **Step 5: Commit** „Loader lesen aus dem Spiegel; Termine-Kinds nicht mehr erlaubt (ADR-0026, ADR-0028)".

---

### Task 8: Route `/[d]` mit JSON und `naddr`-Weiterleitung

**Files:**
- Move: `src/routes/[naddr]/+page.svelte` → `src/routes/[d]/+page.svelte`; `+page.server.js` ebenso; `json/+server.js` ebenso
- Create: `src/routes/en/[d]/+page.server.js`, `+page.svelte` (dünn: importiert die Logik)
- Create: `src/routes/+layout.server.js`
- Modify: `test/detailansicht.test.js`, `test/oberflaeche.test.js`, `test/debug-bereich.test.js`
- Modify: `src/lib/komponenten/DebugBereich.svelte` (Zeile „Stand des Spiegels")

**Interfaces:**
- Consumes: `spiegelHolen().lesen()`, `beitragLaden({ adresse, konfig, inhalt })`, `naddrDekodieren`, `adressePruefen`, `beitragsPfad`.
- Produces: gemeinsame Ladefunktion `src/lib/routen/detail.js` — **Achtung Regel:** `src/lib/` darf nichts aus `routes/` importieren, umgekehrt schon. Die Ladefunktion liegt also in `src/lib/routen/detail.js` und wird von beiden Routen importiert:

```js
export async function detailLaden({ d, sprache, konfig, inhalt }): Promise<Seitendaten>   // wirft error()/redirect()
export function naddrWeiterleitung(pfadsegment: string, konfig: Konfig, inhalt: Inhalt): string|null  // Zielpfad oder null
```

- [ ] **Step 1: Failing tests.** `test/detailansicht.test.js`: Die `vi.doMock`-Attrappen ersetzen:

```js
vi.doMock('$lib/services/spiegel.js', async () => {
  const echt = await import('../src/lib/services/spiegel.js');
  return { ...echt, spiegelHolen: () => ({ lesen: () => inhalt, letzterFehlschlag: () => null }) };
});
const { load } = await import('../src/routes/[d]/+page.server.js');
return load(/** @type {any} */ ({ params: { d: eingabe.d ?? 'die-kraft-der-gemeinschaft' }, url: new URL('http://test/' + (eingabe.d ?? 'die-kraft-der-gemeinschaft')) }));
```

Neue Fälle:

```js
it('leitet ein naddr der eigenen Quelle dauerhaft auf /d weiter', async () => {
  await expect(ladeMitAttrappe({ d: NADDR })).rejects.toMatchObject({ status: 301, location: '/die-kraft-der-gemeinschaft' });
});
it('ein naddr fremder Quelle ist 404, keine Weiterleitung', async () => {
  await expect(ladeMitAttrappe({ d: NADDR_FREMD })).rejects.toMatchObject({ status: 404 });
});
it('ein Text, der wie naddr beginnt, aber nicht dekodiert, ist ein unbekanntes d → 404', async () => {
  await expect(ladeMitAttrappe({ d: 'naddr1kaputt' })).rejects.toMatchObject({ status: 404 });
});
it('503 mit Relays, wenn der Spiegel leer ist', async () => {
  await expect(ladeMitAttrappe({ inhalt: leererInhalt() })).rejects.toMatchObject({ status: 503, body: { message: expect.stringContaining('wss://relay.edufeed.org/') } });
});
it('liefert pfad und den Stand des Spiegels mit', async () => {
  const daten = await ladeMitAttrappe();
  expect(daten.pfad).toBe('/die-kraft-der-gemeinschaft');
  expect(daten.stand.zeitpunkt).toBeTruthy();
});
```

`NADDR_FREMD`: mit `nostr-tools/nip19` im Test erzeugen: `naddrEncode({ kind: 30023, pubkey: 'b'.repeat(64), identifier: 'x', relays: [] })`.

`test/oberflaeche.test.js`: Import `Artikelseite from '../src/routes/[d]/+page.svelte'`; `seitendaten()` bekommt `pfad: '/die-kraft-der-gemeinschaft'` und `stand: { zeitpunkt: '2026-09-14T10:00:00Z', nichtErreichbar: [] }` statt `naddr`. Prüfung: der Link zur Entwickleransicht zeigt auf `/die-kraft-der-gemeinschaft/json`.

`test/debug-bereich.test.js`: `DebugBereich` bekommt `pfad` statt `naddr`; ein Fall prüft, dass „Stand des Spiegels" mit dem Zeitpunkt erscheint, wenn `stand` übergeben wird.

- [ ] **Step 2: Run** — FAIL.

- [ ] **Step 3: Implementieren.** `src/lib/routen/detail.js`:

```js
/**
 * Gemeinsame Ladefunktion der Detailansichten /[d] und /en/[d] — hier, damit
 * die Route für Englisch keine Kopie ist. Wirft SvelteKit-Fehler und
 * -Weiterleitungen; die Datenschicht darunter (beitragLaden) tut das nicht.
 */
import { error, redirect } from '@sveltejs/kit';
import { beitragLaden } from '../loaders/beitrag.js';
import { artikelAusSpiegel } from '../loaders/artikel.js';
import { adressePruefen } from '../models/adresse.js';
import { beitragsPfad } from '../models/artikel.js';
import { befundErstellen } from '../models/entwickleransicht.js';
import { leerstandMeldung } from '../models/leerstand.js';
import { naddrDekodieren } from '../naddr.js';

/**
 * Ist das Segment ein naddr der eigenen Quelle, kommt der Zielpfad zurück
 * (ADR-0029). Fremde naddr: null → die Route behandelt es als unbekanntes d
 * und antwortet 404, ohne zu verraten, was interessant wäre (ADR-0016).
 * @param {string} segment @param {import('../konfig.js').Konfig} konfig @param {import('../services/spiegel.js').Inhalt} inhalt
 */
export function naddrWeiterleitung(segment, konfig, inhalt) {
  if (!segment.startsWith('naddr1')) return null;
  let adresse;
  try {
    adresse = naddrDekodieren(segment);
  } catch {
    return null;
  }
  if (!adressePruefen(adresse, konfig).ok) return null;
  const { artikel } = artikelAusSpiegel(inhalt, { d: adresse.d });
  return beitragsPfad({ d: adresse.d, sprache: artikel?.sprache ?? 'de' });
}

/**
 * @param {object} e
 * @param {string} e.d
 * @param {'de'|'en'} e.sprache
 * @param {import('../konfig.js').Konfig} e.konfig
 * @param {import('../services/spiegel.js').Inhalt} e.inhalt
 */
export async function detailLaden({ d, sprache, konfig, inhalt }) {
  const ziel = naddrWeiterleitung(d, konfig, inhalt);
  if (ziel) redirect(301, ziel);

  const leer = leerstandMeldung(inhalt, konfig);
  if (leer) error(503, leer);

  const adresse = { kind: 30023, author: konfig.autor, d, relays: [] };
  const ergebnis = await beitragLaden({ adresse, konfig, inhalt });
  if (!ergebnis.ok) error(ergebnis.status, ergebnis.meldung);

  const { artikel } = ergebnis;
  // In der falschen Sprache aufgerufen: dorthin, wo der Beitrag wohnt.
  if (artikel.sprache !== sprache) redirect(301, beitragsPfad(artikel));

  const befund = befundErstellen({
    artikelEvent: ergebnis.artikelEvent, artikelAbfrage: ergebnis.artikelAbfrage,
    bildUrl: artikel.bildUrl, bildHash: artikel.bildHash, lizenzEvents: ergebnis.lizenzEvents,
    lizenzAbfrage: ergebnis.lizenzAbfrage, nachweis: ergebnis.nachweis, etag: ergebnis.etag,
    abgeloesteHosts: konfig.abgeloesteHosts
  });

  // Zwei Hälften: `seite` ist serialisierbar und geht an die Page-Route;
  // `ergebnis` trägt die rohen Events (mit Symbol-Schlüsseln, siehe
  // `reinesEvent`) und ist nur für die JSON-Route.
  return {
    seite: {
      artikel: {
        titel: artikel.titel, zusammenfassung: artikel.zusammenfassung,
        veroeffentlicht: artikel.veroeffentlicht.toISOString(), themen: artikel.themen,
        bildUrl: artikel.bildUrl, sprache: artikel.sprache, istSeite: artikel.istSeite
      },
      lizenz: ergebnis.lizenz, teile: ergebnis.teile, fliesstext: ergebnis.fliesstext,
      entfernteBilder: ergebnis.entfernteBilder, befund,
      pfad: beitragsPfad(artikel),
      stand: inhalt.stand ? { zeitpunkt: inhalt.stand.zeitpunkt, nichtErreichbar: inhalt.stand.nichtErreichbar } : null
    },
    ergebnis
  };
}
```

`src/routes/[d]/+page.server.js`:

```js
import { env } from '$env/dynamic/private';
import { konfigLesen } from '$lib/konfig.js';
import { detailLaden } from '$lib/routen/detail.js';
import { spiegelHolen } from '$lib/services/spiegel.js';

export const prerender = false;

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
  const konfig = konfigLesen(env);
  const { seite } = await detailLaden({ d: params.d, sprache: 'de', konfig, inhalt: spiegelHolen().lesen() });
  return seite;
}
```

`src/routes/en/[d]/+page.server.js` identisch mit `sprache: 'en'`; `en/[d]/+page.svelte`:

```svelte
<script>
  import Detail from '$lib/komponenten/Detail.svelte';
  let { data } = $props();
</script>
<Detail {data} />
```

Dazu wandert der Inhalt von `[d]/+page.svelte` in `src/lib/komponenten/Detail.svelte` (Props: `data`), und `[d]/+page.svelte` wird ebenso dünn. Der Link zur Entwickleransicht in `DebugBereich.svelte`: Prop `pfad`, Href `${pfad}/json`. `DebugBereich` bekommt zusätzlich Prop `stand: { zeitpunkt: string, nichtErreichbar: string[] }|null` und zeigt oben:

```svelte
{#if stand}
  <p class="stand">Stand des Spiegels: {new Date(stand.zeitpunkt).toLocaleString('de-DE')}
    {#if stand.nichtErreichbar.length > 0} · nicht erreichbar: {stand.nichtErreichbar.join(', ')}{/if}</p>
{/if}
```

`json/+server.js` unter `[d]/json/` (und `en/[d]/json/`): ruft `detailLaden`, gibt wie bisher `artikel`, `lizenz`, `kette`, `hashes`, `anzeige` aus, `adresse: { d, pfad }` statt `naddr`, plus `spiegel: inhalt.stand`.

`src/routes/+layout.server.js`:

```js
import { spiegelHolen } from '$lib/services/spiegel.js';

/** @type {import('./$types').LayoutServerLoad} */
export function load() {
  const spiegel = spiegelHolen();
  const stand = spiegel.lesen().stand;
  const fehlschlag = spiegel.letzterFehlschlag();
  return {
    spiegelstand: {
      zeitpunkt: stand?.zeitpunkt ?? null,
      // Nur wenn der letzte Lauf scheiterte, ist das Alter eine Nachricht (CLAUDE.md).
      veraltet: fehlschlag !== null,
      relays: fehlschlag?.gefragteRelays ?? []
    }
  };
}
```

`+layout.svelte`: `let { children, data } = $props();` und `<Fusszeile spiegelstand={data.spiegelstand} />` — die Fußzeile selbst folgt in Task 13.

Altes Verzeichnis `src/routes/[naddr]/` löschen.

- [ ] **Step 4: Run** `pnpm check && pnpm test` — grün. `pnpm dev`: `/die-kraft-der-gemeinschaft` rendert, `/naddr1…` leitet dorthin, `/die-kraft-der-gemeinschaft/json` liefert JSON mit `spiegel.zeitpunkt`.

- [ ] **Step 5: Commit** „Detailansicht unter /[d] und /en/[d]; naddr leitet weiter (ADR-0029)".

---

### Task 9: Themen normalisieren

**Files:**
- Create: `src/lib/themen.js`, `src/lib/themen.test.js`, `daten/themen.json`

**Interfaces:**
- Produces:

```js
export function themenTabelleLesen(text: string): Map<string, string>   // Schreibweise → Anzeigeform; wirft bei Dubletten
export function themaNormalisieren(name: string, tabelle: Map<string,string>): string
export function themenSlug(name: string): string
export function themenTabelle(): Map<string,string>   // aus daten/themen.json, einmal gelesen
```

- [ ] **Step 1: Failing tests** `src/lib/themen.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { themaNormalisieren, themenSlug, themenTabelle, themenTabelleLesen } from './themen.js';

describe('themenTabelleLesen', () => {
  it('bildet jede Schreibweise auf die Anzeigeform ab, die Anzeigeform auf sich selbst', () => {
    const t = themenTabelleLesen('{"Open Educational Resources (OER)": ["OER", "oer"]}');
    expect(t.get('OER')).toBe('Open Educational Resources (OER)');
    expect(t.get('Open Educational Resources (OER)')).toBe('Open Educational Resources (OER)');
  });
  it('wirft, wenn eine Schreibweise zweimal vorkommt', () => {
    expect(() => themenTabelleLesen('{"A": ["x"], "B": ["x"]}')).toThrow(/x/);
  });
});

describe('themaNormalisieren', () => {
  const t = themenTabelleLesen('{"OER-Communities": ["OER-Community"]}');
  it('ersetzt bekannte Schreibweisen, unabhängig von Groß/Klein und Leerraum', () => {
    expect(themaNormalisieren(' oer-community ', t)).toBe('OER-Communities');
  });
  it('lässt Unbekanntes, wie es ist (getrimmt)', () => {
    expect(themaNormalisieren(' Theologie ', t)).toBe('Theologie');
  });
});

describe('themenSlug', () => {
  it('kleinschreibt, löst Umlaute auf, ersetzt Rest durch Bindestrich', () => {
    expect(themenSlug('Open Educational Resources (OER)')).toBe('open-educational-resources-oer');
    expect(themenSlug('Religionspädagogik')).toBe('religionspaedagogik');
    expect(themenSlug('KI & Ethik')).toBe('ki-ethik');
    expect(themenSlug('  ß  ')).toBe('ss');
  });
});

describe('daten/themen.json', () => {
  it('ist lesbar und ohne Dubletten', () => {
    expect(themenTabelle().size).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run** — FAIL.

- [ ] **Step 3: Implementieren.** `daten/themen.json` — aus den 45 Live-Themen vom 14.09. die Dubletten:

```json
{
  "Open Educational Resources (OER)": ["OER", "oer", "Open Educational Resources"],
  "Open Educational Practices (OEP)": ["OEP", "Open Educational Practices"],
  "OER-Communities": ["OER-Community", "OER Community", "OER Communities"],
  "Künstliche Intelligenz (KI)": ["KI", "AI", "Künstliche Intelligenz"]
}
```

`src/lib/themen.js`:

```js
/**
 * Themen normalisieren (CLAUDE.md): Die Tabelle daten/themen.json ist
 * Redaktionsarbeit — Schlüssel ist die Anzeigeform, die Liste sind
 * Schreibweisen, die darauf abgebildet werden. Unbekannte Themen bleiben,
 * wie sie sind; jedes Thema ist über seinen Slug filterbar.
 */
import { readFileSync } from 'node:fs';

/** Vergleichsform: getrimmt, klein — Schreibweisen unterscheiden sich meist nur darin. @param {string} s */
const schluessel = (s) => s.trim().toLowerCase();

/**
 * @param {string} text  JSON: { "Anzeigeform": ["Schreibweise", …] }
 * @returns {Map<string, string>}  Vergleichsform → Anzeigeform
 */
export function themenTabelleLesen(text) {
  /** @type {Record<string, string[]>} */
  const roh = JSON.parse(text);
  /** @type {Map<string, string>} */
  const tabelle = new Map();
  /** @param {string} form @param {string} ziel */
  const eintragen = (form, ziel) => {
    const k = schluessel(form);
    const bisher = tabelle.get(k);
    if (bisher && bisher !== ziel) {
      throw new Error(`daten/themen.json: "${form}" steht unter "${bisher}" und unter "${ziel}".`);
    }
    tabelle.set(k, ziel);
  };
  for (const [anzeige, formen] of Object.entries(roh)) {
    eintragen(anzeige, anzeige);
    for (const f of formen) eintragen(f, anzeige);
  }
  return tabelle;
}

/** @param {string} name @param {Map<string, string>} tabelle */
export function themaNormalisieren(name, tabelle) {
  return tabelle.get(schluessel(name)) ?? name.trim();
}

const UMLAUTE = /** @type {Record<string, string>} */ ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' });

/** URL-Slug eines Themas. @param {string} name */
export function themenSlug(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[äöüß]/g, (z) => UMLAUTE[z])
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** @type {Map<string, string>|null} */
let geladen = null;

/** Die Tabelle aus daten/themen.json, einmal je Prozess gelesen. */
export function themenTabelle() {
  geladen ??= themenTabelleLesen(readFileSync(new URL('../../daten/themen.json', import.meta.url), 'utf8'));
  return geladen;
}
```

- [ ] **Step 4: Run** `pnpm check && pnpm test` — grün. **Step 5: Commit** „Themen: Normalisierungstabelle und Slugs".

---

### Task 10: Loader für Übersicht und Themen

**Files:**
- Create: `src/lib/loaders/uebersicht.js`, `src/lib/loaders/uebersicht.test.js`

**Interfaces:**
- Consumes: `artikelAusEvent`, `beitragsPfad`, `lizenzPruefen`, `nachweiseAusSpiegel`, `etagAusSpiegel`, `themaNormalisieren`, `themenSlug`, `themenTabelle`.
- Produces:

```js
/** @typedef {object} Karte
 *  @property {string} d @property {string} pfad @property {string} titel
 *  @property {string} zusammenfassung @property {string} veroeffentlicht  ISO
 *  @property {Array<{ name: string, slug: string }>} themen
 *  @property {{ url: string, alt: string, nachweis: Nachweis }|null} cover   nur wenn die Kette ok ist */
export const JE_SEITE = 20
export function artikelListe(inhalt, konfig, { seite = 1, themaSlug = null, tabelle = themenTabelle() } = {})
  : { karten: Karte[], seite: number, seiten: number, gesamt: number, thema: string|null }
export function themenListe(inhalt, { tabelle = themenTabelle() } = {})
  : Array<{ name: string, slug: string, anzahl: number }>
```

- [ ] **Step 1: Failing tests** `src/lib/loaders/uebersicht.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { JE_SEITE, artikelListe, themenListe } from './uebersicht.js';
import { leererInhalt } from '../services/spiegel.js';
import { themenTabelleLesen } from '../themen.js';

const fixture = (/** @type {string} */ f) => JSON.parse(readFileSync(new URL(`../../../test/fixtures/${f}`, import.meta.url), 'utf8'));
const BESTAND = fixture('foerbico-artikel-30023.json');
const REFERENZ = fixture('artikel-30023-die-kraft-der-gemeinschaft-2026-09-07.json')[0];
const NACHWEIS = fixture('lizenz-1063-nostr-schrein.json')[0];
const KONFIG = /** @type {any} */ ({ autor: REFERENZ.pubkey, relays: [], abgeloesteHosts: ['oer.community'] });
const TABELLE = themenTabelleLesen('{"Open Educational Resources (OER)": ["OER"]}');

/** Bestand ohne den Referenzfall (alte Fassung) plus die neue Fassung. */
const artikel = [...BESTAND.filter((/** @type {any} */ e) => e.tags.find((/** @type {string[]} */ t) => t[0] === 'd')?.[1] !== 'die-kraft-der-gemeinschaft'), REFERENZ];
const inhalt = { ...leererInhalt(), stand: /** @type {any} */ ({}), artikel, nachweise: [NACHWEIS] };

describe('artikelListe', () => {
  it('sortiert published_at absteigend und blättert in 20ern', () => {
    const s1 = artikelListe(inhalt, KONFIG, { seite: 1, tabelle: TABELLE });
    expect(s1.gesamt).toBe(artikel.length);
    expect(s1.karten).toHaveLength(JE_SEITE);
    expect(s1.seiten).toBe(Math.ceil(artikel.length / JE_SEITE));
    const daten = s1.karten.map((k) => k.veroeffentlicht);
    expect([...daten].sort().reverse()).toEqual(daten);
    const letzte = artikelListe(inhalt, KONFIG, { seite: s1.seiten, tabelle: TABELLE });
    expect(letzte.karten.length).toBe(artikel.length - JE_SEITE * (s1.seiten - 1));
  });

  it('lässt Seiten (Selbst-Label) weg', () => {
    const seite = { ...REFERENZ, id: 'seite', tags: [['d', 'impressum'], ['title', 'Impressum'], ['L', 'foerbico/typ'], ['l', 'seite', 'foerbico/typ']] };
    const mit = { ...inhalt, artikel: [...artikel, seite] };
    expect(artikelListe(mit, KONFIG, { tabelle: TABELLE }).gesamt).toBe(artikel.length);
  });

  it('zeigt das Cover nur, wenn die Kette ok ist; abgelöste Hosts nie', () => {
    const alle = artikelListe(inhalt, KONFIG, { seite: 1, tabelle: TABELLE });
    const referenz = alle.karten.find((k) => k.d === 'die-kraft-der-gemeinschaft') ??
      artikelListe(inhalt, KONFIG, { seite: 2, tabelle: TABELLE }).karten.find((k) => k.d === 'die-kraft-der-gemeinschaft');
    expect(referenz?.cover?.url).toContain('blossom.edufeed.org');
    const mitAltemCover = alle.karten.filter((k) => k.cover && /oer\.community/.test(k.cover.url));
    expect(mitAltemCover).toEqual([]);
  });

  it('filtert nach Themen-Slug und normalisiert die Themen der Karten', () => {
    const oer = artikelListe(inhalt, KONFIG, { themaSlug: 'open-educational-resources-oer', tabelle: TABELLE });
    expect(oer.thema).toBe('Open Educational Resources (OER)');
    expect(oer.gesamt).toBeGreaterThan(0);
    for (const k of oer.karten) expect(k.themen.map((t) => t.name)).toContain('Open Educational Resources (OER)');
    expect(artikelListe(inhalt, KONFIG, { themaSlug: 'gibt-es-nicht', tabelle: TABELLE }).thema).toBeNull();
  });

  it('eine Seite jenseits des Endes ist leer, nicht kaputt', () => {
    expect(artikelListe(inhalt, KONFIG, { seite: 999, tabelle: TABELLE }).karten).toEqual([]);
  });
});

describe('themenListe', () => {
  it('zählt normalisiert, sortiert nach Anzahl, dann Name', () => {
    const themen = themenListe(inhalt, { tabelle: TABELLE });
    const oer = themen.find((t) => t.slug === 'open-educational-resources-oer');
    expect(oer?.anzahl).toBeGreaterThan(15);
    for (let i = 1; i < themen.length; i++) {
      const [a, b] = [themen[i - 1], themen[i]];
      expect(a.anzahl > b.anzahl || (a.anzahl === b.anzahl && a.name.localeCompare(b.name, 'de') <= 0)).toBe(true);
    }
    expect(themen.some((t) => t.name === 'OER')).toBe(false);
  });
});
```

- [ ] **Step 2: Run** — FAIL.

- [ ] **Step 3: Implementieren** `src/lib/loaders/uebersicht.js`:

```js
import { artikelAusEvent, beitragsPfad } from '../models/artikel.js';
import { lizenzPruefen } from '../models/lizenz.js';
import { themaNormalisieren, themenSlug, themenTabelle } from '../themen.js';
import { etagAusSpiegel, nachweiseAusSpiegel } from './lizenz.js';

/** @typedef {import('../services/spiegel.js').Inhalt} Inhalt */
/** @typedef {import('../konfig.js').Konfig} Konfig */
/** @typedef {import('../models/lizenz.js').Nachweis} Nachweis */
/**
 * @typedef {object} Karte
 * @property {string} d
 * @property {string} pfad
 * @property {string} titel
 * @property {string} zusammenfassung
 * @property {string} veroeffentlicht
 * @property {Array<{ name: string, slug: string }>} themen
 * @property {{ url: string, alt: string, nachweis: Nachweis }|null} cover
 */

export const JE_SEITE = 20;

/**
 * Alle Artikel (keine Seiten), published_at absteigend, Themen normalisiert.
 * @param {Inhalt} inhalt @param {Map<string, string>} tabelle
 */
function artikelSortiert(inhalt, tabelle) {
  return inhalt.artikel
    .map((e) => artikelAusEvent(e))
    .filter((a) => !a.istSeite)
    .map((a) => ({
      artikel: a,
      themen: [...new Set(a.themen.map((t) => themaNormalisieren(t, tabelle)))].map((name) => ({ name, slug: themenSlug(name) }))
    }))
    .sort((x, y) => y.artikel.veroeffentlicht.getTime() - x.artikel.veroeffentlicht.getTime());
}

/**
 * Das Cover einer Karte — nur, wenn die Kette ok ist. Ein Bild mit
 * „Lizenz ungeklärt" gehört auf die Artikelseite, wo der Grund steht, nicht
 * in eine Liste, wo er fehlen würde.
 * @param {Inhalt} inhalt @param {Konfig} konfig @param {import('../models/artikel.js').Artikel} a
 */
function cover(inhalt, konfig, a) {
  if (!a.bildUrl || !a.bildHash) return null;
  const { nachweis } = nachweiseAusSpiegel(inhalt, a.bildHash);
  const kette = lizenzPruefen({
    bildUrl: a.bildUrl, bildHash: a.bildHash, nachweis,
    etag: etagAusSpiegel(inhalt, a.bildUrl), abgeloesteHosts: konfig.abgeloesteHosts
  });
  if (!kette.ok) return null;
  return { url: kette.nachweis.url, alt: kette.nachweis.alt ?? kette.nachweis.titel ?? a.titel, nachweis: kette.nachweis };
}

/**
 * @param {Inhalt} inhalt @param {Konfig} konfig
 * @param {{ seite?: number, themaSlug?: string|null, tabelle?: Map<string, string> }} [optionen]
 */
export function artikelListe(inhalt, konfig, { seite = 1, themaSlug = null, tabelle = themenTabelle() } = {}) {
  let alle = artikelSortiert(inhalt, tabelle);
  /** @type {string|null} */
  let thema = null;
  if (themaSlug) {
    const treffer = alle.find((x) => x.themen.some((t) => t.slug === themaSlug));
    thema = treffer?.themen.find((t) => t.slug === themaSlug)?.name ?? null;
    alle = thema ? alle.filter((x) => x.themen.some((t) => t.slug === themaSlug)) : [];
  }
  const gesamt = alle.length;
  const seiten = Math.max(1, Math.ceil(gesamt / JE_SEITE));
  const ab = (Math.max(1, seite) - 1) * JE_SEITE;
  const karten = alle.slice(ab, ab + JE_SEITE).map(({ artikel: a, themen }) => ({
    d: a.d,
    pfad: beitragsPfad(a),
    titel: a.titel,
    zusammenfassung: a.zusammenfassung,
    veroeffentlicht: a.veroeffentlicht.toISOString(),
    themen,
    cover: cover(inhalt, konfig, a)
  }));
  return { karten, seite, seiten, gesamt, thema };
}

/**
 * Alle Themen mit Anzahl — nach Anzahl absteigend, dann Name.
 * @param {Inhalt} inhalt @param {{ tabelle?: Map<string, string> }} [optionen]
 */
export function themenListe(inhalt, { tabelle = themenTabelle() } = {}) {
  /** @type {Map<string, number>} */
  const zaehler = new Map();
  for (const { themen } of artikelSortiert(inhalt, tabelle)) {
    for (const t of themen) zaehler.set(t.name, (zaehler.get(t.name) ?? 0) + 1);
  }
  return [...zaehler.entries()]
    .map(([name, anzahl]) => ({ name, slug: themenSlug(name), anzahl }))
    .sort((a, b) => b.anzahl - a.anzahl || a.name.localeCompare(b.name, 'de'));
}
```

- [ ] **Step 4: Run** `pnpm check && pnpm test` — grün. **Step 5: Commit** „Übersicht: Artikelliste mit Seiten, Themenfilter, Themenliste".

---

### Task 11: Komponenten Karte und Uebersicht

**Files:**
- Create: `src/lib/komponenten/Karte.svelte`, `src/lib/komponenten/Uebersicht.svelte`
- Create: `test/uebersicht.test.js`

**Interfaces:**
- `Karte`: Prop `karte: Karte` (Typ aus Task 10).
- `Uebersicht`: Props `karten: Karte[]`, `seite: number`, `seiten: number`, `basis: string` (z. B. `/blog` oder `/themen/oer`), `ueberschrift: string`, `hinweis?: string|null`.
- Seitenzahlen: Seite 1 unter `basis`, weitere unter `${basis}/seite/${n}`.

- [ ] **Step 1: Failing tests** `test/uebersicht.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Karte from '../src/lib/komponenten/Karte.svelte';
import Uebersicht from '../src/lib/komponenten/Uebersicht.svelte';

const NACHWEIS = /** @type {any} */ ({ id: 'n', hash: 'h', url: 'https://blossom.edufeed.org/h.jpg', titel: 'Schrein', license: 'https://creativecommons.org/publicdomain/zero/1.0/', credit: 'Comenius-Institut', beschreibung: null, quelle: null, alt: 'Ein Schrein', urheberUrl: null, bearbeitung: null, ki: null, mime: 'image/jpeg' });
const karte = (/** @type {Partial<any>} */ ab = {}) => ({
  d: 'canva', pfad: '/canva', titel: 'Canva für OER', zusammenfassung: 'Kurz.', veroeffentlicht: '2024-12-19T00:00:00.000Z',
  themen: [{ name: 'Lizenzen', slug: 'lizenzen' }], cover: null, ...ab
});

describe('Karte', () => {
  it('verlinkt Titel auf den Pfad, nennt Datum und Themen als Links', () => {
    const { body } = render(Karte, { props: { karte: karte() } });
    expect(body).toContain('href="/canva"');
    expect(body).toContain('Canva für OER');
    expect(body).toContain('19. Dezember 2024');
    expect(body).toContain('href="/themen/lizenzen"');
  });
  it('zeigt das Cover mit Lizenzzeile, wenn eines da ist, sonst kein <img>', () => {
    const mit = render(Karte, { props: { karte: karte({ cover: { url: NACHWEIS.url, alt: 'Ein Schrein', nachweis: NACHWEIS } }) } }).body;
    expect(mit).toContain('<img');
    expect(mit).toContain('alt="Ein Schrein"');
    expect(mit).toContain('Comenius-Institut');
    expect(render(Karte, { props: { karte: karte() } }).body).not.toContain('<img');
  });
});

describe('Uebersicht', () => {
  it('rendert Überschrift, Karten und Seitenzahlen mit richtigen Zielen', () => {
    const { body } = render(Uebersicht, { props: { karten: [karte(), karte({ d: 'b', pfad: '/b', titel: 'B' })], seite: 2, seiten: 3, basis: '/blog', ueberschrift: 'Blog' } });
    expect(body).toContain('<h1');
    expect(body).toContain('Blog');
    expect(body).toContain('href="/blog"');          // Seite 1
    expect(body).toContain('href="/blog/seite/3"');
    expect(body).toContain('aria-current="page"');
    expect(body).toContain('Seite 2 von 3');
  });
  it('nennt einen Hinweis, wenn keine Karten da sind — nie eine leere Liste', () => {
    const { body } = render(Uebersicht, { props: { karten: [], seite: 1, seiten: 1, basis: '/themen/x', ueberschrift: 'Thema', hinweis: 'Zu diesem Thema gibt es keinen Beitrag.' } });
    expect(body).toContain('keinen Beitrag');
  });
  it('zeigt bei einer einzigen Seite keine Seitenzahlen', () => {
    const { body } = render(Uebersicht, { props: { karten: [karte()], seite: 1, seiten: 1, basis: '/blog', ueberschrift: 'Blog' } });
    expect(body).not.toContain('Seite 1 von 1');
  });
});
```

- [ ] **Step 2: Run** — FAIL.

- [ ] **Step 3: Implementieren.** `Karte.svelte`:

```svelte
<script>
  import Lizenzzeile from './Lizenzzeile.svelte';
  /** @type {{ karte: import('$lib/loaders/uebersicht.js').Karte }} */
  let { karte } = $props();
  const datum = $derived(new Date(karte.veroeffentlicht).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }));
</script>

<article class="karte">
  {#if karte.cover}
    <a href={karte.pfad} class="cover" tabindex="-1" aria-hidden="true">
      <img src={karte.cover.url} alt={karte.cover.alt} loading="lazy" />
    </a>
  {/if}
  <div class="text">
    <h2><a href={karte.pfad}>{karte.titel}</a></h2>
    <p class="metazeile"><time datetime={karte.veroeffentlicht}>{datum}</time></p>
    {#if karte.zusammenfassung}<p class="anriss">{karte.zusammenfassung}</p>{/if}
    {#if karte.themen.length > 0}
      <ul class="metazeile themen">
        {#each karte.themen as thema (thema.slug)}
          <li><a class="marker" href={`/themen/${thema.slug}`}>{thema.name}</a></li>
        {/each}
      </ul>
    {/if}
    {#if karte.cover}
      <p class="metazeile bildnachweis"><Lizenzzeile nachweis={karte.cover.nachweis} /></p>
    {/if}
  </div>
</article>

<style>
  .karte { border: 1px solid var(--rl-linie); border-radius: 12px; overflow: hidden; margin-bottom: 24px; background: var(--rl-weiss); }
  .cover img { display: block; width: 100%; height: auto; max-height: 360px; object-fit: cover; }
  .text { padding: 20px 24px 24px; }
  h2 { font-size: 1.5rem; margin-bottom: 6px; }
  h2 a { color: inherit; text-decoration: none; }
  h2 a:hover { text-decoration: underline; }
  .anriss { margin: 10px 0 12px; }
  .themen { list-style: none; padding: 0; margin: 0 0 8px; }
  .marker { text-decoration: none; }
  .bildnachweis { margin-top: 8px; font-size: 0.8rem; }
</style>
```

`Uebersicht.svelte`:

```svelte
<script>
  import Karte from './Karte.svelte';
  /** @type {{ karten: import('$lib/loaders/uebersicht.js').Karte[], seite: number, seiten: number, basis: string, ueberschrift: string, hinweis?: string|null }} */
  let { karten, seite, seiten, basis, ueberschrift, hinweis = null } = $props();
  const pfad = (/** @type {number} */ n) => (n <= 1 ? basis : `${basis}/seite/${n}`);
</script>

<header class="detail-kopf">
  <h1>{ueberschrift}</h1>
</header>

{#if hinweis}
  <p class="hinweis">{hinweis}</p>
{/if}

{#if karten.length === 0 && !hinweis}
  <p class="hinweis">Hier gibt es noch keinen Beitrag.</p>
{/if}

{#each karten as karte (karte.d)}
  <Karte {karte} />
{/each}

{#if seiten > 1}
  <nav class="seitenzahlen metazeile" aria-label="Seiten">
    {#if seite > 1}<a href={pfad(seite - 1)} rel="prev">← Neuere</a>{/if}
    <span>Seite {seite} von {seiten}</span>
    {#if seite < seiten}<a href={pfad(seite + 1)} rel="next">Ältere →</a>{/if}
    <ul>
      {#each Array.from({ length: seiten }, (_, i) => i + 1) as n (n)}
        <li>{#if n === seite}<span aria-current="page">{n}</span>{:else}<a href={pfad(n)}>{n}</a>{/if}</li>
      {/each}
    </ul>
  </nav>
{/if}

<style>
  .seitenzahlen { justify-content: space-between; margin-top: 32px; }
  .seitenzahlen ul { display: flex; gap: 8px; list-style: none; padding: 0; margin: 0; width: 100%; flex-wrap: wrap; }
  .seitenzahlen [aria-current] { font-weight: 700; }
</style>
```

- [ ] **Step 4: Run** `pnpm check && pnpm test` — grün. **Step 5: Commit** „Komponenten: Karte und Übersicht mit Seitenzahlen".

---

### Task 12: Routen `/`, `/blog`, `/blog/seite/[n]`, `/themen`, `/themen/[thema]`, `/themen/[thema]/seite/[n]`

**Files:**
- Create: `src/lib/routen/uebersicht.js` (Ladefunktionen, werfen `error()`)
- Create: `src/routes/blog/+page.server.js`, `+page.svelte`; `src/routes/blog/seite/[n]/+page.server.js`, `+page.svelte`
- Create: `src/routes/themen/+page.server.js`, `+page.svelte`; `src/routes/themen/[thema]/+page.server.js`, `+page.svelte`; `src/routes/themen/[thema]/seite/[n]/…`
- Replace: `src/routes/+page.svelte`, Create: `src/routes/+page.server.js`
- Create: `test/uebersicht-routen.test.js`

**Interfaces:**
- Produces in `src/lib/routen/uebersicht.js`:

```js
export function seitennummer(roh: string|undefined): number      // wirft error(404) bei "0", "abc", "1.5"
export function blogLaden({ konfig, inhalt, seite }): { karten, seite, seiten, gesamt, basis: '/blog', ueberschrift: 'Blog' }
export function themaLaden({ konfig, inhalt, slug, seite }): { …, basis: `/themen/${slug}`, ueberschrift: thema }   // 404 für unbekannten Slug
export function themenLaden({ konfig, inhalt }): { themen: Array<{name, slug, anzahl}> }
export function startLaden({ konfig, inhalt }): blogLaden-Ergebnis mit hinweis
```

Jede Funktion ruft zuerst `leerstandMeldung` und wirft `error(503, meldung)`.

- [ ] **Step 1: Failing tests** `test/uebersicht-routen.test.js` (Muster wie `detailansicht.test.js`: `vi.mock('$env/dynamic/private')`, `vi.doMock('$lib/services/spiegel.js')` mit einem `inhalt` aus `foerbico-artikel-30023.json`):

```js
it('/blog liefert die erste Seite', async () => {
  const daten = await lade('../src/routes/blog/+page.server.js', {});
  expect(daten.seite).toBe(1); expect(daten.karten).toHaveLength(20); expect(daten.basis).toBe('/blog');
});
it('/blog/seite/2 liefert Seite 2; Unsinn ist 404', async () => {
  expect((await lade('../src/routes/blog/seite/[n]/+page.server.js', { n: '2' })).seite).toBe(2);
  await expect(lade('../src/routes/blog/seite/[n]/+page.server.js', { n: 'abc' })).rejects.toMatchObject({ status: 404 });
  await expect(lade('../src/routes/blog/seite/[n]/+page.server.js', { n: '0' })).rejects.toMatchObject({ status: 404 });
});
it('/themen listet Themen mit Anzahl', async () => {
  const daten = await lade('../src/routes/themen/+page.server.js', {});
  expect(daten.themen[0].anzahl).toBeGreaterThan(0);
});
it('/themen/[slug] filtert; unbekannt ist 404 mit Hinweis auf /themen', async () => {
  const daten = await lade('../src/routes/themen/[thema]/+page.server.js', { thema: 'community' });
  expect(daten.ueberschrift).toBe('Community');
  await expect(lade('../src/routes/themen/[thema]/+page.server.js', { thema: 'nope' })).rejects.toMatchObject({ status: 404, body: { message: expect.stringContaining('/themen') } });
});
it('/ zeigt die Übersicht mit dem Hinweis, dass die Startseite fehlt', async () => {
  const daten = await lade('../src/routes/+page.server.js', {});
  expect(daten.hinweis).toContain('startseite');
});
it('leerer Spiegel: 503 mit Relays auf jeder Übersicht', async () => {
  await expect(lade('../src/routes/blog/+page.server.js', {}, leererInhalt())).rejects.toMatchObject({ status: 503 });
});
```

Dazu Komponententests mit `svelte/server` für `src/routes/themen/+page.svelte` (Liste mit Links `/themen/<slug>` und Anzahl).

- [ ] **Step 2: Run** — FAIL.

- [ ] **Step 3: Implementieren** `src/lib/routen/uebersicht.js`:

```js
import { error } from '@sveltejs/kit';
import { artikelListe, themenListe } from '../loaders/uebersicht.js';
import { leerstandMeldung } from '../models/leerstand.js';

/** @typedef {import('../konfig.js').Konfig} Konfig */
/** @typedef {import('../services/spiegel.js').Inhalt} Inhalt */

/** Seitennummer aus der URL: positive Ganzzahl oder 404. @param {string|undefined} roh */
export function seitennummer(roh) {
  if (roh === undefined) return 1;
  if (!/^[1-9]\d*$/.test(roh)) error(404, `Es gibt keine Seite „${roh}“.`);
  return Number(roh);
}

/** @param {Konfig} konfig @param {Inhalt} inhalt */
function leerOderWeiter(konfig, inhalt) {
  const m = leerstandMeldung(inhalt, konfig);
  if (m) error(503, m);
}

/** @param {{ konfig: Konfig, inhalt: Inhalt, seite?: number }} e */
export function blogLaden({ konfig, inhalt, seite = 1 }) {
  leerOderWeiter(konfig, inhalt);
  const liste = artikelListe(inhalt, konfig, { seite });
  if (seite > liste.seiten) error(404, `Der Blog hat ${liste.seiten} Seiten, nicht ${seite}.`);
  return { ...liste, basis: '/blog', ueberschrift: 'Blog', hinweis: null };
}

/** @param {{ konfig: Konfig, inhalt: Inhalt, slug: string, seite?: number }} e */
export function themaLaden({ konfig, inhalt, slug, seite = 1 }) {
  leerOderWeiter(konfig, inhalt);
  const liste = artikelListe(inhalt, konfig, { seite, themaSlug: slug });
  if (liste.thema === null) error(404, `Ein Thema „${slug}“ gibt es nicht. Alle Themen stehen unter /themen.`);
  if (seite > liste.seiten) error(404, `Zum Thema gibt es ${liste.seiten} Seiten, nicht ${seite}.`);
  return { ...liste, basis: `/themen/${slug}`, ueberschrift: liste.thema, hinweis: null };
}

/** @param {{ konfig: Konfig, inhalt: Inhalt }} e */
export function themenLaden({ konfig, inhalt }) {
  leerOderWeiter(konfig, inhalt);
  return { themen: themenListe(inhalt) };
}

/**
 * Stufe 1: Es gibt noch keine Startseite aus Nostr (ADR-0027, Stufe 2). Bis
 * dahin zeigt / den Blog und sagt der Redaktion, welches Event fehlt.
 * @param {{ konfig: Konfig, inhalt: Inhalt }} e
 */
export function startLaden({ konfig, inhalt }) {
  const blog = blogLaden({ konfig, inhalt, seite: 1 });
  return {
    ...blog,
    ueberschrift: 'Beiträge',
    hinweis: 'Es ist noch keine Startseite publiziert: erwartet wird ein kind:30023 mit d = "startseite" unter dem Autor dieser Quelle. Bis dahin steht hier der Blog.'
  };
}
```

Routen sind dünn — Beispiel `src/routes/blog/seite/[n]/+page.server.js`:

```js
import { env } from '$env/dynamic/private';
import { konfigLesen } from '$lib/konfig.js';
import { blogLaden, seitennummer } from '$lib/routen/uebersicht.js';
import { spiegelHolen } from '$lib/services/spiegel.js';

export const prerender = false;

/** @type {import('./$types').PageServerLoad} */
export function load({ params }) {
  return blogLaden({ konfig: konfigLesen(env), inhalt: spiegelHolen().lesen(), seite: seitennummer(params.n) });
}
```

`+page.svelte` für Blog, Blog/Seite, Thema, Thema/Seite und `/`:

```svelte
<script>
  import Uebersicht from '$lib/komponenten/Uebersicht.svelte';
  let { data } = $props();
</script>
<svelte:head><title>{data.ueberschrift} · community-hub</title></svelte:head>
<Uebersicht karten={data.karten} seite={data.seite} seiten={data.seiten} basis={data.basis} ueberschrift={data.ueberschrift} hinweis={data.hinweis} />
```

`src/routes/themen/+page.svelte`:

```svelte
<script>
  let { data } = $props();
</script>
<svelte:head><title>Themen · community-hub</title></svelte:head>
<header class="detail-kopf"><h1>Themen</h1></header>
<ul class="themenliste">
  {#each data.themen as t (t.slug)}
    <li><a href={`/themen/${t.slug}`}>{t.name}</a> <span class="metazeile">{t.anzahl}</span></li>
  {/each}
</ul>
<style>
  .themenliste { list-style: none; padding: 0; columns: 2 18rem; column-gap: 32px; }
  .themenliste li { break-inside: avoid; padding: 6px 0; display: flex; gap: 10px; align-items: baseline; }
</style>
```

- [ ] **Step 4: Run** `pnpm check && pnpm test` — grün. `pnpm dev`: `/`, `/blog`, `/blog/seite/2`, `/themen`, `/themen/community` rendern; `/blog/seite/99` ist 404 mit Text.

- [ ] **Step 5: Commit** „Übersichten: Blog, Seiten, Themen; / zeigt den Blog mit Hinweis auf die fehlende Startseite".

---

### Task 13: Kopfzeile mit Blog und Themen, Fußzeile mit Stand

**Files:**
- Modify: `src/lib/komponenten/Kopfzeile.svelte`, `src/lib/komponenten/Fusszeile.svelte`, `src/routes/+layout.svelte`
- Modify: `test/oberflaeche.test.js`

- [ ] **Step 1: Failing tests** in `test/oberflaeche.test.js`:

```js
it('Kopfzeile verlinkt Blog und Themen — Ansichten, die es jetzt gibt', () => {
  const { body } = render(Kopfzeile);
  expect(body).toContain('href="/blog"');
  expect(body).toContain('href="/themen"');
});
it('Fußzeile nennt das Alter nur, wenn der letzte Lauf scheiterte', () => {
  const alt = render(Fusszeile, { props: { spiegelstand: { zeitpunkt: '2026-09-14T07:00:00Z', veraltet: true, relays: ['wss://r/'] } } }).body;
  expect(alt).toContain('Stand:');
  expect(alt).toContain('kein Relay erreichbar');
  const frisch = render(Fusszeile, { props: { spiegelstand: { zeitpunkt: '2026-09-14T07:00:00Z', veraltet: false, relays: [] } } }).body;
  expect(frisch).not.toContain('Stand:');
});
```

- [ ] **Step 2: Run** — FAIL.

- [ ] **Step 3: Implementieren.** Kopfzeile: nach der Wortmarke

```svelte
    <nav aria-label="Hauptnavigation" class="nav">
      <a href="/blog">Blog</a>
      <a href="/themen">Themen</a>
    </nav>
```

mit `.innen { justify-content: space-between; }`, `.nav { display: flex; gap: 20px; font-family: var(--schrift-label); font-weight: 500; }`. Der Kommentar oben („Keine Navigation …") wird ersetzt durch: „Navigation nur zu Ansichten, die es gibt: Blog und Themen. Das Menü aus kind:30004 folgt in Stufe 2 (ADR-0027)."

Fußzeile: Prop `spiegelstand: { zeitpunkt: string|null, veraltet: boolean, relays: string[] }`; unter `.text`:

```svelte
    {#if spiegelstand.veraltet}
      <p class="stand">
        <strong>Stand: {spiegelstand.zeitpunkt ? new Date(spiegelstand.zeitpunkt).toLocaleString('de-DE') : 'unbekannt'}</strong>
        — kein Relay erreichbar ({spiegelstand.relays.join(', ')}). Der Dienst zeigt den letzten gültigen Stand und versucht es weiter.
      </p>
    {/if}
```

`+layout.svelte`: `data` durchreichen (siehe Task 8).

- [ ] **Step 4: Run** `pnpm check && pnpm test` — grün. **Step 5: Commit** „Kopfzeile mit Blog und Themen; Fußzeile nennt das Alter bei Relay-Ausfall".

---

### Task 14: Architekturregel „nur der Spiegel spricht mit Relays"

**Files:**
- Modify: `src/lib/architektur.test.js`

- [ ] **Step 1: Test ergänzen** im `describe('Architekturregeln (ADR-0014)')`:

```js
  it('nur services/spiegel.js importiert services/relay.js (ADR-0028)', () => {
    const dateien = quelldateien(join(wurzel, 'src'), (p) => (p.endsWith('.js') || p.endsWith('.svelte')) && !p.endsWith('.test.js'));
    /** @type {string[]} */
    const verstoesse = [];
    for (const datei of dateien) {
      if (datei.endsWith('services/spiegel.js') || datei.endsWith('services/relay.js')) continue;
      for (const { nr, text } of zeilen(datei)) {
        const quelle = importquelle(text);
        if (quelle && /services\/relay(\.js)?$/.test(quelle)) verstoesse.push(`${datei}:${nr} importiert '${quelle}'`);
      }
    }
    expect(verstoesse, 'Jede Anfrage rendert aus dem Spiegel, nie direkt vom Relay (ADR-0028):\n' + verstoesse.join('\n')).toEqual([]);
  });
```

- [ ] **Step 2: Run** `pnpm vitest run src/lib/architektur.test.js` — Expected: PASS, wenn Task 7 die Re-Exporte (`ABFRAGEGRUND_TEXT`, `ZUSAMMENFUEHREN_UNERREICHBAR`) über `spiegel.js` gezogen hat; sonst nennt der Test die Datei — dort den Import umbiegen.

- [ ] **Step 3: Commit** „Architekturtest: Relay-Zugriff nur im Spiegel (ADR-0028)".

---

### Task 15: Dokumentation nachziehen und Stufe abschließen

**Files:**
- Modify: `CLAUDE.md`, `docs/betrieb.md`, `docs/STATUS.md`, `test/fixtures/README.md`

- [ ] **Step 1: CLAUDE.md** — nur, was durch ADR-0026 bis 0030 falsch geworden ist:
  - Kopf: erster Absatz → „Lesender Client, der oer.community vollständig aus Nostr-Events rendert (ADR-0026). Begonnen als relilab-Schaufenster; relilab ist dokumentierte, nicht betriebene Quelle."; Wortmarke-Absatz: ADR-0019 ist ersetzt, die Wortmarke kommt in Stufe 2 aus `kind:0` (ADR-0027), bis dahin steht „Community-Hub".
  - „Zuschnitt": „Nur Lesen: Artikel, Seiten, Detailansicht, Themenfilter." Termine streichen. Hinweis: „Termine sind nicht im Zuschnitt (ADR-0026)."
  - Neuer Abschnitt nach „Nostr-Operationen": **„Der Spiegel"** — drei Sätze: Jede Anfrage liest aus `services/spiegel.js`; nur er importiert `services/relay.js` (Architekturtest); Datei unter `SPIEGEL_PFAD`, Läufe alle `SPIEGEL_INTERVALL_S`; Alter in der Fußzeile bei Fehlschlag (ADR-0028).
  - „Daten": Zeile „FOERBICO hat derzeit keine Termine … Termin-Ansicht wird gebaut" streichen. Bei „Wiederkehrende Fallen" ergänzen: „**Bilder von abgelösten Hosts** (`ABGELOESTE_HOSTS`, Standard `oer.community`) gelten wie relative Pfade (ADR-0030)." und „**Ein Beitrag ist eine Seite**, wenn er `["l","seite","foerbico/typ"]` trägt (ADR-0027); Seiten erscheinen nicht im Blog."
  - „Sortierung": nur noch „Artikel `published_at` absteigend".
  - „Warum ein Bild fehlt": Pfade `/[d]/json` statt `/[naddr]/json`; „Beide Routen laufen durch `loaders/beitrag.js`" bleibt; ergänzen: „`/[naddr]` leitet auf `/[d]` weiter (ADR-0029)."
  - „Fehlerfälle": unverändert, jetzt wahr.
  - „Arbeitsweise → Vor jedem Merge": `pnpm check && pnpm test` — mit dem Zusatz „(`lint` und `test:e2e` gibt es noch nicht; offener Punkt der Spec vom 14.09.)".
  - „Umgebungen": Tabelle: `dev.relilab.org`/`int.relilab.org` → „Ziel ist oer.community; Zwischenstände laufen auf dem Hetzner-Server aus `docs/betrieb.md`."
- [ ] **Step 2: `docs/betrieb.md`**: Abschnitt „Spiegel": Verzeichnis `~/community-hub/daten/` muss beschreibbar sein; `daten/spiegel.json` wird vom Dienst geschrieben; `ausliefern.sh` überschreibt es nicht (prüfen: `git archive` enthält es nicht, weil `.gitignore`).
- [ ] **Step 3: `test/fixtures/README.md`**: Hinweis, dass die Fixtures jetzt auch den Spiegel füttern (`spiegel.test.js`, `uebersicht.test.js`).
- [ ] **Step 4: `docs/STATUS.md`** neuer Eintrag oben, drei Fragen: Passiert (Spec 14.09., ADR-0026–0031, Stufe 1 umgesetzt: Spiegel, `/[d]`, Blog, Themen, `naddr`-Weiterleitung; Testzahl), Wo steht es (live-Verhalten mit heutigen Daten: 87 Artikel, Cover nur bei 16 mit Nachweis; `/` zeigt Blog mit Hinweis), Nächster Schritt (Stufe 2: Seiten, Menü, Fußzeile, Startseite — braucht mdparser-Punkte 1–4 aus der Spec; Plan schreiben).
- [ ] **Step 5: Vollständiger Lauf**

```bash
pnpm check && pnpm test
pnpm build && PORT=8080 node build/index.js &   # kurz starten, /blog abrufen, beenden
```

Expected: grün; `/blog` liefert HTML mit 20 Karten.

- [ ] **Step 6: Commit** „Doku: CLAUDE.md, Betrieb, STATUS für Stufe 1" und dann `superpowers:finishing-a-development-branch` (Merge nach `dev`).

---

## Selbstprüfung gegen die Spec (Stufe-1-Anteil)

| Spec-Anforderung | Task |
|---|---|
| Routen `/[d]`, `/en/[d]`, `/blog`, `/blog/seite/[n]`, `/themen`, `/themen/[thema]`, `/[d]/json`, `/[naddr]`-Redirect | 8, 12 |
| `/` → Übersicht mit Hinweis, solange keine Startseite | 12 |
| Spiegel: Bestände, Zusammenführen, Nachweise über alle Relays in 50er-Blöcken, Etags, gültig/ungültig, atomar, Datei, Startwartezeit, Intervall, Stand | 4, 5, 6 |
| Loader nur aus dem Spiegel; Architekturtest | 7, 14 |
| Seite-oder-Artikel per Label | 3, 10 |
| Themen-Tabelle, Slugs | 9 |
| Abgelöste Hosts | 1, 2, 7, 10 |
| Fehlerfälle: leer/keine Datei, kein Artikel des Autors, `d` unbekannt, fremdes `naddr`, Alter in Fußzeile, stummes Relay in Entwickleransicht | 6, 7, 8, 12, 13 |
| Konfiguration `SPIEGEL_*`, `ABGELOESTE_HOSTS`, drei Relays in der Vorlage | 1 |
| Tests mit `svelte/server`, Fixtures ohne Netz | alle |
| Termine raus (ADR-0026) | 7, 15 |

Nicht in Stufe 1 (bewusst): `30004`-Menü, `kind:0` in Kopf/Fuß, Startseite, Seiten-Darstellung ohne Datum, Feed, Sitemap, `trailingSlash`, FOERBICO-Tokens, `STARTSEITE_D`/`NAVIGATION_D`/`FUSSZEILE_D`, Testschlüssel-Fixtures. Das sind Stufe 2 bis 4 mit eigenen Plänen.
