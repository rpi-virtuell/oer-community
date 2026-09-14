# Designsystem community-hub

**Grundlage:** `Website/Design/styleguide.md` (FOERBICO-Styleguide) und das
PaperMod-Theme von oer.community, dessen CSS
(`zz001-foerbico-theme.css`) die tatsächlich genutzten Werte zeigt —
Stand 14.09.2026. **ADR-0031 ersetzt ADR-0018.** Die Farbkarte
FOERBICO × rpi-virtuell und `mockup/index.html` sind der relilab-Stand vom
04.09.2026 und nicht mehr maßgeblich — sie bleiben im Repository als
Beleg dieses früheren Stands, nicht als Quelle für neue Werte.

**Stand:** 14.09.2026 · Umsetzung: `src/app.css` (Tokens, Grundschrift,
Bausteine) · Begründung: ADR-0031 · Kontrastentscheidungen: ADR-0031,
nachgerechnet in `test/kontrast.test.js`.

**Die Werte werden kopiert, nicht verlinkt.** Weder das WordPress-Stylesheet
noch ein PaperMod-Stylesheet werden zur Laufzeit geladen — sonst wäre
WordPress nicht überflüssig, sondern Voraussetzung.

---

## Farben

Aus `Website/Design/styleguide.md` (FOERBICO), kopiert nach `src/app.css`:

| Token | Wert | Wofür |
|---|---|---|
| `--fb-primaer` | `#203a8f` | Marke, Links, aktive Zustände |
| `--fb-akzent` | `#ffa500` | Rahmen, Hervorhebung, Fokus — **nie** Grund für weißen Text |
| `--fb-ueberschrift` | `#002366` | Überschriften |
| `--fb-text` | `#333333` | Fließtext |
| `--fb-rahmen` | `#d3d3d3` | Linien |
| `--fb-flaeche` | `#f0f8ff` | Karten, Fußzeile, Hinweise |
| `--fb-flaeche-2` | `#e6f2ff` | Kopfzeile, Marker |
| `--fb-weiss` | `#ffffff` | Grund |

Zwei Werte sind abgeleitet, nicht im Styleguide genannt:

| Token | Wert | Herkunft |
|---|---|---|
| `--fb-text-leise` | `#5a6178` | Metazeilen — Wert aus dem früheren Designsystem übernommen, da der Styleguide keinen eigenen für gedämpften Text nennt |
| `--fb-fehler` | `#971b2f` | Comenius-Dunkelrot aus der Farbtabelle des Styleguides (Zeile „Aktive Elemente", Spalte Comenius) — der Styleguide selbst nennt keinen Fehlerton, ADR-0031 legt diesen fest |

**Kein Dunkelmodus in dieser Stufe** (ADR-0031). PaperMod hatte einen; der
Hub bekommt ihn, wenn jemand ihn vermisst.

---

## Schrift

**Eine Schrift für alles.** Roboto und Yanone Kaffeesatz aus dem früheren
Designsystem entfallen samt Dateien und Lizenztexten — der
FOERBICO-Styleguide nennt nur Roboto Condensed.

```css
--schrift: 'Roboto Condensed', system-ui, -apple-system, 'Segoe UI', sans-serif;
```

**Schriften werden lokal ausgeliefert** (`static/schriften/`), nicht von
Google Fonts geladen — Schulnetze und Datenschutz. Eine variable Datei je
Subset (`latin`, `latin-ext`) deckt die Schnittweiten 400 bis 700 ab. Dass
keine Schrift von Google kommt und jede `url()` auf eine vorhandene Datei
zeigt, prüft `src/lib/architektur.test.js`.

### Skala

| Rolle | Wert |
|---|---|
| Fließtext (`body`) | `17px`, `line-height: 1.6`, `font-weight: 400` |
| `h1` | `clamp(2rem, 4vw, 2.8rem)` |
| `h2` | `clamp(1.5rem, 3vw, 2rem)` |
| `h3` | `1.3rem` |
| Metazeile | `.86rem` |
| Marker | `.78rem` |

Überschriften (`h1`–`h6`): `font-weight: 700`, `line-height: 1.15`, Farbe
`--fb-ueberschrift`.

---

## Maße

```css
--breite-container: 1499px;   /* Textbreite schmal: 820px */
--breite-schmal:    820px;
--hoehe-kopf:        120px;   /* Kopfzeilenhöhe */
--radius:              5px;
```

Das Layout — Textbreite, Container, Kopfzeilenhöhe — bleibt vom
bisherigen Designsystem übernommen, weil es nicht markenspezifisch ist
(ADR-0031).

```css
--schatten: 0 2px 24px rgba(20, 50, 100, 0.08);
```

---

## Einsatzregeln

- **Primär** (`--fb-primaer`) für Links, Marke, aktive Zustände.
- **Akzent** (`--fb-akzent`) nur als Rahmen, Hervorhebung oder Fokusring —
  **nie** als Grund für weißen Text. Orange trägt kein Weiß: 2,0:1, weit
  unter der Grenze. Steht Text auf `--fb-akzent`, ist die Textfarbe
  `--fb-ueberschrift` (7,4:1). `test/kontrast.test.js` prüft mechanisch,
  dass keine Komponente `--fb-akzent` als Hintergrund mit `--fb-weiss` als
  Textfarbe im selben Regelblock kombiniert.
- **Flächen** (`--fb-flaeche`, `--fb-flaeche-2`) für Karten, Fußzeile,
  Hinweise (`--fb-flaeche`) sowie Kopfzeile und Marker (`--fb-flaeche-2`).
- **Fehler** (`--fb-fehler`) ausschließlich für Fehlerzustände.

---

## Kontrast

Alle Werte sind mit der Formel aus `test/kontrast.test.js` nachgerechnet
(WCAG 2.1, sRGB, relative Leuchtdichte). Grenze: **4,5:1**, unabhängig von
der Textgröße — die Werte tragen die Farbe auch, wenn eine Schrift kleiner
gesetzt wird. `test/kontrast.test.js` prüft diese Paare gegen genau diese
Grenze.

| Kombination | Verhältnis | |
|---|---|---|
| `--fb-text` auf `--fb-weiss` | 12,6:1 | AA |
| `--fb-text` auf `--fb-flaeche` | 11,8:1 | AA |
| `--fb-text-leise` auf `--fb-weiss` | 6,1:1 | AA |
| `--fb-text-leise` auf `--fb-flaeche-2` | 5,4:1 | AA |
| `--fb-primaer` auf `--fb-weiss` | 10,2:1 | AA |
| `--fb-ueberschrift` auf `--fb-akzent` | 7,4:1 | AA |
| `--fb-fehler` auf `--fb-weiss` | 8,4:1 | AA |
| `--fb-weiss` auf `--fb-akzent` | 2,0:1 | **durchgefallen, deshalb verboten** |

**Weiß auf Akzent ist deshalb keine Option, keine Ausnahme.** Der letzte
Wert steht in der Tabelle, weil er den Grund für die Einsatzregel oben
liefert — nicht, weil er irgendwo eingesetzt wird.

---

## Bausteine

Wiederkehrende Klassen aus `src/app.css`:

- **Metazeile** (`.metazeile`) — Datum, Themen, Bildnachweis: `.86rem`,
  `--fb-text-leise`, als Flex-Zeile mit Umbruch.
- **Marker** (`.marker`) — Themen-Schlagwort als Pille: Fläche
  `--fb-flaeche-2`, Text `--fb-text-leise`, `.78rem`, voll gerundet.
- **Augenbraue** (`.augenbraue`) — kurze Zeile über einer Überschrift:
  `.82rem`, Versalien, `letter-spacing: .16em`, `--fb-text-leise`.
- **Hinweis** (`.hinweis`) — Herkunftshinweis, fehlendes Bild, entfernte
  Verweise: Fläche `--fb-flaeche`, linker Rahmen `--fb-akzent` (3px),
  abgerundet nur rechts.
- **Karte** (`Karte.svelte`) — Übersichtskachel: Rahmen `--fb-rahmen` (1px),
  `--radius`, weißer Grund, Cover oben, Text darunter.
- **Bildrahmen** — jedes ausgelieferte Bild trägt `1px solid --fb-akzent`
  und `--radius`, wie PaperMods `.post-content img`/`.post-entry img`.

---

## Frühere Stände

`mockup/index.html` und die Farbkarte FOERBICO × rpi-virtuell
(`--relilab`, `--magenta`, `--verlauf`, `--fau` und Verwandte) sind der
relilab-Stand vom 04.09.2026. Sie bleiben im Repository, sind aber seit
ADR-0031 **nicht mehr maßgeblich** — der Gestaltungsstand im laufenden
Client ist `src/app.css` mit den FOERBICO-Werten oben. ADR-0018
(die drei Kontrastpunkte der relilab-Palette) ist durch ADR-0031 ersetzt
und bleibt nur als Geschichte stehen.

Ebenso historisch: die geplante relilab-Seitenstruktur für die Startseite
(Intro-Titel, animiertes GIF, vier Kästen, Newsletter-Knopf) wurde nie im
Hub gebaut und entfällt mit ADR-0026/ADR-0027 — die Startseite ist die
Seite `d = startseite` aus Nostr, kein festverdrahtetes relilab-Markup.

---

## Noch zu klären

**Wie nah kommt „1:1" an oer.community?** Farben, Schrift und Maße sind
Tokens; ein abweichendes Kartenraster oder eine andere Kopfzeile sind
Komponentenarbeit. Diese Untersuchung steht noch aus.
