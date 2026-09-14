# oer.community aus Nostr: die Website ohne Hugo-Build

**Stand:** 14.09.2026 · **Ziel:** oer.community vollständig aus Nostr-Events
rendern, ohne Hugo, ohne Build-Schritt für Inhalte · **Ersetzt** den
Zuschnitt der Spec vom 31.08. (relilab-Schaufenster) · **Entscheidungen:**
ADR-0026 bis ADR-0031

## Worum es geht

oer.community ist heute eine Hugo-Seite: 87 Blogbeiträge, sieben statische
Seiten, ein Menü, eine Fußzeile mit Förderhinweis. Die Beiträge liegen seit
dem Frühjahr zusätzlich als `kind:30023` auf den Edufeed-Relays; seit dem
07.09. hängen ihre Bilder als Blossom-Blobs mit Lizenznachweis `kind:1063`
daran. Was noch fehlt, damit Hugo überflüssig wird, ist ein Leser, der die
**ganze** Seite aus den Events baut, und die wenigen Events, die es für
Seiten, Menü und Fußzeile noch nicht gibt.

Der community-hub wird dieser Leser. Er wechselt dafür das Vorhaben: nicht
mehr relilab-Schaufenster, sondern oer.community (ADR-0026). Er bleibt, was
er ist — lesend, serverseitig gerendert, ohne Relay im Browser.

**Nicht Teil dieses Vorhabens:** Anmeldung, Autorenwerkzeuge, Kommentare,
Suche, Termine, Dunkelmodus, Sprachumschalter. Was es nicht gibt, wird auch
nicht angedeutet.

## Ausgangslage (geprüft am 14.09.2026)

Gegen alle drei Relays abgefragt, Autor FOERBICO
(`5a12b41e…`):

| Befund | Wert |
|---|---|
| Artikel `kind:30023` (identisch auf allen drei Relays) | 87 |
| davon mit `x`-Tag / mit Blossom-Cover | 16 / 18 |
| davon mit Bild-URLs auf `oer.community` | 64 |
| davon mit relativen Bildpfaden im Text | 42 |
| Lizenznachweise `kind:1063` (`relay-rpi` / `relay`) | 40 / 36, davon 1 mit `ai` |
| AMB `kind:30142` (`amb-relay`) | 64 |
| Redaktionsliste `kind:30000 d=redaktion` | 1 |
| Profil `kind:0` | 1 (`name: FOERBICO`, `picture` auf Blossom, `about` leer) |
| Statische Seiten, Kuratierungslisten `30004`, Termine, Entwürfe | 0 |
| verschiedene `t`-Themen | 45, mit Dubletten |
| `inLanguage`: `de` / `d` / fehlt | 64 / 19 / 4 |

Die statischen Seiten liegen in Git mit `commonMetadata`, aber mdparser
verwirft sie bei der Validierung: ihnen fehlen `name`, `description` und
`datePublished`. Die Startseite (`_index.md`) wird gar nicht erst gefunden.
`inLanguage: d` entsteht, wo das Frontmatter einen String statt einer Liste
trägt und mdparser `[0]` nimmt.

Der Hub hat heute eine Detailansicht unter `/[naddr]`, keine Übersicht,
keinen Cache — jede Anfrage geht ans Relay (Spec 03.09., „Abweichung von
CLAUDE.md"). Die Bildmigration steht bei 17 von 87 Beiträgen.

## Was sich gegenüber der Spec vom 31.08. ändert

1. **Vorhaben:** oer.community statt relilab. Wortmarke, Farben und Menü
   kommen von FOERBICO; relilab bleibt als dokumentierte, nicht betriebene
   Quelle (ADR-0026).
2. **Termine entfallen** aus dem Zuschnitt. FOERBICO hat keine, und eine
   Ansicht für einen leeren Bestand wäre eine angedeutete Funktion.
3. **Der Cache wird gebaut.** Die Regel „jede Anfrage rendert aus dem Cache,
   nie direkt aus dem Relay" gilt ab dieser Stufe wirklich (ADR-0028).
4. **URLs sind `d`**, nicht `naddr`. oer.community-Adressen bleiben gültig
   (ADR-0029).

Die vier Grundentscheidungen der Spec vom 31.08. — eigenes Projekt,
Kompatibilität im Protokoll, Server rendert, eigenes Designsystem — gelten
unverändert. Das Designsystem bekommt neue Werte, nicht ein neues Prinzip.

## Routen

| Route | Inhalt | Quelle im Spiegel |
|---|---|---|
| `/` | Startseite | `30023` mit `d = startseite` |
| `/[d]` | Seite oder Artikel, deutsch | `30023` mit diesem `d`, `inLanguage` nicht `en` |
| `/en/[d]` | Seite oder Artikel, englisch | `30023` mit diesem `d`, `inLanguage = en` |
| `/blog`, `/blog/seite/[n]` | Artikelübersicht, 20 je Seite, `published_at` absteigend | alle Artikel (keine Seiten) |
| `/themen` | alle Themen mit Anzahl | Themen der Artikel, normalisiert |
| `/themen/[thema]` | Artikel zu einem Thema | wie `/blog`, gefiltert |
| `/[d]/json` | Entwickleransicht, Rohdaten | wie bisher unter `/[naddr]/json` |
| `/[naddr]` | dauerhafte Weiterleitung (301) auf `/[d]` bzw. `/en/[d]` | Dekodierung wie bisher, Wächter aus ADR-0016 |
| `/feed.xml` | RSS 2.0 der Artikel, 20 neueste | alle Artikel |
| `/sitemap.xml` | alle Seiten und Artikel mit `lastmod` | alle `30023` |

**Regeln:**

- Ein `d` ist der letzte Pfadabschnitt der `commonMetadata.id`, also genau
  der Hugo-Pfad: `/canva` bleibt `/canva`, `/en/our-team` bleibt
  `/en/our-team`. Es gibt keinen Namensraum `/posts/`.
- `trailingSlash: 'ignore'` in SvelteKit: `/canva/` und `/canva` liefern
  dieselbe Seite. Kanonisch ist die Form ohne Schrägstrich; `<link
  rel="canonical">` sagt das.
- Ein `d`, das nur in der anderen Sprache existiert, leitet dorthin weiter.
  Ein `d`, das es nicht gibt, ist 404 mit Verweis auf `/blog`.
- Die Weiterleitung von `/[naddr]` gilt nur für Adressen der eigenen Quelle
  (Autor, Kind). Fremde `naddr` sind 404 wie bisher (ADR-0016). Wie ein
  Pfad als `naddr` erkannt wird: er beginnt mit `naddr1` und dekodiert
  fehlerfrei; alles andere ist ein `d`.
- `/en` ohne `d` leitet auf `/`. Eine englische Startseite gibt es nicht.
- Seiten und Artikel unterscheiden sich in der Darstellung (siehe
  „Darstellung"), nicht in der Route.

## Datenschicht: der Spiegel

`src/lib/services/spiegel.js` hält alle Events, die der Hub braucht, im
Speicher und auf der Platte. Er kennt die Oberfläche nicht. Loader lesen aus
ihm; **kein Loader und keine Route spricht mehr selbst mit einem Relay** —
das prüft der Architekturtest (ADR-0014).

### Inhalt

| Bestand | Filter | Regel beim Zusammenführen |
|---|---|---|
| Artikel und Seiten | `{ kinds:[30023], authors:[AUTOR] }` | neuestes `created_at` je `d`, Gleichstand kleinste `id` |
| Kuratierungslisten | `{ kinds:[30004], authors:[AUTOR] }` | dito |
| Profil | `{ kinds:[0], authors:[AUTOR] }` | neuestes `created_at` |
| Lizenznachweise | `{ kinds:[1063], "#x": [alle Hashes] }`, in Blöcken zu 50 Hashes | **alle** behalten; die Auswahl trifft `lizenzPruefen` (ADR-0013, ADR-0024) |
| Etags | `HEAD <bildUrl>` je Hash mit Nachweis | Wert je Hash |

„Alle Hashes" sind die `x`-Tags der Artikel plus die Hashes aus Hash-URLs
im `content` (`hashAusUrl`, dieselbe Regel wie mdparser und edufeed). Jede
Abfrage geht an **alle** konfigurierten Relays; der Nachweis liegt nicht
dort, wo der Artikel liegt (ADR-0013).

AMB-Events `kind:30142` werden nicht gespiegelt. Sie bleiben additiv
anschließbar; der Spiegel bekommt dann einen weiteren Bestand.

### Auffrischen

- Beim Start und danach alle `SPIEGEL_INTERVALL_S` Sekunden (Standard 600).
- Ein Lauf baut einen **vollständigen neuen Stand** und tauscht ihn atomar
  ein. Leser sehen nie einen halben Stand.
- Ein Lauf ist **gültig**, wenn mindestens ein Relay die Artikelabfrage mit
  EOSE beantwortet hat. Ein ungültiger Lauf ersetzt den alten Stand nicht.
- Jeder Stand trägt `zeitpunkt`, je Relay `erreicht: true|false`, die Zahl
  der Events je Bestand und die Dauer. Die Entwickleransicht zeigt das.
- Nach einem gültigen Lauf wird der Stand als JSON nach `SPIEGEL_PFAD`
  geschrieben (erst in eine temporäre Datei, dann umbenannt). Beim Start
  wird diese Datei zuerst geladen; so gibt es nach einem Neustart ohne
  Relay den letzten gültigen Stand mit seinem Alter.
- `hooks.server.js` startet den Spiegel und wartet auf den ersten Lauf,
  höchstens `SPIEGEL_STARTWARTEZEIT_S` Sekunden (Standard 20). Dauert er
  länger oder scheitert er, geht der Dienst trotzdem ans Netz — mit der
  Datei, oder leer mit Meldung.
- Größe: 87 Artikel mit Inhalt, 40 Nachweise, ein Profil, zwei Listen sind
  rund ein Megabyte. Ein Lauf braucht in der Messung vom 14.09. unter zehn
  Sekunden für drei Relays.

### Loader

- `artikelLaden({ d, sprache })`, `seitenLaden()`, `artikelListe({ thema,
  seite })`, `listeLaden(d)`, `profilLaden()` lesen aus dem Spiegel.
- `beitragLaden` behält Aufbau und Wächter; nur die Quelle wechselt. Die
  Entwickleransicht bekommt statt der Live-Abfrage den Stand des Spiegels
  (Zeitpunkt, erreichte Relays) — dieselbe Auskunft, nur ehrlich datiert.
- `lizenzPruefen` bleibt unverändert; sie bekommt die Nachweise zu einem
  Hash aus dem Spiegel statt vom Relay.

### Seite oder Artikel

Ein `30023` ist eine **Seite**, wenn es die Selbst-Labels
`["L","foerbico/typ"]` und `["l","seite","foerbico/typ"]` trägt (NIP-32,
Abschnitt „Self-Reporting"). Alles andere ist ein Artikel. Seiten
erscheinen nicht im Blog, nicht in den Themen, nicht im Feed; in der
Sitemap schon. Der Namensraum `foerbico/…` ist der aus ADR-0021
(`foerbico/review`, `foerbico/status`).

Warum ein Label und nicht die Zugehörigkeit zum Menü: Impressum und
Datenschutz stehen nicht im Menü, die englischen Seiten in keiner Liste.
Ein Merkmal am Event selbst ist unabhängig davon, wer es wo verlinkt.

### Themen

`src/lib/themen.js` liest `daten/themen.json`:

```json
{
  "Open Educational Resources (OER)": ["OER", "oer", "Open Educational Resources"],
  "OER-Communities": ["OER-Community", "OER Community"]
}
```

Schlüssel ist die Anzeigeform, die Liste sind Schreibweisen, die darauf
abgebildet werden. Themen, die in der Tabelle nicht vorkommen, bleiben, wie
sie sind. Jedes Thema hat einen URL-Slug (`themenSlug`: Kleinbuchstaben,
Umlaute aufgelöst, Rest zu Bindestrich); `/themen/oer-communities` findet
das Thema über den Slug. Die Tabelle ist Redaktionsarbeit: JSON, keine
Codeänderung, ein Test prüft nur, dass sie parsebar ist und kein Wert
doppelt vorkommt.

## Struktur aus Nostr

| Baustein | Event | Was der Hub liest |
|---|---|---|
| Hauptmenü | `kind:30004`, `d = navigation` | `a`-Tags in Reihenfolge; Beschriftung ist der `title` der referenzierten Seite |
| Fußzeilenlinks | `kind:30004`, `d = fusszeile` | dito |
| Wortmarke | `kind:0` | `name`, Rückfall `display_name` |
| Logo | `kind:0` | `picture` (Blossom-URL) |
| Fußtext | `kind:0` | `about` — Lizenzzeile und Förderhinweis, Markdown ohne Bilder |
| Domain | `kind:0` | `website`, für kanonische URLs und Feed |
| Startseite | `kind:30023`, `d = startseite` | Konvention wie `d = redaktion` |

**Regeln:**

- Das Menü zeigt die Seiten der Liste in ihrer Reihenfolge. Danach hängt
  der Hub seine eigenen Ansichten an: „Blog" und „Themen". Die sind keine
  Seiten, sondern Ansichten des Hubs; sie gehören ihm, nicht der Liste.
- Ein `a`-Tag, dessen Ziel nicht im Spiegel liegt, wird übersprungen und in
  der Entwickleransicht genannt.
- Die Startseite steht nicht im Menü; Logo und Wortmarke verlinken dorthin.
- Fehlt die Liste `navigation`, zeigt die Kopfzeile nur Logo, Wortmarke,
  „Blog" und „Themen". Fehlt `fusszeile`, fehlen die Links. Fehlt die
  Startseite, zeigt `/` die Artikelübersicht mit einem Hinweis für die
  Redaktion, welches Event erwartet wird. Nie eine leere Fläche ohne
  Erklärung.
- Menüpunkte heißen wie ihre Seiten. Heute weichen drei Hugo-Beschriftungen
  ab („Was ist OER?" → „OER und OEP", „Team" → „Unser Team", „Startseite"
  entfällt). Wer die Beschriftung will, ändert den Seitentitel in Git.

## Bilder

Alle bestehenden Regeln gelten (ADR-0015, 0022, 0023, 0024, 0025). Neu:

**Abgelöste Hosts** (ADR-0030). `ABGELOESTE_HOSTS` (Standard
`oer.community`) nennt Hosts, die der Hub ersetzt. Bilder von dort werden
behandelt wie relative Pfade: entfernt, gezählt, in der Entwickleransicht
gelistet. Ein `image`-Tag von dort ist kein Cover. Begründung: Sobald Hugo
steht, sind diese URLs tot; ein Bild, das nicht kommt, ist schlechter als
keins, und die Zahl ist die Redaktionsliste (heute 64 Beiträge).

Die vier Logos der Startseite (`/images/FOERBICO.png` usw.) sind relative
Pfade und fallen unter ADR-0015, bis sie auf Blossom liegen.

## Darstellung

**Designsystem** (ADR-0031): Die FOERBICO-Werte aus
`Website/Design/styleguide.md` ersetzen die relilab-Tokens.

```css
:root{
  --fb-primaer:     #203a8f;  /* Marke, Links, aktive Zustände */
  --fb-akzent:      #ffa500;  /* Rahmen, Hervorhebung, Hover */
  --fb-ueberschrift:#002366;
  --fb-text:        #333333;
  --fb-rahmen:      #d3d3d3;
  --fb-flaeche:     #f0f8ff;  /* Karten, Fußzeile */
  --fb-flaeche-2:   #e6f2ff;  /* Kopfzeile */
  --fb-weiss:       #ffffff;
}
```

Schrift: Roboto Condensed für alles, lokal aus `static/schriften` (liegt
schon dort). Yanone Kaffeesatz und Roboto entfallen samt Dateien. Die
Kontrastentscheidungen aus ADR-0018 gelten für diese Werte nicht; Text auf
`--fb-akzent` ist immer dunkel (`#002366`), nie weiß — Orange auf Weiß
trägt keinen weißen Text.

**Kopfzeile:** Logo (aus `kind:0`), Wortmarke, Menü. Auf schmalen Bildschirmen
bricht das Menü um; kein Hamburger, kein JavaScript.

**Übersicht** (`/blog`, `/themen/[thema]`): Karten untereinander wie
PaperMod. Je Karte Cover (nur mit Hash-URL, sonst ohne Bild), Titel, Datum,
Anriss (`summary`), Themen als Links. Seitenzahlen unten.

**Artikel:** wie heute — Cover mit Lizenzzeile, Datum, Themen, Inhalt mit
Fließtextbildern und Nachweisen, Entwickleransicht am Ende.

**Seite:** Titel und Inhalt. Kein Datum, keine Themen, kein Cover. Die
Entwickleransicht gibt es auch hier.

**Fußzeile:** Fußtext aus `kind:0 about`, Links aus `fusszeile`, der
Debug-Schalter wie bisher, dazu der Stand des Spiegels, wenn der letzte Lauf
fehlgeschlagen ist: „Stand: vor 3 Stunden — kein Relay erreichbar."

`<title>` ist `<Seitentitel> · <Wortmarke>`, auf der Startseite nur die
Wortmarke. OG-Tags wie bisher aus Titel, Anriss und Cover.

## Fehlerfälle

| Lage | Verhalten |
|---|---|
| Kein Relay erreichbar, Datei vorhanden | letzter Stand, Alter in der Fußzeile |
| Kein Relay erreichbar, keine Datei | jede Route zeigt: „Noch keine Inhalte geladen. Gefragt wurden: …" mit den Relays und dem Hinweis, dass der Dienst es weiter versucht |
| Relay erreichbar, kein Artikel des Autors | dieselbe Meldung, mit dem Autor statt der Relays |
| Menü, Fußzeile oder Startseite fehlen | Rückfall wie unter „Struktur aus Nostr", Hinweis in der Entwickleransicht |
| `d` unbekannt | 404 mit Verweis auf `/blog` |
| `naddr` fremder Quelle | 404 (ADR-0016) |
| Pflichtwert der Konfiguration fehlt | Start bricht ab (`konfigLesen`) |
| Ein Relay antwortet, ein anderes nicht | Lauf gültig; Entwickleransicht nennt das stumme Relay; Nachweise, die nur dort liegen, fehlen bis zum nächsten Lauf — kein anderes Verhalten als heute |

## Voraussetzungen in Nachbar-Repos

Der Hub zeigt, was publiziert ist. Diese Arbeiten liegen außerhalb dieses
Repos und werden dort als eigene Vorhaben eingeplant. Bis sie gelandet
sind, zeigt der Hub live die Rückfälle aus „Struktur aus Nostr" und wird
gegen Fixtures mit einem Testschlüssel geprüft.

| Nr | Repo | Was | Warum |
|---|---|---|---|
| 1 | FOERBICO (Git) | Sieben Seiten bekommen `name`, `description`, `datePublished`; Startseite als `content/de/startseite/index.md` mit `id: https://oer.community/startseite` | sonst verwirft mdparser sie |
| 2 | mdparser | Für `type: 'page'` die Selbst-Labels `["L","foerbico/typ"]`, `["l","seite","foerbico/typ"]` ans 30023; Contract `event-tag-mapping` ergänzen | Seite erkennbar |
| 3 | mdparser | `inLanguage` als String akzeptieren (19 Artikel tragen `d`) | Sprache stimmt |
| 4 | mdparser | `sync navigation`: publiziert `30004 d=navigation` und `d=fusszeile` aus `Website/navigation.yaml` (Liste von `d`), bis Hugo steht wahlweise aus `hugo.yaml` `menu.main` | Menü aus Nostr |
| 5 | Bunker / edufeed-app | `kind:0` `about` mit Lizenzzeile und Förderhinweis füllen | Fußtext |
| 6 | FOERBICO (Git) | Vier Site-Logos in `bildmigration.md` aufnehmen und über den `# bilder`-Block auf Blossom heben | Startseite mit Bildern |

Bis Punkt 2 gelandet ist, kann der Hub eine Seite nicht von einem Artikel
unterscheiden. Deshalb kommt Stufe 2 der Umsetzung erst gegen Fixtures
und geht live, sobald das erste gelabelte Event auf dem Relay liegt.

## Tests

- **Spiegel:** Mock-Relay aus Fixtures, wie bisher `eventsHolen`
  austauschbar. Geprüft werden: Zusammenführen ersetzbarer Events,
  Nachweise über alle Relays, ungültiger Lauf ersetzt nicht, Datei wird
  geschrieben und beim Start gelesen, atomarer Tausch, Alter.
- **Loader und Modelle:** Seite-oder-Artikel über das Label, Themen-Tabelle,
  Slugs, Sortierung, Seitenzahlen, abgelöste Hosts.
- **Routen und Komponenten** mit `svelte/server` (ADR-0003): Kopfzeile mit
  und ohne Liste, Fußzeile mit und ohne Profil, Übersichtskarte, Seite ohne
  Datum, 404, Weiterleitung `naddr` → `d`, Feed und Sitemap als gültiges
  XML.
- **Architektur:** kein Import von `services/relay.js` außerhalb von
  `services/spiegel.js` und dessen Tests; die bestehenden Regeln bleiben.
- **Fixtures:** Die echten Events bleiben. Für Seiten, Listen und das
  gefüllte Profil kommen signierte Events eines **Testschlüssels** hinzu
  (`test/fixtures/testquelle/`), erzeugt mit einem Skript im Repo, das im
  README steht. Tests setzen `QUELLE_AUTOR` auf den Testschlüssel. Sobald
  die echten Events publiziert sind, werden sie als weitere Fixtures
  aufgenommen; die Testschlüssel-Fixtures bleiben, weil sie Fälle abdecken,
  die der Bestand nicht hat.
- `pnpm lint` und `pnpm test:e2e` aus CLAUDE.md existieren nicht. Das ist
  ein offener Punkt, kein Teil dieser Stufe; CLAUDE.md wird entsprechend
  ehrlich gemacht.

## Konfiguration

Neu in `.env.example`:

```
SPIEGEL_PFAD=daten/spiegel.json
SPIEGEL_INTERVALL_S=600
SPIEGEL_STARTWARTEZEIT_S=20
ABGELOESTE_HOSTS=oer.community
STARTSEITE_D=startseite
NAVIGATION_D=navigation
FUSSZEILE_D=fusszeile
```

Die drei `_D`-Werte sind Konventionen mit Standard, damit ein zweiter
Mandant andere Namen wählen kann. `QUELLE_AUTOR`, `QUELLE_H_TAG`, `RELAYS`,
`BLOSSOM_URL` bleiben. `RELAYS` bekommt in der Vorlage alle drei Relays.

## Umsetzung in Stufen

Jede Stufe ist für sich lauffähig und wird gemerged, bevor die nächste
beginnt.

1. **Spiegel, Blog, `/[d]`, Themen** — gegen die heutigen Daten. Danach
   zeigt der Hub erstmals eine Übersicht und rendert nie mehr direkt vom
   Relay. `/[naddr]` leitet weiter.
2. **Seiten, Menü, Fußzeile, Startseite, `/en/`** — gegen
   Testschlüssel-Fixtures; live erscheint, was publiziert wird.
3. **FOERBICO-Gestaltung** — Tokens, Kopfzeile, Karten, Schriften bereinigt,
   `designsystem.md` neu.
4. **Feed, Sitemap, kanonische URLs, `trailingSlash`.**

CLAUDE.md, `designsystem.md` und `betrieb.md` werden mit der jeweiligen Stufe
nachgezogen; STATUS.md bekommt je Stufe einen Eintrag.

## Nicht dabei

Suche · Kommentare (NIP-22) · Dunkelmodus · Sprachumschalter · englische
Startseite · AMB-Anzeige · Termine · eigener Editor · Schreiben jeder Art ·
Bilder von abgelösten Hosts durchreichen · Normalisierung der Themen in
Nostr (bleibt Datei) · `pnpm lint`/`test:e2e` einrichten.

## Entscheidungen

| ADR | Entscheidung |
|---|---|
| 0026 | oer.community wird das Vorhaben; Termine entfallen; ersetzt ADR-0019 |
| 0027 | Seitenstruktur aus Nostr: Seiten mit Selbst-Label, Menü und Fußzeile als `30004`, Kopf und Fuß aus `kind:0` |
| 0028 | Spiegel im Prozess mit Datei statt Live-Abfrage |
| 0029 | URLs sind `d`; `naddr` leitet weiter |
| 0030 | Abgelöste Bild-Hosts gelten als unaufgelöst |
| 0031 | FOERBICO-Designsystem ersetzt die relilab-Werte; ersetzt ADR-0018 |
