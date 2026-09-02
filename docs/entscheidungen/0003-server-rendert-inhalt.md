# ADR-0003: Server rendert Inhalt mit, Client übernimmt danach

**Status:** angenommen (2026-08-31)
**Beteiligte:** Jörg

## Entscheidung

Alle Ansichten liefern fertiges HTML mit Inhalt; im Browser laufen nur
Bedienelemente. Keine Relay-Verbindung im Browser, keine
Live-Aktualisierung. `ssr = false` ist hier nie die Antwort.

## Begründung

Spec „Die vier Entscheidungen", Abschnitt 3: Die Inhalte ändern sich
täglich, nicht sekündlich; eine zweite Datenschicht wäre doppelte
Fehlerquelle ohne Gegenwert. Dass edufeed-app `ssr = false` in 40
Routen stehen hat, ist eine Fehlerbehebung von März 2026, keine
Architekturwahl.
