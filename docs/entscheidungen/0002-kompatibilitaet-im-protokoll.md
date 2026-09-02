# ADR-0002: Kompatibilität liegt im Protokoll, nicht im Code

**Status:** angenommen (2026-08-31)
**Beteiligte:** Jörg — Bezeichner-Angleichung mit dem edufeed-Team ist noch abzusprechen (siehe Konsequenzen)

## Entscheidung

Wir teilen mit edufeed Kinds (30023, 31922/31923, später 30142), Relays
und Tag-Konventionen (`d`, `h`, `t`) — aber keinen Code. Die
Nostr-Schicht liegt isoliert in `src/lib/nostr/` und trägt die
Bezeichner der edufeed-app, damit ein späteres gemeinsames Paket ein
Verschieben ist, kein Umschreiben.

## Begründung

Spec „Die vier Entscheidungen", Abschnitt 2. Daraus folgt die
CLAUDE.md-Regel „Nichts unter `src/lib/nostr/` importiert eine
Komponente oder eine Route".

## Konsequenzen

- Offener Punkt aus der Besprechung vom 02.09.: Die Übernahme der
  edufeed-Bezeichner ist einseitig — mit dem edufeed-Team absprechen,
  bevor das gemeinsame Paket real wird.
- Geprüft am 02.09.2026 gegen die edufeed-app-CLAUDE.md
  (git.edufeed.org, `main`): Dort gibt es **kein** `src/lib/nostr/` —
  deren Nostr-Schicht verteilt sich auf `src/lib/loaders|models|services|stores`
  (Loader/Model-Pattern, Applesauce-first). „Bezeichner von edufeed-app"
  heißt also Funktions- und Konzeptnamen, nicht Pfade; der Sammelpfad
  `src/lib/nostr/` ist eine relilab-client-Eigenheit. Beim Absprechen
  klären, welche Struktur das gemeinsame Paket bekommt.
