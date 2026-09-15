# ADR-0011: Das Projekt heißt community-hub, nicht relilab-client

**Status:** angenommen (2026-09-03) · Name seit 2026-09-15 `oer-community` (Besprechung, ADR-0034); der Grundsatz „eigener Name, nicht relilab" gilt weiter
**Beteiligte:** Jörg

## Kontext

Das Repository hieß `relilab-client` — ein Name aus der Zeit, in der das
Vorhaben genau eine Aufgabe hatte: die konvertierten relilab-Inhalte
lesend anzeigen. Mit ADR-0007 ist die dahinterliegende Frage anders
entschieden worden: Das Schaufenster ist **der Keim des Community Hubs**,
nicht nur ein Schaufenster für relilab.

Damit trug der Name eine Einschränkung, die inhaltlich nicht mehr gilt.
Ein Name, der einen einzelnen Mandanten nennt, macht jede spätere zweite
Community zur Ausnahme vom Namen — im Repository, in Pfaden, in Gesprächen.

## Entscheidung

Wir benennen das Projekt in **`community-hub`** um: Repository,
Verzeichnis, Dokumenttitel und der Dateiname der Spec.

**relilab bleibt überall dort stehen, wo es nicht der Projektname ist** —
als Mandant, Marke, Domain oder Historie:

| bleibt | warum |
|---|---|
| `relilab.org`, `dev.relilab.org`, `relay.relilab.org` | echte Adressen |
| relilab-Community (`h`-Tag), relilab-Inhalte | der Mandant, dessen Events gelesen werden |
| `--relilab`, `--relilab-tief` im Designsystem | so heißt die Farbe in der Farbkarte von rpi-virtuell (ADR-0004); Umbenennen kappt die Rückverfolgbarkeit zur Quelle |
| `mockup/index.html` | Markeninhalt und Farbtoken, kein Projektname |

Die **Umbenennung ist rein namentlich.** relilab bleibt der erste und
derzeit einzige Mandant; der Zuschnitt aus CLAUDE.md gilt unverändert.
Ein Mehrmandantenbetrieb ist damit *nicht* beschlossen — er wäre eine
eigene ADR.

## Angenommene ADRs bleiben, wie sie sind

ADR-0001, -0002, -0006, -0009 und -0010 sprechen von `relilab-client`.
Das bleibt so: Angenommene ADRs werden nicht umgeschrieben, sondern
ersetzt (Vorlage). Sie geben wieder, was damals beschlossen wurde — und
damals hieß das Projekt so. **Wer dort `relilab-client` liest, meint
`community-hub`.**

## Konsequenzen

- **Das Remote muss in Gitea umbenannt werden.** Die lokale URL zeigt
  bereits auf `…/Comenius-Institut/community-hub.git`; bis zur
  Umbenennung in Gitea schlägt `git push` fehl.
- **Der Paketname des künftigen SvelteKit-Projekts ist `community-hub`.**
  Das Gerüst existiert noch nicht (STATUS.md), die Umbenennung kommt
  also vor dem Code — der günstigste Zeitpunkt.
- **Die Domains sind davon unberührt.** `dev.relilab.org` und
  `int.relilab.org` bleiben die Umgebungen (ADR-0008). Der Projektname
  ist nicht die Adresse, unter der eine Instanz läuft.
- **Woran wir merken, dass es falsch war:** Wenn „community-hub" im
  Gespräch regelmäßig eine Rückfrage auslöst, welcher Hub gemeint ist,
  ist der Name zu allgemein — dann braucht er einen unterscheidenden
  Zusatz. Ein Repository umzubenennen ist billig; das haben wir hier
  gerade gezeigt.
