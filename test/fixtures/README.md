# Fixtures

Echte Events, abgefragt am **2026-09-03**. Tests laufen gegen ein
Mock-Relay mit diesen Dateien — ohne Netz und ohne Abhängigkeit von der
Publikationstätigkeit anderer (CLAUDE.md).

**Nicht von Hand bearbeiten.** Es sind signierte Events; eine Änderung am
Inhalt macht die Signatur ungültig und damit den Testfall unecht.

| Datei | Inhalt | Quelle |
|---|---|---|
| `artikel-30023-die-kraft-der-gemeinschaft.json` | Referenzfall, 1 Artikel | `relay.edufeed.org` |
| `lizenz-1063-nostr-schrein.json` | Lizenznachweis dazu | **`relay-rpi.edufeed.org`** |
| `foerbico-artikel-30023.json` | Gesamtbestand, 86 Artikel | `relay.edufeed.org` |
| `profil-0-foerbico.json` | Autorenprofil (`display_name: Foerbico`) | `relay.edufeed.org` |

Autor durchweg
`5a12b41ec15b466321e88c371be2dc47d9193f9c8bba4ab09fc50045bd35aedf`
(ADR-0012).

## Warum zwei Relays

Der Lizenznachweis liegt **nur** auf `relay-rpi.edufeed.org`, der Artikel
auf `relay.edufeed.org` — obwohl der `naddr` des Artikels letzteres nennt.
Das Mock-Relay muss diese Trennung nachbilden, sonst testet es einen Fall,
den es in Wirklichkeit nicht gibt (ADR-0013).

## Der Referenzfall

`die-kraft-der-gemeinschaft` ist der einzige Artikel im Bestand, der die
Auflösungskette aus ADR-0013 vollständig durchläuft:

- `image` auf Blossom, `x`-Tag mit dem SHA-256
- `kind:1063` mit `license` (CC0 1.0) und `credit` (Comenius-Institut)
- Hash am 2026-09-03 gegen die Datei geprüft: stimmt (1500×1500, 146 385 B)

Die anderen 85 Artikel decken die Abbruchfälle ab: 78 Fremd-URL ohne
`x`-Tag, 6 ohne Aufmacher, 1 auf Blossom ohne `x`. 52 Artikel enthalten
relative Bildpfade im Markdown.

## Neu abfragen

Die Abfrage ist einfaches NIP-01 über WebSocket:

```json
{ "kinds": [30023], "authors": ["5a12b41e…"] }
{ "kinds": [1063], "#x": ["a2a54ea5…"] }
```

Ein neuer Abruf ersetzt diese Dateien nicht stillschweigend — der Bestand
wächst mit der redaktionellen Überarbeitung, und Tests, die sich daran
festmachen, würden dann unbemerkt etwas anderes prüfen. Beim Aktualisieren
das Datum hier oben mitziehen.
