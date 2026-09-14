# ADR-0031: Das FOERBICO-Designsystem ersetzt die relilab-Werte

**Status:** angenommen (2026-09-14)
**Beteiligte:** Jörg

Ersetzt ADR-0018 (Kontrastpunkte der relilab-Farben). ADR-0004 (eigenes
Theme, Werte werden kopiert) gilt unverändert — neue Werte, gleiches Prinzip.

## Kontext

Mit ADR-0026 ist oer.community das Vorhaben. Die Farbtoken des Hubs
(`--relilab`, `--magenta`, `--verlauf`, `--fau`) und die Schriftmischung aus
Roboto, Roboto Condensed und Yanone Kaffeesatz stammen aus der Farbkarte
FOERBICO × rpi-virtuell für relilab. oer.community hat einen eigenen
Styleguide (`Website/Design/styleguide.md`) und ein PaperMod-Theme, dessen
CSS (`zz001-foerbico-theme.css`) die tatsächlich genutzten Werte zeigt.

## Entscheidung

Wir übernehmen die Werte des FOERBICO-Styleguides, kopiert nach `app.css`:

| Token | Wert | Wofür |
|---|---|---|
| `--fb-primaer` | `#203a8f` | Marke, Links, aktive Zustände |
| `--fb-akzent` | `#ffa500` | Rahmen, Hervorhebung, Hover |
| `--fb-ueberschrift` | `#002366` | Überschriften |
| `--fb-text` | `#333333` | Fließtext |
| `--fb-rahmen` | `#d3d3d3` | Linien |
| `--fb-flaeche` | `#f0f8ff` | Karten, Fußzeile |
| `--fb-flaeche-2` | `#e6f2ff` | Kopfzeile |
| `--fb-weiss` | `#ffffff` | Grund |

Schrift: **Roboto Condensed** für alles, lokal aus `static/schriften`.
Roboto und Yanone Kaffeesatz entfallen samt Dateien und Lizenztexten.

Kontrast: Text auf `--fb-akzent` ist immer `--fb-ueberschrift`, nie weiß
(Orange `#ffa500` trägt keinen weißen Text: Kontrast 1,9:1). `--fb-primaer`
auf Weiß hat 10:1, `--fb-text` auf `--fb-flaeche` 11,8:1, `--fb-ueberschrift`
auf `--fb-akzent` 7,4:1 — alle drei
AA-tauglich für Fließtext.

Das Layout — Textbreite, Container, Abstände — bleibt vom bisherigen
Designsystem, weil es nicht markenspezifisch ist. Kein Dunkelmodus in
dieser Stufe; PaperMod hatte einen, der Hub bekommt ihn, wenn jemand ihn
vermisst.

## Konsequenzen

- `docs/designsystem.md` wird neu geschrieben; die Farbkarte
  FOERBICO × rpi-virtuell ist dort nicht mehr Grundlage.
- Die Wortmarke ist kein Text mehr, sondern `name` und `picture` aus
  `kind:0` (ADR-0027). `Kopfzeile.svelte` und `Fusszeile.svelte` verlieren
  den Verlauf.
- Der Styleguide nennt keine Werte für Fokus-Ringe und Fehlerzustände; wir
  nehmen `--fb-akzent` für Fokus und `#971b2f` (Comenius-Dunkelrot aus der
  Farbtabelle des Styleguides) für Fehlerhinweise, dokumentiert in
  `designsystem.md`.
- Falsch war die Entscheidung, wenn FOERBICO ein neues Branding beschließt.
  Dann ändern sich Werte in `app.css` und diese ADR wird ersetzt — die
  Komponenten kennen nur Token.
