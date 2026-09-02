# STATUS — Logbuch

Neuester Eintrag oben. Jeder Eintrag beantwortet drei Fragen:
**Was ist passiert? Wo steht das Projekt? Was ist der nächste Schritt?**

Regeln stehen in `../CLAUDE.md`, Begründungen in
`superpowers/specs/2026-08-31-relilab-schaufenster-design.md` —
hier steht nur der Stand.

---

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
Schreibpfad — beides bleibt **außerhalb** des relilab-client, im
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
