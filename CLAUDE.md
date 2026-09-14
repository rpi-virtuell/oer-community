# community-hub

Lesender Client, der oer.community vollständig aus Nostr-Events rendert
(ADR-0026). Begonnen als relilab-Schaufenster; relilab ist dokumentierte,
nicht betriebene Quelle.

**Warum eine Regel gilt, steht in `docs/entscheidungen/` (ADR)** — eine
Entscheidung, eine Datei, mit Status. Die Spec
`docs/superpowers/specs/2026-08-31-community-hub-schaufenster-design.md`
bleibt das Gesamtbild; ihre vier Entscheidungen sind ADR-0001 bis ADR-0004.
Die Spec vom 14.09.
(`docs/superpowers/specs/2026-09-14-oer-community-aus-nostr-design.md`)
ändert den Zuschnitt: ADR-0026 bis ADR-0031. Hier stehen
nur die Regeln. Widerspricht diese Datei einer ADR, gilt die ADR — und diese
Datei ist zu korrigieren. **Neue Festlegungen aus Besprechungen werden ADRs**
(Vorlage: `docs/entscheidungen/TEMPLATE.md`), auch mit Status „offen".
Farben, Schriften, Abstände: `docs/designsystem.md`.

**Zum Namen:** Das Projekt hieß `relilab-client` und heißt seit ADR-0011
`community-hub`. Ältere ADRs sprechen noch vom alten Namen — angenommene
ADRs werden nicht umgeschrieben. **relilab bleibt** als Mandant, Domain
und Farbtoken; umbenannt wurde nur der Projektname. Die **Wortmarke** in
Kopf- und Fußzeile kommt aus dem `kind:0` der Quelle (`name`, Rückfall
`display_name`); fehlt beides, steht „Community-Hub" (ADR-0027, ersetzt
ADR-0019).

**Wo das Projekt steht und was als Nächstes dran ist: `docs/STATUS.md`**
(Logbuch, neuester Eintrag oben). Diese Datei hier beschreibt teils den
Zielzustand — was davon schon existiert, sagt STATUS.md. Jede Arbeitssitzung
beginnt dort und endet mit einem Eintrag dort.

## Zuschnitt

Nur Lesen: Artikel, Seiten, Detailansicht, Themenfilter. Termine sind
nicht im Zuschnitt (ADR-0026).

**Nicht Teil dieses Vorhabens:** Anmeldung, Autorenwerkzeuge, Communities,
Wiki, Nachrichten, Verwaltung. **Was es nicht gibt, wird auch nicht
angedeutet** — keine Bedienung anbieten, die dann scheitert. Also keine
Schaltflächen, Menüpunkte oder Formulare für nicht vorhandene Funktionen,
auch nicht abgeblendet oder als „demnächst".

Das gilt auch nach ADR-0010: Inhalte werden **im Web-Frontend der
edufeed-app** redaktionell eingestellt, nicht hier. Der community-hub
bleibt lesend — er zeigt die Lizenzen nur an.

## Die Regel, die am leichtesten erodiert

**Die Datenschicht kennt die Oberfläche nicht.** Nichts unter
`src/lib/loaders/`, `src/lib/models/` oder `src/lib/services/` importiert eine
Komponente oder eine Route.

Die Grenze bricht beim ersten „nur schnell hier importieren". Der
Abhängigkeitspfeil zeigt ausschließlich von `routes/` und `components/` nach
`lib/`, nie zurück. **Das prüft `src/lib/architektur.test.js`**
(ADR-0014) — zusammen mit dem `nostr-tools`-Verbot und `ssr = false`.
Die Struktur folgt der edufeed-app, damit Muster wandern können
(ADR-0009) — ein Sammelpfad `src/lib/nostr/` ist es ausdrücklich nicht.

## Nostr-Operationen

**Applesauce für alles, was mit Relays spricht** — nie `nostr-tools` für
Relay-Kommunikation (fehlerhafte Serialisierung in `SimplePool`).

**Vor dem Schreiben von Loader-, Model- oder Subscription-Code die MCPs
befragen** statt aus dem Gedächtnis zu programmieren:
`https://mcp.applesauce.build/mcp` für die Applesauce-API, **nostrbook.dev**
für Kind- und NIP-Details (ADR-0009).

## Der Spiegel

Jede Anfrage liest aus `src/lib/services/spiegel.js`, nie direkt vom Relay;
nur er importiert `services/relay.js`, geprüft vom Architekturtest
(ADR-0014, ADR-0028). Der Stand liegt als Datei unter `SPIEGEL_PFAD` und
wird alle `SPIEGEL_INTERVALL_S` Sekunden neu aufgebaut; scheitert der
letzte Lauf, nennt die Fußzeile das Alter des angezeigten Stands
(ADR-0028).

Menü und Fußzeile sind Kuratierungslisten `kind:30004` (`d = navigation`,
`d = fusszeile`), die Startseite ist die Seite `d = startseite`; alle drei
Kennungen sind Konfiguration mit Standard (`NAVIGATION_D`, `FUSSZEILE_D`,
`STARTSEITE_D`). Fehlt etwas, zeigt die Fußzeile im Debug-Modus den
Struktur-Befund.

## Serverseitig rendern, nicht clientseitig

Alle vier Ansichten liefern **fertiges HTML mit Inhalt** — nicht nur
OG-Metadaten. Die Seite ist ohne JavaScript lesbar.

Im Browser laufen nur Bedienelemente: Themenfilter, Umschalten
kommend/vergangen. **Keine Relay-Verbindung im Browser, keine
Live-Aktualisierung** — die Inhalte ändern sich täglich, nicht sekündlich,
und eine zweite Datenschicht wäre doppelte Fehlerquelle ohne Gegenwert.

`ssr = false` ist hier nie die Antwort. Dass edufeed-app es in 40 Routen
stehen hat, ist eine Fehlerbehebung von März 2026, keine Architekturwahl
(Spec, Entscheidung 3).

## Daten

**Aktive Quelle ist FOERBICO** (ADR-0012), nicht der relilab-Bot. Alle
Schlüssel und Relay-Adressen kommen aus der Konfiguration, nie aus dem Code.

- FOERBICO (Autor):
  `5a12b41ec15b466321e88c371be2dc47d9193f9c8bba4ab09fc50045bd35aedf`

```json
{ "kinds": [30023, 31922, 31923],
  "authors": ["5a12b41e…"] }
```

**Hier filtert der Autor allein** — 85 der 86 Artikel haben kein `h`-Tag,
der Doppelfilter ließe genau einen durch. Das ist eine begründete Ausnahme
für einen redaktionellen Account (ADR-0012), keine neue Regel.

**Für Bot-Quellen gilt weiter: beide Kriterien zusammen, nie eines allein.**
`authors` allein zöge künftige Bot-Inhalte anderer Mandanten mit; `#h` allein
ließe jeden herein, der auf den Community-Key taggt. Die relilab-Quelle ist
dokumentiert, aber **nicht in Betrieb**:

- Termine-Bot (Absender):
  `f6c14ab7add65d61cf9311a8685575c3f2de0ca540bc4ddf916f76f089f1aa43`
- relilab-Community (`h`-Tag):
  `48706e894e64be57a250d3cd1f4c8a0f69ca900937936f8bd11a1329cd3c97e3`

Kinds: `30023` Artikel (NIP-23) · `31923` Termine zeitgebunden · `31922`
ganztägig · `1063` Lizenznachweis zu Bildern (NIP-94, wird über `#x`
nachgeschlagen, nicht über die Hauptabfrage).

**Der Lizenznachweis liegt auf einem anderen Relay als der Artikel.**
Der Artikel steht auf `relay.edufeed.org`, sein `kind:1063` nur auf
`relay-rpi.edufeed.org`. Der Lizenz-Lookup fragt **alle** konfigurierten
Relays (ADR-0013) — nie nur das aus dem `naddr`.

### Wiederkehrende Fallen

- **Anzeigedatum von Artikeln ist `published_at`, nicht `created_at`.**
  Termine haben kein `published_at` — dort zählt `start`.
- **Events werden nie verändert.** Sie sind unveränderlich und nicht unser
  Code. Was zu säubern ist, wird **beim Rendern** gesäubert.
  **Die Bot-Säuberungsregeln gelten für FOERBICO nicht unverändert**
  (ADR-0012): kein Kadence, kein `wp-block`. Vorhanden sind 19 Blockquotes
  (meist echte Zitate, **nicht** automatisch Autorenzeilen), 5 absolute
  Site-Pfade `](/…`, 3-mal Roh-HTML (`<br>`). Nicht blind auf Blockquotes
  losgehen — erst prüfen, was dort steht.
  Für relilab-Altbestand gilt weiter: Autorenzeile nicht verwerfen, sondern
  als „von X, ursprünglich auf relilab.org" auswerten.
- **Themen normalisieren.** Bei FOERBICO 43 `t`-Tags auf nur 25 von 86
  Artikeln, mit Dubletten (`OER` neben `Open Educational Resources (OER)`,
  `OER-Community` neben `OER-Communities`); der relilab-Bot hatte 195. Die
  Normalisierungstabelle in `daten/themen.json` (gelesen von
  `src/lib/themen.js`) ist Redaktionsarbeit und muss ohne Entwickler
  änderbar bleiben. Nicht filterbare Themen bleiben am Artikel sichtbar.
- **Bilder erscheinen mit ihrem Lizenzstand** (ADR-0022, ersetzt ADR-0013
  Punkt 2). Ein absolut adressiertes Bild wird ausgeliefert; ist der
  Nachweis aufgelöst, steht die Attributionszeile nach `bildattribution.md`
  darunter — `[title](sourceUrl), [author](authorUrl), [licence](licenceUrl),
  modification`, nur Kommas —, sonst „Lizenz ungeklärt" mit Grund. Der
  Alt-Text kommt aus dem `alt`-Tag des Nachweises, nicht aus `title`. Redaktionell eingestellte Bilder liegen auf Blossom,
  in voller Größe, mit Lizenznachweis — im FOERBICO-Bestand ist das derzeit
  **eines von 86**. Für relilab-Altbestand gilt: 150×150-Thumbnails,
  zentriert darstellen, nicht auf Kartenbreite ziehen.
- **Relative Bildpfade im Markdown werden nicht aufgelöst** (ADR-0013).
  `![](nosTr-schrein.jpg)` löst nur gegen WordPress auf — das wäre
  WordPress als Voraussetzung. Entfernen und zählen; die Zahl ist die
  Redaktions-Aufgabenliste. Betrifft 166 von 269 Bildverweisen.
  **Bilder mit Hash-URL im Text werden dagegen aufgelöst und gezeigt wie das
  Cover** (ADR-0023): Der Hash im Blossom-Pfad ist der Zeiger auf den
  `kind:1063`, ein Lookup für alle Hashes des Beitrags, die Konventionszeile
  unter dem Bild (`bildattribution.md`) ist der Rückfall, wenn kein Nachweis
  kommt. `inhaltAufbereiten` liefert deshalb Teile, keinen HTML-String.
- **Zu jedem Bild den Lizenznachweis auflösen und ausweisen.**
  `kind:1063` über den SHA-256-Hash: `{ kinds: [1063], "#x": [hash] }`,
  **über alle konfigurierten Relays** — der Nachweis liegt oft nicht dort,
  wo der Artikel liegt. Bei mehreren Treffern gewinnt das neueste
  `created_at`, Gleichstand nach `id`. **Pflicht ist allein `license`**
  (URL); `credit` wird angezeigt, wenn vorhanden — wie in der edufeed-app,
  die beim Lesen ebenfalls nur auf `license` besteht (ADR-0022, ersetzt
  ADR-0013 Punkt 3). Beim **Schreiben** verlangen edufeed-app und
  `foerbico-editor` weiterhin beides; der Hub ist lesend.
  **Ohne auflösbaren Nachweis wird das Bild trotzdem ausgeliefert**, der
  Stand daran ausgewiesen (ADR-0022, kehrt zu ADR-0010 zurück). Die
  urheberrechtliche Begründung von ADR-0013 bleibt richtig und wurde
  bewusst zurückgestellt, damit Hub und edufeed-app dieselben Events nicht
  verschieden beurteilen — nachzulesen in ADR-0022.
- **Ohne `x`-Tag am Artikel gibt es keinen Lookup.** Kein Hash, keine
  Frage — das ist kein fehlender Nachweis, sondern eine fehlende Angabe.
  Betrifft 85 von 86 FOERBICO-Artikeln.
- **`verifyEvent` allein prüft die Signatur nicht gegen den Inhalt.** Es
  prüft `sig` gegen `id`; ein Event mit verändertem `content` und
  unberührter `id`/`sig` kommt durch. Immer zusätzlich `getEventHash`
  gegen die `id` vergleichen (ADR-0017).
- **Bilder von abgelösten Hosts** (`ABGELOESTE_HOSTS`, Standard
  `oer.community`) gelten wie relative Pfade (ADR-0030).
- **Ein Beitrag ist eine Seite**, wenn er `["l","seite","foerbico/typ"]`
  trägt (ADR-0027); Seiten erscheinen nicht im Blog.
- **Das Menü beschriftet Einträge mit dem Seitentitel;** Ziele außerhalb
  des Spiegels oder fremder Quellen werden übersprungen und im Befund
  genannt.
- **Werte kopieren, nie verlinken.** Kein WordPress-Stylesheet und keine
  Farbkarte zur Laufzeit laden — sonst wäre WordPress Voraussetzung statt
  überflüssig.

### Sortierung

Artikel `published_at` absteigend.

## Warum ein Bild fehlt: die Entwickleransicht

Ein aufklappbarer Bereich am Beitragsende zeigt die Rohdaten —
`kind:30023` und `kind:1063` nebeneinander, mit Relay-Herkunft, der
Prüfkette aus ADR-0013 und dem Signaturbefund (ADR-0017). Dieselben Daten
liegen unter `/[d]/json`. **Der Nachweis steht nicht im Artikel**;
ohne diese Ansicht ist ein ausbleibendes Bild nicht diagnostizierbar.
`/[naddr]` leitet auf `/[d]` weiter (ADR-0029).

**Geschaltet wird in der Fußzeile**, gemerkt in `localStorage` unter
`community-hub-einstellungen` — Muster von edufeeds `appSettings.debugMode`
(ADR-0009). Keine Einstellungsseite: die wäre Verwaltung.
Aufbau und Bedienung folgen edufeeds `EventDebugInfo.svelte`, Farben und
Abstände kommen aus `docs/designsystem.md`.

Drei Regeln dazu:

- **Die Prüfkette wird nicht zweimal implementiert.** Sie wird aus
  `lizenzPruefen` abgeleitet — dessen `grund` sagt, welcher Schritt kippte.
  Eine zweite Implementierung würde auseinanderlaufen und etwas anderes
  behaupten als die Anzeige.
- **Beide Routen laufen durch `loaders/beitrag.js`.** Dort liegen die
  Wächter aus ADR-0016. Eine Route, die selbst dekodiert und lädt, ist der
  Umweg daran vorbei.
- **`ungeprüft` ist nicht `gescheitert`.** Schritte nach einem Abbruch und
  Schritt 5 ohne `etag` gelten als nicht geprüft (`ok: null`). Sie als
  bestanden oder gescheitert zu zeigen behauptete eine Prüfung, die nicht
  stattfand — dasselbe gilt für ein Relay, das nie gefragt wurde.

## Fehlerfälle

Jede Anfrage rendert aus dem Spiegel, **nie direkt aus dem Relay**.

- Kein Relay erreichbar → letzter gültiger Stand **mit Hinweis auf sein Alter**
- Spiegel leer → Meldung, die das Relay nennt und sagt, was zu tun ist
- Pflichtwert fehlt → **Start bricht ab** mit klarer Meldung, statt später
  leere Seiten zu liefern

**Nie eine leere Liste ohne Erklärung.** Ein stumm leeres Brett lässt den
Fehler bei den Daten suchen statt bei der Verbindung.

## Sprache

Oberfläche, Code, Bezeichner und Commits auf **Deutsch**.

Ausnahme ist, was der Nostr-Spezifikation gehört: `kind`, `tags`, `naddr`,
`d`, `h`, `t`, `published_at`, `start`, `end`. Diese Namen bleiben englisch,
auch in eigenen Funktionen.

Keine Mehrsprachigkeit, kein Paraglide/inlang — relilab.org ist einsprachig
deutsch, Nachrüsten ist möglich.

## Technik

SvelteKit 2 + Svelte 5 (Runes) · TailwindCSS 4 + DaisyUI 5 · JavaScript mit
JSDoc, `checkJs` **und** `strict` über `svelte-check` · pnpm ·
`@sveltejs/adapter-node` · Docker + Traefik.

`nostr-tools` für `naddr`-Kodierung und Signaturprüfung,
`applesauce-common/helpers` für NIP-23/NIP-52-Felder. Die Relay-Abfrage selbst
ist eigener, schlanker Servercode.

## Arbeitsweise

Superpowers: Brainstorming → Spec → Plan → TDD → Review.
Specs `docs/superpowers/specs/`, Pläne `docs/superpowers/plans/`,
benannt `YYYY-MM-DD-<thema>`.

**Branches:** `dev` arbeiten · `feat/<thema>` je Vorhaben · `main` freigegeben.

**Vor jedem Merge:**

```
pnpm check && pnpm test
```

(`lint` und `test:e2e` gibt es noch nicht; offener Punkt der Spec vom 14.09.)

Tests laufen gegen ein Mock-Relay mit echten Events aus `test/fixtures/` —
ohne Netz und ohne Abhängigkeit von der Publikationstätigkeit anderer.
**Neue Funktionen kommen mit einer Prüfung.**

**Komponenten werden mit `svelte/server` gerendert**, nicht in einem
DOM-Nachbau: dieselbe Darstellung, die der Server ausliefert (ADR-0003).
`vitest.config.js` lädt dafür das Svelte-Plugin, aber nicht `sveltekit()`.

Als Fixture-Grundlage dient der FOERBICO-Bestand (ADR-0012), insbesondere
der Referenzfall `die-kraft-der-gemeinschaft` mit seinem Lizenznachweis —
er ist der einzige Fall **im FOERBICO-Bestand**, der die ganze Kette
durchläuft. Als zweiter, autorenfremder Durchlauf dient die
Caesar-Scheibe (`test/fixtures/*-caesar-scheibe.json`, Personen-Key,
`credit` eine natürliche Person, mit `kind:30142` am selben Hash).
Für Profil, Menü, Fußzeile und Startseite dient `test/fixtures/testquelle/`
(Wegwerf-Schlüssel, mit dem Skript `erzeugen.mjs` erzeugt) — eigene Events,
weil FOERBICO selbst noch kein `kind:30004` publiziert.

## Umgebungen

| Umgebung | Quelle | Datenquelle |
|---|---|---|
| lokal (`pnpm dev`) | Arbeitskopie | `relay.edufeed.org` |
| `community-hub.rpi-virtuell.net` (Dev) | `main`, bei jedem Push per Woodpecker | `relay.edufeed.org`, `relay-rpi.edufeed.org` |

Ziel ist oer.community. Der Deploy-Weg samt Stolperstein steht in
`docs/betrieb.md` (Abschnitt Dev-Umgebung); ältere Zwischenstände liefen auf dem Hetzner-Server aus
`docs/betrieb.md`.

Kein eigenes Relay — die Edufeed-Relays werden genutzt und bei Bedarf
gespiegelt (ADR-0008). Bilder liegen auf `https://blossom.edufeed.org/`
(ADR-0010). Alle Adressen sind Konfiguration, kein Code.

**Mehrere Relays sind Pflicht, nicht Redundanz** (ADR-0013):

| Relay | wofür |
|---|---|
| `relay.edufeed.org` | Artikel und Termine |
| `relay-rpi.edufeed.org` | **Lizenznachweise `kind:1063`** |
| `amb-relay.edufeed.org` | AMB-Metadaten |

Der Lizenz-Lookup fragt alle, weil der Nachweis nicht dort liegt, wo der
Artikel liegt.
