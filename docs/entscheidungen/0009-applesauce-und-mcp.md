# ADR-0009: Applesauce für alle Nostr-Operationen, MCP-Server als Entwicklungsquelle

**Status:** angenommen (2026-09-02) · ersetzt ADR-0002
**Beteiligte:** Jörg

## Kontext

ADR-0002 legte fest, dass die Nostr-Schicht isoliert in `src/lib/nostr/`
liegt und die Bezeichner der edufeed-app trägt, damit später ein
gemeinsames Paket entsteht. Die Prüfung ergab: edufeed-app hat **kein**
`src/lib/nostr/` — die Schicht verteilt sich dort auf
`loaders/`, `models/`, `services/`, `stores/`. Der Sammelpfad war eine
relilab-client-Eigenheit ohne Gegenstück.

In der Besprechung wurde der „feste Kern / nachnutzbare Komponenten"
verworfen. Kompatibilität entsteht stattdessen über **Protokoll und
Werkzeuge**.

## Entscheidung

- **Applesauce für alle Nostr-Operationen** — nicht `nostr-tools` für
  Relay-Kommunikation (dessen `SimplePool` serialisiert fehlerhaft;
  dokumentiert in der edufeed-app-CLAUDE.md).
- **Bei der Entwicklung verbindlich zu nutzen:**
  `https://mcp.applesauce.build/mcp` (API-Recherche vor dem Schreiben
  von Loader-/Model-Code) und **nostrbook.dev** für Kind- und
  NIP-Details.
- Ein isolierter `src/lib/nostr/`-Sammelpfad ist **nicht** vorgeschrieben;
  die Struktur folgt der edufeed-app (`loaders/`, `models/`, `services/`,
  `stores/`), damit Muster wandern können.

## Relevante NIPs

- Kalender NIP-52 · Long-form NIP-23 · AMB (`kind:30142`)

## Konsequenzen

- Die CLAUDE.md-Regel „Nichts unter `src/lib/nostr/` importiert eine
  Komponente oder eine Route" entfällt in dieser Form. Die dahinterliegende
  Absicht — Datenschicht kennt keine Oberfläche — bleibt gültig und gilt
  für `loaders/`, `models/`, `services/`.
- Die einseitige Übernahme von Bezeichnern muss nicht mehr abgesprochen
  werden; die Absprache verlagert sich auf den Zeitpunkt, an dem ein
  gemeinsames Paket real wird.
