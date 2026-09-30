# ADR-0038: Fremdbilder mit Quellenzeile werden gezeigt, nicht entfernt

**Status:** angenommen (2026-09-30)
**Beteiligte:** Jörg

Ergänzt ADR-0015 und ADR-0023 für hashlose absolute Bilder. ADR-0030
(abgelöste Hosts) gilt unverändert.

## Kontext

Die Teamseite (`unser-team`, `en/our-team`) zeigt im Hub weder Porträts
noch Institutionslogos: Die Porträts sind relativ adressiert, und für die
Logos gibt es keinen Hash-Pfad. Die Logos gehören den Institutionen. Sie
auf Blossom zu kopieren und mit einem eigenen `kind:1063` zu versehen, hieße,
eine Lizenz zu behaupten, die wir nicht vergeben können. Seriös ist die
Einbettung von der Website der Institution, mit Rechtehinweis und
Quellverweis. Nach ADR-0023 entfernt der Hub aber jedes absolute Bild ohne
Hash. Dasselbe trifft das reliGlobal-Logo im Interview.

## Entscheidung

Wir zeigen ein hashloses Bild als **Fremdbild**, wenn alle drei Bedingungen
zutreffen:

1. Die URL ist absolut und `https`, und der Host ist nicht abgelöst (ADR-0030).
2. Das Bild steht allein auf seiner Zeile.
3. Direkt darunter steht eine Zeile mit mindestens einem Link, dem
   Quellverweis (Zeilenkonvention aus `bildattribution.md`), z. B.
   `© Goethe-Universität Frankfurt, Quelle: [uni-frankfurt.de](https://www.uni-frankfurt.de/)`.

Ohne diese Zeile bleibt es beim Entfernen und Zählen (ADR-0015). Für
Fremdbilder gibt es keinen Lookup, keine Lizenzpille und kein „Lizenz
ungeklärt": Sie behaupten keine offene Lizenz, der Hinweis in der Zeile ist
ihr Nachweis. Dargestellt werden sie klein und nicht auf voller Breite,
weil Logos beim Hochskalieren unscharf würden (`Fremdbild.svelte`).
Relative Bilder bleiben entfernt, auch wenn eine Quellenzeile darunter steht.

## Konsequenzen

- Institutionslogos und ähnliche fremde Marken lassen sich einbinden, ohne
  sie zu kopieren. Die Redaktion schreibt die URL und die Zeile in den
  Markdown des Beitrags (Hugo-Quelle → `sync publish`).
- Ein Fremdbild ist hotlinked: Ändert oder entfernt die Institution die
  Datei, bricht das Bild. Das nehmen wir in Kauf, denn der Rechteinhaber
  behält die Hoheit über seine Marke.
- Der Hub prüft nur, *dass* ein Quellenlink da ist, nicht, *ob* der
  Rechtehinweis stimmt. Das bleibt Redaktionsverantwortung.
- Porträts und eigene Fotos betrifft diese ADR nicht. Sie gehören weiter mit
  `kind:1063` auf Blossom (ADR-0010, ADR-0023).
- Falsch war die Entscheidung, wenn Fremdbilder zum Ausweg für Fotos
  werden, die eigentlich migriert gehören. Dann ist die Ausnahme auf eine
  Hostliste zu verengen.
