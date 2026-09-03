# ADR-0014: Architekturregeln werden automatisch geprüft, nicht nur aufgeschrieben

**Status:** angenommen (2026-09-03)
**Beteiligte:** Jörg

## Kontext

CLAUDE.md nennt eine Regel ausdrücklich als die, „die am leichtesten
erodiert": Die Datenschicht kennt die Oberfläche nicht. Die Begründung
dort ist präzise — „die Grenze bricht beim ersten *nur schnell hier
importieren*". Eine Regel, die genau in dem Moment bricht, in dem
niemand hinschaut, ist als Prosa am falschen Ort.

Dasselbe gilt für zwei weitere Festlegungen: Relay-Kommunikation läuft
nie über `nostr-tools` (ADR-0009, wegen fehlerhafter Serialisierung in
`SimplePool`), und `ssr = false` ist hier nie die Antwort (ADR-0003).
Beide sind heute erfüllt — `ssr = false` kommt im ganzen Projekt nicht
vor. Erfüllt zu sein ist aber kein Zustand, sondern ein Zufall, solange
ihn nichts hält.

Drei Regeln, die alle dieselbe Eigenschaft haben: Sie sind mit einem
Textvergleich über den Quellbaum entscheidbar. Kein Urteil, kein
Ermessen — Treffer oder kein Treffer.

## Entscheidung

**Wir prüfen diese drei Regeln als Test, nicht als Vorsatz.**

Die Prüfung liegt in `src/lib/architektur.test.js` und läuft in
`pnpm test` mit. Sie liest den Quellbaum als Text und bricht bei
Verstoß mit einer Meldung ab, die Datei, Zeile und die verletzte ADR
nennt.

Geprüft wird:

| Regel | Herkunft | Prüfung |
|---|---|---|
| `src/lib/**` importiert nichts aus `routes/` oder `components/` | CLAUDE.md | Import-Ziele je Datei unter `src/lib/` |
| Relay-Kommunikation nicht über `nostr-tools` | ADR-0009 | `nostr-tools`-Importe nur für `nip19`/Signaturprüfung |
| Kein `ssr = false` | ADR-0003 | Zuweisung in `+*.js`/`+*.svelte` |

**Was nicht geprüft wird, bleibt Prosa.** „Nie eine leere Liste ohne
Erklärung" oder „Werte kopieren, nie verlinken" sind Urteilsfragen; ein
Textvergleich würde sie nur scheinbar sichern. Diese ADR erweitert die
Prüfung nicht auf alles, was in CLAUDE.md steht — sie nimmt die drei
Regeln, die mechanisch entscheidbar sind.

## Konsequenzen

- **Leichter:** Ein Verstoß fällt beim Testlauf auf, nicht beim
  Code-Review oder gar nicht. Die Meldung nennt die ADR, also auch das
  Warum — wer die Regel nicht kennt, findet sie.
- **Schwerer:** Eine bewusste Ausnahme kostet jetzt einen Schritt. Das
  ist gewollt: Wer die Schichtgrenze durchbrechen will, soll dabei die
  ADR anfassen müssen, nicht nur die Importzeile.
- **Der Test kennt keine Absicht.** Er sieht Importpfade, keine
  Architektur. Eine Umgehung über Umwege (dynamischer Import,
  Alias-Pfad) fängt er nicht. Er sichert gegen Erosion durch
  Bequemlichkeit, nicht gegen Entschlossenheit — und mehr soll er nicht.
- **Woran wir merken, dass sie falsch war:** Wenn der Test bei
  legitimer Arbeit im Weg steht und die Reaktion regelmäßig lautet,
  die Prüfung zu lockern statt den Code zu ändern, dann prüft er die
  falsche Regel. Dann ist die betroffene Regel als ADR zu revidieren —
  nicht der Test stillzulegen.
- **Erweiterung ist erwartbar, nicht automatisch.** Kommt eine neue
  mechanisch prüfbare Regel dazu, gehört ihre Prüfung in dieselbe
  Datei. Eine ADR braucht das nicht erneut; diese hier deckt das Muster.
