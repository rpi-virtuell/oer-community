# ADR-0037: Ein Lauf ohne die bisherigen Artikel-Relays ist ungültig

**Status:** angenommen (2026-09-30)
**Beteiligte:** Jörg

Präzisiert ADR-0028 (Spiegel) und die Regel „Kein Relay erreichbar →
letzter gültiger Stand" aus CLAUDE.md.

## Kontext

Ein Lauf galt als gültig, sobald **irgendein** Relay die Artikelabfrage
beantwortete. Die Relays führen aber verschiedene Bestände (ADR-0013):
`relay-rpi` und `amb-relay` haben keine Artikel. Fiel `relay.edufeed.org`
aus, antworteten die beiden mit „habe nichts", der Lauf galt, und der
Spiegel wurde durch 0 Artikel ersetzt — die Seite war leer statt mit dem
letzten Stand und seinem Alter. Verschärfend zählte `CLOSED` (etwa
`auth-required:`) als Antwort. Im Code-Review vom 30.09. nachgestellt.

Erwogen: ein Lauf mit deutlich weniger Artikeln als zuvor ist ungültig —
verworfen, weil dann eine gewollte Löschung vieler Beiträge den Spiegel
dauerhaft festhielte.

## Entscheidung

Wir werten einen Lauf als ungültig, wenn **alle** Relays nicht erreichbar
waren, die im bisherigen Stand Artikel geliefert haben (`quellen`); nur
noch konfigurierte Relays zählen. Ohne bisherigen Stand gilt die alte Regel.
`CLOSED` gilt als „nicht erreicht", nicht als leere Antwort.

## Konsequenzen

- Fällt das Artikel-Relay aus, bleibt der letzte Stand stehen, die Fußzeile
  nennt sein Alter und das stumme Relay.
- Löschungen und kleinere Bestände wirken weiter sofort, solange das
  Artikel-Relay antwortet.
- Wird ein Relay aus `RELAYS` gestrichen, hält es den alten Stand nicht fest.
- Offen bleibt ein Relay, das antwortet, aber seinen Bestand verloren hat —
  das lässt sich von einer echten Löschung nicht unterscheiden.
