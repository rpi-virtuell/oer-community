# ADR-0030: Bilder von Hosts, die der Hub ablöst, gelten als unaufgelöst

**Status:** angenommen (2026-09-14)
**Beteiligte:** Jörg

Ergänzt ADR-0015 (relative Bilder entfernen) und ADR-0022 (absolute Bilder
ausliefern, Lizenzstand daran).

## Kontext

64 von 87 Artikeln verweisen mit absoluten URLs auf Bilder unter
`oer.community/…`. Nach ADR-0022 würde der Hub sie ausliefern und „Lizenz
ungeklärt" daranschreiben. Sobald der Hub oer.community ist, gibt es diesen
Host mit diesen Pfaden nicht mehr — die Bilder wären kaputt. Drei Wege:
ausliefern wie bisher, die Bilder selbst von der alten Seite holen und
durchreichen, oder sie wie relative Pfade behandeln.

Durchreichen macht Hugo zur Voraussetzung (CLAUDE.md: „Werte kopieren, nie
verlinken"). Ausliefern zeigt ab dem Umschalttag leere Rahmen.

## Entscheidung

`ABGELOESTE_HOSTS` (Standard `oer.community`) nennt die Hosts, die der Hub
ersetzt. Bilder von dort — im Fließtext wie im `image`-Tag — werden
**entfernt und gezählt** wie relative Pfade (ADR-0015). Ein Cover von dort
ist kein Cover. Die Entwickleransicht listet sie; die Zahl ist die
Redaktionsliste, dieselbe wie in `bildmigration.md`.

ADR-0022 gilt weiter für absolute URLs anderer Hosts.

## Konsequenzen

- Solange Hugo noch läuft, zeigt der Hub weniger Bilder als die alte Seite.
  Das ist gewollt: Der Hub zeigt den Stand der Migration, nicht den Stand
  von Hugo.
- Die Bildmigration (17 von 87 am 10.09.) wird auf der Seite sichtbar. Jeder
  migrierte Beitrag bekommt seine Bilder zurück, mit Nachweis.
- Falsch war die Entscheidung, wenn der Umschalttag kommt und die Mehrheit
  der Beiträge ohne Bilder ist. Dann ist die Abhilfe Migration, nicht
  Durchreichen — oder ein bewusster Aufschub des Umschalttags.
