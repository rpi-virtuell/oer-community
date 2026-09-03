# ADR-0013: Bildlizenz über mehrere Relays auflösen; ohne Nachweis kein Bild

**Status:** angenommen (2026-09-03)
**Beteiligte:** Jörg

## Kontext

ADR-0010 verlangt: Zu jedem Bild ist der Lizenznachweis (`kind:1063`,
NIP-94) aufzulösen und sichtbar auszuweisen; ein Bild ohne auflösbaren
Nachweis wird kenntlich gemacht, nicht stillschweigend angezeigt.

Der erste echte Fall hat drei Dinge gezeigt, die die naive Umsetzung
brechen (geprüft am 03.09.2026 am Beitrag `die-kraft-der-gemeinschaft`):

1. **Der Nachweis liegt nicht auf dem Relay des Artikels.** Der
   `kind:1063` steht ausschließlich auf `relay-rpi.edufeed.org`. Auf
   `relay.edufeed.org` und `amb-relay.edufeed.org` ist er nicht — obwohl
   der `naddr` des Artikels genau `relay.edufeed.org` nennt. Ein Lookup
   nur am Artikel-Relay hätte das korrekt attestierte Bild als
   „ohne Nachweis" markiert.
2. **Ohne `x`-Tag ist kein Lookup möglich.** Der Nachweis wird über den
   SHA-256 des Bildes adressiert. 85 der 86 Artikel haben kein `x`-Tag —
   es gibt also keinen Schlüssel, unter dem gesucht werden könnte. Das
   ist kein fehlender Nachweis, sondern eine fehlende Frage.
3. **Aufmacher und Fließtext laufen auseinander.** Im überarbeiteten
   Beitrag zeigt das `image`-Tag auf Blossom, das Markdown aber weiter
   auf `![](nosTr-schrein.jpg)` — relativ, nur im WordPress-Kontext
   auflösbar. Bestandsweit sind 166 von 269 Bildverweisen relativ.

## Entscheidung

**1. Der Lizenz-Lookup fragt alle konfigurierten Relays, nicht das
Artikel-Relay.**

```json
{ "kinds": [1063], "#x": ["<sha256-hex>"] }
```

Über die Relay-Liste aus der Konfiguration, Treffer zusammengeführt. Bei
mehreren Treffern gewinnt das neueste `created_at`, Gleichstand nach
`id` (wie ADR-0010). Ein Relay, das nicht antwortet, macht den Nachweis
nicht ungültig — es fehlt nur eine Quelle.

**2. Kein auflösbarer Nachweis → das Bild wird nicht ausgeliefert.**

Statt des Bildes steht eine Textkarte bzw. ein Platzhalter mit klarer
Begründung. Der Artikel selbst erscheint vollständig — nur ohne Bild.

Das ist strenger als ADR-0010 („kenntlich machen"). Begründung: Ein
kenntlich gemachtes, aber ausgeliefertes Bild ist urheberrechtlich
weiterhin eine Veröffentlichung. Der Hinweis schützt den Betrachter,
nicht den Betreiber. Bei 85 von 86 Artikeln ohne Nachweis wäre die
mildere Variante zudem faktisch der Normalfall — und ein Hinweis, der
überall steht, wird nicht gelesen.

**3. Pflichtangaben sind `license` und `credit`.**

Ein `kind:1063` ohne beide gilt als **nicht** aufgelöst. NIP-94 kennt
die Felder nicht; sie sind edufeed-Konvention (ADR-0010) und hier
Bedingung.

**4. Der Hash wird gegen das Bild geprüft, wo es ohne Mehrkosten geht.**

Der `x`-Wert muss zum ausgelieferten Bild passen, sonst attestiert der
Nachweis eine andere Datei. Blossom liefert den Hash als `etag` — die
Prüfung kostet dort keinen Download. Ein `etag`, der dem `x` widerspricht,
gilt als nicht aufgelöst.

**5. Relative Bildpfade im Markdown werden nicht aufgelöst.**

Ein relativer Verweis wie `nosTr-schrein.jpg` würde gegen
`oer.community/<d>/` auflösen — also gegen WordPress. Das machen wir
nicht: Es hätte WordPress zur Voraussetzung, statt es abzulösen
(CLAUDE.md, „Werte kopieren, nie verlinken"), und das Ziel hat ohnehin
keinen Nachweis. Relative Verweise werden **entfernt und gezählt**; die
Zahl ist die Redaktions-Aufgabenliste.

## Die Auflösungskette

Pro Bildverweis, in dieser Reihenfolge:

| Schritt | Prüfung | Wenn nein |
|---|---|---|
| 1 | Verweis absolut (`http(s)`)? | relativ → entfernen, zählen |
| 2 | `x`-Tag zum Bild vorhanden? | kein Lookup möglich → kein Bild |
| 3 | `kind:1063` mit diesem `#x` auf **einem** Relay? | kein Bild |
| 4 | `license` **und** `credit` gesetzt? | kein Bild |
| 5 | Hash stimmt (Blossom-`etag`)? | kein Bild |
| ✓ | Bild anzeigen **mit** Lizenzzeile | |

Nur Schritt ✓ liefert ein Bild aus. Jeder Abbruch nennt in der
Entwicklungsansicht seinen Grund — damit die Redaktion weiß, was fehlt,
statt zu raten.

## Was angezeigt wird

Bei Erfolg: das Bild, darunter Urheber und Lizenz, die Lizenz als Link
auf die `license`-URL. Für den geprüften Fall:

> nosTr-schrein — Comenius-Institut, [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)

`title` aus dem `kind:1063` dient als Bildunterschrift, `credit` als
Urhebernennung, `license` als Lizenzverweis. Fehlt `title`, entfällt die
Unterschrift; `credit` und `license` sind Pflicht (Punkt 3).

## Konsequenzen

- **Der Startbestand ist bildarm.** Ein Artikel mit Bild, 85 ohne. Das
  ist gewollt und sichtbar: Der Hub zeigt damit den Stand der
  redaktionellen Überarbeitung, statt ihn zu verdecken.
- **Der Lizenz-Lookup braucht einen Cache.** 269 Bildverweise ergäben
  ohne Cache 269 Relay-Abfragen pro Durchlauf. Der Nachweis ist über den
  Hash adressiert und damit unveränderlich cachebar — anders als der
  Artikelbestand, der sich ändert. Ein negativer Treffer („zu diesem
  Hash gibt es nichts") wird **kürzer** vorgehalten als ein positiver,
  weil ein Nachweis nachträglich publiziert werden kann.
- **Es braucht ein Prüfwerkzeug für die Redaktion.** Ein Beitrag muss
  vor dem Einstellen gegen diese Kette geprüft werden können, ohne den
  Client zu starten — sonst merkt man den Fehler erst an der leeren
  Bildstelle. Kommt als Skript, nicht als Oberfläche (der Client bleibt
  lesend, ADR-0010).
- **`ox` wird nicht ausgewertet.** NIP-94 kennt einen Original-Hash für
  transformierte Dateien. Blossom transformiert nicht; solange das gilt,
  reicht `x`.
- **Woran wir merken, dass Punkt 2 zu streng war:** Wenn Bilder mit
  gültigem `kind:1063` allein deshalb nicht erscheinen, weil das
  `x`-Tag am Artikel fehlt, wäre ein Rückwärts-Lookup zu erwägen
  (Bild laden, hashen, suchen). Das kostet einen Download pro Bild und
  wird erst gebaut, wenn der Fall real auftritt — beim einen
  Blossom-Bild ohne `x` (`4g2mkzxv`) existiert auch kein Nachweis, der
  Aufwand hätte dort also nichts gebracht.

## Geprüfter Referenzfall

Beitrag `die-kraft-der-gemeinschaft`, `naddr1qvzqqqr4gupzqksjks0…`:

| Feld | Wert |
|---|---|
| `image` | `https://blossom.edufeed.org/a2a54ea5….jpeg` |
| `x` | `a2a54ea54f386ba0abceb4d28498c4c5c0b66da153bdec04c36bf40a6c32bf5b` |
| Nachweis | `kind:1063` `ebbbb1dc…`, nur auf `relay-rpi.edufeed.org` |
| `license` | `https://creativecommons.org/publicdomain/zero/1.0/` |
| `credit` | `Comenius-Institut` |
| `title` | `nosTr-schrein` |
| Hash geprüft | ✓ SHA-256 des Bildes = `x` = Blossom-`etag` |
| Maße | 1500×1500, 146 385 Bytes (= `size`-Tag) |

Dieser Fall ist die Vorlage: Er ist der einzige, der die ganze Kette
durchläuft, und dient als Testdatensatz für die Umsetzung.
