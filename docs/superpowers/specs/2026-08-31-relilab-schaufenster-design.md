# relilab-Client: Schaufenster auf Nostr

**Stand:** 31.08.2026 · **Ziel:** `dev.relilab.org`

## Worum es geht

Ein lesender Client, der die bereits nach Nostr konvertierten relilab-Inhalte
anzeigt — Artikel und Termine — in der Optik von relilab.org. Er ist der erste
Schritt, WordPress abzulösen: Wenn die Ansicht überzeugt, kann die Redaktion
später das Publikationswerkzeug wechseln, ohne dass das Schaufenster etwas merkt.

**Nicht Teil dieses Vorhabens:** Anmeldung, Autorenwerkzeuge, Communities, Wiki,
Nachrichten, Verwaltung. Termine und Lernmodule entstehen anderswo. Was es nicht
gibt, wird auch nicht angedeutet — keine Bedienung anbieten, die dann scheitert.

Der Materialpool (AMB, `kind:30142`) ist als spätere Integration vorgesehen und
wird hier nur so weit berücksichtigt, dass er additiv anschließbar bleibt.

## Ausgangslage (geprüft am 31.08.2026)

Gegen `wss://relay.edufeed.org` abgefragt, nicht angenommen:

| Befund | Wert |
|---|---|
| Events unter dem Termine-Bot | 111 |
| davon Artikel (`kind:30023`) | 61 |
| davon Termine (`kind:31923`) | 50 — davon 49 in der Zukunft |
| Zeitraum | 01.01.2025 bis 24.08.2026 |
| verschiedene `t`-Themen | 195 |
| Bilder | 56, **alle** auf relilab.org |

**Schlüssel:**

- Termine-Bot (Absender):
  `npub17mq54dad6ewkrnunzx5xs4t4c0edur99gz7ymhu3dam0pz034fpsxjqk3d`
  = `f6c14ab7add65d61cf9311a8685575c3f2de0ca540bc4ddf916f76f089f1aa43`
- relilab-Community (Zuordnung über `h`-Tag):
  `npub1fpcxaz2wvjl90gjs60x37ny2pa5u4yqfx7fklz73rgfjnnfujl3sr2fxgk`
  = `48706e894e64be57a250d3cd1f4c8a0f69ca900937936f8bd11a1329cd3c97e3`

Unter dem Community-Key selbst liegen keine Events; er dient ausschließlich der
Zuordnung.

## Die vier Entscheidungen, die alles andere bestimmen

### 1. Eigenes Projekt, nicht Fork und nicht Deployment-Variante

edufeed-app (`dev`-Branch) umfasst 277.000 Zeilen und 548 Komponenten. Das
Schaufenster braucht davon etwa fünfzehn. Es ist zwar funktional weitreichend
konfigurierbar (138 Umgebungsvariablen, u. a. `GROUPS_ENABLED`,
`MEMBERSHIP_ENABLED`, `CURATED_PUBKEYS_*`), aber das **Design-Whitelabeling ist
rudimentär**: fünf DaisyUI-Themes, kein relilab-Theme, und die Seitenstruktur
bleibt in jedem Fall die von edufeed.

„Merkbar unterscheiden" und „komplett abgespeckt" sind Struktureingriffe, keine
Konfigurationswerte. 95 % einer Anwendung per Flag stillzulegen ist mehr Arbeit
als ein Neubau und hinterlässt eine Codebasis, in der niemand mehr weiß, was
aktiv ist.

**Also: eigenes Repository, gleicher Stack.**

### 2. Kompatibilität liegt im Protokoll, nicht im Code

Der relilab-Client ist edufeed-kompatibel, weil er dieselben Events liest:
gleiche Kinds, gleiche Relays, gleiche Tag-Konventionen, `naddr`-Adressen, die in
beiden Clients auflösen. Nicht, weil er dieselben Funktionen aufruft.

Die Nostr-Schicht liegt trotzdem isoliert in `src/lib/nostr/` mit den
Bezeichnern von edufeed-app, damit ein späteres gemeinsames Paket ein
Verschieben ist und kein Umschreiben. **Regel: Nichts unter `src/lib/nostr/`
importiert eine Komponente oder eine Route.** Diese Grenze erodiert beim ersten
„nur schnell hier importieren" — deshalb steht sie im `CLAUDE.md`.

### 3. Server rendert Inhalt mit, Client übernimmt danach

edufeed-app rendert **nicht** serverseitig: null `+page.server.js`, 41
`+page.js` (Stand `origin/main`, August 2026). Link-Vorschauen und Permalinks löst es über den Hook
`ogMetaHandle` (`src/lib/server/og.js`, 701 Zeilen) — der Server holt bei jeder
Anfrage das Event vom Relay, extrahiert Titel, Anriss und Bild und injiziert
OG-Tags vor `</head>`, mit Cache für Treffer und Fehltreffer.

**Warum edufeed so gebaut ist, steht in der Historie** — und es war keine
Entscheidung gegen serverseitiges Rendern, sondern eine Fehlerbehebung.
Commit `b1a6c48` (10.03.2026): „Fix 404 on direct naddr URL navigation by
disabling SSR — Routes using fetchEventById depend on client-side Nostr
infrastructure (EventStore, relay pool) which isn't available during SSR."
Direkte `naddr`-Links warfen 404, weil die Nostr-Schicht clientseitig gewachsen
war. Das schnellste Mittel war `ssr = false` in drei Routen. Einen Monat
später kamen die OG-Tags dazu — ohne SSR haben geteilte Links keine Vorschau —
und wuchsen bis Juli 2026 auf die heutigen 701 Zeilen. Inzwischen steht
`ssr = false` in **40** Routen.

`og.js` ist damit nicht die Vorlage, sondern der Preis: 701 Zeilen, die den
Server das Event holen lassen, um am Ende drei Metadatenfelder zu behalten und
den Text zu verwerfen.

**Also:** derselbe Hook-Ansatz, aber der Server rendert den Inhalt gleich mit.
Er holt das Event ohnehin; es im HTML zu belassen statt zu verwerfen ist der
kleine Schritt von „Vorschau funktioniert" zu „Suchmaschine sieht den Artikel".
Listenseiten nutzen `+page.server.js` gegen denselben Server-Cache.

**Der Grund ist nicht SEO.** Auffindbarkeit ist nur einer von vier Punkten, und
für ein Schaufenster nicht einmal der wichtigste:

1. **Weniger Code, nicht mehr.** Der Server-Cache steht ohnehin (siehe
   Datenfluss). Clientseitiges Rendern bräuchte ihn **zusätzlich** zu einer
   zweiten Datenschicht im Browser, die dasselbe Relay noch einmal abfragt —
   genau die doppelte Fehlerquelle, die weiter unten für die Live-Aktualisierung
   abgelehnt wird.
2. **Lesbar ohne JavaScript** — Screenreader, restriktive Schulnetze, alte
   Geräte. Bei einer Bildungsplattform kein Randfall.
3. **Ein Umlauf statt vier.** Clientseitig: HTML, dann JS, dann WebSocket zum
   Relay, dann Events abwarten, dann rendern.
4. **Fehlerfälle bleiben einfach.** „Letzter gültiger Stand mit Hinweis auf sein
   Alter" ist serverseitig ein Cache-Zugriff; clientseitig braucht es
   Ladezustände, Wiederholungslogik und Fehlerbanner in jeder Komponente.

Die edufeed-Variante wäre die Übernahme einer Umgehung für ein Problem, das
dieses Projekt nicht hat: Die Nostr-Schicht ist noch nicht geschrieben und wird
nach der Regel aus Entscheidung 2 serverfähig gebaut. Gegen SSR spräche
personalisierter oder sekündlich wechselnder Inhalt — beides trifft nicht zu
(111 Events, täglicher Rhythmus).

### 4. Eigenes Theme nach dem Designsystem FOERBICO × rpi-virtuell

Maßgeblich ist das **Farbfusion- und Typografie-Konzept v2** für den
Community-Hub ([Farbkarte][fk], Februar 2026). Es ordnet relilab als
Tochtermarke von rpi-virtuell ein und legt Farben, Schriftrollen und
Einsatzregeln fest.

[fk]: https://rpi-virtuell.github.io/FOERBICO_und_rpi-virtuell/farbkarte-komplementaer.html

**Dies ersetzt die frühere Ableitung aus relilab.org.** Zuvor stand hier das
Blocksy-Theme der WordPress-Seite als Quelle, mit `#2872fa` als Primärfarbe und
Roboto Condensed als ausdrücklich falscher, weil rpi-eigener Schrift. Beides
gilt nicht mehr: Die Farbkarte setzt relilab auf `#34B2F6` und weist Condensed
eine eigene Rolle zu. Wo Ist-Zustand und Designsystem sich widersprechen,
gewinnt das Designsystem — das Schaufenster soll nicht die alte Seite
nachbauen, sondern in die gemeinsame Markenwelt passen.

```
--relilab:      #34b2f6   Primärfarbe
--relilab-tief: #1a8fd0   Verweise und Hover auf hellem Grund
--magenta:      #d225f8   Endpunkt des relilab-Gradienten
--amber:        #f29422   Primärakzent: Aktionen, Filter, Hervorhebungen
--pink:         #e54d9a   Community-Events, partizipative Formate
--mint:         #2ecc88   Funktionsfarbe: Erfolg, Status
--fau:          #04316a   dunkelster Ton: Fußzeile, Schrift auf Farbflächen
--rl-text:      #1a1e2e   Fließtext
--rl-text-leise:#5a6178   Metazeilen
--rl-linie:     #e6e9f2
--rl-flaeche:   #f6f7fb
--rl-flaeche-2: #eef0f7
Container:      max. 1499px
Kopfzeilenhöhe: 120px
```

**Drei Schriften, drei Rollen** — die Aufteilung ist Teil des Systems, nicht
Geschmack:

| Schrift | Rolle | Herkunft |
|---|---|---|
| Yanone Kaffeesatz | Headlines, Display, Community-Bereiche | Community |
| Roboto Condensed | Navigation, Labels, Marker, Metazeilen | FOERBICO |
| Roboto | Fließtext, Beschreibungen | rpi-virtuell |

**Einsatzregeln der Akzente:** Amber für Aktionen und aktive Zustände, Pink für
Termine und Community-Formate, der Gradient `#34B2F6 → #D225F8` als
relilab-Submarke (Wortmarke, Aufmacher), Mint für Statusmeldungen.

**Schrift auf Farbflächen.** Weiß erreicht auf `#34B2F6` nur 2,37:1 und auf
Amber 2,32:1 — beides unter den 4,5:1, die normaler Text nach WCAG AA braucht.
Aktive Zustände tragen deshalb `--fau` als Textfarbe (5,35:1 bzw. 5,47:1). Die
Palette bleibt unverändert; das betrifft allein die Schrift darauf. Die
Farbkarte trifft dazu keine Aussage, also ist es eine Festlegung dieses
Projekts.

Die Werte werden **kopiert, nicht verlinkt** — weder das WordPress-Stylesheet
noch die Farbkarte werden zur Laufzeit geladen. Würde der Client das
WordPress-Stylesheet laden, wäre WordPress nicht überflüssig, sondern
Voraussetzung.

## Datenmodell

### Artikel — `kind:30023` (NIP-23)

| Tag | Inhalt | Verwendung |
|---|---|---|
| `d` | Quell-URL auf relilab.org | Identität, Rückverweis, Umleitung von Altlinks |
| `title` | Titel | Überschrift, `<title>`, OG |
| `summary` | Anriss | Kartentext, Meta-Description |
| `image` | Beitragsbild | Karte, Kopf der Detailseite |
| `published_at` | Erstveröffentlichung | Anzeigedatum — **nicht** `created_at` |
| `t` | Themen (mehrfach) | Filter |
| `h` | Community-Key | Zugehörigkeit zu relilab |

### Termine — `kind:31923` (NIP-52, zeitgebunden)

Zusätzlich `start`/`end` als Unix-Zeit mit `start_tzid`/`end_tzid`
(`Europe/Berlin`), häufig `location`. Kein `published_at`.

`kind:31922` (ganztägig) kommt in den Daten nicht vor, wird aber mitgelesen —
NIP-52 sieht es vor und es kostet nichts.

### Die zentrale Abfrage

```json
{ "kinds": [30023, 31922, 31923],
  "authors": ["f6c14ab7add65d61cf9311a8685575c3f2de0ca540bc4ddf916f76f089f1aa43"],
  "#h":      ["48706e894e64be57a250d3cd1f4c8a0f69ca900937936f8bd11a1329cd3c97e3"] }
```

Geprüft: liefert exakt die 111 Events.

**Beide Kriterien zusammen, nicht eines davon.** `authors` allein zöge künftige
Bot-Inhalte anderer Mandanten mit; `#h` allein ließe jeden herein, der auf den
Community-Key taggt. Beide Werte kommen aus der Konfiguration, nicht aus dem Code.

### Sortierung

- Artikel: `published_at` absteigend
- Termine kommend: `start` aufsteigend (nächster zuerst)
- Termine vergangen: `start` absteigend

## Bekannte Eigenheiten der Daten

**Content-Rückstände.** In Artikeln stehen eine Autorenzeile als Blockquote
(`> Erstellt von: [Name](…)`) und CSS-Reste des Kadence-Plugins
(`.kb-table-of-content-nav…`) im Markdown. Der Client **säubert beim Rendern**
und ändert keine Events — sie sind unveränderlich, und der Bot ist nicht unser
Code. Die Autorenzeile wird nicht verworfen, sondern als strukturierte Angabe
„von X, ursprünglich auf relilab.org" ausgewertet.

**195 Themen.** Mit Tippfehlern („Chirstentum", „Unterrrichtspraxis") und
Dubletten („material4you" / „#Material4you"). Ein Filter mit 195 Einträgen ist
unbenutzbar. Der Client bekommt eine **Normalisierungstabelle**: kleingeschrieben,
`#` entfernt, bekannte Schreibfehler zusammengeführt, dazu eine kuratierte Liste
der als Filter angebotenen Themen. Der Rest bleibt am Artikel sichtbar, aber
nicht filterbar. Diese Tabelle ist Redaktionsarbeit, kein Code — sie gehört in
eine Datei, die ohne Entwickler änderbar ist.

**Alle Bilder liegen auf relilab.org**, und zwar als `-150x150`-Thumbnails.
Zwei Folgen: Das Schaufenster bleibt an WordPress gekoppelt, und die Bilder sind
für Kartenansichten zu klein. Der Client zeigt sie zunächst so an. Die
dauerhafte Lösung — Bilder auf einen Blossom-Server spiegeln und im Event
verweisen — liegt beim Bot, nicht beim Client, und ist als eigener Vorgang zu
führen.

## Aufbau

```
relilab-client/
├─ CLAUDE.md                 Projektgedächtnis: Entscheidungen, Stolpersteine
├─ docs/superpowers/
│  ├─ specs/                 YYYY-MM-DD-<thema>-design.md
│  └─ plans/                 YYYY-MM-DD-<thema>.md
├─ mockup/index.html         Gestaltungsabstimmung: eine Datei, Daten
│                            eingebettet, rendert im Browser — der Client
│                            selbst rendert serverseitig (Entscheidung 3)
├─ src/
│  ├─ app.css                Theme relilab + Tokens
│  ├─ app.html
│  ├─ hooks.server.js        Inhalt + OG-Tags einsetzen (nach og.js-Vorbild)
│  ├─ lib/
│  │  ├─ nostr/              ── ISOLIERT, kandidiert für gemeinsames Paket ──
│  │  │  ├─ pool.js          Relay-Verbindung, Zeitschranke
│  │  │  ├─ loaders.js       Abfragen für Artikel und Termine
│  │  │  ├─ modelle.js       Event → Artikel/Termin, Tags auslesen
│  │  │  └─ inhalt.js        Markdown säubern, Autorenzeile auswerten
│  │  ├─ themen.js           Normalisierung der t-Tags
│  │  ├─ konfig.js           Env einlesen und prüfen
│  │  ├─ cache.js            Server-Cache mit Alter
│  │  └─ komponenten/        Karte, Terminkarte, Kopf, Fuss, Themenfilter
│  └─ routes/
│     ├─ +layout.svelte
│     ├─ +page.server.js     Startseite
│     ├─ termine/            Liste
│     ├─ artikel/            Liste
│     └─ [naddr]/            Detailansicht
├─ e2e/                      Playwright
├─ test/fixtures/            die 111 echten Events als Prüfdaten
├─ static/                   Logo, Favicons, Schriften
├─ .env.example
├─ Dockerfile
└─ docker-compose.yml
```

### Ansichten

1. **Startseite** — Aktuelles aus Artikeln, kommende Termine
2. **Terminliste** — kommend/vergangen, nach Datum, Themenfilter
3. **Artikelliste** — Lernmodule und Beiträge, Themenfilter
4. **Detailansicht** — Artikel bzw. Termin unter stabiler `naddr`-Adresse

### Adressen

`/[naddr]` für Detailseiten, kompatibel zu edufeed-app (dort `[naddr=naddr]`) —
Links funktionieren zwischen beiden Clients. Zusätzlich leitet die alte
relilab.org-URL aus dem `d`-Tag auf die passende Detailseite um, damit
Bestandslinks gültig bleiben, wenn WordPress abgelöst wird.

### Was Server und was Browser tut

Alle vier Ansichten werden **vollständig serverseitig gerendert** — Inhalt,
nicht nur Metadaten. Der Browser bekommt fertiges HTML und braucht kein
JavaScript, um zu lesen. Client-seitig laufen nur Bedienelemente:
Themenfilter, Umschalten kommend/vergangen. Eine Live-Aktualisierung über eine
offene Relay-Verbindung im Browser gibt es **nicht** — die Inhalte ändern sich
täglich, nicht sekündlich, und eine zweite Datenschicht wäre doppelte
Fehlerquelle ohne Gegenwert.

### Datenfluss

Start → `konfig.js` prüft Pflichtwerte (fehlt der Community-Key, **bricht der
Start mit klarer Meldung ab**, statt später leere Seiten zu liefern) →
`pool.js` verbindet → `loaders.js` holt Artikel und Termine → `cache.js` hält
sie mit Zeitstempel → Hintergrundabgleich in Intervallen → jede Anfrage rendert
aus dem Cache, nie direkt aus dem Relay.

### Fehlerfälle

Antwortet kein Relay, zeigt die Seite den letzten gültigen Stand mit Hinweis auf
sein Alter. Ist der Cache leer, erscheint eine Meldung, die das Relay nennt und
sagt, was zu tun ist. **Nie eine leere Liste ohne Erklärung** — ein stumm leeres
Brett lässt den Fehler bei den Daten suchen statt bei der Verbindung.

## Technik

Wie edufeed-app, damit Erfahrung und später Code wandern können:

| Bereich | Wahl |
|---|---|
| Framework | SvelteKit 2 + Svelte 5 (Runes) |
| Stil | TailwindCSS 4 + DaisyUI 5 |
| Sprache | JavaScript mit JSDoc, `checkJs` **und** `strict` über `svelte-check` |
| Paketverwaltung | pnpm |
| Nostr | `nostr-tools` für `naddr`-Kodierung und Signaturprüfung, `applesauce-common/helpers` für NIP-23/NIP-52-Felder; die Relay-Abfrage selbst ist eigener, schlanker Servercode |
| Adapter | `@sveltejs/adapter-node` |
| Betrieb | Docker + Traefik |
| Prüfen | Vitest (`node` und `jsdom`), Playwright, Prettier, ESLint, Husky |

**Ohne Paraglide/inlang.** relilab.org ist einsprachig deutsch; Mehrsprachigkeit
kostet Aufwand pro Textzeile und ist nachrüstbar. Oberfläche und Code auf
Deutsch — Ausnahme ist, was der Nostr-Spezifikation gehört (`kind`, `tags`,
`naddr`, `d`, `h`, `t`).

## Arbeitsprozess

Superpowers, wie in edufeed-app etabliert: Brainstorming → Spec → Plan →
TDD-Umsetzung → Review. Spezifikationen unter `docs/superpowers/specs/`, Pläne
unter `docs/superpowers/plans/`, benannt `YYYY-MM-DD-<thema>`.

**Branches:** `dev` als Arbeitsbranch, `feat/<thema>` je Vorhaben, `main` als
freigegebener Stand.

**Umgebungen:**

| Umgebung | Zweck | Quelle | Datenquelle |
|---|---|---|---|
| lokal (`pnpm dev`) | Entwicklung | Arbeitskopie | `relay.edufeed.org` |
| `dev.relilab.org` | dynamischste Umgebung | `dev` | `relay.edufeed.org` |
| `int.relilab.org` | Integration, Abnahme | `main` | später `relay.relilab.org` |
| `relilab.org` | heute WordPress | — | — |

**Vor jedem Merge:** `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm test:e2e`.

**Prüfen ohne fremde Infrastruktur:** Ein Mock-Relay liefert die 111 echten
Events aus `test/fixtures/` aus. Damit laufen Tests ohne Netz und ohne
Abhängigkeit von der Publikationstätigkeit anderer. Neue Funktionen kommen mit
einer Prüfung.

## Was betrieblich fehlt

Kein Entwicklungs-, sondern ein Einrichtungsauftrag — blockiert den Livegang:

1. **DNS für `dev.relilab.org`** — existiert nicht. `int.relilab.org` und
   `relay.relilab.org` zeigen bereits auf `88.99.213.122`.
2. **`relay.relilab.org` ist kein Relay** — dort antwortet ein leeres
   Apache-Dokument mit `Last-Modified` vom 27.11.2024.
3. **Das TLS-Zertifikat dort ist auf `rpivirt02.intranda.com` ausgestellt** —
   jeder Browser bricht die WebSocket-Verbindung ab.
4. **Docker-Host mit Traefik** für beide Umgebungen.

Bis 2. und 3. erledigt sind, arbeitet der Client gegen `relay.edufeed.org`
(strfry 1.1.0, gültiges Zertifikat, geprüft). Die Relay-Adresse ist
Konfiguration, kein Code.

## Offene Punkte

**Wie nah kommt „1:1"?** Die größte Unbekannte. Farben, Schriften und Abstände
sind Tokens; ein abweichendes Kartenraster oder eine andere Kopfzeile sind
Komponentenarbeit. **Erste Aufgabe nach dieser Spec ist eine Untersuchung, keine
Schätzung:** Seitenteile von relilab.org durchgehen und festhalten, was Token
und was Komponente ist.

**Wachstum.** 111 Events sind mühelos. Spiegelt relilab dauerhaft alle Inhalte,
werden es Tausende — dann braucht die Abfrage Blättern über `until`. Einzuplanen,
nicht vorwegzunehmen.

**Bilder.** Siehe oben — Lösung liegt beim Bot, nicht beim Client.

**Materialpool.** `kind:30142` (AMB) gegen `AMB_RELAYS`, später und additiv.
edufeed-app hat dafür Vokabulare (`SCHEME_NADDR_*`) und Suche mit NIP-50; beides
ist Vorlage, wenn es so weit ist.
