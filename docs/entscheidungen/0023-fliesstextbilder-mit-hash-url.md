# ADR-0023: Fließtextbilder mit Hash-URL werden aufgelöst wie das Cover

**Status:** angenommen (2026-09-07)
**Beteiligte:** Jörg

Ersetzt ADR-0015 für Bilder, deren URL einen Hash im Pfad trägt. Für alle
anderen Fließtextbilder gilt ADR-0015 unverändert weiter.

## Kontext

ADR-0015 entfernt Bilder im Fließtext ausnahmslos, weil zu ihnen kein Hash
existiert — „keine Frage, die man an ein Relay stellen könnte". Die ADR nennt
selbst den Weg zurück: eine Konvention, die Hashes pro Bild am Artikel führt,
„die gibt es in der edufeed-Konvention nicht, und sie zu erfinden wäre eine
eigene Entscheidung."

Seit dem 03.09. gibt es diese Konvention zweimal, und keine davon haben wir
erfunden:

1. **edufeed liest den Hash aus der Blossom-URL** (`BodyImageLicense.svelte`
   → `getSha256FromURL`). Blossom adressiert Blobs per Hash (BUD-01), der
   Pfad `/<sha256>.<ext>` *ist* der Zeiger. edufeeds Wiki vom 07.09. beruft
   sich darauf.
2. **`sync publish` schreibt je Fließtextbild ein `x`-Tag am Artikel** —
   edufeeds Vorschlag vom 07.09. („die Hashes der Bilder mit einem x-Tag
   kennzeichnen und für jeden Hash ein Lizenz-Event"; zunächst als `imeta`
   gebaut, am selben Tag umgestellt). Der Zeiger steht damit im Event und ist
   relay-indexiert; die Zuordnung zum Bild im Text läuft über den Pfad, bei
   fremden URLs über den `url`-Tag des 1063.

Am 07.09. hat der erste Beitrag mit Blossom-Fließtextbild den Hub erreicht
(`die-kraft-der-gemeinschaft`, Event `688aa602…`). Der Hub entfernte das Bild
und ließ die Konventionszeile darunter als verwaisten Absatz stehen —
„nosTr-schrein, Comenius-Institut, CC0" ohne Bild.

## Entscheidung

**1. Eine Regel für alle Bilder: Hat die URL einen Hash im Pfad, ist das
Bild attestierbar und wird behandelt wie das Cover.** Anzeigen, Nachweis
über `{ kinds: [1063], "#x": [hash] }` suchen, Lizenzstand daran
(ADR-0022). Hat sie keinen — relativ, `cdn.midjourney.com`,
`upload.wikimedia.org` —, gilt ADR-0015: entfernen und zählen. Kein
Rückwärts-Lookup, keine Host-Vermutung; beides bleibt verworfen.

**2. Der Hash kommt aus der URL.** Die `x`-Tags des Artikels sind der
zweite Weg — sie nennen die Menge der Hashes; die Zuordnung zu einem Bild im
Text ergibt sich bei fremden URLs über den `url`-Tag des zugehörigen 1063.
Dieser Weg wird noch nicht gelesen (Erweiterung, wenn der erste fremde
Bibliotheksbeitrag kommt). Bis dahin gilt für Cover und Fließtext dieselbe
Quelle wie in edufeed.

**3. Ein Lookup für alle Hashes.** Cover- und Fließtexthashes werden
dedupliziert und in **einer** Abfrage mit mehreren `#x`-Werten geholt; das
Ergebnis wird nach `x` gruppiert und je Hash durch `lizenzPruefen` geführt
— inklusive Schritt 5 (`etag`). Der Referenzfall zeigt das Cover im Text
noch einmal: ein Hash, ein Nachweis, zwei Verwendungen.

**4. Die Konventionszeile ist Rückfall, nicht Wahrheit.** Die Zeile direkt
unter dem Bild — gleicher Absatz, kein Leerraum, so verlangt es
`bildattribution.md` „damit Parser sich darauf verlassen können" — wird als
Bildunterschrift erkannt. Ist der Nachweis aufgelöst, ersetzt die
1063-Attribution sie; keine Dublette. Ist er nicht aufgelöst, bleibt sie als
Autorenangabe stehen, daneben „Lizenz ungeklärt" mit Grund.

**5. Die Datenschicht liefert Teile, die Seite rendert.** `inhaltAufbereiten`
gibt statt eines HTML-Strings eine Folge von Teilen zurück — HTML-Segmente
und Bild-Teile (`url`, `hash`, `alt`, `unterschrift`). Die Figur baut die
Seite mit denselben Komponenten wie beim Cover (`Bildbereich`,
`Lizenzzeile`). Damit rendert die Datenschicht keine Oberfläche (CLAUDE.md,
ADR-0014), und Cover und Fließtextbild sehen zwangsläufig gleich aus.

## Konsequenzen

- **Die zehn Artikel aus ADR-0015 ändern sich nicht.** Ihre 25 Bilder sind
  hashlos und bleiben entfernt. Es ändert sich nur, was die Redaktion künftig
  über Blossom einstellt — und das ist der Weg, den ADR-0015 als „redaktionell,
  nicht technisch" vorgesehen hat.
- **Ein HEAD je Fließtextbild.** Schritt 5 kostet pro Bild eine Anfrage an
  Blossom. Bei einem Bild egal, bei zwanzig nicht — der Cache aus ADR-0013
  (Konsequenzen) wird dringlicher, nicht neu.
- **Die Entwickleransicht zeigt weiter nur die Cover-Kette.** Eine Liste der
  Fließtextbilder mit ihrer Kette ist der nächste Schritt (ADR-0017 erweitern),
  nicht Teil dieser Entscheidung.
- **Das Markdown darf die Zeile unter dem Bild nicht anders nutzen.** Wer
  direkt unter ein Blossom-Bild ohne Leerzeile einen Absatz schreibt, sieht
  ihn bei aufgelöstem Nachweis nicht. Das ist die Konvention, nicht der Hub.
- **Woran wir merken, dass es falsch war:** Wenn Bilder mit Hash-URL
  ausgeliefert werden, deren Rechtelage strittig ist — dann ist nicht die
  Erkennung falsch, sondern der Nachweis fehlt, und ADR-0022 hat entschieden,
  dass das Bild trotzdem erscheint. Wer das für Fließtextbilder strenger will,
  ersetzt ADR-0022, nicht diese.
