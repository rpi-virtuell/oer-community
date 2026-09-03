# ADR-0016: Der `naddr` ist Eingabe von aussen, nicht Konfiguration

**Status:** angenommen (2026-09-03)
**Beteiligte:** Jörg

## Kontext

Die Detailansicht nimmt den `naddr` aus der URL. Beim Nachdenken über
eine Portfreigabe auf dem Entwicklungsserver fiel auf: Dieser Wert wurde
behandelt, als käme er von uns — dabei bestimmt ihn, wer die URL aufruft.

Ein `naddr` trägt vier Angaben: `kind`, Autor, `d` und **Relay-Hinweise**.
Alle vier kamen ungeprüft zum Einsatz. Zwei Folgen, am laufenden System
belegt (03.09.2026):

**1. Der Server verbindet sich zu fremden Zielen.** `artikelLaden` fragte
`[...adresse.relays, ...konfig.relays]`. Wer einen `naddr` mit
`wss://127.0.0.1:9999/` oder einer internen Adresse baut, lässt den
Server dorthin verbinden — eine SSRF-Fläche.

**2. Jeder Autor wurde angezeigt.** `QUELLE_AUTOR` steht in der `.env`,
aber der Filter nahm `adresse.author`. Damit war das Schaufenster ein
offener Nostr-Renderer für beliebige Inhalte — und deren Roh-HTML ging
über `{@html}` mit hinaus.

Im FOERBICO-Bestand stehen nur harmlose `<br>`. Aber Events sind
unveränderlich und nicht unser Code (CLAUDE.md), und bei fremden Autoren
ist über den Inhalt nichts bekannt.

## Entscheidung

**Der `naddr` liefert nur, was nachprüfbar ist. Alles andere kommt aus
der Konfiguration.**

| Angabe | Behandlung |
|---|---|
| Autor | **muss** `QUELLE_AUTOR` sein, sonst 404 |
| `kind` | nur `30023`, `31922`, `31923`, sonst 404 |
| `d` | darf nicht leer sein, sonst 404 |
| Relay-Hinweise | **werden ignoriert** — gefragt wird `RELAYS` |

Dazu: **gerendertes HTML wird entschärft**, bevor es über `{@html}`
in die Seite geht. Erlaubt sind Fließtext-Elemente, Listen, Tabellen,
Links; entfernt werden `script`, `iframe`, `object`, `embed`,
Ereignis-Attribute und `javascript:`-Verweise. Verweise nach draussen
bekommen `rel="noopener nofollow"`.

Der Autor wird **vor** dem `kind` geprüft: Die Ablehnung soll nicht
verraten, welche Kinds interessant wären.

## Warum nicht milder

**Relay-Hinweise erlauben, aber auf eine Positivliste beschränken** —
verworfen. Eine Positivliste ist genau die Konfiguration, die schon
existiert (`RELAYS`); die Hinweise brächten dann nichts.

Der Preis: Ein `naddr` mit korrektem Relay-Hinweis, dessen Relay **nicht**
konfiguriert ist, findet den Artikel nicht mehr. Für ein Schaufenster mit
einer bekannten Quelle ist das richtig — es soll die eigene Quelle zeigen,
nicht dem Besucher folgen, wohin er zeigt.

**Eigene Filter statt Bibliothek** — verworfen. Bei Sanitizern sind
Eigenbauten regelmäßig lückenhaft. `sanitize-html` (2.17.7) läuft
serverseitig ohne DOM.

## Konsequenzen

- **Das Schaufenster zeigt eine Quelle**, wie CLAUDE.md es beschreibt.
  Eine zweite Quelle ist eine Konfigurationsänderung, kein Umbau.
- **`img` steht nicht auf der Erlaubnisliste** und muss es nicht:
  Fließtextbilder sind schon vorher entfernt (ADR-0015).
- **Elf neue Tests** decken die Fälle ab: fremder Autor, unerwartetes
  `kind`, leere Kennung, ignorierte Relay-Hinweise, `script`, `iframe`,
  Ereignis-Attribute, `javascript:`-Verweise.
- **Kein Ersatz für TLS und Ratenbegrenzung.** Diese ADR schliesst zwei
  Lücken in der Anwendung. Ohne Verschlüsselung bleibt der Verkehr
  mitlesbar, und gegen viele Anfragen hilft sie nicht — siehe
  `docs/betrieb.md`.
- **Woran wir merken, dass es zu streng war:** Wenn ein berechtigter
  `naddr` scheitert, weil sein Relay nicht in `RELAYS` steht. Die Antwort
  ist dann, das Relay zu konfigurieren — nicht, dem `naddr` zu folgen.

## Geprüft am laufenden System

| Fall | Ergebnis |
|---|---|
| Referenzfall | 200, Bild und Lizenz unverändert |
| fremder Autor (`ffff…`) | 404 „gehört nicht zur Quelle dieses Schaufensters" |
| `naddr` mit `wss://boese.example/` | 404, `boese.example` erscheint nirgends |
| Fehlerseite in Produktion | keine Pfade, keine Stacktraces |
