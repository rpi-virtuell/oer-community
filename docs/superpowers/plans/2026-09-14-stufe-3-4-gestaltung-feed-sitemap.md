# Stufe 3 und 4: FOERBICO-Gestaltung, Feed, Sitemap, kanonische URLs — Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Der Hub sieht aus wie oer.community (FOERBICO-Styleguide, Roboto Condensed) und liefert RSS-Feed, Sitemap und kanonische URLs, damit Suchmaschinen und Newsletter beim Wechsel von Hugo nichts verlieren.

**Architecture:** Stufe 3 tauscht in `src/app.css` die relilab-Token gegen `--fb-*` aus ADR-0031 und eine Schrift; die Komponenten werden mechanisch umbenannt, Kopf- und Fußzeile bekommen den hellen PaperMod-Look mit orangem Rahmen, der Kontrasttest rechnet die neuen Paare nach. Stufe 4 ergänzt die Layoutstruktur um eine Basis-URL aus `kind:0 website` (Rückfall: Origin der Anfrage), setzt `<link rel="canonical">` und den Feed-Hinweis, und baut `feed.xml` und `sitemap.xml` als Server-Routen aus dem Spiegel.

**Tech Stack:** SvelteKit 2 (Svelte 5 Runes), JavaScript mit JSDoc unter `checkJs`+`strict`, Vitest mit `svelte/server`, CSS-Custom-Properties, lokale WOFF2.

**Spec:** `docs/superpowers/specs/2026-09-14-oer-community-aus-nostr-design.md` — Abschnitte „Darstellung" (Designsystem, Kopfzeile, Fußzeile), „Routen" (`/feed.xml`, `/sitemap.xml`, `trailingSlash`, kanonische Form), „Struktur aus Nostr" (`website`); ADR-0031 (Werte, Kontrastregel, Rückfälle für Fokus und Fehler), ADR-0029 (kanonisch ohne Schrägstrich).

## Global Constraints

- Oberfläche, Code, Bezeichner, Commits auf **Deutsch**; Nostr-Namen bleiben englisch.
- **Werte kopieren, nie verlinken:** keine Schrift von Google, kein Stylesheet von außen (Architekturtest prüft `fonts.g…`).
- **Token statt Farbwerte in Komponenten:** kein Hex außerhalb von `src/app.css`; die Komponenten kennen nur Token (ADR-0031 „Falsch war die Entscheidung, wenn …").
- **Text auf `--fb-akzent` ist immer `--fb-ueberschrift`, nie weiß** (ADR-0031). Fließtext-Paare ≥ 4,5:1, geprüft in `test/kontrast.test.js` gegen `src/app.css`.
- `src/lib/**` importiert nichts aus `routes/` oder `$app/`; nur `services/spiegel.js` importiert `relay.js`; `routen/` ist die Schicht, die wirft.
- Feed und Sitemap werden **aus dem Spiegel** gebaut, nie vom Relay; leerer Spiegel → 503 mit Meldung, nie ein leeres Dokument ohne Erklärung.
- Tests ohne Netz und Platte. Vor jedem Commit `pnpm check && pnpm test` grün, ohne Warnungen. Trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Arbeitsbranch `feat/stufe-3-4-gestaltung-feed` von `dev`, Worktree unter `.claude/worktrees/`.

## Dateistruktur

| Datei | Zuständigkeit |
|---|---|
| `src/app.css` (umschreiben) | `--fb-*`-Token, eine Schrift, Grundschrift, Bausteine, Fokus |
| `static/schriften/` (bereinigen), `static/schriften/LIZENZ.md` | nur Roboto Condensed bleibt |
| `test/kontrast.test.js` (umschreiben) | Paare der neuen Palette |
| `src/lib/architektur.test.js` (ändern) | Schriftregel: genau Roboto Condensed |
| `src/lib/komponenten/*.svelte`, `src/routes/+error.svelte`, `+layout.svelte` (ändern) | Token-Umbenennung, Kopf-/Fußzeilen-Look, Bildrahmen |
| `docs/designsystem.md` (neu schreiben) | FOERBICO-Werte, Regeln, Kontrasttabelle |
| `src/lib/routen/struktur.js`, `src/routes/+layout.server.js`, `+layout.svelte` (ändern) | `basisUrl`, Feed-Hinweis |
| `src/lib/komponenten/Detail.svelte`, Übersichts-`+page.svelte`, `themen/+page.svelte`, `+page.svelte` (ändern) | `<link rel="canonical">` |
| `src/routes/+layout.js` (neu) | `trailingSlash = 'ignore'` |
| `src/lib/routen/xml.js` (neu) | `xmlEscape`, Datumshelfer |
| `src/lib/routen/feed.js`, `src/routes/feed.xml/+server.js` (neu) | RSS 2.0 |
| `src/lib/routen/sitemap.js`, `src/routes/sitemap.xml/+server.js` (neu) | Sitemap |
| `CLAUDE.md`, `docs/STATUS.md` | nachziehen |

---

### Task 0: Branch und Worktree

- [ ] `git -C /Users/joerglohrer/repositories/community-hub worktree add .claude/worktrees/feat-stufe-3-4-gestaltung-feed -b feat/stufe-3-4-gestaltung-feed dev`, dort `cp ../../../.env .env`, `pnpm install --frozen-lockfile && pnpm check && pnpm test` — Expected: 312 Tests grün.

---

### Task 1: Token und Schrift in `app.css`, Kontrasttest, Schriftdateien

**Files:** Modify `src/app.css`, `test/kontrast.test.js`, `src/lib/architektur.test.js`, `static/schriften/LIZENZ.md`; Delete `static/schriften/roboto-*.woff2` (4 Dateien), `static/schriften/yanone-kaffeesatz-*.woff2` (2), `static/schriften/OFL-roboto.txt`, `static/schriften/OFL-yanone-kaffeesatz.txt`

**Interfaces (Produces — die Komponenten in Task 2 benutzen genau diese Namen):**

```css
:root {
  /* FOERBICO-Styleguide (ADR-0031) */
  --fb-primaer:      #203a8f;  /* Marke, Links, aktive Zustände */
  --fb-akzent:       #ffa500;  /* Rahmen, Hervorhebung, Fokus — nie Grund für weißen Text */
  --fb-ueberschrift: #002366;
  --fb-text:         #333333;
  --fb-text-leise:   #5a6178;  /* abgeleitet: Metazeilen; nicht im Styleguide */
  --fb-rahmen:       #d3d3d3;
  --fb-flaeche:      #f0f8ff;  /* Karten, Fußzeile, Hinweise */
  --fb-flaeche-2:    #e6f2ff;  /* Kopfzeile, Marker */
  --fb-weiss:        #ffffff;
  --fb-fehler:       #971b2f;  /* Comenius-Dunkelrot aus der Farbtabelle des Styleguides */
  /* Schrift */
  --schrift: 'Roboto Condensed', system-ui, -apple-system, 'Segoe UI', sans-serif;
  /* Maße (unverändert übernommen, umbenannt) */
  --breite-container: 1499px;
  --breite-schmal: 820px;
  --hoehe-kopf: 120px;
  --radius: 5px;
  --schatten: 0 2px 24px rgba(20, 50, 100, 0.08);
}
```

Alle anderen Token (`--relilab*`, `--magenta`, `--rpi`, `--foerbico`, `--fusion`, `--fau`, `--amber*`, `--pink`, `--orange`, `--mint`, `--rl-*`, `--verlauf*`, `--marker-amber-text`, `--fuss-text`, `--aufmacher-*`, `--schrift-ueber`, `--schrift-label`, `--schrift-text`, `--schatten-hover`) **entfallen**.

- [ ] **Step 1: Failing tests.** `test/kontrast.test.js` — den `describe`-Block ersetzen (Helfer `token`, `kontrast`, `getoent` bleiben):

```js
const AA = 4.5;

describe('Kontrast der FOERBICO-Palette (docs/designsystem.md, ADR-0031)', () => {
  it('Fließtext und Überschriften auf Weiß und auf den Flächen', () => {
    for (const grund of ['--fb-weiss', '--fb-flaeche', '--fb-flaeche-2']) {
      expect(kontrast(token('--fb-text'), token(grund))).toBeGreaterThanOrEqual(AA);
      expect(kontrast(token('--fb-ueberschrift'), token(grund))).toBeGreaterThanOrEqual(AA);
      expect(kontrast(token('--fb-text-leise'), token(grund))).toBeGreaterThanOrEqual(AA);
    }
  });
  it('Links: --fb-primaer auf Weiß und auf --fb-flaeche', () => {
    expect(kontrast(token('--fb-primaer'), token('--fb-weiss'))).toBeGreaterThanOrEqual(AA);
    expect(kontrast(token('--fb-primaer'), token('--fb-flaeche'))).toBeGreaterThanOrEqual(AA);
  });
  it('Text auf --fb-akzent ist --fb-ueberschrift; Weiß darauf wäre zu schwach', () => {
    expect(kontrast(token('--fb-ueberschrift'), token('--fb-akzent'))).toBeGreaterThanOrEqual(AA);
    expect(kontrast('#ffffff', token('--fb-akzent'))).toBeLessThan(AA);
  });
  it('Fehlerfarbe auf Weiß und auf --fb-flaeche', () => {
    expect(kontrast(token('--fb-fehler'), token('--fb-weiss'))).toBeGreaterThanOrEqual(AA);
    expect(kontrast(token('--fb-fehler'), token('--fb-flaeche'))).toBeGreaterThanOrEqual(AA);
  });
  it('keine Komponente setzt Weiß auf --fb-akzent (ADR-0031)', () => {
    // Grobe, aber mechanische Prüfung: keine CSS-Regel, die --fb-akzent als
    // background und --fb-weiss als color im selben Block nennt.
    const dateien = quelldateienSvelte();
    for (const [pfad, css] of dateien) {
      for (const block of css.match(/\{[^}]*\}/g) ?? []) {
        const akzentGrund = /background(-color)?:\s*var\(--fb-akzent\)/.test(block);
        const weissText = /(^|[^-])color:\s*var\(--fb-weiss\)/.test(block);
        expect(akzentGrund && weissText, `${pfad}: Weiß auf Akzent`).toBe(false);
      }
    }
  });
});
```

`quelldateienSvelte()` liest alle `.svelte` unter `src/` und `src/app.css` (Pfad → Text) mit `readdirSync` rekursiv — dieselbe Idee wie `quelldateien` im Architekturtest; hier lokal kopieren (zwei Testdateien teilen keinen Code).

`src/lib/architektur.test.js`: Test „deklariert die drei Schriften des Designsystems lokal" → Name „deklariert genau die Schrift des Designsystems lokal", Erwartung `new Set(['Roboto Condensed'])`.

- [ ] **Step 2:** `pnpm vitest run test/kontrast.test.js src/lib/architektur.test.js` — FAIL (Token fehlen, drei Schriften).

- [ ] **Step 3: `app.css` umschreiben.** Kopf: nur die zwei `@font-face` für Roboto Condensed (latin, latin-ext) behalten, alle Roboto- und Yanone-Blöcke löschen. `:root` wie unter Interfaces. Grundschrift:

```css
body { background: var(--fb-weiss); color: var(--fb-text); font-family: var(--schrift); font-size: 17px; font-weight: 400; line-height: 1.6; -webkit-font-smoothing: antialiased; }
h1, h2, h3, h4, h5, h6 { font-family: var(--schrift); font-weight: 700; line-height: 1.15; color: var(--fb-ueberschrift); margin: 0 0 0.4em; }
h1 { font-size: clamp(2rem, 4vw, 2.8rem); }
h2 { font-size: clamp(1.5rem, 3vw, 2rem); }
h3 { font-size: 1.3rem; }
a { color: var(--fb-primaer); }
a:hover { color: var(--fb-ueberschrift); text-decoration: underline; }
/* Fokus sichtbar, für Tastatur — der Akzent als Ring, nie als Grund für Text (ADR-0031). */
:focus-visible { outline: 3px solid var(--fb-akzent); outline-offset: 2px; }
```

Bausteine: `.metazeile` (`font-family: var(--schrift)`, `color: var(--fb-text-leise)`), `.marker` (`background: var(--fb-flaeche-2)`, `color: var(--fb-text-leise)`, Schrift `var(--schrift)`), `.augenbraue` (`color: var(--fb-text-leise)`), `.hinweis` (`background: var(--fb-flaeche)`, `border-left: 3px solid var(--fb-akzent)`, `strong { color: var(--fb-ueberschrift) }`). Kommentar oben im Token-Block: „Werte aus `Website/Design/styleguide.md` (FOERBICO), kopiert, nicht verlinkt (ADR-0004, ADR-0031). Roboto Condensed ist die einzige Schrift; die Kontrastpaare rechnet `test/kontrast.test.js` nach."

Schriftdateien löschen (`git rm`), `LIZENZ.md` auf Roboto Condensed kürzen (Tabelle mit einer Zeile, Urheber The Roboto Project Authors, OFL-Text bleibt `OFL-roboto-condensed.txt`).

- [ ] **Step 4:** `pnpm vitest run test/kontrast.test.js src/lib/architektur.test.js` — PASS. `pnpm check && pnpm test` — jetzt sind die Komponenten kaputt (Token fehlen)? Nein: unbekannte `var(--…)` sind kein Fehler für svelte-check und Tests prüfen keine Farben; alles bleibt grün, sieht aber bis Task 2 falsch aus. Deshalb Task 1 und 2 **im selben Branch direkt nacheinander**, Commit nach Task 1 trotzdem eigenständig.

- [ ] **Step 5: Commit** „Designsystem: FOERBICO-Token und Roboto Condensed statt relilab-Palette (ADR-0031)".

---

### Task 2: Komponenten auf die neuen Token, Kopf- und Fußzeile im oer.community-Look

**Files:** Modify `src/lib/komponenten/{Kopfzeile,Fusszeile,Karte,Uebersicht,Detail,Bildbereich,Lizenzzeile,DebugBereich,DebugFeld,DebugRohblock}.svelte`, `src/routes/+error.svelte`, `src/routes/+layout.svelte`; `test/oberflaeche.test.js`

- [ ] **Step 1: Failing tests** in `test/oberflaeche.test.js`:

```js
it('kein Alt-Token und kein Hex-Farbwert in Komponenten (ADR-0031)', () => {
  const alt = /var\(--(rl-|relilab|magenta|rpi|fau|amber|fuss-text|verlauf|aufmacher|schrift-(ueber|label|text)|marker-amber)/;
  const hex = /#[0-9a-fA-F]{3,8}\b/;
  for (const [pfad, text] of komponentenQuellen()) {
    expect(alt.test(text), `${pfad} nutzt ein Alt-Token`).toBe(false);
    const css = (text.match(/<style>[\s\S]*<\/style>/) ?? [''])[0];
    expect(hex.test(css), `${pfad} hat einen Hex-Farbwert im <style>`).toBe(false);
  }
});
```

`komponentenQuellen()` liest `src/lib/komponenten/*.svelte` und `src/routes/**/*.svelte` (Pfad → Text). Hinweis: `Lizenzzeile.svelte` hat im SVG `fill="var(--rl-weiss, #fff)"` — das ist Markup, nicht `<style>`; das Token wird umbenannt, der Rückfall `#fff` bleibt (SVG braucht einen Wert, wenn CSS-Variablen fehlen); die Hex-Prüfung gilt nur für `<style>`.

- [ ] **Step 2:** FAIL.

- [ ] **Step 3: Umbenennen** — mechanisch, dann Hand:

```bash
cd src && sed -i '' \
  -e 's/var(--rl-text-leise)/var(--fb-text-leise)/g' -e 's/var(--rl-text)/var(--fb-text)/g' \
  -e 's/var(--rl-weiss, #fff)/var(--fb-weiss, #fff)/g' -e 's/var(--rl-weiss)/var(--fb-weiss)/g' \
  -e 's/var(--rl-linie)/var(--fb-rahmen)/g' -e 's/var(--rl-dunkel)/var(--fb-ueberschrift)/g' \
  -e 's/var(--rl-flaeche-2)/var(--fb-flaeche-2)/g' -e 's/var(--rl-flaeche)/var(--fb-flaeche)/g' \
  -e 's/var(--schrift-ueber)/var(--schrift)/g' -e 's/var(--schrift-label)/var(--schrift)/g' -e 's/var(--schrift-text)/var(--schrift)/g' \
  -e 's/var(--rl-container)/var(--breite-container)/g' -e 's/var(--rl-schmal)/var(--breite-schmal)/g' -e 's/var(--rl-kopf)/var(--hoehe-kopf)/g' \
  -e 's/var(--amber)/var(--fb-akzent)/g' -e 's/var(--relilab-tief)/var(--fb-ueberschrift)/g' -e 's/var(--relilab)/var(--fb-primaer)/g' -e 's/var(--rpi)/var(--fb-primaer)/g' \
  $(grep -rl 'var(--' lib routes)
```

Dann von Hand:
- **Kopfzeile:** `.kopf { background: var(--fb-flaeche-2); border-bottom: 1px solid var(--fb-akzent); }`, `.marke { color: var(--fb-ueberschrift) }`, `.nav a { color: var(--fb-primaer) }`, `.nav a:hover, .nav a[aria-current] { text-decoration: underline; text-underline-offset: 0.3em; color: var(--fb-ueberschrift) }`.
- **Fußzeile** (heller PaperMod-Look statt dunkel): `.fuss { background: var(--fb-flaeche); color: var(--fb-text); border-top: 1px solid var(--fb-akzent); }`, `.marke { color: var(--fb-ueberschrift) }`, `.text :global(a), .links a { color: var(--fb-primaer) }`, `.stand { background: var(--fb-weiss); border-left: 3px solid var(--fb-akzent) }`, `.werkzeug { border-top: 1px solid var(--fb-rahmen) }`, `.schalter { color: var(--fb-text) }`, `.schalter input { accent-color: var(--fb-primaer) }`, `.befund h2 { color: var(--fb-ueberschrift) }`. Die Zeilen mit `rgba(255,255,255,…)` und `--fau`/`--fuss-text` entfallen.
- **Bilder** wie auf oer.community: in `Bildbereich.svelte` `.bild img { border: 1px solid var(--fb-akzent); border-radius: var(--radius); }`; in `Karte.svelte` `.karte { border: 1px solid var(--fb-rahmen); border-radius: var(--radius); }`, `.cover img` ohne eigenen Rahmen (die Karte rahmt).
- **Detail.svelte:** `blockquote { border-left: 3px solid var(--fb-akzent); color: var(--fb-text-leise) }`, `code`/`pre` Hintergrund `var(--fb-flaeche)`, `img` `border-radius: var(--radius)`.
- **+error.svelte:** `.augenbraue { color: var(--fb-fehler) }` als lokaler Stil (Fehlerfarbe nach ADR-0031).
- **Uebersicht.svelte:** `.detail-kopf { border-bottom: 1px solid var(--fb-rahmen) }`.
- **Debug\*.svelte:** nur Umbenennung; `.marke`-Verlauf gibt es dort nicht.

Prüfe danach `grep -rn "var(--" src | grep -vE "fb-|schrift\)|breite-|hoehe-|radius|schatten"` — muss leer sein.

- [ ] **Step 4:** `pnpm check && pnpm test` grün; `pnpm dev` (Port 5199): Kopfzeile hellblau mit orangem Strich, Fußzeile hell, Links dunkelblau, Fokusring orange (Tab-Taste) — kurz mit `curl` die Klassen prüfen und im Bericht festhalten.

- [ ] **Step 5: Commit** „Komponenten auf FOERBICO-Token; Kopf- und Fußzeile im oer.community-Look".

---

### Task 3: `docs/designsystem.md` neu

**Files:** Rewrite `docs/designsystem.md`; Modify `CLAUDE.md` (Zeile „Farben, Schriften, Abstände: `docs/designsystem.md`" bleibt; im Abschnitt „Technik"/„Umgebungen" nichts).

- [ ] **Step 1:** Inhalt (kurz, Tabellenform):
  1. **Grundlage:** `Website/Design/styleguide.md` (FOERBICO) und das PaperMod-Theme `zz001-foerbico-theme.css` von oer.community, Stand 14.09.2026; ADR-0031 ersetzt ADR-0018; die Farbkarte FOERBICO × rpi-virtuell und `mockup/index.html` sind der relilab-Stand vom 04.09. und nicht mehr maßgeblich.
  2. **Werte werden kopiert, nie verlinkt** (unverändert).
  3. **Farben:** Tabelle Token → Wert → Wofür (aus Task 1), plus die zwei abgeleiteten Werte (`--fb-text-leise`, `--fb-fehler`) mit Herkunft.
  4. **Schrift:** Roboto Condensed, variable 400–700, latin + latin-ext, lokal; Skala (Body 17px, h1 clamp 2–2,8rem, h2 1,5–2rem, h3 1,3rem, Metazeile 0,86rem, Marker 0,78rem).
  5. **Maße:** `--breite-container` 1499px, `--breite-schmal` 820px, `--hoehe-kopf` 120px, `--radius` 5px.
  6. **Einsatzregeln:** Primär für Links/Marke/aktive Zustände, Akzent nur als Rahmen/Hervorhebung/Fokus (nie Grund für weißen Text), Flächen für Karten/Fußzeile/Hinweise, Flächen-2 für Kopfzeile/Marker, Fehler nur für Fehlerzustände.
  7. **Kontrast:** Tabelle der geprüften Paare mit Werten (aus `test/kontrast.test.js` ablesen und mit `node -e` nachrechnen — Werte hinschreiben, nicht schätzen): Text/Weiß, Text/Fläche, Text-leise/Weiß, Text-leise/Fläche-2, Primär/Weiß, Überschrift/Akzent, Fehler/Weiß, Weiß/Akzent (fällt durch, deshalb verboten).
  8. **Bausteine:** Metazeile, Marker, Augenbraue, Hinweis, Karte, Bildrahmen — je ein Satz.
- [ ] **Step 2:** Commit „Designsystem-Doku: FOERBICO-Werte, Schrift, Kontrasttabelle (ADR-0031)".

---

### Task 4: Basis-URL, kanonische Links, Feed-Hinweis, `trailingSlash`

**Files:** Modify `src/lib/routen/struktur.js`, `src/lib/routen/struktur.test.js`, `src/routes/+layout.server.js`, `src/routes/+layout.svelte`, `src/lib/komponenten/Detail.svelte`, alle Übersichts-`+page.svelte` (`/`, `/blog`, `/blog/seite/[n]`, `/themen`, `/themen/[thema]`, `/themen/[thema]/seite/[n]`), `test/oberflaeche.test.js`, `test/uebersicht-routen.test.js`; Create `src/routes/+layout.js`

**Interfaces:**
```js
// routen/struktur.js
export function basisUrlBestimmen(profil: Profil|null, origin: string): string   // website ohne Schrägstrich am Ende, sonst origin
// Layoutstruktur bekommt zusätzlich: basisUrl: string
// strukturFuerLayout({ konfig, inhalt, origin })   — origin = url.origin der Anfrage
export function kanonisch(basisUrl: string, pfad: string): string                // basisUrl + pfad; '/' → basisUrl + '/'
```
Detail.svelte: Prop `kanonischeUrl: string`. Übersichten: `<link rel="canonical" href={kanonisch(data.struktur.basisUrl, pfadDerSeite)}>` — Seite 1 unter `basis`, Seite n unter `${basis}/seite/${n}`; `/` (beide Zweige) → `basisUrl + '/'`.

- [ ] **Step 1: Failing tests** (`routen/struktur.test.js`):

```js
it('basisUrl: website aus dem Profil ohne Schrägstrich, sonst der Origin', () => {
  const s = strukturFuerLayout({ ...inhaltDerTestquelle(), origin: 'https://hub.example' });
  expect(s.basisUrl).toBe('https://test.example');
  const ohne = strukturFuerLayout({ ...inhaltDerTestquelle({ ohne: [{ kind: 0 }] }), origin: 'https://hub.example' });
  expect(ohne.basisUrl).toBe('https://hub.example');
  expect(basisUrlBestimmen({ name: 'X', logoUrl: null, fusstext: null, website: 'https://oer.community/' }, 'https://o')).toBe('https://oer.community');
});
it('kanonisch setzt den Pfad an die Basis; / bleibt ein Schrägstrich', () => {
  expect(kanonisch('https://oer.community', '/canva')).toBe('https://oer.community/canva');
  expect(kanonisch('https://oer.community', '/')).toBe('https://oer.community/');
});
```

`test/oberflaeche.test.js`: Detail rendert `<link rel="canonical" href="https://oer.community/die-kraft-der-gemeinschaft">` wenn `kanonischeUrl` gesetzt; Kopfzeile-/Layout-Test: der Feed-Hinweis `<link rel="alternate" type="application/rss+xml" href="/feed.xml"` steht im `head` (dazu in `+layout.svelte` rendern — Layout ist über `svelte/server` mit `children`-Snippet schwer zu rendern; lege den Hinweis stattdessen in `Kopfzeile.svelte` als `<svelte:head>` und teste dort). `test/uebersicht-routen.test.js`: `/blog/seite/2` liefert `data.struktur.basisUrl` (Layout) — die Page-Komponententests prüfen `href="…/blog/seite/2"` im `head` für die Blog-Seite-Route mit gestubbtem `data`.

- [ ] **Step 2:** FAIL. **Step 3: Implementieren.**

```js
// routen/struktur.js
/** Basis für kanonische URLs, Feed und Sitemap: die Domain des Herausgebers (kind:0 website), sonst der Origin der Anfrage. */
export function basisUrlBestimmen(profil, origin) {
  const w = profil?.website?.replace(/\/+$/, '');
  return w && w !== '' ? w : origin.replace(/\/+$/, '');
}
export function kanonisch(basisUrl, pfad) { return pfad === '/' ? `${basisUrl}/` : `${basisUrl}${pfad}`; }
// strukturFuerLayout({ konfig, inhalt, origin }) → … basisUrl: basisUrlBestimmen(s.profil, origin)
```

`+layout.server.js`: `load({ url })` → `strukturFuerLayout({ konfig, inhalt, origin: url.origin })`. `+layout.js`: `export const trailingSlash = 'ignore';` mit Kommentar (ADR-0029: beide Formen antworten, kanonisch ist ohne Schrägstrich). `Kopfzeile.svelte`: `<svelte:head><link rel="alternate" type="application/rss+xml" title="{wortmarke} — Blog" href="/feed.xml" /></svelte:head>`. Detail: `<link rel="canonical" href={kanonischeUrl} />` im Head; Routen `[d]`, `en/[d]`, `/` übergeben `kanonischeUrl={kanonisch(data.struktur.basisUrl, data.pfad ?? '/')}` (`/`: Seiten-Zweig `kanonisch(basisUrl, '/')`). Übersichten: `/blog` → `kanonisch(basisUrl, '/blog')`, `/blog/seite/[n]` → `${basis}/seite/${seite}` über `data.basis`/`data.seite`, Themen analog, `/themen` → `/themen`, `/` Blog-Zweig → `/`.

- [ ] **Step 4:** grün. **Step 5: Commit** „Kanonische URLs aus kind:0 website, Feed-Hinweis, trailingSlash ignore (ADR-0029)".

---

### Task 5: `feed.xml`

**Files:** Create `src/lib/routen/xml.js`, `src/lib/routen/feed.js`, `src/lib/routen/feed.test.js`, `src/routes/feed.xml/+server.js`; Modify `test/uebersicht-routen.test.js`

**Interfaces:**
```js
// routen/xml.js
export function xmlEscape(text: string): string          // & < > " '
export function rfc822(iso: string): string              // new Date(iso).toUTCString()
// routen/feed.js
export function feedXml({ konfig, inhalt, basisUrl }): string   // wirft error(503) bei Leerstand
```

- [ ] **Step 1: Failing tests** `src/lib/routen/feed.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { feedXml } from './feed.js';
import { xmlEscape } from './xml.js';
import { leererInhalt } from '../services/spiegel.js';
import { inhaltDerTestquelle } from '../../../test/fixtures/testquelle/laden.js';

const BESTAND = JSON.parse(readFileSync(new URL('../../../test/fixtures/foerbico-artikel-30023.json', import.meta.url), 'utf8'));

describe('feedXml', () => {
  it('RSS 2.0 mit den 20 neuesten Artikeln, kanonischen Links und Datum', () => {
    const { konfig } = inhaltDerTestquelle();
    const inhalt = { ...leererInhalt(), stand: /** @type {any} */ ({ zeitpunkt: '2026-09-14T10:00:00Z' }), artikel: BESTAND };
    const xml = feedXml({ konfig: { ...konfig, autor: BESTAND[0].pubkey }, inhalt, basisUrl: 'https://oer.community' });
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<rss version="2.0"');
    expect((xml.match(/<item>/g) ?? []).length).toBe(20);
    expect(xml).toContain('<link>https://oer.community/');
    expect(xml).toMatch(/<pubDate>[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4}/);
    expect(xml).toContain('<atom:link href="https://oer.community/feed.xml" rel="self"');
  });
  it('Seiten stehen nicht im Feed', () => {
    const { inhalt, konfig } = inhaltDerTestquelle();
    const xml = feedXml({ konfig, inhalt, basisUrl: 'https://t' });
    expect(xml).toContain('Artikel A');
    expect(xml).not.toContain('Impressum');
    expect(xml).not.toContain('Willkommen');
  });
  it('escapet Titel und Anriss', () => {
    expect(xmlEscape('Tom & Jerry <3 "x"')).toBe('Tom &amp; Jerry &lt;3 &quot;x&quot;');
  });
  it('leerer Spiegel: 503 mit Meldung', () => {
    const { konfig } = inhaltDerTestquelle();
    expect(() => feedXml({ konfig, inhalt: leererInhalt(), basisUrl: 'https://t' })).toThrow();
  });
});
```

Routentest in `test/uebersicht-routen.test.js`: `GET` von `../src/routes/feed.xml/+server.js` mit gemocktem Spiegel → `Response` mit `content-type` `application/rss+xml; charset=utf-8` und Body, der `<rss` enthält.

- [ ] **Step 2:** FAIL. **Step 3: Implementieren.**

```js
// routen/xml.js
export function xmlEscape(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
export function rfc822(iso) { return new Date(iso).toUTCString(); }
```

```js
// routen/feed.js
import { error } from '@sveltejs/kit';
import { artikelListe } from '../loaders/uebersicht.js';
import { leerstandMeldung } from '../models/leerstand.js';
import { rfc822, xmlEscape } from './xml.js';
import { kanonisch } from './struktur.js';

/** RSS 2.0 der 20 neuesten Artikel (Spec „Routen"). Seiten sind keine Artikel — artikelListe lässt sie weg. */
export function feedXml({ konfig, inhalt, basisUrl }) {
  const leer = leerstandMeldung(inhalt, konfig);
  if (leer) error(503, leer);
  const { karten } = artikelListe(inhalt, konfig, { seite: 1 });
  const titel = xmlEscape(strukturTitel(inhalt));   // Wortmarke aus dem Profil, Rückfall „Community-Hub" — über profilAusEvent
  const items = karten.map((k) => `    <item>
      <title>${xmlEscape(k.titel)}</title>
      <link>${xmlEscape(kanonisch(basisUrl, k.pfad))}</link>
      <guid isPermaLink="true">${xmlEscape(kanonisch(basisUrl, k.pfad))}</guid>
      <pubDate>${rfc822(k.veroeffentlicht)}</pubDate>
      <description>${xmlEscape(k.zusammenfassung)}</description>
${k.themen.map((t) => `      <category>${xmlEscape(t.name)}</category>`).join('\n')}
    </item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${titel}</title>
    <link>${xmlEscape(kanonisch(basisUrl, '/blog'))}</link>
    <description>Beiträge von ${titel}</description>
    <language>de</language>
    <lastBuildDate>${rfc822(inhalt.stand?.zeitpunkt ?? new Date().toISOString())}</lastBuildDate>
    <atom:link href="${xmlEscape(kanonisch(basisUrl, '/feed.xml'))}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}
```

`strukturTitel(inhalt)` = `profilAusEvent(inhalt.profil)?.name ?? WORTMARKE_RUECKFALL` (Import aus `./struktur.js`). Route `src/routes/feed.xml/+server.js`:

```js
import { env } from '$env/dynamic/private';
import { konfigLesen } from '$lib/konfig.js';
import { feedXml } from '$lib/routen/feed.js';
import { basisUrlBestimmen } from '$lib/routen/struktur.js';
import { profilAusEvent } from '$lib/models/profil.js';
import { spiegelHolen } from '$lib/services/spiegel.js';

export const prerender = false;

/** @type {import('./$types').RequestHandler} */
export function GET({ url }) {
  const konfig = konfigLesen(env);
  const inhalt = spiegelHolen().lesen();
  const basisUrl = basisUrlBestimmen(profilAusEvent(inhalt.profil), url.origin);
  return new Response(feedXml({ konfig, inhalt, basisUrl }), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=600' }
  });
}
```

- [ ] **Step 4:** grün. **Step 5: Commit** „feed.xml: RSS 2.0 der 20 neuesten Artikel aus dem Spiegel".

---

### Task 6: `sitemap.xml`

**Files:** Create `src/lib/routen/sitemap.js`, `src/lib/routen/sitemap.test.js`, `src/routes/sitemap.xml/+server.js`; Modify `test/uebersicht-routen.test.js`

**Interfaces:** `sitemapXml({ konfig, inhalt, basisUrl }): string` — alle `30023` (Artikel und Seiten) je einmal, `loc` = kanonische URL (die Startseite unter `basisUrl/`), `lastmod` = `published_at` als `YYYY-MM-DD`; dazu `/blog` und `/themen` mit `lastmod` = Stand des Spiegels. Leerstand → 503.

- [ ] **Step 1: Failing tests** `src/lib/routen/sitemap.test.js`:

```js
it('listet Artikel und Seiten je einmal, die Startseite als /', () => {
  const { inhalt, konfig } = inhaltDerTestquelle();
  const xml = sitemapXml({ konfig, inhalt, basisUrl: 'https://t' });
  expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  expect(xml).toContain('<loc>https://t/</loc>');
  expect(xml).not.toContain('<loc>https://t/startseite</loc>');
  expect(xml).toContain('<loc>https://t/impressum</loc>');
  expect(xml).toContain('<loc>https://t/en/our-team</loc>');
  expect(xml).toContain('<loc>https://t/artikel-a</loc>');
  expect(xml).toContain('<loc>https://t/blog</loc>');
  expect((xml.match(/<url>/g) ?? []).length).toBe(6 + 2);   // 6 Beiträge der Testquelle + blog + themen
  expect(xml).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
});
it('leerer Spiegel: 503', () => { expect(() => sitemapXml({ konfig: inhaltDerTestquelle().konfig, inhalt: leererInhalt(), basisUrl: 'https://t' })).toThrow(); });
```

Routentest wie beim Feed (`content-type` `application/xml; charset=utf-8`).

- [ ] **Step 2:** FAIL. **Step 3: Implementieren** `routen/sitemap.js`:

```js
import { error } from '@sveltejs/kit';
import { artikelAusEvent, beitragsPfad } from '../models/artikel.js';
import { leerstandMeldung } from '../models/leerstand.js';
import { kanonisch } from './struktur.js';
import { xmlEscape } from './xml.js';

/** @param {Date} d */
const tag = (d) => d.toISOString().slice(0, 10);

export function sitemapXml({ konfig, inhalt, basisUrl }) {
  const leer = leerstandMeldung(inhalt, konfig);
  if (leer) error(503, leer);
  const stand = tag(new Date(inhalt.stand?.zeitpunkt ?? Date.now()));
  const eintraege = inhalt.artikel.map((e) => artikelAusEvent(e)).map((a) => ({
    loc: kanonisch(basisUrl, a.d === konfig.startseiteD ? '/' : beitragsPfad(a)),
    lastmod: tag(a.veroeffentlicht)
  }));
  eintraege.push({ loc: kanonisch(basisUrl, '/blog'), lastmod: stand }, { loc: kanonisch(basisUrl, '/themen'), lastmod: stand });
  const urls = eintraege.map((u) => `  <url>\n    <loc>${xmlEscape(u.loc)}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
```

Route `src/routes/sitemap.xml/+server.js` analog zum Feed mit `Content-Type: application/xml; charset=utf-8`.

- [ ] **Step 4:** grün. **Step 5: Commit** „sitemap.xml: alle Beiträge und Seiten mit lastmod aus dem Spiegel".

---

### Task 7: Doku, Rauchtest, Abschluss

**Files:** Modify `CLAUDE.md`, `docs/STATUS.md`, `src/lib/routen/feste-segmente.test.js` (Prüfung: `feed.xml` und `sitemap.xml` stehen schon in `FESTE_SEGMENTE` — nur bestätigen)

- [ ] **Step 1: CLAUDE.md:** im Abschnitt „Warum ein Bild fehlt" nichts; unter „Technik" der Satz „Feed (`/feed.xml`, RSS 2.0, 20 Artikel) und Sitemap (`/sitemap.xml`) werden aus dem Spiegel gebaut; kanonische URLs kommen aus `kind:0 website`, Rückfall Origin (ADR-0029)."; unter „Sprache/Technik" keine Änderung; der Verweis auf `docs/designsystem.md` bleibt, die Zeile „Farben, Schriften, Abstände" um „(FOERBICO, ADR-0031)" ergänzt.
- [ ] **Step 2: STATUS.md:** Eintrag oben „2026-09-14 (spät nachts) — Stufe 3 und 4: Gestaltung, Feed, Sitemap, kanonische URLs" mit den drei Fragen; Testzahl; was live sichtbar ist; offen: Dunkelmodus (bewusst nicht), Logo-Maße, `pnpm lint`/`test:e2e`.
- [ ] **Step 3:** `pnpm check && pnpm test`; `pnpm build`; `PORT=5199 node build/index.js` (`set -a; . ./.env; set +a`): `curl -s localhost:5199/feed.xml | head -5` zeigt `<rss`, `curl -sI localhost:5199/sitemap.xml | grep -i content-type` → `application/xml`, `curl -s localhost:5199/blog | grep -o 'rel="canonical"[^>]*'` zeigt `https://oer.community/blog` (Profil `website` live), `curl -s -o /dev/null -w '%{http_code}' localhost:5199/canva/` → 200 (trailingSlash ignore). Server beenden.
- [ ] **Step 4: Commit** „Doku: Stufe 3 und 4 in CLAUDE.md und STATUS". Danach `superpowers:finishing-a-development-branch`.

---

## Selbstprüfung gegen die Spec

| Anforderung | Task |
|---|---|
| Designsystem: FOERBICO-Werte, Roboto Condensed, andere Schriften samt Dateien weg, Kontrastregel, Fokus/Fehler-Rückfälle (ADR-0031) | 1, 2, 3 |
| Kopfzeile Logo/Wortmarke/Menü (Stufe 2) im neuen Look; Übersicht als Kartenliste; Fußzeile | 2 |
| `<title>`-Form (Stufe 2) unverändert | — |
| `/feed.xml` RSS 2.0, 20 neueste | 5 |
| `/sitemap.xml` alle Seiten und Artikel mit lastmod | 6 |
| `trailingSlash: 'ignore'`, kanonisch ohne Schrägstrich, `<link rel="canonical">` | 4 |
| `website` aus `kind:0` für kanonische URLs und Feed, Rückfall Origin | 4, 5, 6 |
| Leerstand → 503 mit Meldung auch für Feed/Sitemap | 5, 6 |
| Kein Dunkelmodus, kein Sprachumschalter | — (bewusst) |
