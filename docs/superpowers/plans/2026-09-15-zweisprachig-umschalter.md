# Zweisprachig DE/EN mit Umschalter — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Der Hub zeigt englische Inhalte unter `/en/…`, kennt zu Seiten ihr Gegenstück in der anderen Sprache und bietet in der Kopfzeile einen Umschalter DE | EN, der auf das Gegenstück führt — sonst auf die Startseite der Sprache.

**Architecture:** Die Sprache eines Beitrags bleibt `inLanguage`; die Adresse bleibt `d`, das für englische Inhalte wie der Hugo-Pfad mit `en/` beginnt (`en/conference` → `/en/conference`). Übersetzungen werden als `a`-Tags mit Marker `translation` gelesen (schema.org `workTranslation`/`translationOfWork` im Frontmatter, vom mdparser emittiert); ein Loader baut daraus die symmetrische Zuordnung. Die Layout-Daten tragen die Sprache der aktuellen Adresse; Menü und Fußzeile werden auf Gegenstücke abgebildet, wo es sie gibt. Die wenigen Oberflächentexte des Hubs stehen in einer kleinen Tabelle `src/lib/sprache.js` (kein Paraglide, ADR-0033). `<html lang>` kommt je Antwort aus dem Hook.

**Tech Stack:** SvelteKit 2 (hooks `transformPageChunk`), Svelte 5 Runes, JSDoc `checkJs`+`strict`, Vitest mit `svelte/server`.

**Spec:** `docs/entscheidungen/0033-zweisprachig-de-en-mit-umschalter.md` (Task 1; hält die Gestaltung fest, Status „offen, umgesetzt auf Wunsch von Jörg vom 15.09.") — ergänzt ADR-0029 (Adressen sind `d`) und ADR-0027 (Struktur aus Nostr); löst den Satz „Keine Mehrsprachigkeit" in CLAUDE.md und die Spec-Aussage „`/en` leitet auf `/`" ab. Produzentenseite (mdparser, FOERBICO-Repo) steht am Ende dieses Plans als Teil P, wird vom Controller nach dem Hub-Merge ausgeführt.

## Global Constraints

- Sprache des Codes: Bezeichner, Kommentare, Commits Deutsch; Nostr-Namen (`kind`, `d`, `a`, `inLanguage`) englisch. Oberflächentexte Deutsch **und** Englisch nur über `src/lib/sprache.js`, nie als zweiter Literalstring in einer Komponente.
- Datenschicht (`src/lib/loaders|models|services`) importiert nichts aus routes/components/$app. `.svelte` importiert zur Laufzeit nichts aus `src/lib/routen|loaders|services`; `$lib/sprache.js`, `$lib/models/*`, `$lib/kanonisch.js` sind erlaubt (`src/lib/architektur.test.js`).
- Nur `routen/*.js` wirft `error()`/`redirect()`.
- Komponenten nur mit `--fb-*`-Token, kein Hex im `<style>`.
- Die Adresse eines Beitrags ist sein `d` (ADR-0029): englische `d` tragen `en/` als Präfix; ein englischer Beitrag ohne Präfix (Altbestand, Testquelle `our-team`) bleibt unter `/en/<d>` erreichbar.
- `/en` ohne englische Startseite leitet weiter auf `/` (301) — nie eine leere Seite ohne Erklärung.
- Keine `/en/blog`, keine `/en/themen`: Blog und Themen bleiben eine Liste, Beiträge erscheinen in ihrer Sprache.
- Vor jedem Commit `pnpm check && pnpm test` grün; Trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`; keine Subagents aus Implementer-Sicht; kein bare `git stash`.

## Dateistruktur

| Datei | Verantwortung |
|---|---|
| `docs/entscheidungen/0033-zweisprachig-de-en-mit-umschalter.md` (neu) | Entscheidung |
| `src/lib/sprache.js` (neu, rein) | `spracheAusPfad`, `startPfad`, `TEXTE`, `t()` |
| `src/lib/models/artikel.js` | `uebersetzungen` aus `a`-Tags, `beitragsPfad` mit `en/`-Präfix |
| `src/lib/loaders/uebersetzungen.js` (neu) | `gegenstueck(inhalt, artikel)`, `englischVorhanden(inhalt)` |
| `src/lib/routen/detail.js` | Suche `en/<d>` dann `<d>`, Startseiten-Weiterleitung je Sprache, `uebersetzung` und `sprache` in `seite` |
| `src/lib/routen/uebersicht.js` | `startLaden({ sprache })` |
| `src/lib/routen/struktur.js` | `strukturFuerLayout({ sprache })`: Menü/Fußzeile auf Gegenstücke, Hub-Ansichten übersetzt, `zweisprachig`, `sprache` |
| `src/routes/en/+page.server.js`, `src/routes/en/+page.svelte` (neu) | englische Startseite |
| `src/routes/en/[d]/json/+server.js` (neu) | Entwickleransicht englisch |
| `src/hooks.server.js`, `src/app.html` | `<html lang>` je Antwort |
| `src/routes/+layout.server.js`, `src/routes/+layout.svelte` | Sprache der Adresse, Umschalter-Ziel |
| `src/lib/komponenten/Kopfzeile.svelte` | Umschalter DE \| EN |
| `src/lib/komponenten/Detail.svelte`, `Bildbereich.svelte`, `Lizenzpille.svelte` | Texte und Datum in der Sprache des Beitrags, `hreflang` |
| `test/fixtures/testquelle/erzeugen.mjs` + `events.json` | `our-team` mit Übersetzungs-Tag, neue Seite `en/startseite` |
| Tests | `src/lib/sprache.test.js`, `src/lib/models/artikel.test.js`, `src/lib/loaders/uebersetzungen.test.js`, `test/detailansicht.test.js`/`test/uebersicht-routen.test.js`, `test/oberflaeche.test.js`, `test/struktur.test.js` |
| `CLAUDE.md`, `docs/STATUS.md` | Regel „Sprache", Logbuch |

---

### Task 1: ADR-0033 und reines Sprachmodul

**Files:**
- Create: `docs/entscheidungen/0033-zweisprachig-de-en-mit-umschalter.md`
- Create: `src/lib/sprache.js`
- Test: `src/lib/sprache.test.js`

**Interfaces:**
- Produces: `spracheAusPfad(pfad: string): 'de'|'en'`, `startPfad(sprache): '/'|'/en'`, `t(sprache, schluessel): string`, `TEXTE`. Keine Laufzeitimporte (wie `kanonisch.js`), damit Komponenten es nutzen dürfen.

- [ ] **Step 1: ADR anlegen**

```markdown
# ADR-0033: Zweisprachig — Englisch als zweite Sprache mit Umschalter

**Status:** offen — umgesetzt am 2026-09-15 auf Wunsch von Jörg („Mehrsprachigkeits-Toggle inkl. Umsetzung"); Bestätigung der Gestaltung durch das Team steht aus
**Beteiligte:** Jörg

Ergänzt ADR-0027 (Struktur aus Nostr) und ADR-0029 (Adressen sind `d`).
Löst den Satz „Keine Mehrsprachigkeit, kein Paraglide/inlang" in CLAUDE.md
und die Aussage der Spec vom 14.09. ab, `/en` leite auf `/` weiter und eine
englische Startseite gebe es nicht.

## Kontext

oer.community hat drei englische Seiten (`/en/conference`,
`/en/oer-and-oep`, `/en/our-team`) und eine englische Startseite (`/en`),
alle als Übersetzungen deutscher Seiten. Hugo verlinkt sie im PaperMod-Theme
über einen Sprachumschalter. Im Hub waren sie bisher weder publiziert (dem
Frontmatter fehlten `name`, `description`, `datePublished`) noch
verbunden: Kein Event sagt, welche Seite die Übersetzung welcher anderen
ist, und der Hub kannte nur die Regel „`inLanguage = en` → `/en/<d>`".

Zwei Fragen waren offen: Wie heißt das `d` einer englischen Seite, und woher
weiß der Hub, welche deutsche Seite dazugehört?

## Entscheidung

1. **Das `d` ist der Hugo-Pfad, auch für Englisch.** `id:
   https://oer.community/en/conference` ergibt `d = en/conference`, wie der
   mdparser es aus der `id` ableitet. So kollidieren `impressum` und
   `en/impressum` nicht (ersetzbare Events sind je Autor und `d` eindeutig).
   Die Adresse im Hub ist `/` + `d`, also `/en/conference`. Ein englischer
   Beitrag ohne Präfix (Altbestand) bleibt unter `/en/<d>` erreichbar; die
   Route `/en/[d]` sucht erst `en/<d>`, dann `<d>` in Sprache `en`.
2. **Übersetzungen stehen im Frontmatter als schema.org-Relation** —
   `workTranslation` an der deutschen Seite (URL der englischen),
   `translationOfWork` an der englischen (URL der deutschen). Der mdparser
   schreibt daraus `["a", "30023:<pubkey>:<d>", "", "translation"]`. Der Hub
   liest beide Richtungen und baut die Zuordnung symmetrisch: eine Richtung
   genügt, damit der Umschalter funktioniert.
3. **Ein Umschalter DE | EN in der Kopfzeile**, nur wenn der Spiegel
   englische Inhalte hat. Ziel ist das Gegenstück der aktuellen Seite, sonst
   die Startseite der Sprache: `/` oder `/en`. `/en` zeigt die Seite
   `en/<STARTSEITE_D>`; fehlt sie, leitet `/en` weiter auf `/`.
   Die Seite trägt `<link rel="alternate" hreflang>` auf ihr Gegenstück.
4. **Menü und Fußzeile folgen der Sprache der Adresse:** Unter `/en/…`
   zeigt jeder Eintrag sein Gegenstück, wenn es eines gibt, sonst den
   deutschen Eintrag (ein deutsches Impressum ist besser als keines). Die
   Ansichten des Hubs heißen „Blog" und „Topics".
5. **Blog und Themen bleiben eine Liste.** Beiträge erscheinen in ihrer
   Sprache; `/en/blog` gibt es nicht, bis es englische Beiträge gibt.
6. **Oberflächentexte des Hubs stehen in einer Tabelle** (`src/lib/sprache.js`,
   Deutsch und Englisch) — ein Dutzend Strings. Paraglide/inlang bleibt
   draußen: Der Hub hat kaum Chrome, und eine Bibliothek brächte einen
   Build-Schritt für zwölf Wörter. `<html lang>` wird je Antwort gesetzt.

## Konsequenzen

- **Produzentenseite:** Die englischen Seiten brauchen `name`,
  `description`, `datePublished`, `creator` und `translationOfWork`; die
  deutschen `workTranslation`. Eine englische Startseite entsteht als
  `content/en/startseite/index.md` (für Hugo nicht gerendert), Gegenstück von
  `startseite`. Der mdparser emittiert das `a`-Tag (Contract
  `event-tag-mapping.md`).
- **Der Umschalter ist ehrlich:** Auf einer Seite ohne Gegenstück führt er
  auf die Startseite der anderen Sprache — kein „in Vorbereitung".
- **Blog-Beiträge in Englisch** würden heute im deutschen Blog erscheinen.
  Wenn es sie gibt, ist `/en/blog` als Filter auf `inLanguage = en` die
  naheliegende Ergänzung — nicht Teil dieser ADR.
- **Woran wir merken, dass es falsch war:** Wenn Redaktion Übersetzungen
  nicht als Relation im Frontmatter pflegt, sondern nach Slug-Ähnlichkeit
  erwartet; oder wenn das Chrome mehr Texte bekommt, als eine Tabelle
  trägt — dann ist Paraglide neu zu bewerten.
```

- [ ] **Step 2: Failing Test** — `src/lib/sprache.test.js`

```js
import { describe, expect, it } from 'vitest';
import { spracheAusPfad, startPfad, t, TEXTE } from './sprache.js';

describe('sprache.js (ADR-0033)', () => {
  it('liest die Sprache aus dem Pfad: /en und /en/… sind Englisch, alles andere Deutsch', () => {
    expect(spracheAusPfad('/')).toBe('de');
    expect(spracheAusPfad('/blog')).toBe('de');
    expect(spracheAusPfad('/en')).toBe('en');
    expect(spracheAusPfad('/en/')).toBe('en');
    expect(spracheAusPfad('/en/conference')).toBe('en');
    expect(spracheAusPfad('/entwurf')).toBe('de');
  });
  it('kennt die Startseite je Sprache', () => {
    expect(startPfad('de')).toBe('/');
    expect(startPfad('en')).toBe('/en');
  });
  it('liefert Texte in beiden Sprachen, Rückfall Deutsch', () => {
    expect(t('de', 'themen')).toBe('Themen');
    expect(t('en', 'themen')).toBe('Topics');
    expect(t('en', 'lizenzUngeklaert')).toBe('Licence unclear');
    expect(t('en', 'seiteVon', 2, 3)).toBe('Page 2 of 3');
    expect(t('de', 'seiteVon', 2, 3)).toBe('Seite 2 von 3');
    // Jeder deutsche Schlüssel hat ein englisches Gegenstück.
    expect(Object.keys(TEXTE.en).sort()).toEqual(Object.keys(TEXTE.de).sort());
  });
});
```

- [ ] **Step 3: Test läuft rot** — `pnpm vitest run src/lib/sprache.test.js` → FAIL (Modul fehlt).

- [ ] **Step 4: `src/lib/sprache.js`**

```js
/**
 * Sprache und Oberflächentexte des Hubs (ADR-0033). Rein — keine Importe —,
 * damit Komponenten, Routen und Loader es gleichermaßen nutzen dürfen
 * (Architekturregel wie bei kanonisch.js).
 *
 * Die Sprache eines Beitrags steht in seinem inLanguage-Tag; die Sprache
 * einer Adresse ist ihr erstes Segment: `/en` und `/en/…` sind Englisch.
 * Die Texte hier sind das ganze Chrome des Hubs — bewusst eine Tabelle, kein
 * Paraglide (ADR-0033, Punkt 6).
 */

/** @typedef {'de'|'en'} Sprache */

/** @type {readonly Sprache[]} */
export const SPRACHEN = ['de', 'en'];

/** @param {string} pfad @returns {Sprache} */
export function spracheAusPfad(pfad) {
  return pfad === '/en' || pfad.startsWith('/en/') ? 'en' : 'de';
}

/** Startseite der Sprache. @param {Sprache} sprache */
export function startPfad(sprache) {
  return sprache === 'en' ? '/en' : '/';
}

/**
 * @typedef {object} Texte
 * @property {string} blog
 * @property {string} themen
 * @property {string} neuere
 * @property {string} aeltere
 * @property {(n: number, m: number) => string} seiteVon
 * @property {string} seiten
 * @property {string} keinBeitrag
 * @property {string} lizenzUngeklaert
 * @property {string} bildNichtAngezeigt
 * @property {(n: number) => string} entfernteBilder
 * @property {string} sprache
 * @property {string} zurStartseite
 * @property {string} hauptnavigation
 * @property {string} datumsformat  BCP-47-Locale für toLocaleDateString
 */

/** @type {Record<Sprache, Texte>} */
export const TEXTE = {
  de: {
    blog: 'Blog',
    themen: 'Themen',
    neuere: '← Neuere',
    aeltere: 'Ältere →',
    seiteVon: (n, m) => `Seite ${n} von ${m}`,
    seiten: 'Seiten',
    keinBeitrag: 'Hier gibt es noch keinen Beitrag.',
    lizenzUngeklaert: 'Lizenz ungeklärt',
    bildNichtAngezeigt: 'Bild nicht angezeigt.',
    entfernteBilder: (n) =>
      `${n} Bildverweis${n === 1 ? '' : 'e'} ohne Lizenznachweis wurden nicht ausgeliefert (ADR-0015):`,
    sprache: 'Sprache',
    zurStartseite: 'zur Startseite',
    hauptnavigation: 'Hauptnavigation',
    datumsformat: 'de-DE'
  },
  en: {
    blog: 'Blog',
    themen: 'Topics',
    neuere: '← Newer',
    aeltere: 'Older →',
    seiteVon: (n, m) => `Page ${n} of ${m}`,
    seiten: 'Pages',
    keinBeitrag: 'Nothing here yet.',
    lizenzUngeklaert: 'Licence unclear',
    bildNichtAngezeigt: 'Image not shown.',
    entfernteBilder: (n) =>
      `${n} image reference${n === 1 ? '' : 's'} without a licence record ${n === 1 ? 'was' : 'were'} not delivered (ADR-0015):`,
    sprache: 'Language',
    zurStartseite: 'to the start page',
    hauptnavigation: 'Main navigation',
    datumsformat: 'en-GB'
  }
};

/**
 * Text in einer Sprache; Funktionen werden mit den restlichen Argumenten
 * aufgerufen. Unbekannte Sprache fällt auf Deutsch zurück.
 * @template {keyof Texte} K
 * @param {Sprache} sprache @param {K} schluessel @param {...any} args
 * @returns {string}
 */
export function t(sprache, schluessel, ...args) {
  const tabelle = TEXTE[sprache] ?? TEXTE.de;
  const wert = tabelle[schluessel];
  return typeof wert === 'function' ? /** @type {any} */ (wert)(...args) : /** @type {string} */ (wert);
}
```

- [ ] **Step 5: Test grün, Check** — `pnpm vitest run src/lib/sprache.test.js && pnpm check`.

- [ ] **Step 6: Commit**

```bash
git add docs/entscheidungen/0033-zweisprachig-de-en-mit-umschalter.md src/lib/sprache.js src/lib/sprache.test.js
git commit -m "ADR-0033: Zweisprachig DE/EN — Sprachmodul mit Texten und Pfadregel

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Modell und Loader — Übersetzungen und Adressen

**Files:**
- Modify: `src/lib/models/artikel.js` (Typedef `Artikel`, `artikelAusEvent`, `beitragsPfad`)
- Create: `src/lib/loaders/uebersetzungen.js`
- Modify: `test/fixtures/testquelle/erzeugen.mjs`, regenerate `test/fixtures/testquelle/events.json`
- Test: `src/lib/models/artikel.test.js` (bestehend; ergänzen), `src/lib/loaders/uebersetzungen.test.js` (neu)

**Interfaces:**
- Consumes: `zielAusKoordinate` aus `src/lib/models/liste.js`; `artikelAusSpiegel` aus `src/lib/loaders/artikel.js`.
- Produces: `Artikel.uebersetzungen: string[]` (die `d` der Gegenstücke); `UEBERSETZUNG_MARKER = 'translation'`; `beitragsPfad` → `/en/<rest>` für `d` mit Präfix `en/`, `/en/<d>` für Sprache `en` ohne Präfix, sonst `/<d>`; `gegenstueck(inhalt, artikel): Artikel|null`; `englischVorhanden(inhalt): boolean`.
- Testquelle danach: `our-team` (ohne Präfix, `inLanguage en`, `a`-Tag auf `unser-team`), neu `en/startseite` (`Welcome`, `a`-Tag auf `startseite`). Damit hat die Testquelle 7 Artikel (30023).

- [ ] **Step 1: Failing Tests**

In `src/lib/models/artikel.test.js` ergänzen (bestehende Importe nutzen; `artikelAusEvent`, `beitragsPfad` sind importiert — sonst ergänzen):

```js
describe('Übersetzungen und Adressen (ADR-0033)', () => {
  const PK = 'a'.repeat(64);
  const ev = (/** @type {string[][]} */ tags) => /** @type {any} */ ({ id: 'x', pubkey: PK, created_at: 1, kind: 30023, tags, content: '', sig: '' });

  it('liest die d der Gegenstücke aus a-Tags mit Marker translation — nur eigene 30023', () => {
    const a = artikelAusEvent(ev([['d', 'tagungen'], ['inLanguage', 'de'],
      ['a', `30023:${PK}:en/conference`, '', 'translation'],
      ['a', `30023:${'b'.repeat(64)}:fremd`, '', 'translation'],
      ['a', `30142:${PK}:tagungen`, 'wss://amb/', 'amb-metadata'],
      ['a', `30023:${PK}:ohne-marker`]]));
    expect(a.uebersetzungen).toEqual(['en/conference']);
  });

  it('beitragsPfad: en/-Präfix wird zur /en/-Adresse, Sprache en ohne Präfix ebenso, sonst /d', () => {
    expect(beitragsPfad({ d: 'en/conference', sprache: 'en' })).toBe('/en/conference');
    expect(beitragsPfad({ d: 'our-team', sprache: 'en' })).toBe('/en/our-team');
    expect(beitragsPfad({ d: 'tagungen', sprache: 'de' })).toBe('/tagungen');
    expect(beitragsPfad({ d: 'en/oer-visuelle-qualit%C3%A4t', sprache: 'en' })).toBe('/en/oer-visuelle-qualit%C3%A4t');
  });
});
```

Neu `src/lib/loaders/uebersetzungen.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { englischVorhanden, gegenstueck } from './uebersetzungen.js';
import { artikelAusSpiegel } from './artikel.js';
import { leererInhalt } from '../services/spiegel.js';
import { inhaltDerTestquelle } from '../../../test/fixtures/testquelle/laden.js';

describe('gegenstueck (ADR-0033)', () => {
  const { inhalt } = inhaltDerTestquelle();
  const hole = (/** @type {string} */ d) => /** @type {NonNullable<ReturnType<typeof artikelAusSpiegel>['artikel']>} */ (artikelAusSpiegel(inhalt, { d }).artikel);

  it('vorwärts: our-team nennt unser-team als Übersetzung', () => {
    expect(gegenstueck(inhalt, hole('our-team'))?.d).toBe('unser-team');
  });
  it('rückwärts: unser-team hat kein a-Tag, findet our-team trotzdem', () => {
    expect(gegenstueck(inhalt, hole('unser-team'))?.d).toBe('our-team');
  });
  it('die Startseiten sind Gegenstücke', () => {
    expect(gegenstueck(inhalt, hole('startseite'))?.d).toBe('en/startseite');
    expect(gegenstueck(inhalt, hole('en/startseite'))?.d).toBe('startseite');
  });
  it('ohne Gegenstück null', () => {
    expect(gegenstueck(inhalt, hole('impressum'))).toBeNull();
  });
  it('englischVorhanden: Testquelle ja, leerer Spiegel nein', () => {
    expect(englischVorhanden(inhalt)).toBe(true);
    expect(englischVorhanden(leererInhalt())).toBe(false);
  });
});
```

- [ ] **Step 2: Rot laufen lassen** — `pnpm vitest run src/lib/models/artikel.test.js src/lib/loaders/uebersetzungen.test.js` → FAIL.

- [ ] **Step 3: Testquelle erweitern** — in `test/fixtures/testquelle/erzeugen.mjs`:

Nach `const a = (…)` ergänzen:

```js
/** Übersetzungs-Relation (ADR-0033): a-Tag mit Marker translation. */
const uebersetzung = (/** @type {string} */ d) => ['a', `30023:${PUBKEY}:${d}`, '', 'translation'];
```

Die Zeile für `our-team` ersetzen und danach `en/startseite` einfügen:

```js
  ev(30023, [['d', 'our-team'], ['title', 'Our team'], ['published_at', String(ZEIT)], ['inLanguage', 'en'], ...SEITE, uebersetzung('unser-team')], 'Three people.'),
  ev(30023, [['d', 'en/startseite'], ['title', 'Welcome'], ['published_at', String(ZEIT)], ['inLanguage', 'en'], ...SEITE, uebersetzung('startseite')], 'Welcome to the **Testquelle**.'),
```

Dann `node test/fixtures/testquelle/erzeugen.mjs` (schreibt `events.json`; `schluessel.json` bleibt gleich). `git diff --stat test/fixtures/testquelle/` muss beide Dateien zeigen.

- [ ] **Step 4: Modell** — `src/lib/models/artikel.js`

Import oben: `import { zielAusKoordinate } from './liste.js';`

Typedef ergänzen: ` * @property {string[]} uebersetzungen  d der Gegenstücke aus a-Tags mit Marker translation (ADR-0033)`

Nach `SEITEN_LABEL`:

```js
/** Marker des a-Tags, das auf die Übersetzung eines Beitrags zeigt (ADR-0033). */
export const UEBERSETZUNG_MARKER = 'translation';

/**
 * Die d der Übersetzungen: `["a", "30023:<pubkey>:<d>", "<relay>", "translation"]`.
 * Nur Ziele derselben Quelle und derselben Art (30023) zählen — eine
 * Übersetzung bei einem anderen Autor wäre ein fremder Text.
 * @param {string[][]} tags @param {string} pubkey @returns {string[]}
 */
function uebersetzungenAus(tags, pubkey) {
  /** @type {string[]} */
  const ds = [];
  for (const t of tags) {
    if (t[0] !== 'a' || !t[1] || t[3] !== UEBERSETZUNG_MARKER) continue;
    const ziel = zielAusKoordinate(t[1]);
    if (ziel && ziel.kind === 30023 && ziel.pubkey === pubkey.toLowerCase()) ds.push(ziel.d);
  }
  return ds;
}
```

In `artikelAusEvent` im Rückgabeobjekt nach `istSeite: …` ergänzen: `uebersetzungen: uebersetzungenAus(tags, event.pubkey)` (Komma davor setzen).

`beitragsPfad` ersetzen:

```js
/**
 * Der Pfad eines Beitrags im Hub — `/` + d (ADR-0029). Englische Inhalte
 * tragen ihr d mit Präfix `en/` wie ihren Hugo-Pfad (ADR-0033); ein
 * englischer Beitrag ohne Präfix (Altbestand) wohnt ebenfalls unter /en/.
 *
 * @param {{ d: string, sprache: 'de'|'en' }} beitrag
 * @returns {string}
 */
export function beitragsPfad(beitrag) {
  const d = dNormalisieren(beitrag.d);
  if (d.startsWith('en/')) return `/en/${encodeURIComponent(d.slice(3))}`;
  return beitrag.sprache === 'en' ? `/en/${encodeURIComponent(d)}` : `/${encodeURIComponent(d)}`;
}
```

- [ ] **Step 5: Loader** — `src/lib/loaders/uebersetzungen.js`

```js
/**
 * Übersetzungen zwischen Beiträgen (ADR-0033): Das a-Tag mit Marker
 * translation steht an einer Seite oder an beiden; hier wird die Zuordnung
 * symmetrisch, damit der Umschalter in beide Richtungen führt.
 */
import { artikelAusEvent, dNormalisieren } from '../models/artikel.js';
import { artikelAusSpiegel } from './artikel.js';

/** @typedef {import('../services/spiegel.js').Inhalt} Inhalt */
/** @typedef {import('../models/artikel.js').Artikel} Artikel */

/**
 * Das Gegenstück eines Beitrags in der anderen Sprache — oder null.
 * Vorwärts über die eigenen a-Tags, rückwärts über die a-Tags aller anderen.
 * @param {Inhalt} inhalt @param {Artikel} artikel @returns {Artikel|null}
 */
export function gegenstueck(inhalt, artikel) {
  for (const d of artikel.uebersetzungen) {
    const { artikel: ziel } = artikelAusSpiegel(inhalt, { d });
    if (ziel && ziel.sprache !== artikel.sprache) return ziel;
  }
  const eigenes = dNormalisieren(artikel.d);
  for (const event of inhalt.artikel) {
    const kandidat = artikelAusEvent(event);
    if (kandidat.sprache === artikel.sprache) continue;
    if (kandidat.uebersetzungen.some((d) => dNormalisieren(d) === eigenes)) return kandidat;
  }
  return null;
}

/** Gibt es im Spiegel überhaupt englische Beiträge? Dann erscheint der Umschalter. @param {Inhalt} inhalt */
export function englischVorhanden(inhalt) {
  return inhalt.artikel.some((e) => artikelAusEvent(e).sprache === 'en');
}
```

- [ ] **Step 6: Alle Tests, Check** — `pnpm vitest run src/lib && pnpm check && pnpm test`. Bestehende Tests, die die Zahl der Testquelle-Artikel annehmen (5 → 7) oder `beitragsPfad`-Ergebnisse festschreiben, anpassen — jede Anpassung im Report nennen.

- [ ] **Step 7: Commit**

```bash
git add src/lib/models/artikel.js src/lib/models/artikel.test.js src/lib/loaders/uebersetzungen.js src/lib/loaders/uebersetzungen.test.js test/fixtures/testquelle/erzeugen.mjs test/fixtures/testquelle/events.json
git commit -m "Übersetzungen als a-Tag mit Marker translation; d mit en/-Präfix wird zur /en/-Adresse (ADR-0033)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Routen — `/en`, `/en/[d]`, Gegenstück in den Seitendaten, Struktur je Sprache

**Files:**
- Modify: `src/lib/routen/detail.js`, `src/lib/routen/uebersicht.js` (`startLaden`), `src/lib/routen/struktur.js`, `src/lib/routen/detail-json.js` (nur wenn die Signatur `sprache` nicht durchreicht — prüfen)
- Modify: `src/routes/en/+page.server.js`; Create: `src/routes/en/+page.svelte`, `src/routes/en/[d]/json/+server.js`
- Modify: `src/routes/+layout.server.js`
- Test: `test/detailansicht.test.js` oder `test/uebersicht-routen.test.js` (Muster `lade(...)` dort), `test/struktur.test.js` (falls vorhanden, sonst in `test/uebersicht.test.js` bei `strukturFuerLayout`)

**Interfaces:**
- Consumes: Task 1 (`spracheAusPfad`, `startPfad`, `t`), Task 2 (`gegenstueck`, `englischVorhanden`, `beitragsPfad`).
- Produces: `detailLaden({ d, sprache, … })` sucht für `en` erst `en/<d>`, dann `<d>`; `seite` erhält `sprache: 'de'|'en'` und `uebersetzung: { pfad: string, sprache: 'de'|'en' }|null`. `startLaden({ konfig, inhalt, sprache })`. `strukturFuerLayout({ konfig, inhalt, origin, sprache })` liefert zusätzlich `sprache`, `zweisprachig: boolean`; `menue`/`fusszeilenLinks` sind unter `en` auf Gegenstücke abgebildet; `HUB_ANSICHTEN` wird zu `hubAnsichten(sprache)`. Layout-Daten: `sprache`.

- [ ] **Step 1: Failing Routen-Tests** — in `test/uebersicht-routen.test.js` (Muster `lade`, Testquelle über `inhaltDerTestquelle()` und deren `konfig.autor`) ergänzen:

```js
describe('/en (ADR-0033)', () => {
  it('zeigt die englische Startseite en/startseite', async () => {
    const { inhalt, konfig } = inhaltDerTestquelle();
    const data = await lade('../src/routes/en/+page.server.js', {}, inhalt, konfig.autor);
    expect(data.artikel.titel).toBe('Welcome');
    expect(data.sprache).toBe('en');
    expect(data.uebersetzung).toEqual({ pfad: '/', sprache: 'de' });
  });
  it('leitet ohne englische Startseite auf / weiter', async () => {
    const { inhalt, konfig } = inhaltDerTestquelle({ ohne: [{ kind: 30023, d: 'en/startseite' }] });
    await expect(lade('../src/routes/en/+page.server.js', {}, inhalt, konfig.autor)).rejects.toMatchObject({ status: 301, location: '/' });
  });
  it('/en/startseite leitet auf /en', async () => {
    const { inhalt, konfig } = inhaltDerTestquelle();
    await expect(lade('../src/routes/en/[d]/+page.server.js', { d: 'startseite' }, inhalt, konfig.autor)).rejects.toMatchObject({ status: 301, location: '/en' });
  });
  it('/en/our-team findet den englischen Beitrag ohne Präfix und nennt das Gegenstück', async () => {
    const { inhalt, konfig } = inhaltDerTestquelle();
    const data = await lade('../src/routes/en/[d]/+page.server.js', { d: 'our-team' }, inhalt, konfig.autor);
    expect(data.artikel.titel).toBe('Our team');
    expect(data.uebersetzung).toEqual({ pfad: '/unser-team', sprache: 'de' });
  });
  it('/unser-team nennt sein englisches Gegenstück; /en/unser-team leitet dorthin, wo der Beitrag wohnt', async () => {
    const { inhalt, konfig } = inhaltDerTestquelle();
    const de = await lade('../src/routes/[d]/+page.server.js', { d: 'unser-team' }, inhalt, konfig.autor);
    expect(de.uebersetzung).toEqual({ pfad: '/en/our-team', sprache: 'en' });
    await expect(lade('../src/routes/en/[d]/+page.server.js', { d: 'unser-team' }, inhalt, konfig.autor)).rejects.toMatchObject({ status: 301, location: '/unser-team' });
  });
});
```

Prüfe zuerst, wie `lade` Weiterleitungen sichtbar macht (im bestehenden Test `/blog/seite/1 → 301`): dieselbe Form verwenden (`rejects.toMatchObject({ status, location })` oder wie dort). Das Gegenstück der Startseite ist `/` und nicht `/startseite`, weil die Startseite unter `/` wohnt (ADR-0029): `uebersetzung.pfad` für ein Gegenstück mit `d === konfig.startseiteD` ist `'/'`, für `en/<startseiteD>` ist es `'/en'`.

Für die Struktur (in derselben Datei oder `test/uebersicht.test.js`, wo `strukturFuerLayout` schon importiert ist):

```js
describe('strukturFuerLayout je Sprache (ADR-0033)', () => {
  it('unter en: Menü und Fußzeile auf Gegenstücke, sonst der deutsche Eintrag; Hub-Ansichten übersetzt', () => {
    const { inhalt, konfig } = inhaltDerTestquelle();
    const en = strukturFuerLayout({ konfig, inhalt, origin: 'http://x', sprache: 'en' });
    expect(en.sprache).toBe('en');
    expect(en.zweisprachig).toBe(true);
    expect(en.menue.find((e) => e.pfad === '/en/our-team')?.titel).toBe('Our team');
    expect(en.menue.some((e) => e.pfad === '/unser-team')).toBe(false);
    expect(en.menue.find((e) => e.pfad === '/artikel-a')?.titel).toBe('Artikel A');
    expect(en.menue.map((e) => e.titel)).toContain('Topics');
    expect(en.fusszeilenLinks.find((e) => e.d === 'impressum')?.pfad).toBe('/impressum');
    const de = strukturFuerLayout({ konfig, inhalt, origin: 'http://x' });
    expect(de.sprache).toBe('de');
    expect(de.menue.map((e) => e.titel)).toContain('Themen');
  });
});
```

- [ ] **Step 2: Rot laufen lassen.**

- [ ] **Step 3: `detail.js`** — Änderungen:

Importe ergänzen: `import { gegenstueck } from '../loaders/uebersetzungen.js';` und `import { startPfad } from '../sprache.js';`

Signatur/JSDoc unverändert bis auf den Ablauf. Nach der naddr-Weiterleitung:

```js
  // Die Startseite je Sprache wohnt unter / bzw. /en — zwei Adressen für
  // denselben Text wären eine zu viel. Die JSON-Route bleibt erreichbar.
  if (d === konfig.startseiteD && !anhang && !istStartseite) redirect(301, startPfad(sprache));

  const leer = leerstandMeldung(inhalt, konfig);
  if (leer) error(503, leer);

  // Englische d tragen das Präfix en/ (ADR-0033); Altbestand ohne Präfix
  // bleibt erreichbar — deshalb zwei Kandidaten, der erste Treffer zählt.
  const kandidaten = sprache === 'en' ? [`en/${d}`, d] : [d];
  const gefunden = kandidaten.find((k) => artikelAusSpiegel(inhalt, { d: k }).artikel) ?? d;
  const adresse = { kind: 30023, author: konfig.autor, d: gefunden, relays: [] };
```

Nach der Sprach-Weiterleitung (`if (artikel.sprache !== sprache) …`) das Gegenstück bestimmen:

```js
  const gegen = gegenstueck(inhalt, artikel);
  const uebersetzung = gegen
    ? { pfad: istStartseitenD(gegen.d, konfig) ? startPfad(gegen.sprache) : beitragsPfad(gegen), sprache: gegen.sprache }
    : null;
```

mit Hilfsfunktion oberhalb von `detailLaden`:

```js
/** Ist dieses d die Startseite einer Sprache? @param {string} d @param {import('../konfig.js').Konfig} konfig */
function istStartseitenD(d, konfig) {
  return d === konfig.startseiteD || d === `en/${konfig.startseiteD}`;
}
```

Im Rückgabeobjekt `seite` ergänzen: `sprache: artikel.sprache, uebersetzung,` (neben `pfad`). Achtung: `pfad: beitragsPfad(artikel)` bleibt; für die englische Startseite selbst ist `pfad` damit `/en/startseite` — die Route `/en` setzt ihren Kanon selbst auf `/en` (wie `/` es tut).

Wird `d === konfig.startseiteD` unter `sprache 'en'` aufgerufen und es gibt kein `en/startseite`, leitet `/en/startseite` auf `/en` und `/en` auf `/` — zwei Sprünge, kein Kreis.

- [ ] **Step 4: `uebersicht.js`** — `startLaden`:

```js
/**
 * `/` und `/en`: die Startseite der Sprache (kind:30023, d = STARTSEITE_D
 * bzw. en/STARTSEITE_D) als Seite. Fehlt die deutsche, steht der Blog mit
 * Hinweis da (ADR-0027); fehlt die englische, geht es nach / (ADR-0033).
 * @param {{ konfig: Konfig, inhalt: Inhalt, sprache?: 'de'|'en' }} e
 */
export async function startLaden({ konfig, inhalt, sprache = 'de' }) {
  leerOderWeiter(konfig, inhalt);
  if (sprache === 'en') {
    const { artikel } = artikelAusSpiegel(inhalt, { d: `en/${konfig.startseiteD}` });
    if (!artikel) redirect(301, '/');
    const { seite } = await detailLaden({ d: konfig.startseiteD, sprache: 'en', konfig, inhalt, istStartseite: true });
    return /** @type {const} */ ({ art: 'seite', seite });
  }
  const { artikel } = artikelAusSpiegel(inhalt, { d: konfig.startseiteD });
  // … Rest wie bisher (deutscher Zweig unverändert)
```

- [ ] **Step 5: `struktur.js`**

```js
import { artikelAusSpiegel } from '../loaders/artikel.js';
import { englischVorhanden, gegenstueck } from '../loaders/uebersetzungen.js';
import { beitragsPfad } from '../models/artikel.js';
import { t } from '../sprache.js';
```

`HUB_ANSICHTEN` bleibt als deutsche Konstante (Tests importieren sie), dazu:

```js
/** Ansichten des Hubs in der Sprache der Adresse (ADR-0033). @param {'de'|'en'} sprache @returns {Eintrag[]} */
export function hubAnsichten(sprache) {
  return [
    { titel: t(sprache, 'blog'), pfad: '/blog', d: '' },
    { titel: t(sprache, 'themen'), pfad: '/themen', d: '' }
  ];
}
```

`Layoutstruktur` um `sprache: 'de'|'en', zweisprachig: boolean` erweitern. `strukturFuerLayout({ konfig, inhalt, origin, sprache = 'de' })`:

```js
  const s = strukturLaden(inhalt, konfig);
  /** Unter /en/: jeder Eintrag durch sein Gegenstück, wenn es eines gibt (ADR-0033, Punkt 4). @param {Eintrag[]} eintraege */
  const inSprache = (eintraege) => {
    if (sprache === 'de') return eintraege;
    /** @type {Eintrag[]} */
    const aus = [];
    for (const e of eintraege) {
      const { artikel } = artikelAusSpiegel(inhalt, { d: e.d });
      const g = artikel ? gegenstueck(inhalt, artikel) : null;
      const eintrag = g && g.sprache === sprache ? { titel: g.titel, pfad: beitragsPfad(g), d: g.d } : e;
      if (!aus.some((x) => x.pfad === eintrag.pfad)) aus.push(eintrag);
    }
    return aus;
  };
  return {
    wortmarke: …, logoUrl: …,
    menue: [...inSprache(s.menue), ...hubAnsichten(sprache)],
    fusszeilenLinks: inSprache(s.fusszeile),
    …,
    sprache,
    zweisprachig: englischVorhanden(inhalt)
  };
```

- [ ] **Step 6: Routen**

`src/routes/en/+page.server.js`:

```js
import { env } from '$env/dynamic/private';
import { konfigLesen } from '$lib/konfig.js';
import { startLaden } from '$lib/routen/uebersicht.js';
import { spiegelHolen } from '$lib/services/spiegel.js';

export const prerender = false;

/** /en: die englische Startseite (ADR-0033) — ohne sie weiter nach /. */
export async function load() {
  const ergebnis = await startLaden({ konfig: konfigLesen(env), inhalt: spiegelHolen().lesen(), sprache: 'en' });
  return ergebnis.seite;
}
```

(`startLaden` mit `sprache: 'en'` liefert immer `art: 'seite'` oder wirft; der Typ ist die Union — `ergebnis.art === 'seite' ? ergebnis.seite : …` absichern, falls `svelte-check` meckert: dann `if (ergebnis.art !== 'seite') redirect(301, '/');` davor.)

`src/routes/en/+page.svelte`:

```svelte
<script>
  import Detail from '$lib/komponenten/Detail.svelte';
  import { kanonisch } from '$lib/kanonisch.js';
  /** @type {{ data: import('./$types').PageData }} */
  let { data } = $props();
</script>

<!-- /en ist die Basis der englischen Startseite (ADR-0033): /en/startseite leitet hierher. -->
<Detail {data} wortmarke={data.struktur.wortmarke} nurWortmarke kanonischeUrl={kanonisch(data.struktur.basisUrl, '/en')} />
```

`src/routes/en/[d]/json/+server.js` wie `src/routes/[d]/json/+server.js`, aber `sprache: 'en'`. Prüfen, dass `detailAlsJson` `sprache` an `detailLaden` durchreicht (sonst ergänzen).

`src/routes/+layout.server.js`: `import { spracheAusPfad } from '$lib/sprache.js';`, `const sprache = spracheAusPfad(url.pathname);`, `strukturFuerLayout({ …, sprache })`, Rückgabe zusätzlich `sprache`.

- [ ] **Step 7: Tests, Check, volle Suite** — `pnpm vitest run test/uebersicht-routen.test.js test/uebersicht.test.js test/detailansicht.test.js && pnpm check && pnpm test`.

- [ ] **Step 8: Commit**

```bash
git add src/lib/routen src/routes/en src/routes/+layout.server.js test
git commit -m "Routen: /en als englische Startseite, /en/[d] mit en/-Präfix, Gegenstück in den Seitendaten, Struktur je Sprache (ADR-0033)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Oberfläche — Umschalter, `<html lang>`, Texte in der Sprache des Beitrags

**Files:**
- Modify: `src/app.html`, `src/hooks.server.js`
- Modify: `src/routes/+layout.svelte`, `src/lib/komponenten/Kopfzeile.svelte`
- Modify: `src/lib/komponenten/Detail.svelte`, `Bildbereich.svelte`, `Lizenzpille.svelte`
- Test: `test/oberflaeche.test.js`, `test/lizenzpille.test.js`

**Interfaces:**
- Consumes: Task 1 (`t`, `startPfad`, `spracheAusPfad`), Task 3 (`data.struktur.sprache`, `data.struktur.zweisprachig`, `page.data.uebersetzung`).
- Produces: `Kopfzeile` Props `sprache?: 'de'|'en'`, `zweisprachig?: boolean`, `wechselPfad?: string` (Ziel des anderen Sprachlinks). `Bildbereich`, `Lizenzpille` Prop `sprache?: 'de'|'en'` (Standard `de`). `Detail` liest `data.artikel.sprache` und `data.uebersetzung`.

- [ ] **Step 1: Failing Tests**

`test/oberflaeche.test.js`, im `describe('Kopfzeile')`:

```js
  it('zeigt den Umschalter DE | EN nur zweisprachig; die aktuelle Sprache ist kein Link (ADR-0033)', () => {
    const de = render(Kopfzeile, { props: { wortmarke: 'T', menue: HUB_ANSICHTEN, zweisprachig: true, sprache: 'de', wechselPfad: '/en/our-team' } }).body;
    expect(de).toMatch(/<a[^>]+href="\/en\/our-team"[^>]+hreflang="en"[^>]*>EN<\/a>/);
    expect(de).toMatch(/aria-current="true"[^>]*>DE</);
    const en = render(Kopfzeile, { props: { wortmarke: 'T', menue: HUB_ANSICHTEN, zweisprachig: true, sprache: 'en', wechselPfad: '/' } }).body;
    expect(en).toMatch(/<a[^>]+href="\/"[^>]+hreflang="de"[^>]*>DE<\/a>/);
    expect(en).toContain('aria-label="Language"');
    const einsprachig = render(Kopfzeile, { props: { wortmarke: 'T', menue: HUB_ANSICHTEN } }).body;
    expect(einsprachig).not.toContain('hreflang=');
  });
```

Im `describe('Artikelseite')`:

```js
  it('englischer Beitrag: Datum englisch, Lizenzpille englisch, hreflang auf das Gegenstück (ADR-0033)', () => {
    const { body, head } = render(Artikelseite, {
      props: {
        data: seitendaten({ artikel: { ...seitendaten().artikel, sprache: 'en' }, uebersetzung: { pfad: '/die-kraft-der-gemeinschaft', sprache: 'de' }, pfad: '/en/the-power-of-community' }),
        wortmarke: 'T'
      }
    });
    expect(body).toContain('Licence unclear');
    expect(body).not.toContain('Lizenz ungeklärt');
    expect(body).toMatch(/<time[^>]*>\d{1,2} September 2026<\/time>/);
    expect(head).toContain('<link rel="alternate" hreflang="de" href="/die-kraft-der-gemeinschaft"');
    const de = render(Artikelseite, { props: { data: seitendaten(), wortmarke: 'T' } });
    expect(de.head).not.toContain('hreflang=');
    expect(de.body).toContain('Lizenz ungeklärt');
  });
```

(`seitendaten()` in dieser Datei um `sprache: 'de'` im `artikel` und `uebersetzung: null` erweitern, damit der Typ vollständig ist.)

`test/lizenzpille.test.js`:

```js
  it('spricht Englisch, wenn die Seite es tut', () => {
    const { body } = render(Lizenzpille, { props: { lizenz: { ok: false, grund: 'kein-nachweis' }, sprache: 'en' } });
    expect(body).toContain('Licence unclear');
  });
```

- [ ] **Step 2: Rot laufen lassen.**

- [ ] **Step 3: `<html lang>`** — `src/app.html`: `<html lang="%lang%">`. `src/hooks.server.js` ergänzen:

```js
import { spracheAusPfad } from '$lib/sprache.js';

/** `<html lang>` je Antwort aus der Sprache der Adresse (ADR-0033). @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  const lang = spracheAusPfad(event.url.pathname);
  return resolve(event, { transformPageChunk: ({ html }) => html.replace('%lang%', lang) });
}
```

- [ ] **Step 4: Kopfzeile** — Props erweitern:

```js
   * @type {{ wortmarke: string, logoUrl?: string|null,
   *   menue: import('$lib/loaders/struktur.js').Eintrag[], aktuellerPfad?: string,
   *   sprache?: 'de'|'en', zweisprachig?: boolean, wechselPfad?: string }}
   */
  let { wortmarke, logoUrl = null, menue, aktuellerPfad = '/', sprache = 'de', zweisprachig = false, wechselPfad = '/' } = $props();
  import { t } from '$lib/sprache.js';
  const andere = $derived(sprache === 'de' ? 'en' : 'de');
```

(`import` gehört an den Anfang des `<script>`.) `aria-label` der Marke: `"{wortmarke} — {t(sprache, 'zurStartseite')}"`; `nav aria-label={t(sprache, 'hauptnavigation')}`. Nach dem `</nav>` der Hauptnavigation:

```svelte
    {#if zweisprachig}
      <!-- Umschalter (ADR-0033): die aktuelle Sprache ist Text, die andere ein Link
           auf das Gegenstück oder die Startseite der Sprache. -->
      <nav aria-label={t(sprache, 'sprache')} class="sprachen">
        {#if sprache === 'de'}<span aria-current="true" lang="de">DE</span>{:else}<a href={wechselPfad} hreflang="de" lang="de">DE</a>{/if}
        <span aria-hidden="true">|</span>
        {#if sprache === 'en'}<span aria-current="true" lang="en">EN</span>{:else}<a href={wechselPfad} hreflang="en" lang="en">EN</a>{/if}
      </nav>
    {/if}
```

Styles: `.sprachen { display: flex; gap: 8px; font-size: .9rem; letter-spacing: .06em; color: var(--fb-text-leise); } .sprachen a { color: var(--fb-primaer); text-decoration: none; } .sprachen a:hover { text-decoration: underline; color: var(--fb-ueberschrift); } .sprachen [aria-current] { font-weight: 700; color: var(--fb-ueberschrift); }`. Der Feed-Hinweis bleibt.

- [ ] **Step 5: Layout** — `src/routes/+layout.svelte`:

```js
  import { startPfad } from '$lib/sprache.js';
  const andere = $derived(data.struktur.sprache === 'de' ? 'en' : 'de');
  // Ziel des Umschalters: das Gegenstück dieser Seite, sonst die Startseite der anderen Sprache.
  const wechselPfad = $derived(page.data.uebersetzung?.pfad ?? startPfad(andere));
```

`<Kopfzeile … sprache={data.struktur.sprache} zweisprachig={data.struktur.zweisprachig} {wechselPfad} />`. Hinweis: `page.data` enthält Layout- und Seitendaten zusammen; `uebersetzung` kommt nur von Detailseiten, sonst `undefined`.

- [ ] **Step 6: Detail, Bildbereich, Lizenzpille**

`Lizenzpille.svelte`: Prop `sprache = 'de'` (Typ `'de'|'en'`), `import { t } from '$lib/sprache.js';`, im ungeklärten Zweig `{t(sprache, 'lizenzUngeklaert')}` statt des Literals; `titel` ungeklärt: `` `${t(sprache, 'lizenzUngeklaert')}. ${GRUND_TEXT[lizenz.grund]}` `` (GRUND_TEXT bleibt deutsch — Diagnose, kein Chrome).

`Bildbereich.svelte`: Prop `sprache = 'de'`, an `<Lizenzpille {lizenz} {sprache} />` durchreichen; `<strong>Lizenz ungeklärt.</strong>` → `<strong>{t(sprache, 'lizenzUngeklaert')}.</strong>`; `<strong>Bild nicht angezeigt.</strong>` → `<strong>{t(sprache, 'bildNichtAngezeigt')}</strong>`.

`Detail.svelte`: Typ von `data` um `sprache: 'de'|'en'`, `uebersetzung: { pfad: string, sprache: 'de'|'en' }|null` erweitern (beide optional mit `?` — die Startseiten-Route liefert sie ebenfalls über `seite`). `import { t } from '$lib/sprache.js';`. Datum: `toLocaleDateString(t(data.artikel.sprache, 'datumsformat'), …)`. Im `<svelte:head>`: `{#if data.uebersetzung}<link rel="alternate" hreflang={data.uebersetzung.sprache} href={data.uebersetzung.pfad} />{/if}`. Beide `<Bildbereich …/>` bekommen `sprache={data.artikel.sprache}`. Der Hinweis zu entfernten Bildern nutzt `t(data.artikel.sprache, 'entfernteBilder', data.entfernteBilder.length)` als ersten Satz, danach `{data.entfernteBilder.join(', ')}`; der bisherige deutsche Satz entfällt (der Text steht jetzt in `sprache.js`). Bestehenden Test „erklärt die aus dem Fließtext entfernten Bildverweise" anpassen: er prüft `keinen Lizenznachweis` — der neue deutsche Satz enthält „ohne Lizenznachweis"; Assertion auf `ohne Lizenznachweis` ändern.

- [ ] **Step 7: Tests, Check, Build** — `pnpm vitest run test/oberflaeche.test.js test/lizenzpille.test.js test/uebersicht.test.js && pnpm check && pnpm test && pnpm build`.

- [ ] **Step 8: Commit**

```bash
git add src/app.html src/hooks.server.js src/routes/+layout.svelte src/lib/komponenten test
git commit -m "Oberfläche: Umschalter DE | EN, <html lang> je Antwort, Texte in der Sprache des Beitrags (ADR-0033)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Doku

**Files:**
- Modify: `CLAUDE.md` (Abschnitt „Sprache", Tabelle Feste Segmente/Startseite-Falle), `docs/STATUS.md`

- [ ] **Step 1: CLAUDE.md** — Absatz `Keine Mehrsprachigkeit, kein Paraglide/inlang — relilab.org ist einsprachig\ndeutsch, Nachrüsten ist möglich.` ersetzen durch:

```markdown
**Zwei Sprachen, eine Tabelle** (ADR-0033): Deutsch ist die Grundsprache,
englische Inhalte wohnen unter `/en/…` — ihr `d` beginnt wie der Hugo-Pfad
mit `en/`. Die Oberflächentexte des Hubs stehen in `src/lib/sprache.js`
(Deutsch und Englisch), kein Paraglide/inlang. Übersetzungen sind `a`-Tags
mit Marker `translation` (aus `workTranslation`/`translationOfWork` im
Frontmatter); der Umschalter DE | EN führt auf das Gegenstück, sonst auf
`/` bzw. `/en`. Neue Chrome-Texte kommen in die Tabelle, nie als zweites
Literal in eine Komponente.
```

In der Falle „**Die Startseite hat eine Adresse: `/`.**" ergänzen: „Die englische Startseite ist `en/<STARTSEITE_D>` unter `/en` (ADR-0033); fehlt sie, leitet `/en` auf `/`."

- [ ] **Step 2: STATUS-Eintrag** oben:

```markdown
## 2026-09-15 — Zweisprachig: Umschalter DE | EN, /en als englische Startseite

**Passiert:** ADR-0033. Englische Inhalte tragen ihr `d` mit Präfix `en/`
(wie der Hugo-Pfad) und wohnen unter `/en/…`; Altbestand ohne Präfix bleibt
unter `/en/<d>` erreichbar. Übersetzungen kommen als `a`-Tag mit Marker
`translation` (schema.org `workTranslation`/`translationOfWork` im
Frontmatter, mdparser emittiert es); `loaders/uebersetzungen.js` macht die
Zuordnung symmetrisch. Kopfzeile mit Umschalter (nur, wenn der Spiegel
englische Inhalte hat), Ziel ist das Gegenstück oder `/` bzw. `/en`;
`<link rel="alternate" hreflang>` am Gegenstück; `<html lang>` je Antwort
aus dem Hook. Menü und Fußzeile zeigen unter `/en/` Gegenstücke, sonst den
deutschen Eintrag; Hub-Ansichten heißen „Blog"/„Topics". Chrome-Texte in
`src/lib/sprache.js` (Deutsch/Englisch), Datum im Beitrag in seiner Sprache.
Testquelle: `our-team` verweist auf `unser-team`, neu `en/startseite`.

**Wo steht das Projekt:** Im Hub fertig; live erscheint der Umschalter
erst, wenn die englischen Seiten publiziert sind — dafür braucht das
FOERBICO-Repo `name`, `description`, `datePublished`, `creator` und
`translationOfWork` an den drei englischen Seiten, `workTranslation` an den
deutschen und eine `content/en/startseite/index.md`; der mdparser muss das
`a`-Tag schreiben (Teil P des Plans).

**Nächster Schritt:** Teil P (mdparser, FOERBICO-Frontmatter, Contract),
dann Live-Prüfung von `/en`, `/en/conference` und dem Umschalter.
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md docs/STATUS.md
git commit -m "Doku: Zweisprachigkeit in CLAUDE.md und STATUS (ADR-0033)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

## Teil P: Produzentenseite (Controller, nach dem Hub-Merge)

**P1 mdparser** (`/Users/joerglohrer/repositories/mdparser`, Branch `main`, Mirror `edufeed-org/mdparser`):
- `core/parser.ts` `CommonMetadata`: `workTranslation?: string | string[]`, `translationOfWork?: string | string[]`.
- `events/article.ts`: nach den `about`-Tags — für jede URL aus beiden Feldern `tags.push(['a', `30023:${pubkey}:${extractSlug(url)}`, '', 'translation'])`; URLs außerhalb der eigenen Site (anderer Host als die `id`) werden übersprungen. Test in `events/article_test.ts`: de-Seite mit `workTranslation: ['https://oer.community/en/conference']` → Tag `['a','30023:<pk>:en/conference','','translation']`; String statt Liste ebenso; fremder Host → kein Tag.
- Contract `oer-orchestrator/contracts/event-tag-mapping.md`: Zeile `workTranslation[] / translationOfWork[]` → `["a", "30023:<pubkey>:<d>", "", "translation"]`.
- `deno test`, Commit, Push.

**P2 FOERBICO-Repo** (Worktree von `main`, nicht der lokale Branch `add-blogpost-ki-ru-baden`):
- `content/en/conference/index.md`, `oer-and-oep/index.md`, `our-team/index.md`: `name`, `description` (ein englischer Satz aus dem Text), `datePublished` (wie die deutsche Seite), `creator` (wie die deutschen Seiten in a362648), `translationOfWork: https://oer.community/tagungen` bzw. `/oer-und-oep`, `/unser-team`.
- `content/de/tagungen`, `oer-und-oep`, `unser-team`: `workTranslation: [https://oer.community/en/conference]` usw.
- Neu `content/en/startseite/index.md` aus `content/en/_index.md` (Text, `id: https://oer.community/en/startseite`, `translationOfWork: https://oer.community/startseite`, `_build: render: never` wie die deutsche Startseite); `content/de/startseite/index.md`: `workTranslation: [https://oer.community/en/startseite]`.
- Commit, Push auf `main` → Action publiziert (mdparser `main` muss P1 enthalten).
- Live nach ≤ 10 min: `/en` → Startseite, `/en/conference`, Umschalter auf `/tagungen` ↔ `/en/conference`, Sitemap mit `/en/…`.
