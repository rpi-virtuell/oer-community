# ADR-0024: Bei konkurrierenden Nachweisen gilt der eigene Key zuerst, dann der neueste

**Status:** angenommen (2026-09-07), Umsetzung ausstehend
**Beteiligte:** Jörg, Steffen (edufeed, Chat vom 07.09.)

Ergänzt ADR-0013 (Auswahlregel „neuestes `created_at`, Gleichstand kleinste
`id`") um eine Vorrangstufe. Ersetzt nichts.

## Kontext

`kind:1063` ist ein reguläres Event: nicht ersetzbar, nicht löschbar außer
per NIP-09. Zwei Nachweise zum selben Hash koexistieren für immer, und jeder
Key darf zu jedem Blob attestieren. Die Auswahlregel des Hubs (ADR-0013),
edufeeds Anzeige (`useLicenseStatus`) und edufeeds Wiki vom 07.09. sagen
gleich: neuestes `created_at` gewinnt. Damit gewinnt, wer zuletzt publiziert
— auch ein Fremder, der zu unserem Bild eine andere Lizenz behauptet.

Auf die Frage, ob „einfach der Neueste, egal von wem" gewinnt, hat Steffen am
07.09. geantwortet: *„nicht nur der neueste sondern alle, wobei die Lizenz
‚oben' angezeigt würde, die der User selbst angelegt hat."* Das ist die
Perspektive eines Editors mit eingeloggter Nutzerin. Der Hub hat keine — er
ist eine Lese-Seite mit einem Herausgeber.

Im Bestand gibt es heute zu jedem attestierten Bild genau einen Nachweis. Die
Frage ist nicht drängend, aber sie wird es, sobald Redaktions-Keys attestieren
(ADR-0021, Spec 04.09. Teil C) und dasselbe Bild in mehreren Beiträgen
vorkommt.

## Entscheidung

**1. Vorrang für eigene Attestierer.** Unter allen gültigen Kandidaten
(Pflichtfelder nach ADR-0022: `license`, `x`, `url`) gewinnt zuerst ein
Nachweis vom **FOERBICO-Key**, danach einer von einem Mitglied der
**Redaktionsliste** (`kind:30000`, `d=redaktion`, Autor FOERBICO — Spec
04.09., Teil C), danach greift ADR-0013: neuestes `created_at`, Gleichstand
kleinste `id`. Innerhalb einer Stufe gilt ebenfalls ADR-0013.

Das ist Steffens „eigene oben", übersetzt auf einen Herausgeber statt einer
Nutzerin: Was wir selbst attestiert haben, zeigen wir; was andere sagen,
sehen wir uns an.

**2. Kein Ausschluss.** Fremde Nachweise werden nicht verworfen — fehlt ein
eigener, gilt der fremde. Ein Vertrauens*filter* wäre eine andere Entscheidung
(ADR-0022 hat sich für Anzeigen mit Stand entschieden, nicht für Weglassen).

**3. Mehrere Kandidaten sind sichtbar.** Gibt es mehr als einen, steht an
der Figur „n weitere Nachweise" mit Verweis auf die Entwickleransicht; dort
werden alle Kandidaten mit Attestierer, `created_at` und dem Grund der
Reihung gelistet — `auswahlgrund` (ADR-0017) bekommt die neue Stufe.
Steffens „alle anzeigen" landet damit dort, wo es lesbar ist, nicht in der
Bildunterschrift eines Artikels.

**4. Die Redaktionsliste ist Konfiguration, kein Code.** Bis sie existiert,
besteht die Vorrangstufe aus dem FOERBICO-Key allein (`QUELLE_AUTOR`).

## Konsequenzen

- **`nachweisAusEvents` bekommt eine Vorrangliste** (`bevorzugt: string[]`,
  Pubkeys in Rangfolge) und sortiert zweistufig. `lizenzLaden` und
  `lizenzenLaden` reichen sie aus der Konfiguration durch. Die
  Entwickleransicht zeigt die Stufe im `auswahlgrund`. **Noch nicht gebaut**
  — kommt nach dem Regression-Wächter (mdparser-Spec 07.09., Teil 1).
- **Tests:** Fremder neuer vs. eigener alter → eigener gewinnt; zwei eigene →
  neuester; kein eigener → ADR-0013 unverändert; Redaktionsmitglied vor
  Fremdem, nach FOERBICO.
- **Das Wiki und edufeeds Anzeige laufen auseinander.** Das Wiki sagt
  newest-wins, Steffen sagt „alle, eigene oben", der Code macht newest-wins.
  Steffen ist zu bitten, das Wiki zu präzisieren — sonst zitiert der nächste
  Leser die falsche Regel.
- **Woran wir merken, dass es falsch war:** Wenn ein eigener, aber veralteter
  Nachweis eine fremde, richtige Korrektur verdeckt. Dann ist die Korrektur
  unter dem eigenen Key nachzuziehen — der Vorrang ist Verantwortung, nicht
  Bequemlichkeit.
