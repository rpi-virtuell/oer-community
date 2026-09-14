# STATUS — Logbuch

Neuester Eintrag oben. Jeder Eintrag beantwortet drei Fragen:
**Was ist passiert? Wo steht das Projekt? Was ist der nächste Schritt?**

Regeln stehen in `../CLAUDE.md`, Begründungen in
`superpowers/specs/2026-08-31-community-hub-schaufenster-design.md`
— hier steht nur der Stand.

---

## 2026-09-14 — Stufe 1 aus der Spec „oer.community aus Nostr": Spiegel, `/[d]`, Blog, Themen

**Passiert:** Spec vom 14.09.
(`docs/superpowers/specs/2026-09-14-oer-community-aus-nostr-design.md`) und
ADR-0026 bis ADR-0031 richten den Hub auf **oer.community** statt relilab
aus; Termine entfallen aus dem Zuschnitt (ADR-0026), Adressen sind `d`
statt `naddr` (ADR-0029). Stufe 1 der Spec ist umgesetzt: `src/lib/
services/spiegel.js` hält Artikel, Seiten und Lizenznachweise im Speicher
und schreibt sie nach jedem gültigen Lauf über alle konfigurierten Relays
atomar nach `SPIEGEL_PFAD`; `hooks.server.js` startet ihn und wartet
höchstens `SPIEGEL_STARTWARTEZEIT_S` Sekunden auf den ersten Lauf. Loader
lesen nur noch aus dem Spiegel; der Architekturtest verbietet
`services/relay.js` außerhalb von `services/spiegel.js` (ADR-0028). Neue
Routen: `/`, `/blog`, `/blog/seite/[n]`, `/themen`, `/themen/[thema]`,
`/themen/[thema]/seite/[n]`, `/[d]`, `/en/[d]`, `/[d]/json`, `/en/[d]/json`;
`/[naddr]` leitet 301 auf `/[d]` weiter. Beiträge mit dem Selbst-Label
`["l","seite","foerbico/typ"]` gelten als Seite und bleiben außerhalb von
Blog und Themen (ADR-0027). Bilder von `ABGELOESTE_HOSTS` (Standard
`oer.community`) gelten wie relative Pfade (ADR-0030). Kopfzeile verlinkt
Blog und Themen; die Fußzeile nennt Stand und Relays, wenn der letzte
Spiegel-Lauf scheiterte. **254 Tests grün, `pnpm check` ohne Befund.**
Die Fix-Welle nach dem Abschluss-Review hat vier Befunde behoben:
prozent-kodierte `d` finden jetzt ihren Beitrag (drei Live-Artikel tragen
`%C3%A4` literal im `d`-Tag), der Themen-Slug ist die Identität eines Themas
statt seines Namens (`Community`/`community` kollidierten), der Spiegel
behält das **neueste** `kind:0` statt des ältesten, und das Docker-Image
bringt `daten/themen.json` mit samt Volume und Spiegel-Variablen.

**Wo steht das Projekt:** Rauchtests vom 14.09. mit den echten Relays: Der
Spiegel lädt 87 Artikel in rund 2 Sekunden, die Standdatei ist etwa
1,2 MB groß. `/blog` zeigt 20 Karten je Seite; ein Cover erscheint nur bei
Artikeln mit auflösbarem Lizenznachweis: 16 Artikel tragen ein `x`-Tag,
15 zeigen ein Cover (bei einem scheitert die Kette). `/` zeigt den Blog mit dem Hinweis auf die fehlende Startseite
(`d = startseite`), weil die noch nicht aus Nostr kommt. `pnpm lint` und
`pnpm test:e2e` existieren weiterhin nicht.

**Live seit 14.09., 19:03 Uhr:** `https://community-hub.rpi-virtuell.net/`
läuft mit Stufe 1 (Pipeline 6). Der Spiegel lädt dort 87 Artikel und 37
Nachweise in 5,9 s von zwei Relays; `/blog`, `/themen`, `/[d]`, `naddr`-Weiterleitung
und die Umlaut-Adresse antworten wie erwartet. Vorher scheiterten die
Pipelines 2 bis 5: Pipeline 2 am Altfehler in `svelte-check`, 3 bis 5 am
Deploy-Skript, weil das Server-Repo auf dem gelöschten Branch
`succesful-deployment` steht und der Deploy-Schlüssel nur das Skript ausführen
darf. Übergangslösung: der Branch existiert wieder und wird mit `main`
mitgeführt (`docs/betrieb.md`). Dauerhaft: Ludger stellt das Server-Repo auf
`main` um.

**Nächster Schritt:** Stufe 2 der Spec planen — Seiten-Darstellung, Menü
und Fußzeile aus `kind:30004`, Wortmarke und Logo aus `kind:0`, Startseite.
Das braucht die mdparser-Punkte 1–4 aus der Spec vom 14.09.
(„Voraussetzungen in Nachbar-Repos"): Selbst-Label für Seiten, `sync
navigation`, `inLanguage` als String. Bis dahin zeigt der Hub live die in
der Spec beschriebenen Rückfälle.

---

## 2026-09-10 — KI-Kennzeichnung aus dem `ai`-Tag (edufeed-Wiki vom 10.09.)

**Passiert:** edufeed hat das Wiki `license-events-nope` um ein `ai`-Tag
erweitert (`generated` | `modified`, Werte nach den EU-AI-Office-Icons,
andere Werte ignorieren, kein Tag = nicht deklariert). **ADR-0025** übernimmt
das: `nachweisAusEvents` liest das Tag als `ki`, `attributionsGlieder` setzt
ein Glied `ki` („KI-generiert" / „KI-verändert") direkt hinter den
Lizenz-Link, `Lizenzzeile.svelte` rendert es als Marke, die Entwickleransicht
nennt `ai=…` in Schritt 4. Redaktionsseite ist das Feld `ai` im
`# bilder`-Block — mdparser/sync, md2blossom und foerbico-editor sind am
selben Tag nachgezogen, `bildattribution.md` und `felder.yaml` erweitert.

**Nebenbefund:** Ginas händisch eingetragener `# bilder`-Block brach den
Hugo-Build (Doppelpunkt mit Leerzeichen in einem unquotierten `alt`).
`bildattribution.md` hat jetzt einen Abschnitt „Stolpersteine beim händischen
Bearbeiten".

**Wo steht das Projekt:** Lesen der Nachweise vollständig nach Wiki-Stand
10.09.; 190 Tests grün. Kein Nachweis im Bestand trägt bisher ein `ai`-Tag —
der erste wird der Canva-Beitrag (Cover KI-generiert), sobald er auf Blossom
migriert ist.

Die edufeed-app hat das Tag am selben Tag umgesetzt; Wortlaut („KI-generiert",
„KI-verändert") und das EU-AI-Office-Icon sind von dort kopiert. Sie stellt
die Marke im Badge vor das Lizenzkürzel, wir hinter den Lizenz-Link (Konvention).

**Nächster Schritt:** ADR-0024 umsetzen (Vorrang eigener Key), weiterhin
offen.

---

## 2026-09-07 — Bildlizenz wie edufeed, Attribution nach Konvention, Vorfall Referenzpost

**Passiert:** Die edufeed-app am Quelltext geprüft (`helpers/image-license.js`,
`stores/image-license.svelte.js`, `components/shared/ImageLicenseOverlay.svelte`,
`helpers/tullu-caption.js`) und den Hub in vier Punkten angeglichen —
**ADR-0022**, ersetzt ADR-0013 in den Punkten 2 und 3.

1. `credit` ist nicht mehr Pflicht, allein `license` zählt.
2. Das Bild wird **immer** ausgeliefert, der Lizenzstand steht daran
   („Lizenz ungeklärt." mit Grund). Rücknahme der urheberrechtlich
   begründeten Strenge — bewusst, siehe ADR.
3. Lizenz-Label lesbar: `CC0 (Public Domain)` statt „Lizenz" (`src/lib/lizenzlabel.js`,
   aus edufeeds `formatLicenseUrl` kopiert, nicht verlinkt).
4. Bildunterschrift nach `bildattribution.md` (`src/lib/attribution.js`):
   `[title](sourceUrl), [author](authorUrl), [licence](licenceUrl),
   modification` — **nicht** edufeeds TULLU-Zeile. Alt-Text aus dem
   `alt`-Tag des Nachweises statt aus `title`. Beides war am Vormittag
   zunächst falsch gebaut (edufeed-Form, `title` als alt) und wurde am
   Nachmittag gegen die Konvention korrigiert.

**Zwei frühere Befunde korrigiert.** `relay-rpi.edufeed.org` ist **nicht**
ausgefallen — es antwortete während der Messung vorübergehend nicht und
liefert seither wieder. Entsprechend liegt auch der Caesar-Nachweis dort
(2 Treffer), nicht nur auf fremden Relays. Die Fixture-README ist berichtigt.

**Neue Fixtures:** `lizenz-1063-caesar-scheibe.json` und
`amb-30142-caesar-scheibe.json` — zweiter vollständiger Kettendurchlauf mit
fremdem Autor; das 30142 am selben `#x` ist das neuere Event und belegt,
dass nicht nur nach `created_at` sortiert wird.

**Stand:** 173 Tests grün, `pnpm check` ohne Befund. Attributionszeile und
Alt-Text sind über `svelte/server` geprüft — derselbe Pfad wie SSR (ADR-0003).

**16:11 Uhr — Durchstich Git → Event → Hub geschlossen.** Referenzpost auf
`feat/md2blossom` umgestellt (`image`/`cover` auf die attestierte Blossom-URL,
`relative: false`, neuer `# bilder`-Block, Fließtextbild als Blossom-URL mit
Konventionszeile). `mdparser` liest den Block, leitet `x` aus der URL ab und
schreibt je Fließtextbild ein weiteres `x` — zunächst als `imeta` gebaut, nach
edufeeds Antwort am Nachmittag („die Hashes der Bilder mit einem x-Tag
kennzeichnen") auf wiederholte `x` umgestellt (57 Tests grün; `publish-single`
nutzt jetzt `validatePost` — vorher lehnte es 74 von 93 Posts wegen `keywords`
ab). Live
publiziert: `30023` `688aa602…` auf `relay-rpi`, `relay.edufeed.org`, `primal`;
`30142` `032ccb05…`. Der Hub zeigt das Cover mit „nosTr-schrein,
Comenius-Institut, CC0 (Public Domain)", Prüfkette 1–5 ✓, alle drei Hashes
gleich. Das 1063 kommt weiterhin **nur** von `relay-rpi`. Aus dem `# bilder`-Block
abgeleitetes 1063 stimmt in allen sieben gemeinsamen Feldern mit dem bestehenden
überein — die Abbildungstabelle der Spec trägt.

**ADR-0023 — Fließtextbilder mit Hash-URL werden aufgelöst.** Der erste
Blossom-Beitrag zeigte die Lücke von ADR-0015 sofort: Bild entfernt,
Konventionszeile darunter als verwaister Absatz. Jetzt: `inhaltAufbereiten`
liefert Teile statt HTML (Segmente + Bild-Teile mit `hash`, `alt`,
`unterschrift`); ein Lookup für alle Hashes eines Beitrags (`lizenzenLaden`,
nach `x` gruppiert), Cover-Hash wiederverwendet; die Seite baut aus
Bild-Teilen dieselbe Figur wie beim Cover. Alt-Text aus dem Markdown hat
Vorrang. Die Konventionszeile ist Rückfall: ersetzt, wenn der Nachweis da ist,
sichtbar mit „Lizenz ungeklärt", wenn nicht. Hashlose Bilder weiter entfernt
(ADR-0015 bleibt dafür). `imeta` wird nicht gelesen — Entscheidung nach
Rückmeldung von edufeed. Fixture `…-2026-09-07.json` aus dem Live-Event; die
JSON-Route meldet `anzeige.fliesstextbilder`. **188 Tests grün, `svelte-check`
ohne Befund.** Live: zwei Figuren auf der Referenzseite, keine Dublette.

**Vorfall 11:36 Uhr — der Referenzbeitrag wurde zurückgesetzt.** Ein
`sync publish`-Lauf hat `die-kraft-der-gemeinschaft` neu geschrieben: `image`
zeigt wieder auf `oer.community/…/nosTr-schrein.jpg`, das `x`-Tag fehlt. Der
Hub zeigt „Lizenz ungeklärt — kein x-Tag". Ursache ist kein Fehler im Hub:
Das Frontmatter in Git steht seit 20. Mai auf dem alten Stand, `sync` kann
kein `x` erzeugen (`events/article.ts` kennt nur `image`), und die gute
Fassung vom 03.09. war außerhalb von Git entstanden. Auf `relay-rpi` liegt
sie noch — das Relay war zur Publikationszeit down (Platte voll, seither
behoben). Der `kind:1063` existiert unverändert; er ist nur nicht mehr
adressierbar. Konsequenz: Spec
`mdparser/docs/superpowers/specs/2026-09-07-regression-waechter-und-blossom-in-git.md`
— Regression-Wächter in `publish`, `x` aus der Blossom-URL, Blossom-URLs in
Git (ersetzt Teil A der Spec vom 04.09.). Entwurf, noch zu lesen.

**Nächster Schritt:** Spec lesen, dann Plan für Wächter + `x`-Ableitung in
`mdparser`. Danach den Referenzpost in Git auf die bekannte Blossom-URL
setzen und publizieren — erst dann zeigt der Hub das Bild wieder, jetzt mit
der neuen Attributionszeile. Die Übersicht fehlt weiterhin; Cache für den
Lizenz-Lookup und Prüfwerkzeug für die Redaktion bleiben offen.

## 2026-09-04 (spät) — Redaktionsregeln, md2blossom, Entwurfs-ADR

**Passiert:** `docs/redaktion-longform.md` angelegt — Regeln für
Beitragsbild, Fließtextbilder, Fließtext und den Workflow Git ↔ edufeed.
Grundlage ist die Lektüre der edufeed-app am 04.09.: Lizenz hängt als
`kind:1063` am SHA-256, Cover trägt `x` am Artikel, Fließtextbilder
werden über den Hash **in der Blossom-URL** nachgeschlagen
(`BodyImageLicense.svelte` → `getSha256FromURL`), der Editor schreibt
beim Einfügen eine TULLU-Zeile in den Markdown. Der Longform-Editor
(`/create/article`) existiert samt Edit über `naddr` — kein eigener
Editor nötig (bestätigt ADR-0010).

**Henne-Ei aufgelöst:** Blossom-URLs sind deterministisch
(`<server>/<sha256>.<ext>`), der Hash ist lokal berechenbar. Deshalb
`Website/scripts/md2blossom.mjs` im FOERBICO-Repo: hasht Bilder im
Post-Verzeichnis, ersetzt relative Pfade durch Blossom-URLs + TULLU,
schreibt unsignierte `30023`/`1063`-Vorlagen und ein AMB-JSON für
`amb-convert`. Lizenzdaten je Bild kommen aus `bilder.yaml` im
Post-Verzeichnis; fehlt ein Eintrag → `TODO:LICENSE`, Exit 2, keine
Erfindung. Gegen den OERcamp-Post getestet (mit Dummy-Bildern).

**ADR-0020 (offen):** Entwürfe als `kind:30024` in der edufeed-app.
Befund: die App hat **keine** Artikel-Entwürfe, nur localStorage für
Wizard und Umfragen. PR-Skizze steht in der ADR; blockiert durch die
Frage an Steffen, ob die Relays 30024 annehmen.

**Korrektur am selben Abend — der Publikationsweg existiert schon.**
`FOERBICO_und_rpi-virtuell/.github/workflows/nostr-sync.yml` ruft bei Push
auf `main` `edufeed-org/mdparser/sync` auf: 30023 + 30142, gleicher `d`,
`a`-Cross-Refs (`amb-metadata`/`content`), Bunker per NIP-46. Damit ist
die 30142↔30023-Frage längst entschieden (`a`, nicht `r`) und die 86
Artikel stammen von dort. Was `sync` **nicht** macht: Blossom, `x`,
`1063`, Umschreibung der Fließtextbilder — das ist die Quelle der 85
Artikel ohne `x`. `md2blossom` ist damit Vorstufe, nicht Werkzeug.
`redaktion-longform.md` entsprechend umgeschrieben (Abschnitt 2 Ist-Stand,
Abschnitt 8 Migration vs. Betrieb mit Cut-over-Bedingungen). Spec für den
Bilderschritt in `sync publish` und für `sync pull` (Relay → Git):
`mdparser/docs/superpowers/specs/2026-09-04-bilder-und-pull.md`.

**Regel bis Cut-over:** edufeed-Editor für FOERBICO-Posts tabu — ohne
`pull` bügelt der nächste Push die Web-Änderung weg.

**Nächster Schritt:** Teil A der Spec (Bilder in `publish`), dann
`bilder.yaml` × 86 als Redaktionsarbeit, dann `--force-all`. Zwei Fragen
an Steffen: nimmt `relay.edufeed.org` 1063 an, ist der FOERBICO-Key für
`PUT /upload` auf Blossom freigeschaltet.

**Nachtrag — ADR-0021, Redaktion nur in Nostr.** Git-Review ist im
Betrieb kein Gate mehr, also wird es keins: Entwürfe sind gewöhnliche
30023 unter **Redaktions-Keys** (im Hub unsichtbar, ADR-0012 filtert den
Autor), Freigabe per NIP-32-Label auf die Event-ID, der **FOERBICO-Key
wird nur noch durch `sync adopt` beschrieben** (gleicher `d`, `p author`,
Blobs per BUD-04 gespiegelt, 1063 bleibt — Lookup geht über den Hash).
ADR-0020 (30024) damit zurückgezogen. Lizenz-Relay ist `relay-rpi`. Spec
um Teil C (`label`/`adopt`) ergänzt, Regeln 6–9 neu.

**Nächster Schritt:** unverändert Teil A (Bilder in `publish`) für die
Migration; dann Teil C am Referenzfall. An Steffen: `PUT /mirror` auf
Blossom, Bunker-Modell für Redaktions-Keys.

## 2026-09-04 — Detailansicht trägt das Designsystem

**Passiert:** Die vorhandenen Ansichten — Artikelseite, Fußzeile,
Fehlerseite — sind ins Designsystem gehoben (ADR-0004). Neu ist eine
Kopfzeile mit der Wortmarke, verlinkt auf `/`, **ohne Navigation**: Es
gibt nichts, wohin man navigieren könnte, und was es nicht gibt, wird
nicht angedeutet. Die Textbreite ist „schmal" (820px), die Fußzeile
dunkel auf `--fau` mit dem Debug-Schalter wie bisher.

**Drei Schriften, drei Rollen — jetzt lokal.** Acht WOFF2-Subsets in
`static/schriften/` (113 KB, latin + latin-ext), variable Fonts: eine
Datei deckt 400 bis 700. Lizenztexte (OFL) liegen daneben. Vorher stand
`Source Sans 3` im CSS, das nie geladen wurde — die Seite lief in der
Systemschrift. `architektur.test.js` prüft jetzt, dass keine Schrift von
Google kommt und jede `url()` auf eine vorhandene Datei zeigt.

**Die drei Kontrastpunkte sind entschieden** (ADR-0018): Empfehlungen
des Designsystems übernommen, als Tokens in `app.css`. Neu dabei:
Augenbraue auf Weiß in `--rl-text-leise` (bei `.82rem` reicht
`--relilab-tief` nicht) und `--fuss-text` für die Fußzeile.
`test/kontrast.test.js` rechnet die WCAG-Werte aus den Tokens nach —
die Zahlen im Designsystem sind damit Prüfung, nicht Behauptung.
`--marker-amber-text` und `--verlauf-aufmacher` warten auf die
Startseite; in der Detailansicht kommen sie nicht vor.

**Kleinigkeiten, die dabei anfielen:** Datum als `<time datetime>`,
Themen als Liste von Markern, Hinweise („Bild nicht angezeigt",
„n Bildverweise entfernt") im Hinweiskasten mit Amber-Linie — der
zweite nennt jetzt die Dateinamen, nicht nur die Zahl.

**Stand:** `pnpm test` 17 Dateien, **149 Tests grün** (16 neu).
`pnpm check` 372 Dateien, 0 Fehler. Im Browser gegen die echten Relays:
alle vier Schriftdateien kommen mit 200 aus `static/`, `document.fonts`
meldet vier geladene Faces, berechnete Stile stimmen (Yanone für `h1`
und Wortmarke, Condensed für Metazeile und Bildunterschrift, Roboto im
Fließtext, `--fau` in der Fußzeile). Fehlerseite (400, fremder Autor)
mit Augenbraue und Meldung. Kein Google-Fonts-Verweis im ausgelieferten
HTML. Der Referenzartikel trägt keine `t`-Tags — Marker sind deshalb
nur im Test zu sehen, nicht am Referenzfall.

**Nachtrag am selben Tag — Wortmarke und ein geänderter Event.**
Die Wortmarke heißt vorläufig **„Community-Hub"**, nicht „relilab"
(ADR-0019): relilab ist die Herkunft der Inhalte, rpi-virtuell die alte
Plattform, FOERBICO will daraus den Community-Hub machen — und dafür
gibt es noch kein Branding. CLAUDE.md ist korrigiert („Marke" aus der
relilab-Aufzählung gestrichen).

Der Referenz-Event wurde redaktionell erweitert: sechs `t`-Tags
(`nostr`, `community`, `prozessqualität`, `gemeinschaft`, `edufeed`,
`schrein`) — die Marker sind jetzt am echten Fall sichtbar — und der
Blossom-Link des Aufmacherbilds steht zusätzlich im Fließtext. **Dort
wird er nach ADR-0015 entfernt**, wie jeder Bildverweis im Text. Dabei
fiel auf, dass der Hinweis „Relative Pfade, die nur auf der alten
Website auflösen" behauptete — für eine Blossom-URL falsch. Er nennt
jetzt den wirklichen Grund: kein Lizenznachweis für Bilder im Fließtext.
Die Fixture bleibt der Stand vom 03.09.; die Tests brauchen den neuen
Event nicht.

**Beobachtung, nicht entschieden:** Bei einer Blossom-URL *ist* der
Dateiname der SHA-256 — hier derselbe Hash wie im `x`-Tag, also
attestiert. ADR-0015 begründet das Entfernen mit „kein Hash, keine
Frage"; für Blossom-Verweise trägt diese Begründung nicht. Ob das eine
Ausnahme rechtfertigt (Fließtextbild zeigen, wenn Hash = attestiertes
`x`-Tag), ist eine eigene Entscheidung — dann als ADR.

**Offen:** `pnpm lint` und `pnpm test:e2e` aus der Merge-Checkliste in
CLAUDE.md existieren als Skripte nicht — Zielzustand, nicht Ist.
Startseite nach Mockup und Übersicht mit Themenfilter stehen weiter
aus; dort kommen die neuen Tokens erstmals zum Einsatz.

## 2026-09-03 (spät) — Entwickleransicht: warum ein Bild fehlt, ist jetzt beantwortbar

**Passiert:** ADR-0017. Unter `/[naddr]/json` liegen die Rohdaten hinter
einem Beitrag: `kind:30023` und `kind:1063` nebeneinander, je mit dem
Relay, das sie lieferte, dazu die fünf Schritte aus ADR-0013 mit Ergebnis
je Schritt, die drei Hashes zum Vergleich und ein Signaturbefund. Die
Artikelseite verweist per Aufklappbereich darauf, ohne die Daten
einzubetten.

Anlass war die Frage, wie man den Lizenznachweis überhaupt zu Gesicht
bekommt — **er steht nicht im Artikel**. Der `30023` trägt nur den Hash
im `x`-Tag; der Nachweis ist ein eigenes Event auf einem anderen Relay.
Bisher zeigte die Seite nur das Ergebnis, nicht seinen Grund.

**Adressprüfung und Relay-Abfrage liegen jetzt gemeinsam** in
`loaders/beitrag.js`, den Artikelseite und JSON-Route beide nutzen.
Sonst wäre die JSON-Route der Umweg um ADR-0016, sobald ein Wächter in
einer Kopie fehlt. Am laufenden System geprüft: fremder Autor → 404.

**Zwei Funde, beide am laufenden System belegt:**

- **`verifyEvent` prüft die Signatur nicht gegen den Inhalt**, sondern
  `sig` gegen `id`. Ein Event mit verändertem `content` und unberührter
  `id`/`sig` kommt durch — `verifyEvent` meldet `true`. Erst der
  Vergleich mit `getEventHash` bindet die Signatur an den Inhalt. Der
  Test dazu wurde vor dem Code geschrieben und wäre nachträglich grün
  geworden, ohne etwas zu prüfen.
- **Die Relay-Trennung ist nicht disjunkt.** Der Referenzartikel liegt
  inzwischen auf *beiden* Relays, sein Nachweis nur auf `relay-rpi`.
  „Liegt der Nachweis auf keinem der Artikel-Relays" ist damit falsch,
  obwohl ADR-0013 gilt. Die richtige Frage: Gibt es ein Relay, das den
  Artikel hat und den Nachweis nicht? Antwort für den Referenzfall:
  `relay.edufeed.org`.

**Stand:** `pnpm test` 13 Dateien, **107 Tests grün** (33 neu).
`pnpm check` 361 Dateien, 0 Fehler, 0 Warnungen. Beide Fälle gegen die
echten Relays geprüft: der Referenzfall (fünf Schritte bestanden, drei
Hashes gleich) und ein Artikel ohne `x`-Tag (Schritt 2 gescheitert,
3 bis 5 als *ungeprüft* ausgewiesen, `gefragt: []` mit Erklärung —
„kein Hash, keine Frage").

**Nachtrag am selben Abend — die Ansicht sitzt jetzt in der Seite.**
Nach dem Vorbild von edufeeds `EventDebugInfo.svelte`: aufklappbarer
Bereich am Beitragsende, Kachelraster mit Kopierknöpfen, Marke „Aktiv"
beim Aufklappen, Rohobjekte mit „kopieren / ausklappen". Geschaltet wird
in der **Fußzeile** (`localStorage`, Muster von `appSettings.debugMode`)
— keine Einstellungsseite, die wäre Verwaltung. Farben aus
`docs/designsystem.md`, nicht DaisyUI: dort sind die Kontraste geprüft.
Die JSON-Route bleibt zum Weiterverarbeiten.

**Zwei weitere Funde, beide erst beim Aufrufen im Browser sichtbar:**

- **HTTP 500 — Events tragen Symbol-Schlüssel.** SvelteKit serialisiert
  alles aus `load` und bricht daran ab. `JSON.stringify` verschluckt sie
  stumm, die JSON-Route allein hätte das nie gezeigt. Der Befund gibt
  jetzt reine NIP-01-Objekte heraus.
- **„hat den Beitrag, nicht den Nachweis" log bei fehlendem `x`-Tag.**
  Dort fand gar keine Abfrage statt; beide Relays als „hat ihn nicht"
  auszuweisen behauptete eine Antwort, die es nie gab.

**Komponenten sind jetzt prüfbar:** `vitest.config.js` lädt das
Svelte-Plugin, Tests rendern mit `svelte/server` — dieselbe Darstellung,
die der Server ausliefert (ADR-0003).

**Im Browser durchgespielt** (Chrome über CDP, echte Relays): Klick auf
den Schalter → Bereich erscheint → in `localStorage` gemerkt →
Aufklappen zeigt Marke und Kette → nach dem Neuladen noch an. Beide
Fälle angesehen: Referenzfall (fünf `✓`) und Artikel ohne `x`-Tag
(`✓ ✗ · · ·` mit Erklärung).

**Stand nach dem Nachtrag:** **133 Tests grün**, `pnpm check` 369
Dateien ohne Fehler oder Warnung.

**Nächster Schritt:** unverändert die Termin-Ansicht mit ihrem
Leerzustand. Davor oder danach der Cache — die JSON-Route löst eine
zweite Abfragerunde aus und ist bewusst `no-store`.

**Offen, neu:** **Was folgt aus einer ungültigen Signatur?** Die Ansicht
weist den Befund aus, zieht aber keine Konsequenz — ein Event mit
gebrochener Signatur wird normal angezeigt. 404, Warnung, oder Anzeige
ohne Bild? Braucht eine eigene Entscheidung (ADR-0017, Abschnitt
„Offen"), weil ein solcher Beitrag nicht belegbar von der Quelle stammt,
auf die sich ADR-0016 stützt.

---

## 2026-09-03 (abends) — Architekturregeln prüfen sich selbst

**Passiert:** ADR-0014. Drei Regeln, die bisher nur in CLAUDE.md und in
ADRs standen, laufen jetzt als Test mit: die Schichtgrenze
(`src/lib/**` importiert nichts aus `routes/`/`components/`), das
`nostr-tools`-Verbot für Relay-Kommunikation (ADR-0009) und das Verbot,
die Serverdarstellung abzuschalten (ADR-0003). Prüfung liegt in
`src/lib/architektur.test.js` und meldet bei Verstoß Datei, Zeile und
die verletzte ADR.

Anlass war die Frage, wieviel von Hendersons ADR-Sammlung hier schon
integriert ist. Antwort: fast alles — Template, Status, Zeitstempel,
Immutabilität, Falsifikationskriterium, sogar der Rat, das Verzeichnis
`decisions` statt `adr` zu nennen (hier `entscheidungen`). Nicht
vorhanden war nur der Gedanke der *Fitness Functions*: eine Entscheidung
nicht nur dokumentieren, sondern automatisch zusichern. Genau das war
für die Regel einschlägig, die CLAUDE.md selbst als die bezeichnet, „die
am leichtesten erodiert".

**Gegengeprüft, nicht nur grün gesehen:** Jede der drei Regeln wurde
absichtlich verletzt (Route-Import in `inhalt.js`, `SimplePool` in
`naddr.js`, `ssr = false` in einer Route) — alle drei schlagen an,
danach wieder grün. Beim ersten Lauf fand der Test sich selbst, weil er
das verbotene Muster in seiner eigenen Meldung zitiert; die Prüfdatei
nimmt sich jetzt aus.

**Stand:** `pnpm check` 341 Dateien, 0 Fehler, 0 Warnungen.
`pnpm test` 9 Dateien, 52 Tests grün (3 neu). Die Datenschicht ist
unverändert — es kam nur eine Prüfung dazu, kein Produktivcode.

**Nächster Schritt:** unverändert die Termin-Ansicht mit ihrem
Leerzustand (FOERBICO hat 0 Termine). Am Rand aufgefallen: CLAUDE.md
nennt `pnpm lint` und `pnpm test:e2e` als Merge-Voraussetzung, beide
Skripte existieren in `package.json` noch nicht — entweder anlegen oder
die Merge-Regel auf den Ist-Stand bringen.

---

## 2026-09-03 (abends) — Erster Code läuft, auf dem Server

**Passiert:** Das SvelteKit-Gerüst steht und die **Artikel-Detailansicht
läuft auf `46.225.82.96`** — serverseitig gerendert, mit über zwei Relays
aufgelöster Bildlizenz. Der Referenzfall
`die-kraft-der-gemeinschaft` zeigt Titel, Datum, Fließtext, das
Blossom-Bild und „nosTr-schrein — Comenius-Institut, CC0 1.0".

**Zwei Sicherheitslücken beim Abwägen einer Portfreigabe gefunden**
(ADR-0016), beide am laufenden System belegt und behoben:

- `artikelLaden` fragte die Relay-Hinweise **aus dem `naddr`** — ein
  Fremder konnte den Server zu beliebigen Zielen verbinden lassen,
  auch auf `127.0.0.1`. Die Hinweise werden jetzt ignoriert.
- Der Filter nahm den Autor aus dem `naddr` statt `QUELLE_AUTOR`. Damit
  war dies ein offener Nostr-Renderer für fremde Inhalte, deren Roh-HTML
  über `{@html}` mit hinausging. Jetzt 404 bei fremdem Autor, dazu
  `sanitize-html` vor der Ausgabe.

**Eine Lücke in ADR-0013 geschlossen** (ADR-0015): Bilder im Fließtext
gingen durch, wenn sie absolute URLs hatten — 25 Verweise in 10 Artikeln,
darunter midjourney und Wikimedia. Sie können keinen Nachweis haben, weil
es zu ihnen kein `x`-Tag gibt. Jetzt werden alle entfernt und gezählt.

**Stand:**

| Baustein | Zustand |
|---|---|
| SvelteKit-Gerüst, Designtokens | ✓ |
| Detailansicht `/[naddr]` | ✓ läuft auf dem Server |
| Lizenz-Kette (5 Schritte, mit Grund) | ✓ |
| Tests | **71 grün**, `pnpm check` 0 Fehler |
| Auslieferung | ✓ `betrieb/ausliefern.sh` |
| Liste, Startseite, Termine | existiert nicht |

**Werkzeugkette:** Node 24.20.0, pnpm 11.25.0, Vitest 5 — hier und auf
dem Server. Die Vitest-4-Bindung kam allein von Node 20.

**Betrieb weicht von CLAUDE.md ab:** kein Docker, kein Traefik. Der
Server hat kein Docker und `sudo` verlangt ein Passwort; darum Node in
`~/.local/node` und `systemd --user` auf Port 8080, **nur auf
`127.0.0.1`**. Begründet in `docs/betrieb.md`.

**Nächster Schritt:** Liste oder Startseite — und damit fällig: der
**Cache**, dessen Abweichung befristet war. Ohne ihn löst jeder Aufruf
zwei Relay-Abfragen aus; bei einer Liste wären es viele.

**Offen:**

- **Nicht öffentlich erreichbar.** Eine Firewall vor dem Server lässt nur
  Port 22 durch. Ansehen per SSH-Tunnel. Für eine öffentliche Adresse
  fehlen DNS-Name, Portfreigabe und ein Reverse-Proxy mit TLS (Caddy) —
  Schritte in `docs/betrieb.md`.
- **`pnpm lint` und `test:e2e` fehlen** — CLAUDE.md fordert sie vor jedem
  Merge. Kein ESLint, kein Playwright eingerichtet.
- **Kein Mock-Relay.** Die Loader sind nur über echte Abrufe geprüft.
- **`main` hängt zurück** — alles liegt auf `dev`.

## 2026-09-03 (nachmittags) — FOERBICO wird die Datenquelle, Bildlizenz-Routine steht

**Passiert:** ADR-0012 und ADR-0013. Die Datengrundlage wechselt vom
relilab-Bot auf den **FOERBICO-Bestand** — dort ist erstmals ein Beitrag
nach der Zielkonvention aus ADR-0010 überarbeitet:
`die-kraft-der-gemeinschaft`, Bild auf Blossom, `x`-Tag, Lizenznachweis
CC0 / Comenius-Institut. Hash selbst nachgerechnet: stimmt.

**Bestand geprüft** (Autor `5a12b41e…`, 03.09.2026):

| Größe | Wert |
|---|---|
| Artikel `kind:30023` | **86** |
| Termine `31923`/`31922` | **0** |
| Bildverweise gesamt | **269** |
| Aufmacher auf Blossom **mit** `x` | **1** |
| Lizenznachweise `kind:1063` | **1** |
| `t`-Tags | 43 (auf 25 Artikeln) |

**Drei Befunde, die die Umsetzung prägen:**

1. **Der Lizenznachweis liegt auf einem anderen Relay als der Artikel.**
   Der `kind:1063` steht nur auf `relay-rpi.edufeed.org` — nicht auf
   `relay.edufeed.org`, das der `naddr` nennt. Ein Lookup am Artikel-Relay
   hätte das korrekt attestierte Bild als „ohne Nachweis" markiert.
2. **Ohne `x`-Tag ist kein Lookup möglich** — 85 von 86 Artikeln. Das ist
   kein fehlender Nachweis, sondern eine fehlende Angabe.
3. **Aufmacher und Fließtext laufen auseinander.** Im überarbeiteten
   Beitrag zeigt `image` auf Blossom, das Markdown weiter auf
   `![](nosTr-schrein.jpg)` — relativ, nur gegen WordPress auflösbar.
   166 von 269 Bildverweisen sind so.

**Entschieden:** Artikel erscheinen alle, **ein Bild aber nur mit
auflösbarem Nachweis** (ADR-0013, strenger als ADR-0010 — ein kenntlich
gemachtes Bild ist trotzdem veröffentlicht). Der Filter nutzt bei FOERBICO
**den Autor allein**, weil 85 Artikel kein `h`-Tag haben; die
Doppelfilter-Regel bleibt für Bot-Quellen gültig (ADR-0012).

relilab bleibt in CLAUDE.md dokumentiert, aber **nicht in Betrieb**.

**Stand:** unverändert Dokumentation, kein Code — jetzt aber mit geprüfter
Datenquelle und vollständiger Auflösungskette für Bildlizenzen.

**Nächster Schritt:** Die Auflösungskette braucht (a) ein **Prüfskript für
die Redaktion**, das einen Beitrag vor dem Einstellen gegen die fünf
Schritte aus ADR-0013 testet, und (b) eine **Redaktions-Checkliste** für
den Web-Editor. Danach das SvelteKit-Gerüst, mit
`die-kraft-der-gemeinschaft` als Fixture.

**Offen:** Ob und wann die 85 unattestierten Beiträge überarbeitet werden,
ist Redaktionsarbeit ohne Termin — der Hub zeigt den Fortschritt, statt
ihn zu verdecken. Zwei stichprobenhaft geprüfte Fremd-Aufmacher liefern
schon **404**, die Bilder sind dort also ohnehin verloren.

## 2026-09-03 — Projekt umbenannt: community-hub

**Passiert:** ADR-0011. Das Repository hieß `relilab-client` — ein Name aus
der Zeit, in der das Vorhaben nur relilabs Inhalte anzeigen sollte. Seit
ADR-0007 gilt: Das Schaufenster ist der Keim des Community Hubs. Der Name
trug also eine Einschränkung, die nicht mehr gilt.

Umbenannt wurden **nur Projektnamen**: Verzeichnis, Git-Remote-URL,
Dokumenttitel und der Dateiname der Spec
(`2026-08-31-community-hub-schaufenster-design.md`). **relilab bleibt
stehen**, wo es Mandant, Marke, Domain oder Historie ist — die Domains
`dev.relilab.org`/`int.relilab.org`, der Community-`h`-Tag, die Farbtoken
`--relilab` aus der rpi-virtuell-Farbkarte und das Mockup.

Angenommene ADRs (0001, 0002, 0006, 0009, 0010) sprechen weiter von
`relilab-client` — sie werden nicht umgeschrieben, nur ersetzt. Gemeint ist
`community-hub`.

**Stand:** unverändert Dokumentation, kein Code. Ein Mehrmandantenbetrieb
ist **nicht** beschlossen; relilab bleibt der einzige Mandant.

**Nächster Schritt:** unverändert das SvelteKit-Gerüst — jetzt unter dem
Paketnamen `community-hub`. Die Umbenennung fiel vor den Code, also den
günstigsten Zeitpunkt.

**Offen:** Das Repository muss **in Gitea** umbenannt werden
(`Comenius-Institut/relilab-client` → `community-hub`); die lokale
Remote-URL zeigt schon dorthin, bis dahin schlägt `git push` fehl.

## 2026-09-02 (spät, 2) — Startbestand wird redaktionell erstellt, nicht übernommen

**Passiert:** ADR-0010. Die 111 Bot-Events sind **nicht** der
Startbestand der Instanz: Ihre Medien liegen weiterhin auf relilab.org,
und für einen Teil fehlen Urheberrechtsangaben. Für v0.0.1 werden
exemplarische Beiträge und Termine **redaktionell neu eingestellt**,
Vorschaubilder auf **Blossom**, mit Lizenznachweis als `kind:1063`
(NIP-94) nach der edufeed-Konvention — Pflichtfelder `license` und
`credit`. Der bestehende Mechanismus der edufeed-app wird bedient,
nichts neu erfunden.

**Wirkung auf den Zuschnitt:** Das Einstellen braucht Anmeldung und
Schreibpfad — beides bleibt **außerhalb** des community-hub, im
Web-Frontend der edufeed-app. Der Client bleibt lesend; neu ist nur,
dass er `kind:1063` auflösen und die Lizenz **sichtbar ausweisen** muss.
Bilder ohne auflösbaren Nachweis werden kenntlich gemacht, nicht
stillschweigend angezeigt.

**Geklärt (02.09. nachmittags):** Blossom-Server ist
`https://blossom.edufeed.org/` — erreichbar geprüft, CORS offen, der
Client kann direkt laden. Umfang: **eine Handvoll** Beiträge und Termine,
bis das grundlegende Schema belastbar ist; erst dann erweitern.

**Nächster Schritt:** unverändert das SvelteKit-Gerüst — die
Lizenzanzeige gehört in die Detailansicht und die Karten, ist also Teil
davon. Der Bot-Bestand bleibt als Fixture-Quelle für Tests nützlich.

## 2026-09-02 (spät) — Framework bestätigt, drei Entscheidungen gefallen

**Passiert:** Die Framework-Frage („evtl. brauchts kein Svelte") wurde
gestellt und beantwortet: **SvelteKit bleibt** (ADR-0007). Damit ist auch
die dahinterliegende Frage entschieden — das Schaufenster ist der Keim des
Community Hubs, nicht nur ein Schaufenster. ADR-0003 (SSR, kein
Browser-Zustand) ist ab jetzt ausdrücklich eine **Startbedingung mit
Ablaufbedingung**, kein Dauerzustand.

Zwei ADRs wurden ersetzt statt korrigiert:

- **ADR-0005 → ADR-0008:** Kein eigenes Relay. `relay.edufeed.org` und
  `amb-relay.edufeed.org` sind da, es wird gespiegelt. Die Frage an
  Steffen nach Relay-Software entfällt für den Start.
- **ADR-0002 → ADR-0009:** Der isolierte `src/lib/nostr/`-Kern ist
  verworfen. Applesauce für alle Nostr-Operationen; `mcp.applesauce.build`
  und nostrbook.dev sind bei der Entwicklung verbindlich. Struktur folgt
  edufeed-app (`loaders/`, `models/`, `services/`, `stores/`).

CLAUDE.md entsprechend korrigiert: Die Erosionsregel gilt jetzt für die
Datenschicht insgesamt, nicht für einen Pfad, den es nicht gibt.

**Noch offen:** ADR-0006 (Pilgern-MVP vs. Relilab-Klon) — präzisiert:
„Edufeed-Light" ist als Begriff verworfen, es wird **nichts aus edufeed
herausgeschnitten**, sondern eigenständig gebaut.

**Nächster Schritt:** unverändert — SvelteKit-Gerüst. Jetzt ohne
Framework-Vorbehalt und mit geklärter Datenschicht-Struktur.

## 2026-09-02 (abends) — ADRs eingeführt, offene Entscheidungen benannt

**Passiert:** `docs/entscheidungen/` angelegt (ADR, eine Entscheidung pro
Datei, mit Status). Die vier Spec-Entscheidungen sind jetzt ADR-0001 bis
ADR-0004 referenzierbar; aus der Besprechung „Community Hub" (02.09.) sind
zwei offene ADRs entstanden.

**Offen (blockiert weitere Festlegungen):**

- **ADR-0005** Relay: Plan A eigenes Relay (favorisiert) vs. Plan B
  Edufeed-Relay — wartet auf Steffen (docker-fähige Software) und
  Hosting-Klärung intranda.
- **ADR-0006** Schwerpunkt: Pilgern-MVP/Edufeed-Light vs. Relilab-Klon —
  mit Corinna nichts fest vereinbart; Verabredung „eins ausprobieren,
  parallel ok".

**Nächster Schritt:** unverändert (SvelteKit-Gerüst) — ADR-0005/0006
blockieren den Client nicht, die Relay-Adresse ist Konfiguration.

## 2026-09-02 — Branches konsolidiert, Ausgangspunkt vereinheitlicht

**Passiert:** `mockup` per Fast-Forward in `main` gemerged und gelöscht,
`dev` von `main` abgezweigt. Damit gilt das Branch-Modell aus CLAUDE.md
jetzt wirklich (`dev` arbeiten · `feat/<thema>` je Vorhaben · `main`
freigegeben). STATUS.md eingeführt, `.gitignore` um `.DS_Store` ergänzt.

**Stand:**

| Baustein | Zustand |
|---|---|
| Spec (4 Entscheidungen) | ✓ `docs/superpowers/specs/2026-08-31-…` |
| Designsystem FOERBICO × rpi-virtuell | ✓ `docs/designsystem.md` |
| Mockup (eine HTML-Datei) | ✓ `mockup/index.html` |
| SvelteKit-Projekt, Code, Tests | **existiert noch nicht** |

Die Abschnitte „Daten", „Technik", „Arbeitsweise" und „Umgebungen" in
CLAUDE.md beschreiben den **Zielzustand** — `src/lib/themen.js`,
`test/fixtures/`, die pnpm-Befehle gibt es erst, wenn das Gerüst steht.

**Nächster Schritt:** Superpowers-Plan für das SvelteKit-Gerüst anlegen
(`docs/superpowers/plans/YYYY-MM-DD-geruest.md`), darin: Projektanlage
nach Spec Entscheidung 1–3, Mock-Relay mit den 111 Events als Fixtures,
erste Route Artikel-Liste. Arbeit auf `dev`.

**Offen/Blocker:** `relay.relilab.org` ist noch kein Relay (leeres
Apache-Dokument, fremdes Zertifikat) — bis dahin `relay.edufeed.org`.

## 2026-08-31 bis 2026-09-01 — Spec, Designsystem, Mockup

Spec mit den vier tragenden Entscheidungen geschrieben (eigenes Projekt
statt edufeed-app-Fork · SSR statt Client-Rendering · Designsystem statt
WordPress-Anleihe zur Laufzeit). Mockup als einzelne HTML-Datei gebaut,
Designsystem angewandt, Startseite mit Titel, Intro-GIF, Live-Knopf und
Einstiegskästen. CLAUDE.md als Projektgedächtnis angelegt.
