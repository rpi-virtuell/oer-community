# ADR-0036: Nur Events mit gültiger Signatur kommen in den Spiegel

**Status:** angenommen (2026-09-30)
**Beteiligte:** Jörg

Ergänzt ADR-0017 (Signaturbefund) und ADR-0028 (Spiegel).

## Kontext

Der Spiegel übernahm jedes Event, das ein Relay lieferte. Die Prüfung aus
ADR-0017 — `getEventHash` gegen `id` **und** `verifyEvent` — lief nur in der
Entwickleransicht, also nachdem das Event längst angezeigt wurde. Ein
kompromittiertes oder bösartiges Relay konnte so ein `kind:30023` mit dem
FOERBICO-Schlüssel und beliebigem Inhalt ausliefern, ebenso Menü,
Redaktionskreis, Termine oder Lizenznachweise. Im Code-Review vom 30.09.
mit einem Event mit Null-Signatur nachgestellt.

## Entscheidung

Wir lassen nur Events in den Spiegel, deren `id` zum Inhalt passt und
deren Signatur gültig ist. Die Prüfung steht an **einer** Stelle,
`src/lib/models/signatur.js` (`echtesEvent`); Spiegel und Entwickleransicht
nutzen dieselbe Funktion. Verworfene Events werden je Lauf gezählt
(`stand.verworfen`), nicht still verschluckt.

## Konsequenzen

- Ein Relay kann nichts mehr unterschieben, was die Quelle nicht signiert
  hat. Die Filter `authors` und `#h` sind damit erst belastbar.
- Der Signaturbefund in der Entwickleransicht zeigt für Events aus dem
  Spiegel künftig immer „gültig" — er bleibt als Diagnose für Dateien
  und ältere Stände.
- Kosten: eine Schnorr-Prüfung je Event und Lauf, bei rund hundert Events
  vernachlässigbar.
- `verifyEvent` merkt sich sein Ergebnis am Objekt; geprüft wird deshalb
  eine frische Kopie der NIP-01-Felder.
- Steigt `stand.verworfen` dauerhaft, liefert ein Relay Fälschungen oder
  beschädigte Events — das Relay nennen und bei edufeed melden.
