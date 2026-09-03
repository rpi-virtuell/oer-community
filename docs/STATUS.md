# STATUS — Logbuch

Neuester Eintrag oben. Jeder Eintrag beantwortet drei Fragen:
**Was ist passiert? Wo steht das Projekt? Was ist der nächste Schritt?**

Regeln stehen in `../CLAUDE.md`, Begründungen in
`superpowers/specs/2026-08-31-community-hub-schaufenster-design.md`
— hier steht nur der Stand.

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
