# Fixtures

Echte Events, abgefragt am **2026-09-03**, ergänzt am **2026-09-07**.
Tests laufen gegen ein Mock-Relay mit diesen Dateien — ohne Netz und ohne
Abhängigkeit von der Publikationstätigkeit anderer (CLAUDE.md).

**Nicht von Hand bearbeiten.** Es sind signierte Events; eine Änderung am
Inhalt macht die Signatur ungültig und damit den Testfall unecht.

| Datei | Inhalt | Quelle |
|---|---|---|
| `artikel-30023-die-kraft-der-gemeinschaft.json` | Referenzfall, 1 Artikel | `relay.edufeed.org` |
| `lizenz-1063-nostr-schrein.json` | Lizenznachweis dazu | **`relay-rpi.edufeed.org`** |
| `foerbico-artikel-30023.json` | Gesamtbestand, 86 Artikel | `relay.edufeed.org` |
| `profil-0-foerbico.json` | Autorenprofil (`display_name: Foerbico`) | `relay.edufeed.org` |
| `lizenz-1063-caesar-scheibe.json` | Lizenznachweis, **fremder Autor** | `relay-rpi.edufeed.org` |
| `amb-30142-caesar-scheibe.json` | AMB-Metadaten dazu | `relay-rpi.edufeed.org` |
| `artikel-30023-die-kraft-der-gemeinschaft-2026-09-07.json` | Referenzfall nach Weg 2: Blossom-Cover, `x`, Blossom-Bild im Text mit Konventionszeile — trägt noch ein `imeta` (letztes Event damit; `sync` schreibt seit 07.09. nachmittags stattdessen `x` je Bild) | `relay.edufeed.org` |

Die Fassung vom 07.09. (`688aa602…`) ersetzt die vom 03.09. **nicht**: Die
alte hat das Bild im Text noch relativ (`![](nosTr-schrein.jpg)`) und prüft
damit weiter, dass hashlose Bilder entfernt werden (ADR-0015). Die neue prüft
die Auflösung von Fließtextbildern mit Hash-URL (ADR-0023) — Cover und
Textbild sind dort dieselbe Datei, also ein Hash für zwei Verwendungen.

Autor der ersten vier Dateien ist durchweg
`5a12b41ec15b466321e88c371be2dc47d9193f9c8bba4ab09fc50045bd35aedf`
(ADR-0012). **Die beiden Caesar-Dateien nicht** — siehe unten.

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

## Der Fremdfall: Caesar-Scheibe

Abgefragt am **2026-09-07** über den Hash aus der Blossom-URL
`5b8a701b…jpeg`. Er weicht in drei Punkten von allen anderen Fixtures ab —
genau deshalb ist er hier:

- **Anderer Autor.** `4fa5d1c413e2b45e10d40bf3562ab701a5331206e359c90baae0e99bfd6c6e41`
  (ein Personen-Key), nicht FOERBICO. `credit` ist eine natürliche Person
  („Jörg Lohrer"), nicht das Comenius-Institut.
- **Wieder nur auf `relay-rpi`.** Am 2026-09-07 nachgemessen: auf
  `relay-rpi.edufeed.org` beide Events, auf `relay.edufeed.org` und
  `amb-relay.edufeed.org` null Treffer. Dieselbe Relay-Trennung wie beim
  Referenzfall — ein zweiter Beleg für ADR-0013, Punkt 1. (Zusätzlich auch
  auf `relay.damus.io` und `nos.lol` vorhanden.)
- **Mit `kind:30142`.** Der Lizenznachweis hängt an einem AMB-Datensatz
  (`d`-Tag `17xu8qb7`, Arbeitsmaterial, CC0), dessen Vorschaubild das Bild
  ist. Der Referenzfall hat kein 30142.

Der Nachweis selbst ist vollständig und gültig: Signatur ok, `id` gegen den
Inhalt geprüft (ADR-0017), `license` (CC0 1.0) **und** `credit` vorhanden,
Hash am 2026-09-07 gegen die Blossom-Datei geprüft (282 320 B).

**Damit prüfbar:** ein zweiter vollständiger Durchlauf der Kette mit
fremdem Autor und einer natürlichen Person als `credit` — der Referenzfall
allein ließe offen, ob irgendwo auf FOERBICO als Autor geprüft wird. Das
mitgelieferte `kind:30142` deckt zudem den Fall ab, dass am selben Hash
mehr als ein Event hängt (`nachweisAusEvents` muss die Nicht-1063
aussortieren).

## Neu abfragen

Die Abfrage ist einfaches NIP-01 über WebSocket:

```json
{ "kinds": [30023], "authors": ["5a12b41e…"] }
{ "kinds": [1063], "#x": ["a2a54ea5…"] }
{ "#x": ["5b8a701b…"] }
```

Der dritte Filter lässt den `kind` weg — so kam neben dem `1063` auch das
`30142` mit. Der Hash steht in der Blossom-URL (`<server>/<sha256>.<ext>`)
und ist damit ohne Vorwissen ableitbar.

Ein neuer Abruf ersetzt diese Dateien nicht stillschweigend — der Bestand
wächst mit der redaktionellen Überarbeitung, und Tests, die sich daran
festmachen, würden dann unbemerkt etwas anderes prüfen. Beim Aktualisieren
das Datum hier oben mitziehen.
