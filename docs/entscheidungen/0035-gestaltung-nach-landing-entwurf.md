# ADR-0035: Der Hub übernimmt die Gestaltungssprache des FOERBICO-Landing-Entwurfs — mit den Token aus ADR-0031

**Status:** offen (umgesetzt auf `feat/gestaltung`, 2026-09-16; Bestätigung durch die Redaktion steht aus)
**Beteiligte:** Jörg (Vorschlag), Gina und Ludger (zu fragen)

## Kontext

Im FOERBICO-Repository liegt ein Landing-Entwurf
(`docs/foerbico-landing_draft3.html`): klebende, halbtransparente
Navigation, ein dunkelblaues Panel mit feinem Raster und orangem Glow,
ein großer Aufmacher für den neuesten Beitrag, ein dreispaltiges
Kartenraster mit Hover, Versalien-Labels mit weitem Buchstabenabstand,
eine nach Häufigkeit skalierte Themenwolke. Der Hub zeigte bis dahin eine
einspaltige Liste in Lesebreite. Der Entwurf setzt Yanone Kaffeesatz als
Display-Schrift ein, die ADR-0031 zwei Tage zuvor bewusst entfernt hat,
weil der FOERBICO-Styleguide nur Roboto Condensed nennt; er nutzt
außerdem Orange als Textfarbe auf Weiß (2,0:1) und Client-Logik
(Relay-Status, Skeleton, Modal, Live-Filter), die der Hub nach ADR-0028
nicht hat.

## Entscheidung

Wir übernehmen die **Gestaltungssprache** des Entwurfs — Panel, Label,
Display-Überschrift, Aufmacher plus Raster, klebende Kopfzeile,
dreispaltige Fußzeile, Themenwolke — und bauen sie **mit den Token aus
ADR-0031** nach: Roboto Condensed 700 in Versalien statt einer zweiten
Schrift, kein Hex außerhalb `app.css`, keine Google-Schrift, alles reines
CSS ohne Browser-JavaScript. Neu sind ein abgeleiteter Token
`--fb-primaer-tief` (Verlaufsende), `--breite-raster` (1240px) und
`--uebergang` (160 ms). Übersichten und Startseite laufen in der
Rasterbreite (`breit` im Seitendatum), der Beitragstext bleibt in der
Lesebreite. Bewegung nur bei Hover, `prefers-reduced-motion` schaltet sie
ab.

**Nicht übernommen:** Relay-Status-Punkt, Skeleton, Modal, Live-Filter
(Client-Logik, ADR-0028); Luminosity-Blend auf Fotos (verfremdet
lizenzierte Bilder); Eck-Beschriftungen wie „index · 001" (Deutung ohne
Inhalt); die orange Zähler-Zahl (Kontrast). Oranger Text steht nur auf
dem Panel (5,2:1 auf Primärblau, 7,3:1 auf dem tiefen Blau) und nur als
Label.

Was noch fehlt: Die Redaktion bestätigt, dass der Entwurf die Richtung
ist — und entscheidet, ob Yanone Kaffeesatz als Display-Schrift
zurückkommt (dann eine ADR, die ADR-0031 ergänzt, mit lokaler Datei und
OFL-Text).

## Konsequenzen

- `docs/designsystem.md` beschreibt die neuen Bausteine; `test/kontrast.test.js`
  prüft die Panel-Paare, `test/oberflaeche.test.js` Startkopf, Aufmacher,
  Themenwolke und `ohneKopf`, `src/lib/routen/uebersicht.test.js` den
  Breitenschalter.
- Karten ohne Cover (74 von 86 Artikeln, ADR-0030) zeigen ein flaches
  Rasterfeld: das Raster bleibt gleichmäßig, ohne ein Bild zu behaupten.
- Der Startkopf zeigt Titel und Vorspann der Startseite; beginnt deren
  Markdown selbst mit derselben Überschrift, steht sie zweimal — das ist
  Redaktionsarbeit am Event, nicht Code (Events werden nie verändert).
- Falsch war sie, wenn die Redaktion einen anderen Entwurf zur Richtung
  macht: dann fallen Panel, Aufmacher und Raster als Komponenten weg, die
  Token bleiben.
