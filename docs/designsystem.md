# Designsystem community-hub

**Grundlage:** Farbfusions- und Typografiekonzept FOERBICO × rpi-virtuell,
v2 (Februar 2026) —
[Farbkarte](https://rpi-virtuell.github.io/FOERBICO_und_rpi-virtuell/farbkarte-komplementaer.html).
Es ordnet relilab als Tochtermarke von rpi-virtuell ein.

**Stand:** 01.09.2026 · Umsetzung: `mockup/index.html` · Begründung:
Spec, Entscheidung 4

**Die Werte werden kopiert, nicht verlinkt.** Weder das WordPress-Stylesheet
noch die Farbkarte werden zur Laufzeit geladen — sonst wäre WordPress nicht
überflüssig, sondern Voraussetzung.

**Wo Ist-Zustand und Designsystem sich widersprechen, gewinnt das
Designsystem.** Das Schaufenster baut nicht die alte Seite nach, sondern
passt in die gemeinsame Markenwelt. Die frühere Ableitung aus dem
Blocksy-Theme (`#2872fa`, Roboto Condensed als Fließtext) gilt nicht mehr.

---

## Farben

```css
:root{
  /* Institutionsfarben */
  --relilab:      #34b2f6;  /* Primärfarbe */
  --relilab-tief: #1a8fd0;  /* dunklere Stufe, Hover */
  --magenta:      #d225f8;  /* Endpunkt des relilab-Gradienten */
  --rpi:          #0072aa;  /* Muttermarke — hier: Linkfarbe, s. u. */
  --foerbico:     #203a8f;
  --fusion:       #1a5699;
  --fau:          #04316a;  /* dunkelster Ton */

  /* Warm-Spektrum: Akzente */
  --amber:      #f29422;  /* Primärakzent: Aktionen, aktive Zustände */
  --amber-tief: #d97d13;
  --pink:       #e54d9a;  /* Termine, Community-Formate */
  --orange:     #ff8103;  /* relilab-Orange: Akzent, Gamification */
  --mint:       #2ecc88;  /* Funktionsfarbe: Erfolg, Status */

  /* Flächen und Text */
  --rl-text:       #1a1e2e;  /* Fließtext */
  --rl-text-leise: #5a6178;  /* Metazeilen */
  --rl-dunkel:     #04316a;  /* = --fau */
  --rl-linie:      #e6e9f2;
  --rl-flaeche:    #f6f7fb;
  --rl-flaeche-2:  #eef0f7;
  --rl-weiss:      #ffffff;

  --verlauf: linear-gradient(135deg, var(--relilab) 0%, var(--magenta) 100%);
}
```

### Einsatzregeln

| Farbe | Wofür |
|---|---|
| `--amber` | Aktionen, Filter, aktive Zustände, Hervorhebungen |
| `--pink` | Termine, Community-Events, partizipative Formate |
| `--verlauf` | relilab-Submarke: Wortmarke, Aufmacher |
| `--mint` | Statusmeldungen, Erfolg |
| `--fau` | Fußzeile, Schrift auf Farbflächen |

---

## Schrift

**Drei Schriften, drei Rollen.** Die Aufteilung ist Teil des Systems, nicht
Geschmack — jede Schrift steht für eine der drei Marken.

| Schrift | Rolle | Herkunft |
|---|---|---|
| Yanone Kaffeesatz | Überschriften, Display, Community-Bereiche | Community |
| Roboto Condensed | Navigation, Labels, Marker, Metazeilen | FOERBICO |
| Roboto | Fließtext, Beschreibungen | rpi-virtuell |

```css
--schrift-ueber: "Yanone Kaffeesatz", Roboto, system-ui, sans-serif;
--schrift-label: "Roboto Condensed", Roboto, system-ui, sans-serif;
--schrift-text:  Roboto, system-ui, -apple-system, "Segoe UI", sans-serif;
```

**Roboto Condensed ist nicht die Fließtextschrift.** Das war der Fehler der
früheren Ableitung. Sie trägt Navigation, Marker und Metazeilen — kurze Texte
in Versalien oder mit Sperrung.

### Skala

| Rolle | Wert |
|---|---|
| `h1` | `clamp(2rem, 4vw, 3rem)` |
| `h2` | `clamp(1.6rem, 3vw, 2.25rem)` |
| `h3` | `1.35rem` |
| Fließtext | `16px`, `line-height: 1.65`, `font-weight: 400` |
| Detailinhalt | `1.02rem` |
| Metazeile, Marker | `.86rem` / `.78rem` |
| Augenbraue | `.82rem`, `letter-spacing: .16em`, Versalien |

Überschriften: `font-weight: 700`, `line-height: 1.15`, Farbe `--rl-dunkel`.

**Schriften werden lokal ausgeliefert** (`static/`), nicht von Google Fonts
geladen. Das Mockup nutzt das CDN, der Client nicht — Schulnetze und
Datenschutz.

---

## Maße

```css
--rl-container: 1499px;   /* Textbreite schmal: 820px */
--rl-kopf:      120px;    /* Kopfzeilenhöhe */
```

**Radien:** `6px` Knöpfe · `8px` Bilder, kleine Flächen · `10px` Karten ·
`12px` Kästen · `999px` Marker und runde Knöpfe

**Abschnittsabstand:** `56px 0` Standardblock, `72px 0` Aufmacher

```css
--schatten:       0 2px 24px rgba(20,50,100,.08);
--schatten-hover: 0 8px 40px rgba(20,50,100,.15);
```

---

## Kontrast — die Regeln, die aus der Palette folgen

Alle Werte unten sind nachgerechnet (WCAG 2.1, sRGB). Grenzen: **4,5:1** für
normalen Text, **3:1** für großen Text (ab 18,66 px fett oder 24 px normal).

### Nie weiße Schrift auf Primär- oder Akzentflächen

| Kombination | Verhältnis | |
|---|---|---|
| Weiß auf `--relilab` | 2,37:1 | durchgefallen |
| Weiß auf `--amber` | 2,32:1 | durchgefallen |
| **`--fau` auf `--relilab`** | **5,35:1** | AA |
| **`--fau` auf `--amber`** | **5,47:1** | AA |

**Aktive Zustände tragen `--fau` als Textfarbe.** Betrifft: aktiver
Navigationspunkt, gedrückter Filterknopf, aktiver Umschalter. Die Palette
bleibt unverändert; es geht allein um die Schrift darauf.

Die Farbkarte trifft dazu keine Aussage — das ist eine Festlegung dieses
Projekts.

### Knöpfe im Verlauf

Der relilab.org-Knopf läuft Magenta → Orange. Weiß erreicht auf dem
ursprünglichen `--amber` nur 2,50:1.

```css
background: linear-gradient(90deg, var(--magenta) 0%, var(--pink) 50%, #e8721a 100%);
font-weight: 700;  /* bei 1.06rem → großer Text, Grenze 3:1 */
```

Gemessen über den Verlauf: Magenta 3,92:1 · Pink 3,58:1 · `#e8721a` 3,06:1 —
durchgehend über 3:1. **Der Verlauf endet deshalb bei `#e8721a`, nicht bei
`--amber`, und die Schrift muss fett bleiben.** Wird der Knopf kleiner oder
magerer gesetzt, trägt die Farbe nicht mehr.

### Marker

Getönte Fläche (Farbe mit Deckkraft auf Weiß), Text in dunklerer Stufe:

| Marker | Text | Fläche | Verhältnis | |
|---|---|---|---|---|
| Pink | `#c22e7d` | `--pink` 13 % | 4,51:1 | AA |
| Blau | `--relilab-tief` | `--relilab` 14 % | 3,17:1 | nur großer Text |
| Mint | `#1a9c63` | `--mint` 15 % | 3,13:1 | nur großer Text |
| Amber | `--amber-tief` | `--amber` 16 % | 2,68:1 | **durchgefallen** |
| Neutral | `--rl-text-leise` | `--rl-flaeche-2` | 5,40:1 | AA |

Marker sind mit `.78rem` **kleiner** Text — die 3:1-Grenze gilt für sie
nicht. Damit erfüllen nur Pink und Neutral die Anforderung. Siehe offene
Punkte.

### Weitere geprüfte Paare

| Kombination | Verhältnis |
|---|---|
| `--rl-text` auf Weiß | 16,55:1 |
| `--rl-text` auf `--rl-flaeche` | 15,46:1 |
| `--rl-text-leise` auf Weiß | 6,15:1 |
| `--rl-text-leise` auf `--rl-flaeche` | 5,74:1 |
| Weiß auf `--fau` | 12,71:1 |
| `--fau` auf `--mint` | 6,12:1 |

---

## Offene Punkte

Drei Stellen, an denen die Umsetzung im Mockup die Kontrastanforderung noch
nicht erfüllt. Vor dem Bau der Komponenten zu entscheiden:

**1. Linkfarbe.** `--relilab-tief` erreicht auf Weiß **3,57:1** — für
Fließtext-Links zu wenig. `--rpi #0072aa` aus derselben Farbkarte schafft
**5,27:1** auf Weiß und 4,92:1 auf `--rl-flaeche` — beides AA — und
bleibt im Markenraum. Empfehlung: `--rpi` für Links im
Fließtext, `--relilab-tief` weiter für große und dekorative Elemente
(Augenbraue, Zurück-Knopf ≥ 18,66 px fett).

**2. Amber-Marker.** 2,68:1 bei `.78rem`. Zwei geprüfte Wege: Text auf
`--fau` ergibt **11,16:1** — reichlich Reserve, kostet aber die warme
Anmutung; oder eine dunklere Amber-Stufe, `#a35c0c` erreicht genau **4,50:1**,
`#96550a` **5,12:1** mit Reserve. Empfehlung: `#96550a` als eigenes Token für
Marker-Text. Betrifft nur den Marker, nicht `--amber` als Fläche.

**3. Aufmacher-Verlauf.** Weiße Schrift startet bei 2,37:1 (blaues Ende) und
erreicht erst zum Magenta hin 3,92:1. Die `h1` ist groß genug, dass 3:1 gilt,
liegt am Anfang aber darunter. Die Augenbraue mit
`rgba(255,255,255,.82)` kommt auf **2,03:1** und ist klar zu schwach.
Mittel: Verlauf im Aufmacher dunkler anlegen (Richtung `--fusion`/`--fau`),
oder eine abdunkelnde Auflage unter den Text legen. Die Augenbraue in jedem
Fall auf volle Deckkraft.

Diese drei Punkte sind **nicht** im Mockup korrigiert — das Mockup zeigt den
Gestaltungsstand, nicht den Endstand.

---

## Übernommenes von relilab.org

Die Startseite trägt Elemente der heutigen Seite weiter, damit sie als deren
Nachfolgerin erkennbar bleibt: Titel „Gemeinsam religionsbezogene Bildung
ermöglichen.", animiertes Intro-GIF, Knopf „Am Live-Anlass teilnehmen", vier
Kästen (Wer wir sind · Wie wir arbeiten · Was wir tun · Mitmachen), Knopf
„Anmeldung zum Newsletter".

Die Kästen verweisen vorerst **zurück auf relilab.org**. Solange WordPress
läuft, ist das richtig; beim Ablösen werden daraus eigene Seiten. Bewusster
Zwischenstand, kein Endzustand.

**Das Intro-GIF wiegt 11,2 MB.** `loading="lazy"`, Fläche über `aspect-ratio`
reserviert, damit nichts springt. Für den Dauerbetrieb gehört es verkleinert
oder als Video ausgeliefert — Aufgabe der Redaktion, nicht des Clients.

---

## Noch zu klären

**Wie nah kommt „1:1"?** Farben, Schriften und Abstände sind Tokens; ein
abweichendes Kartenraster oder eine andere Kopfzeile sind Komponentenarbeit.
Erste Aufgabe ist eine Untersuchung, keine Schätzung: Seitenteile von
relilab.org durchgehen und festhalten, was Token und was Komponente ist.
