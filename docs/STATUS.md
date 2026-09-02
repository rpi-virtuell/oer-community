# STATUS — Logbuch

Neuester Eintrag oben. Jeder Eintrag beantwortet drei Fragen:
**Was ist passiert? Wo steht das Projekt? Was ist der nächste Schritt?**

Regeln stehen in `../CLAUDE.md`, Begründungen in
`superpowers/specs/2026-08-31-relilab-schaufenster-design.md` —
hier steht nur der Stand.

---

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
