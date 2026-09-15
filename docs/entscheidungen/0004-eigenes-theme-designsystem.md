# ADR-0004: Eigenes Theme nach dem Designsystem FOERBICO × rpi-virtuell

**Status:** angenommen (2026-09-01) · Designsystem ersetzt durch ADR-0031 (FOERBICO, 2026-09-14); der Grundsatz „eigenes Theme, keine Bibliothek“ gilt weiter
**Beteiligte:** Jörg

## Entscheidung

Wir bauen ein eigenes Theme nach `docs/designsystem.md` — nicht das
`rpi`-Theme der edufeed-app und kein WordPress-Stylesheet zur Laufzeit.
Werte werden kopiert, nie verlinkt.

## Begründung

Spec „Die vier Entscheidungen", Abschnitt 4: Das rpi-Theme gehört zu
rpi-virtuell und weicht von relilab spürbar ab; ein zur Laufzeit
geladenes WordPress-Stylesheet machte WordPress zur Voraussetzung statt
überflüssig.
