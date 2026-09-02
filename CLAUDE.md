# relilab-Client

Lesendes Schaufenster für die nach Nostr konvertierten relilab-Inhalte —
Artikel und Termine, in der Optik von relilab.org. Erster Schritt, WordPress
abzulösen.

**Warum eine Regel gilt, steht in `docs/entscheidungen/` (ADR)** — eine
Entscheidung, eine Datei, mit Status. Die Spec
`docs/superpowers/specs/2026-08-31-relilab-schaufenster-design.md` bleibt das
Gesamtbild; ihre vier Entscheidungen sind ADR-0001 bis ADR-0004. Hier stehen
nur die Regeln. Widerspricht diese Datei einer ADR, gilt die ADR — und diese
Datei ist zu korrigieren. **Neue Festlegungen aus Besprechungen werden ADRs**
(Vorlage: `docs/entscheidungen/TEMPLATE.md`), auch mit Status „offen".
Farben, Schriften, Abstände: `docs/designsystem.md`.

**Wo das Projekt steht und was als Nächstes dran ist: `docs/STATUS.md`**
(Logbuch, neuester Eintrag oben). Diese Datei hier beschreibt teils den
Zielzustand — was davon schon existiert, sagt STATUS.md. Jede Arbeitssitzung
beginnt dort und endet mit einem Eintrag dort.

## Zuschnitt

Nur Lesen: Artikel, Termine, Detailansicht, Themenfilter.

**Nicht Teil dieses Vorhabens:** Anmeldung, Autorenwerkzeuge, Communities,
Wiki, Nachrichten, Verwaltung. **Was es nicht gibt, wird auch nicht
angedeutet** — keine Bedienung anbieten, die dann scheitert. Also keine
Schaltflächen, Menüpunkte oder Formulare für nicht vorhandene Funktionen,
auch nicht abgeblendet oder als „demnächst".

## Die Regel, die am leichtesten erodiert

**Die Datenschicht kennt die Oberfläche nicht.** Nichts unter
`src/lib/loaders/`, `src/lib/models/` oder `src/lib/services/` importiert eine
Komponente oder eine Route.

Die Grenze bricht beim ersten „nur schnell hier importieren". Der
Abhängigkeitspfeil zeigt ausschließlich von `routes/` und `components/` nach
`lib/`, nie zurück. Die Struktur folgt der edufeed-app, damit Muster wandern
können (ADR-0009) — ein Sammelpfad `src/lib/nostr/` ist es ausdrücklich nicht.

## Nostr-Operationen

**Applesauce für alles, was mit Relays spricht** — nie `nostr-tools` für
Relay-Kommunikation (fehlerhafte Serialisierung in `SimplePool`).

**Vor dem Schreiben von Loader-, Model- oder Subscription-Code die MCPs
befragen** statt aus dem Gedächtnis zu programmieren:
`https://mcp.applesauce.build/mcp` für die Applesauce-API, **nostrbook.dev**
für Kind- und NIP-Details (ADR-0009).

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

Beide Schlüssel kommen aus der Konfiguration, nie aus dem Code:

- Termine-Bot (Absender):
  `f6c14ab7add65d61cf9311a8685575c3f2de0ca540bc4ddf916f76f089f1aa43`
- relilab-Community (`h`-Tag):
  `48706e894e64be57a250d3cd1f4c8a0f69ca900937936f8bd11a1329cd3c97e3`

```json
{ "kinds": [30023, 31922, 31923],
  "authors": ["f6c14ab7…"],
  "#h":      ["48706e89…"] }
```

**Beide Kriterien zusammen filtern, nie eines allein.** `authors` allein zöge
künftige Bot-Inhalte anderer Mandanten mit; `#h` allein ließe jeden herein,
der auf den Community-Key taggt.

Kinds: `30023` Artikel (NIP-23) · `31923` Termine zeitgebunden · `31922`
ganztägig (kommt in den Daten nicht vor, wird mitgelesen).

### Wiederkehrende Fallen

- **Anzeigedatum von Artikeln ist `published_at`, nicht `created_at`.**
  Termine haben kein `published_at` — dort zählt `start`.
- **Events werden nie verändert.** Sie sind unveränderlich, und der Bot ist
  nicht unser Code. Content-Rückstände (Autorenzeile als Blockquote,
  Kadence-CSS-Reste) werden **beim Rendern** gesäubert.
  Die Autorenzeile nicht verwerfen, sondern als „von X, ursprünglich auf
  relilab.org" auswerten.
- **Themen normalisieren.** 195 `t`-Tags mit Tippfehlern und Dubletten. Die
  Normalisierungstabelle in `src/lib/themen.js` ist Redaktionsarbeit und muss
  ohne Entwickler änderbar bleiben. Nicht filterbare Themen bleiben am
  Artikel sichtbar.
- **Bilder sind 150×150-Thumbnails auf relilab.org.** Zentriert darstellen,
  nicht auf Kartenbreite ziehen. Die Lösung liegt beim Bot, nicht hier.
- **Werte kopieren, nie verlinken.** Kein WordPress-Stylesheet und keine
  Farbkarte zur Laufzeit laden — sonst wäre WordPress Voraussetzung statt
  überflüssig.

### Sortierung

Artikel `published_at` absteigend · Termine kommend `start` aufsteigend ·
Termine vergangen `start` absteigend.

## Fehlerfälle

Jede Anfrage rendert aus dem Cache, **nie direkt aus dem Relay**.

- Kein Relay erreichbar → letzter gültiger Stand **mit Hinweis auf sein Alter**
- Cache leer → Meldung, die das Relay nennt und sagt, was zu tun ist
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
pnpm check && pnpm lint && pnpm test && pnpm test:e2e
```

Tests laufen gegen ein Mock-Relay mit den 111 echten Events aus
`test/fixtures/` — ohne Netz und ohne Abhängigkeit von der
Publikationstätigkeit anderer. **Neue Funktionen kommen mit einer Prüfung.**

## Umgebungen

| Umgebung | Quelle | Datenquelle |
|---|---|---|
| lokal (`pnpm dev`) | Arbeitskopie | `relay.edufeed.org` |
| `dev.relilab.org` | `dev` | `relay.edufeed.org` |
| `int.relilab.org` | `main` | später `relay.relilab.org` |

`relay.relilab.org` ist **noch kein Relay** (leeres Apache-Dokument, Zertifikat
auf fremden Namen). Bis das behoben ist, läuft alles gegen
`relay.edufeed.org`. Die Relay-Adresse ist Konfiguration, kein Code.
