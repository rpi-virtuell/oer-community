# ADR-0015: Bilder im Fließtext werden ausnahmslos entfernt

**Status:** angenommen (2026-09-03) · eingeschränkt durch ADR-0023 (2026-09-07): Bilder mit Hash-URL werden aufgelöst, nur die übrigen entfernt
**Beteiligte:** Jörg

## Kontext

ADR-0013 legt die Auflösungskette für Bildlizenzen fest. Ihr Schritt 1
prüft, ob ein Bildverweis absolut ist — ein **relativer** Pfad wird
entfernt, ein **absoluter** durchgelassen und weiter geprüft.

Am fertigen Durchstich fiel auf: Für Bilder im Markdown-Fließtext geht
diese Prüfung ins Leere. Der Nachweis wird über den SHA-256 aus dem
`x`-Tag des Artikels gefunden, und dieses Tag beschreibt **nur das
Aufmacherbild**. Zu einem Bild im Fließtext existiert kein Hash — also
keine Frage, die man an ein Relay stellen könnte.

Ein absoluter Verweis im Text durchlief Schritt 1 und wurde
ausgeliefert, ohne dass Schritt 2 bis 5 je erreichbar waren.

**Am laufenden System belegt** (03.09.2026): Der Artikel
`just-calling-it-open-is-not-enough` lieferte drei Bilder von
`open-educational-resources.de` aus — während unmittelbar daneben der
Hinweis stand, das Aufmacherbild werde wegen fehlenden Nachweises
*nicht* angezeigt.

## Umfang im Bestand

| | |
|---|---|
| Artikel mit absoluten Bildern im Fließtext | **10** von 86 |
| solche Bildverweise | **25** |

Nach Host: `oer.community` 11 · `pad.gwdg.de` 4 ·
`open-educational-resources.de` 3 · `cdn.midjourney.com` 2 ·
`religlobal.org` 2 · `uni-muenster.de`, `upload.wikimedia.org`,
`campus-innovation.de` je 1.

`cdn.midjourney.com` und `upload.wikimedia.org` sind hier die
deutlichsten Fälle: KI-generierte Bilder und Wikimedia-Inhalte haben
Lizenzbedingungen, die sich nicht aus der URL ergeben.

## Entscheidung

**Bilder im Fließtext werden entfernt — relative wie absolute.**

Die Unterscheidung aus ADR-0013 Schritt 1 entfällt für Fließtextbilder.
Sie war eine Annahme über die *Erreichbarkeit* der Datei, aber die Frage
ist die *Attestierung*, und die ist ohne Hash nie beantwortbar.

Das Aufmacherbild bleibt unberührt: Es hat ein `x`-Tag und durchläuft
die Kette aus ADR-0013 vollständig.

Die entfernten Verweise werden gezählt und auf der Seite genannt
(„3 Bildverweise im Text wurden nicht angezeigt"). Die Zahl ist die
Redaktions-Aufgabenliste.

## Warum nicht der weichere Weg

**Rückwärts-Lookup** (Bild laden, hashen, Nachweis suchen) wäre
technisch möglich. Verworfen: Er kostet einen Download pro Bild bei
jedem Aufruf, und im Bestand existiert **kein einziger** `kind:1063`
für ein Fließtextbild — der Aufwand hätte null Treffer.

**Nur bestimmte Hosts erlauben** (etwa `oer.community` als eigene
Quelle) wäre eine Herkunftsvermutung, keine Attestierung. ADR-0013
verlangt `license` und `credit`; eine Domain liefert beides nicht.

## Konsequenzen

- **Zehn Artikel verlieren Bilder im Text.** Sichtbar, mit Zahl —
  nicht stillschweigend.
- **Der Text bleibt vollständig.** Nur das Bild fällt weg, der
  umgebende Absatz nicht.
- **ADR-0013 Schritt 1 gilt weiter für das Aufmacherbild**, wo ein
  relativer Pfad tatsächlich vorkommt (Referenzfall:
  `![](nosTr-schrein.jpg)`).
- **Der Weg zurück ist redaktionell, nicht technisch:** Wird ein Bild
  auf Blossom gelegt und mit `kind:1063` attestiert, kann es als
  Aufmacher erscheinen. Für Bilder *im Text* bräuchte es eine
  Konvention, die Hashes pro Bild am Artikel führt — die gibt es in
  der edufeed-Konvention nicht, und sie zu erfinden wäre eine eigene
  Entscheidung.
- **Woran wir merken, dass es zu streng war:** Wenn Artikel dadurch
  unverständlich werden — etwa eine Bildbeschreibung, die auf ein
  fehlendes Diagramm verweist. Dann ist die Antwort ein redaktionell
  attestiertes Bild, nicht eine Lockerung der Regel.
