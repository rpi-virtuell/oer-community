# Designsystem community-hub

**Grundlage:** `Website/Design/styleguide.md` (FOERBICO-Styleguide) und das
PaperMod-Theme von oer.community, dessen CSS
(`zz001-foerbico-theme.css`) die tatsächlich genutzten Werte zeigt —
Stand 14.09.2026. **ADR-0031 ersetzt ADR-0018 und ADR-0004.** Der
relilab-Stand vom 04.09.2026 (Farbkarte FOERBICO × rpi-virtuell,
`mockup/index.html`) ist am 15.09.2026 aus dem Arbeitsstand entfernt worden
und nur noch in der Git-Historie nachzulesen (siehe „Frühere Stände“).

**Stand:** 16.09.2026 · Umsetzung: `src/app.css` (Tokens, Grundschrift,
Bausteine) · Begründung: ADR-0031, Gestaltungsebene ADR-0040 (Panel, Label,
Display, Aufmacher-Raster, klebende Kopfzeile — nach dem
FOERBICO-Landing-Entwurf `foerbico-landing_draft3.html`) ·
Kontrastentscheidungen: ADR-0031, nachgerechnet in `test/kontrast.test.js`.

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
| `--fb-primaer-tief` | `#152560` | Endpunkt des Panel-Verlaufs, aus dem Landing-Entwurf (`--blue-deep`); nur im Panel, nie als Textfarbe (ADR-0040) |

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
--breite-container: 1499px;   /* Kopf- und Fußzeile */
--breite-raster:    1240px;   /* Übersichten und Startkopf (ADR-0040) */
--breite-schmal:     820px;   /* Lesebreite */
--hoehe-kopf:         76px;   /* Kopfzeile, klebend (ADR-0040; vorher 120px) */
--radius:              5px;
--uebergang:  160ms ease-out; /* Hover-Übergänge; prefers-reduced-motion schaltet ab */
```

Das Layout — Textbreite, Container — bleibt vom bisherigen Designsystem
übernommen, weil es nicht markenspezifisch ist (ADR-0031). **Zwei
Breiten** seit ADR-0040: Übersichten und die Startseite laufen in der
Rasterbreite (`main.breit`, geschaltet über das Seitendatum `breit`), der
Beitragstext liegt immer in der Lesebreite — auf der Startseite in einem
`.lesebreite`-Wrapper unter dem Startkopf.

```css
--schatten: 0 2px 24px rgba(20, 50, 100, 0.08);
```

---

## Einsatzregeln

- **Primär** (`--fb-primaer`) für Links, Marke, aktive Zustände.
- **Fokusring** (`:focus-visible`) ist `3px` Akzent mit `2px` Abstand, dazu
  ein `1px`-Saum aus `--fb-ueberschrift` (`box-shadow`): Orange allein liegt
  auf Weiß bei 2,0:1 und damit unter den 3:1, die WCAG 2.1 für
  Bedienelemente verlangt. Der Saum hebt den Kontrast, ohne die Akzentfarbe
  des Rings zu ändern (ADR-0031).
- **Akzent** (`--fb-akzent`) nur als Rahmen, Hervorhebung oder Fokusring —
  **nie** als Grund für weißen Text. Orange trägt kein Weiß: 2,0:1, weit
  unter der Grenze. Steht Text auf `--fb-akzent`, ist die Textfarbe
  `--fb-ueberschrift` (7,4:1). `test/kontrast.test.js` prüft mechanisch,
  dass keine Komponente `--fb-akzent` als Hintergrund mit `--fb-weiss` als
  Textfarbe im selben Regelblock kombiniert.
- **Flächen** (`--fb-flaeche`, `--fb-flaeche-2`) für Karten, Fußzeile,
  Hinweise (`--fb-flaeche`) sowie Kopfzeile und Marker (`--fb-flaeche-2`).
- **Fehler** (`--fb-fehler`) ausschließlich für Fehlerzustände.
- **Panel** (`.panel`): die einzige Fläche mit hellem Text. Text darauf ist
  `--fb-weiss`, Labels sind `--fb-akzent` — beide Paare gegen `--fb-primaer`
  und `--fb-primaer-tief` nachgerechnet (unten). Orange bleibt auch hier
  Label, kein Fließtext.
- **Bewegung** nur bei Hover (Karte hebt sich 2 px, Rahmen wird blau),
  Dauer `--uebergang`; `prefers-reduced-motion` schaltet alle Übergänge ab.
  Kein Scroll-Skript, keine Ladeanimation — der Hub rendert fertig.

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
| `--fb-text` auf Lizenzpille (90 % Weiß über Schwarz) | 10,1:1 | AA |
| `--fb-weiss` auf `--fb-primaer` (Panel) | 10,2:1 | AA |
| `--fb-akzent` auf `--fb-primaer` (Panel-Label) | 5,2:1 | AA |
| `--fb-weiss` auf `--fb-primaer-tief` | 14,3:1 | AA |
| `--fb-akzent` auf `--fb-primaer-tief` | 7,3:1 | AA |
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
- **Label** (`.label`) — Versalien, `.72rem`, `letter-spacing: .22em`,
  `--fb-primaer`: Datum auf Karten und im Terminblock, Menüpunkte tragen
  dieselbe Form. Im Panel orange.
- **Display** (`.display`) — die große Überschrift: Roboto Condensed 700 in
  Versalien, `line-height: 1`. Startkopf-Titel und Aufmacher-Überschrift.
  Ersetzt die Display-Schrift des Landing-Entwurfs (Yanone Kaffeesatz), die
  ADR-0031 ausschließt.
- **Panel** (`.panel`) — Primärblau mit Verlauf nach `--fb-primaer-tief`,
  feinem Raster aus `repeating-linear-gradient` und orangem Radial-Glow
  (`color-mix`, keine Hex-Werte in Komponenten). Trägt den Block „Nächste
  Termine".
- **Startkopf** (`Startkopf.svelte`) — Hero der Startseite: Titel
  (`.display`, bis 5,6rem) mit orangem 4-px-Strich darunter und Vorspann der
  Seite `d = startseite`, reiner Text in voller Breite. Das Logo-Panel des
  Entwurfs ist weggefallen: Logo und Wortmarke stehen schon in der
  Kopfzeile, und das Logo klebte im Panel am unteren Rand (Rückmeldung
  Jörg, 16.09.). Detail rendert darunter mit `ohneKopf`, sonst stünde der
  Titel zweimal.
- **Karte** (`Karte.svelte`) — Übersichtskachel: Rahmen `--fb-rahmen` (1px),
  `--radius`, weißer Grund, Cover oben (16:10, `object-fit: cover`), darunter
  Datum als Label, Titel, Anriss auf drei Zeilen begrenzt, Themen über einer
  Trennlinie am Kartenboden. Ohne zeigbares Cover ein flaches Rasterfeld
  (16:5) als Platzhalter. Als **Aufmacher** (Prop `aufmacher`) liegt sie
  zweispaltig quer, Cover links, Titel als `.display`. Die Übersicht macht
  auf Seite 1 den neuesten Beitrag zum Aufmacher, der Rest steht im
  **Raster** (3 Spalten, 2 bis 1024px, 1 bis 640px).
- **Themenwolke** (`Themenwolke.svelte`) — alle Themen als Wolke in fünf
  Größenstufen nach Häufigkeit (`groessenstufe` in `src/lib/themenwolke.js`),
  in `--fb-primaer`; die Anzahl steht klein an jedem Thema. Stufe 5 ist das
  häufigste Thema, nicht orange — Orange trägt auf Weiß keinen Text.
- **Kopfzeile** — klebend (`position: sticky`), `--fb-flaeche-2` zu 88 %
  mit `backdrop-filter: blur(12px)`, orangem Saum, Wortmarke und Menü in
  Versalien mit Buchstabenabstand; der aktive Menüpunkt trägt einen
  2-px-Unterstrich in `--fb-akzent`. Unter 640px nicht klebend.
- **Fußzeile** — drei Spalten (Marke mit Fußtext · Links · Werkzeug),
  Stand-Hinweis und Struktur-Befund über die ganze Breite.
- **Bildrahmen** — den orangen Rahmen (`1px solid --fb-akzent`, `--radius`)
  trägt allein der `Bildbereich` (Cover und aufgelöste Bilder im Fließtext),
  wie PaperMods `.post-content img`. Die **Karte** rahmt als Ganzes
  (`1px solid --fb-rahmen`, `--radius`), nicht ihr Cover einzeln. Bilder, die
  aus dem Fließtext-HTML kommen und keinen Nachweis haben (`.inhalt img`),
  bekommen nur `--radius` — sonst behauptete der Akzentrahmen einen
  geprüften Stand, den es nicht gibt.
- **Lizenzpille** (`Lizenzpille.svelte`) — der Lizenzstand unten rechts auf
  jedem ausgelieferten Bild (ADR-0032), in Karte und Bildbereich: Grund
  `--fb-weiss` zu 90 % über dem Bild (`color-mix`, `backdrop-filter`),
  Text `--fb-text`, Rahmen `--fb-rahmen`, voll gerundet, `.78rem`. Bekannt:
  KI-Marke (`KiMarke.svelte`) · Lizenzkürzel fett · Credit; ungeklärt:
  „i"-Symbol und „Lizenz ungeklärt". Kein Link, kein Popover — die
  Attribution bzw. der Grund stehen im `title` und in der Bildunterschrift.
- **Keine kursive Schnittdatei.** Unter `static/schriften/` liegt je Familie
  nur der aufrechte variable Schnitt (400–700, `font-style: normal`). `<em>`
  wird deshalb vom Browser synthetisiert — bewusst: eine zweite Datei je
  Familie kostet mehr Ladezeit, als die echte Kursive im Fließtext einbringt.

---

## Frühere Stände

Der relilab-Stand vom 04.09.2026 — `mockup/index.html` und die Farbkarte
FOERBICO × rpi-virtuell (`--relilab`, `--magenta`, `--verlauf`, `--fau` und
Verwandte) — ist seit ADR-0031 nicht mehr maßgeblich und am 15.09.2026 aus
dem Repository entfernt; wer ihn braucht, findet ihn in der Git-Historie
vor diesem Datum (`git log --all -- mockup/index.html`). ADR-0004 und
ADR-0018 sind durch ADR-0031 ersetzt und bleiben als Geschichte stehen.
`test/oberflaeche.test.js` verbietet die alten Token weiterhin mechanisch,
damit sie nicht über eine Kopie zurückkommen.

Die geplante relilab-Seitenstruktur für die Startseite (Intro-Titel,
animiertes GIF, vier Kästen, Newsletter-Knopf) wurde nie gebaut und entfällt
mit ADR-0026/ADR-0027 — die Startseite ist die Seite `d = startseite` aus
Nostr.

---

## Noch zu klären

**Wie nah kommt „1:1" an oer.community?** Farben, Schrift und Maße sind
Tokens; Kartenraster und Kopfzeile folgen seit ADR-0040 dem
FOERBICO-Landing-Entwurf, nicht PaperMod. Ob der Entwurf der künftige
Styleguide wird (und Yanone Kaffeesatz zurückkommt), entscheidet die
Redaktion — ADR-0040 hat Status „offen".
