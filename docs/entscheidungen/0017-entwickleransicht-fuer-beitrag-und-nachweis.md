# ADR-0017: Die Entwickleransicht zeigt Beitrag und Lizenznachweis nebeneinander

**Status:** angenommen (2026-09-03)
**Beteiligte:** Jörg

## Kontext

Der Lizenznachweis steht **nicht im Beitrag**. Der `kind:30023` trägt nur
einen Hash im `x`-Tag — die Behauptung, es gebe irgendwo einen Nachweis.
Der `kind:1063` ist ein eigenes, eigenständig signiertes Event mit eigenem
Lebenszyklus: Er kann später entstehen, korrigiert werden (neuestes
`created_at` gewinnt), fehlen — und er liegt auf einem anderen Relay
(ADR-0013).

Bleibt ein Bild aus, zeigte die Artikelseite bisher nur das Ergebnis
(„Grund: kein-nachweis"). Die Frage *warum* — falscher Hash am Artikel?
Nachweis auf einem Relay, das gerade schwieg? `credit` leer? — war ohne die
Rohdaten beider Events nicht beantwortbar. Die Redaktion braucht diese
Auskunft bei 85 von 86 Artikeln.

Zur Wahl standen: die Rohdaten in die Artikelseite einbetten, eine eigene
Route, oder beides.

## Entscheidung

Wir zeigen die Rohdaten **in der Seite** — ein aufklappbarer Bereich am
Beitragsende, beide Events nebeneinander, mit Relay-Herkunft, der
fünfstufigen Prüfkette aus ADR-0013 und einem Signaturbefund. Dieselben
Daten liegen zusätzlich unter **`/[naddr]/json`** zum Weiterverarbeiten.

**Aufbau und Bedienung folgen der edufeed-app** (`EventDebugInfo.svelte`):
Chevron, Marke „Aktiv" beim Aufklappen, Abschnitte mit Kachelraster (Label
links, Wert rechts), Kopierknöpfe an Einzelwerten, Rohobjekt in einem
Block mit „kopieren" und „ausklappen". Muster sollen wandern können
(ADR-0009). **Farben und Abstände aber aus `docs/designsystem.md`**, nicht
die DaisyUI-Token von edufeed: dort sind die Kontrastwerte geprüft, und der
Hub soll wie relilab.org aussehen. Die Marke „Aktiv" ist darum neutral
getönt — bei `.78rem` erfüllt nur diese Variante die Anforderung (5,40:1).

**Der Schalter liegt in der Fußzeile**, nicht auf einer Einstellungsseite:
Eine solche wäre Verwaltung und damit außerhalb des Zuschnitts. Mechanik
wie bei edufeed (`appSettings.debugMode`): Rune plus `localStorage`, hier
unter `community-hub-einstellungen`. Ohne Schalter erscheint der Bereich
nicht.

Vier Festlegungen dazu:

1. **Die Prüfkette wird nicht neu implementiert.** Sie wird aus
   `lizenzPruefen` abgeleitet: dessen `grund` sagt, welcher Schritt kippte,
   alle davor gelten als bestanden, alle danach als ungeprüft. Zwei
   Implementierungen derselben Regel würden auseinanderlaufen — und die
   Diagnose würde dann etwas anderes behaupten als die Anzeige.
2. **Dieselben Wächter wie die Artikelseite.** Adressprüfung gegen die eigene
   Quelle und das Ignorieren der Relay-Hinweise aus dem `naddr` (ADR-0016)
   liegen in `loaders/beitrag.js`, den beide Routen nutzen. Sonst wäre die
   JSON-Route der Umweg, sobald ein Wächter in einer Kopie fehlt.
3. **`ungeprüft` ist nicht `gescheitert`.** Ein Schritt nach dem Abbruch und
   Schritt 5 ohne `etag` werden als *nicht geprüft* ausgewiesen (`ok: null`),
   nicht als bestanden und nicht als gescheitert.
4. **Der Befund kommt vom Server, immer mit.** Der Schalter liegt im
   Browser, der Server weiß also nicht, ob er gebraucht wird.
   Nachzuladen bräuchte eine zweite Datenschicht im Browser — genau das,
   was CLAUDE.md ausschließt. Der Bereich ist damit auch ohne
   JavaScript im Dokument, sobald der Modus an ist.

## Konsequenzen

- **Leichter:** Ein ausbleibendes Bild ist in einem Aufruf erklärt, statt
  über Relay-Abfragen von Hand rekonstruiert zu werden. Die drei Hashes
  (Artikel, Nachweis, ausgeliefertes Bild) stehen zum Vergleich nebeneinander.
- **Schwerer:** Der Befund wird bei jedem Seitenaufruf mitgeliefert, auch
  wenn niemand ihn aufklappt — beim Referenzfall etwa 8 KB. Die JSON-Route
  löst zusätzlich eine zweite Abfragerunde aus und ist bewusst `no-store`.
  Mit dem Cache (STATUS.md) entfällt letzteres.
- **Ein Bedienelement für Entwickler steht auf einer Leseseite.** Der
  Schalter in der Fußzeile ist die bewusste Ausnahme von „Was es nicht gibt,
  wird auch nicht angedeutet" — er *gibt* es, und er ist die einzige Stelle,
  an der man ihn ohne Einstellungsseite unterbringt.
- **Roh-HTML geht ungesäubert hinaus** — als JSON, nie als HTML. Festgehalten
  durch `content-type: application/json` und `X-Content-Type-Options:
  nosniff`. Ohne `nosniff` könnte ein Browser den Inhalt als HTML deuten und
  das Event würde zum Skriptträger.
- **Woran wir merken, dass sie falsch war:** wenn die Ansicht bei einem echten
  Fehlerfall stumm bleibt oder etwas anderes behauptet als die Artikelseite.
  Dann ist die Ableitung aus `lizenzPruefen` gebrochen — und der Fehler liegt
  nicht in der Ansicht, sondern in der doppelten Wahrheit.

## Vier Funde bei der Umsetzung

**`verifyEvent` allein prüft die Signatur nicht gegen den Inhalt.** Es prüft
`sig` gegen `id`. Wer `content` oder `tags` verändert und `id` und `sig`
unangetastet lässt, kommt durch — am Referenzfall belegt: `verifyEvent`
meldet `true` für ein Event mit angefasstem `content`. Erst der Vergleich mit
`getEventHash` bindet die Signatur an den Inhalt. Beides wird geprüft, ein
Test hält den Fund fest.

**Die Relay-Trennung ist keine disjunkte Menge.** Am 03.09.2026 am laufenden
System beobachtet: Der Referenzartikel liegt inzwischen auf *beiden* Relays,
sein Nachweis nur auf `relay-rpi`. Die Frage „liegt der Nachweis auf keinem
der Artikel-Relays" ist damit falsch, obwohl die Aussage von ADR-0013 gilt.
Entscheidend ist die andere Richtung: Gibt es ein Relay, das den Artikel hat
und den Nachweis nicht? Für den Referenzfall ist das `relay.edufeed.org`.
Fand **gar keine** Abfrage statt (kein `x`-Tag), bleibt diese Liste leer —
ein nie gefragtes Relay „hat den Nachweis nicht" nicht.

**Events vom Relay tragen Symbol-Schlüssel.** SvelteKit serialisiert alles
aus `load` und bricht daran ab — am laufenden System als HTTP 500 belegt.
Der Befund gibt darum reine Datenobjekte mit den NIP-01-Feldern heraus.
Bemerkenswert: `JSON.stringify` verschluckt Symbole stumm, die JSON-Route
allein hätte den Fehler also nie gezeigt.

**Komponenten sind jetzt prüfbar.** `vitest.config.js` lädt das
Svelte-Plugin; Tests rendern mit `svelte/server`, also in derselben
Darstellung, die der Server ausliefert (ADR-0003). Ohne das ließe sich an
der Debug-Ansicht nur der Befund prüfen, nicht ihre Ausgabe.

## Offen: Was folgt aus einer ungültigen Signatur?

Die Ansicht **weist den Signaturbefund aus, zieht aber keine Konsequenz.**
Ein Event mit ungültiger Signatur wird heute normal angezeigt.

Das ist bewusst offen gelassen und braucht eine eigene Entscheidung: 404,
Anzeige mit Warnung, oder Anzeige ohne Bild wie bei fehlendem Nachweis? Die
Frage hat Gewicht, weil ein Beitrag mit gebrochener Signatur nicht belegbar
von der Quelle stammt, auf die sich ADR-0016 stützt. Bis dahin ist der
Befund Diagnose, keine Zusicherung.
