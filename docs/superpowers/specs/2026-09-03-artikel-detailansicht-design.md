# Artikel-Detailansicht: der erste Durchstich

**Stand:** 03.09.2026 · **Ziel:** eine Route, die einen echten Artikel
mit nachgewiesener Bildlizenz zeigt

## Worum es geht

Der erste lauffähige Code des community-hub. **Eine** Ansicht: die
Detailansicht eines Artikels unter seiner `naddr`-Adresse. Keine Liste,
keine Startseite.

Der Zuschnitt ist bewusst so eng. Die Detailansicht ist die Stelle, an
der die Bildlizenz zählt — auf Karten ist ein Bild klein und die
Lizenzzeile Beiwerk, im Detail ist es groß und die Nennung Pflicht. Und
es gibt genau einen Artikel im Bestand, der die Kette aus ADR-0013
vollständig durchläuft. An dem wird sie gebaut.

**Referenzfall:**

```
naddr1qvzqqqr4gupzqksjks0vzk6xvvs73rphr03dc37eryleeza6f2cfl3gqgk7ntt
klqyv8wumn8ghj7un9d3shjtn9v36kvet9vshx7un89uqp5erfv5kkkunpve6z6er9wg
kkwetdv45kuumrdpskvaqntfdpj
```

löst auf zu `kind:30023`, Autor `5a12b41e…`, `d` =
`die-kraft-der-gemeinschaft`, Relay-Hinweis `wss://relay.edufeed.org/`.

## Erwartetes Ergebnis

Titel „Die Kraft der Gemeinschaft: Wahre Stärke liegt nicht in
Strukturen, sondern in Prozessen", Datum aus `published_at`, der
Fließtext, das Blossom-Bild in voller Größe (1500×1500) und darunter:

> nosTr-schrein — Comenius-Institut, [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)

Das relative `![](nosTr-schrein.jpg)` im Markdown verschwindet und wird
gezählt. Die Seite ist ohne JavaScript vollständig lesbar (ADR-0003).

## Abweichung von CLAUDE.md: kein Cache

CLAUDE.md verlangt: „Jede Anfrage rendert aus dem Cache, **nie** direkt
aus dem Relay." **Dieser Durchstich fragt direkt ab.**

Entschieden am 03.09.2026. Begründung: Der erste Durchstich soll die
echte Kette ungefiltert zeigen — ein Cache verdeckt beim Bauen genau
die Fehler, die man sehen will (welches Relay antwortet, wie lange,
was fehlt).

**Diese Abweichung ist befristet.** Sie gilt für diese eine Route und
endet mit dem nächsten Schritt (Liste oder Startseite): Sobald eine
Ansicht mehrere Events lädt, wird ohne Cache jeder Aufruf zu einer
Handvoll Relay-Roundtrips, und die Fehlerfälle aus CLAUDE.md („letzter
gültiger Stand mit Hinweis auf sein Alter") lassen sich ohne Cache gar
nicht bauen.

Damit der Cache später davorpasst, ohne die Loader zu ändern: Die
Loader geben Daten zurück und kennen keinen Speicher. Der Cache wird
eine Schicht **darüber**, nicht ein Umbau darin.

## Aufbau

Die Struktur folgt der edufeed-app (ADR-0009) — `loaders/`, `models/`,
`services/`. Ein Sammelpfad `src/lib/nostr/` ist ausdrücklich verworfen;
der Aufbau in der Spec vom 31.08. zeigt ihn noch und ist dort veraltet.

```
src/
├─ app.css                       Tokens aus docs/designsystem.md
├─ app.html
├─ lib/
│  ├─ konfig.js                  Env lesen und prüfen, Abbruch bei Fehlen
│  ├─ services/
│  │  └─ relay.js               WebSocket-Abfrage, Zeitschranke, n Relays
│  ├─ loaders/
│  │  ├─ artikel.js             Artikel holen
│  │  └─ lizenz.js              kind:1063 über #x holen
│  ├─ models/
│  │  ├─ artikel.js             Event → Artikel
│  │  └─ lizenz.js              die Prüfkette aus ADR-0013
│  ├─ inhalt.js                  Markdown säubern und rendern
│  ├─ naddr.js                   dekodieren
│  └─ komponenten/
│     └─ Lizenzzeile.svelte     Urheber + Lizenz
└─ routes/
   └─ [naddr]/
      ├─ +page.server.js        lädt
      └─ +page.svelte           zeigt
```

**Die Datenschicht kennt die Oberfläche nicht.** Nichts unter
`loaders/`, `models/`, `services/` importiert eine Komponente oder eine
Route (CLAUDE.md, „Die Regel, die am leichtesten erodiert").

## Datenfluss

Alles serverseitig, in `+page.server.js`:

```
naddr aus der URL
  → naddr.js: dekodieren → { kind, author, d, relayHinweis }
  → loaders/artikel.js: { kinds:[kind], authors:[author], "#d":[d] }
  → models/artikel.js: Event → { titel, published_at, summary,
                                 bildUrl, bildHash, themen, inhalt }
  → models/lizenz.js: die fünf Schritte, über ALLE Relays
  → inhalt.js: säubern, rendern
  → { artikel, bild | bildGrund, markdownHtml, entfernteBilder }
```

Der Relay-Hinweis aus dem `naddr` wird für die Artikelabfrage genutzt,
**für die Lizenzabfrage aber nicht** — dort werden alle konfigurierten
Relays gefragt (ADR-0013, der Nachweis liegt nicht dort, wo der Artikel
liegt).

## Die Lizenz-Kette

Eigene Datei, eigener Test, weil sie der Kern ist. Sie gibt nicht
ja/nein zurück, sondern **den Grund** — damit die Redaktion weiß, was
fehlt, statt zu raten:

| Schritt | Prüfung | Grund bei Abbruch |
|---|---|---|
| 1 | Verweis absolut? | `relativ` |
| 2 | `x`-Tag vorhanden? | `kein-x-tag` |
| 3 | `kind:1063` mit diesem `#x`? | `kein-nachweis` |
| 4 | `license` **und** `credit`? | `pflichtfeld-fehlt` |
| 5 | Hash = Blossom-`etag`? | `hash-widerspruch` |
| ✓ | | → Bild + Lizenzzeile |

Nur ✓ liefert ein Bild aus. Jeder andere Fall: Artikel vollständig,
**ohne** Bild. Ein kenntlich gemachtes Bild ist urheberrechtlich
trotzdem veröffentlicht (ADR-0013).

Schritt 5 nutzt den `etag`, den Blossom liefert — kein zusätzlicher
Download. Ein Nicht-Blossom-Host ohne `etag` überspringt Schritt 5;
das ist notiert, nicht gelöst, weil im Bestand kein solcher Fall mit
Nachweis existiert.

## Markdown säubern

Nach dem Befund aus ADR-0012 — die Bot-Regeln greifen hier **nicht**:

- **Relative Bildpfade entfernen und zählen.** Sie lösen nur gegen
  WordPress auf. Die Zahl wird zurückgegeben; sie ist die
  Redaktions-Aufgabenliste.
- **Blockquotes bleiben.** Bei FOERBICO sind es echte Zitate, keine
  Autorenzeilen. Nicht blind säubern.
- **Kein Kadence, kein `wp-block`** — im Bestand nicht vorhanden.

## Fehlerfälle

Nie eine leere Seite ohne Erklärung (CLAUDE.md):

| Fall | Verhalten |
|---|---|
| Pflichtwert in `.env` fehlt | **Start bricht ab**, Meldung nennt den Wert |
| `naddr` unlesbar | 400, Meldung nennt das Problem |
| Kein Relay erreichbar | Meldung nennt die Relays und was zu tun ist |
| Artikel nicht gefunden | 404, Meldung nennt Autor und `d` |
| Lizenz nicht auflösbar | Artikel erscheint, Bild nicht, Grund im Log |

Ohne Cache gibt es hier **keinen** „letzten gültigen Stand" — das ist
die Kehrseite der Abweichung oben und ein weiterer Grund, warum sie
befristet ist.

## Tests

TDD, gegen Fixtures, ohne Netz (CLAUDE.md):

- **Lizenz-Kette:** der Erfolgsfall aus
  `lizenz-1063-nostr-schrein.json` und **jeder** Abbruchgrund einzeln.
  Die Abbruchfälle sind im Bestand real vorhanden (78 ohne `x`-Tag,
  1 auf Blossom ohne Nachweis).
- **`naddr`-Dekodierung:** der Referenzfall, plus unlesbare Eingabe.
- **Markdown:** relatives Bild wird entfernt und gezählt; Blockquote
  bleibt stehen.
- **Modell:** `published_at` gewinnt über `created_at`.

Das Relay selbst wird in diesem Schritt nicht gemockt — es gibt nur
eine Abfrage, und ihre Bestandteile sind einzeln geprüft. Ein
Mock-Relay kommt, wenn die Liste kommt.

## Technik

SvelteKit 2 + Svelte 5 (Runes) · TailwindCSS 4 + DaisyUI 5 ·
JavaScript mit JSDoc, `checkJs` und `strict` · pnpm ·
`@sveltejs/adapter-node`.

`nostr-tools` **nur** für `naddr`-Dekodierung. Die Relay-Abfrage ist
eigener, schlanker Servercode — eine `REQ`, eine `EOSE`, Zeitschranke.
Applesauce wird hier noch nicht gebraucht (ADR-0009 gilt, sobald es
mehr als eine Abfrage gibt); `SimplePool` bleibt wegen der fehlerhaften
Serialisierung ausgeschlossen.

Docker, Traefik und Auslieferung sind **nicht** Teil dieses Schritts.
Der Betrieb wird lokal per `pnpm dev` geprüft.

## Nicht dabei

Liste · Startseite · Termine · Themenfilter · Cache · Docker ·
Mock-Relay · Navigation zu Ansichten, die es nicht gibt.
