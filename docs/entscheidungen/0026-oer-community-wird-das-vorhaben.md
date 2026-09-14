# ADR-0026: oer.community wird das Vorhaben — FOERBICO statt relilab, Termine entfallen

**Status:** angenommen (2026-09-14)
**Beteiligte:** Jörg

Ersetzt ADR-0019 (vorläufige Wortmarke). Ändert den Zuschnitt der Spec vom
31.08.; ADR-0012 (FOERBICO als Datenquelle) bleibt und wird zur Regel statt
zur Ausnahme.

## Kontext

Der Hub wurde als relilab-Schaufenster begonnen und zeigt seit ADR-0012
FOERBICO-Inhalte, weil dort die Migration nach Nostr weiter ist. Am 14.09.
stand die Frage, ob oer.community ohne Hugo allein aus Nostr möglich ist.
Drei Wege: ein Code mit zwei Mandanten per Konfiguration, ein eigenes
Repository für oer.community, oder der Hub wechselt das Vorhaben.

FOERBICO hat keine Termine (0 Events `31922`/`31923`), relilab-Optik und
relilab-Wortmarke beschreiben eine Herkunft, die auf oer.community niemand
sieht, und zwei Mandanten zu pflegen, von denen einer nicht in Betrieb ist,
kostet bei jeder Gestaltungsentscheidung doppelt.

## Entscheidung

Wir richten den community-hub auf **oer.community** aus. Wortmarke, Logo,
Menü und Fußtext kommen aus den Events des FOERBICO-Keys (ADR-0027), die
Gestaltung folgt dem FOERBICO-Styleguide (ADR-0031). **Die Terminansicht
entfällt** aus dem Zuschnitt: Was es nicht gibt, wird nicht angedeutet.

relilab bleibt als **dokumentierte, nicht betriebene Quelle** in CLAUDE.md
(Schlüssel, Doppelfilter-Regel, Säuberungsregeln für Altbestand). Der
Projektname `community-hub` bleibt (ADR-0011); der Mandantenbegriff bleibt
in der Konfiguration, damit ein zweiter Betreiber denselben Code mit
anderen Schlüsseln fahren kann.

## Konsequenzen

- CLAUDE.md ist zu korrigieren: Vorhaben, Zuschnitt (keine Termine), Umgebungstabelle
  (`dev.relilab.org`/`int.relilab.org` sind nicht das Ziel), Sortierregeln
  für Termine entfallen.
- Die relilab-Farbtoken (`--relilab`, `--magenta`, `--verlauf`) verschwinden
  aus `app.css`; `docs/designsystem.md` wird neu geschrieben (ADR-0031).
- Die Termin-Fixtures und -Regeln werden nicht gebaut. Kommt ein Mandant
  mit Terminen, ist das eine neue ADR, keine Wiederbelebung.
- Falsch war die Entscheidung, wenn relilab in absehbarer Zeit ebenfalls
  aus Nostr ausgeliefert werden soll und dann Optik und Termine fehlen.
  Dann ist der Weg: zweiter Mandant per Konfiguration, Farbtoken und
  Wortmarke aus dessen `kind:0` — die Struktur aus ADR-0027 ist dafür
  gebaut.
