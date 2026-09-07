# ADR-0022: Bildlizenz wie in der edufeed-app, Bildattribution nach eigener Konvention

**Status:** angenommen (2026-09-07)
**Beteiligte:** Jörg

Ersetzt ADR-0013 in den Punkten 2 und 3 sowie den Abschnitt „Was angezeigt
wird". Die Punkte 1, 4 und 5 von ADR-0013 (Lookup über alle Relays,
Hash-Prüfung gegen den `etag`, keine relativen Pfade) gelten unverändert
weiter.

## Kontext

ADR-0013 hat den Hub strenger gemacht als die edufeed-app: `license` **und**
`credit` sind Pflicht, und ohne auflösbaren Nachweis wird das Bild gar nicht
ausgeliefert. Die edufeed-app verfährt anders — geprüft am 2026-09-07 im
Quelltext (`src/lib/helpers/image-license.js`,
`src/lib/stores/image-license.svelte.js`,
`src/lib/components/shared/ImageLicenseOverlay.svelte`):

- Beim **Schreiben** verlangt `buildLicenseTemplate` beides — ein in der App
  erzeugter Nachweis hat immer `license` und `credit`.
- Beim **Lesen** genügt `license`. Das Badge erscheint bei
  `status === 'found' && label`; `credit` wird angehängt, wenn vorhanden.
- Das Bild wird **immer** angezeigt. Der Lizenzstand steht als Badge daran,
  bei fehlendem Nachweis als Warnhinweis.
- Die Bildunterschrift baut `buildTulluCaption`: `*"Titel" by Credit,
  [CC…](url), source: …*` — inhaltlich TULLU, in der Form aber edufeeds
  eigene Zeile, nicht die FOERBICO-Konvention (`bildattribution.md`).

Seit demselben Tag beschreibt edufeed den Mechanismus selbst — Wiki
`license-events-nope` (kind 30818):
`nostr:naddr1qvzqqqrcvgpzp0wzr7fmrcktw4sgemxh5zsq5auh08vnvlwf0x9anusn7pkft0zgqyv8wumn8ghj7un9d3shjtn9v36kvet9vshx7un89uqpxmrfvdjkuum994jhvetww3ej6mn0wpjswuu6gy`.
Es bestätigt Lookup, newest-wins mit Gleichstand nach kleinster `id` und die
Pflicht-/Optional-Aufteilung. **Es nennt `credit` als Pflicht** — das ist die
Schreibseite. Dass die Anzeige nur `license` verlangt, steht nur im Code.
Diese ADR stützt sich auf das Code-Verhalten; zieht edufeed die Anzeige
nach, läuft der Hub wieder auseinander. Deshalb ist bei edufeed nachzufragen,
ob die Lese-Toleranz Absicht ist und ins Wiki gehört.

Zwei Oberflächen auf denselben Events, die sich unterschiedlich verhalten,
sind für die Redaktion nicht erklärbar: Ein `kind:1063` mit `license`, aber
ohne `credit` ergibt in edufeed ein Badge und im Hub kein Bild. Wer einen
Beitrag in edufeed einstellt und im Hub kontrolliert, sieht zwei
Wahrheiten über dieselbe Datenlage.

## Entscheidung

Wir gleichen den Hub in drei Punkten an die edufeed-app an — und geben der
Bildunterschrift in Punkt 4 bewusst nicht edufeeds Form, sondern die eigene.

**1. `license` ist Pflicht, `credit` nicht.**

Ein `kind:1063` mit `license`, `x` und `url` gilt als aufgelöst. `credit`
wird angezeigt, wenn es da ist, und weggelassen, wenn nicht. Damit ersetzt
diese ADR Punkt 3 von ADR-0013.

**2. Das Bild wird immer ausgeliefert, der Lizenzstand daran ausgewiesen.**

Auch ohne auflösbaren Nachweis erscheint das Bild; daneben steht, was fehlt.
Damit ersetzt diese ADR Punkt 2 von ADR-0013 und kehrt zur milderen Regel
aus ADR-0010 zurück („kenntlich machen").

**Das ist ein bewusster Widerruf, kein Versehen.** ADR-0013 hatte die
Strenge urheberrechtlich begründet: „Ein kenntlich gemachtes, aber
ausgeliefertes Bild ist urheberrechtlich weiterhin eine Veröffentlichung.
Der Hinweis schützt den Betrachter, nicht den Betreiber." Dieses Argument
bleibt richtig. Es wird hier bewusst zurückgestellt, weil beide Oberflächen
dieselben Events zeigen und ein Auseinanderlaufen in der Redaktion mehr
Schaden anrichtet als der Gewinn der strengeren Regel — der Hub zeigt
ohnehin nur, was die edufeed-app bereits veröffentlicht hat.

**Die Konsequenz ist zu tragen:** Bei 85 von 86 Artikeln ohne `x`-Tag ist
das ausgelieferte Bild ohne Nachweis der Normalfall, nicht die Ausnahme.
Wer das nicht will, muss diese ADR ersetzen, nicht den Code umgehen.

**3. Das Lizenz-Label wird lesbar formatiert.**

`https://creativecommons.org/publicdomain/zero/1.0/` erscheint als
„CC0 (Public Domain)", nicht als URL und nicht als das bisherige „Lizenz".
Die Zuordnung folgt `formatLicenseUrl` aus der edufeed-app
(`src/lib/helpers/educational/licenseLabel.js`) — **kopiert, nicht
verlinkt** (CLAUDE.md), damit der Hub nicht von der App abhängt.

**4. Die Bildunterschrift folgt `bildattribution.md`, nicht edufeeds Zeile.**

`[title](sourceUrl), [author](authorUrl), [licence](licenceUrl), modification`
— Reihenfolge normativ, Trenner `, `, keine Wörter wie „von" oder
„Ursprung". Mindestform ist der Lizenz-Link. Das Kürzel (`licence`) wird aus
der URL abgeleitet. Inhaltlich ist das TULLU; die Form ist die dokumentierte
Konvention des Projekts, die auch der `foerbico-editor` schreibt — edufeeds
`buildTulluCaption` ist die Zeile einer fremden App.

**Der Alt-Text kommt aus dem `alt`-Tag des Nachweises**, nicht aus `title`.
Ein Werktitel beschreibt nichts; `bildattribution.md` nennt `alt` faktisch
Pflicht. Rückfall wie Editor und `md2blossom`: `alt` → `title` →
Artikeltitel. `authorUrl` und `modification` werden als Zusatz-Tags gelesen,
wie der Editor sie schreibt.

## Konsequenzen

- **Der Hub wird bildreicher.** Statt eines Bildes im Startbestand
  erscheinen alle, die einen absoluten Verweis haben. Der Stand der
  redaktionellen Überarbeitung ist damit nicht mehr an der Zahl der Bilder
  ablesbar, sondern nur noch an den Lizenzhinweisen daran.
- **Die Auflösungskette bleibt, ihr Ausgang ändert sich.** `lizenzPruefen`
  meldet weiter, welcher Schritt kippte; die Entwickleransicht (ADR-0017)
  zeigt das unverändert. Nur folgt aus einem Abbruch kein Weglassen mehr.
  Schritt 4 fragt jetzt nur noch nach `license`.
- **`credit` bleibt Pflicht für neue Nachweise** — nicht im Hub, aber im
  `foerbico-editor` und in der edufeed-app, die beide beim Schreiben darauf
  bestehen. Der Hub ist lesend; er entscheidet nicht, was publiziert wird.
- **Woran wir merken, dass es falsch war:** Wenn Bilder ohne Nachweis
  ausgeliefert werden, deren Rechtelage tatsächlich strittig ist — dann ist
  ADR-0013 Punkt 2 wiederherzustellen, und zwar durch eine ADR, die diese
  hier ersetzt. Ein Rückbau im Code ohne ADR würde die Divergenz zur
  edufeed-app stillschweigend wieder einführen.
- **edufeed und Hub beschriften dasselbe Bild verschieden.** Gleiche Daten,
  gleiche Lizenzentscheidung, andere Zeile. Das ist gewollt: Die Konvention
  ist die des Projekts, und Editor und `md2blossom` schreiben sie ebenso.
  Sollte edufeed sie übernehmen wollen, ist `buildTulluCaption` die Stelle.
- **Der Referenzfall verliert seine Sonderstellung.** `die-kraft-der-gemeinschaft`
  war der einzige Artikel, der die ganze Kette durchlief und damit als
  einziger ein Bild zeigte. Als Testfall für die vollständige Kette bleibt
  er; als einziger sichtbarer Bildfall nicht.
