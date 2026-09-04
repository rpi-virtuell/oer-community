# ADR-0020: Entwürfe für Longform-Beiträge als kind:30024 in der edufeed-app, nicht als eigener Editor

**Status:** zurückgezogen (2026-09-04) — ersetzt durch ADR-0021. Entwürfe sind
gewöhnliche 30023 unter Redaktions-Keys; ein eigener Entwurfs-Kind wird nicht
gebraucht. Die PR-Skizze unten bleibt als Referenz stehen.
**Beteiligte:** Jörg · Steffen Rörtgen (muss gefragt werden: Relay-Policy, PR-Bereitschaft)

## Kontext

Der Redaktionsworkflow (`docs/redaktion-longform.md`) braucht Entwürfe
und Review. Bisher leistet das Git (Branch, PR). Die edufeed-app hat den
Longform-Editor (`/create/article`, Bearbeiten über `naddr`), aber **keine
Entwürfe für Artikel** — geprüft am 04.09.2026:

- `stores/article-actions.svelte.js`: nur `createArticle` /
  `updateArticle` auf `kind:30023`. Kein 30024.
- Lokale Entwürfe existieren nur für den Ressourcen-Wizard
  (`helpers/educational/draftStore.js`, localStorage) und Umfragen
  (`stores/poll-draft.js`). Beides nicht für Artikel, beides nicht auf
  dem Relay — also nicht teambar.

Optionen:

1. **Eigener „edufeed-light"-Editor** im Community-Hub mit Nostr-Formularen
   — widerspricht ADR-0010 (kein Autorenwerkzeug hier) und baut den
   edufeed-Editor ein zweites Mal.
2. **Entwürfe bleiben Git-Branches**, Publish über `md2blossom` +
   Signieren — funktioniert heute, aber zwei Werkzeuge für einen Vorgang.
3. **`kind:30024` (NIP-23 Draft) in der edufeed-app** — Entwurf liegt auf
   dem Relay, ist für das Team sichtbar, Publish wechselt nur den Kind.

## Entscheidung

Favorisiert: **Option 3**, als PR an die edufeed-app. Bis der PR gemerged
ist, gilt Option 2.

Zur Entscheidung fehlt: Steffens Einschätzung, ob die edufeed-Relays
`kind:30024` annehmen (Whitelist?), und ob der PR in den Zuschnitt der
App passt.

## Wie der PR aussähe (Aufwandsschätzung: klein)

Alles Bestehende bleibt; es kommt hinzu:

- `article-actions.svelte.js`:
  - `DRAFT_KIND = 30024`
  - `saveArticleDraft(formData, existingEvent?)` — baut dieselben Tags
    wie `buildArticleTags`, publiziert als 30024, hält den `d`-Tag.
  - `publishArticle(...)` bleibt `createArticle`/`updateArticle`; nach
    erfolgreichem 30023-Publish optional `kind:5` (Deletion) auf den
    30024 mit gleichem `d`, damit der Entwurf nicht neben dem Artikel
    weiterlebt. `nextCreatedAt` aus `replaceableUpdates.js` gilt auch hier.
- `routes/create/article/+page.svelte`:
  - zweiter Button „Als Entwurf speichern" neben „Veröffentlichen".
  - Edit-Modus: `fetchEventById(naddr)` liefert bereits 30024, wenn das
    `naddr` den Kind trägt — die Lizenz-Rehydrierung über `x` läuft
    unverändert. Der Lizenz-Gate (`imageLicenseEvent` Pflicht) gilt
    **nur** für Publish, nicht für Entwurf speichern.
- `loaders/articles.js` + eine Ansicht „Meine Entwürfe": Filter
  `{ kinds:[30024], authors:[me] }`.
- `encodeEventToNaddr` funktioniert für 30024 ohne Änderung
  (Kind steckt im `naddr`).
- Tests: Tag-Parität 30023/30024, `d`-Erhalt beim Wechsel, Gate nur bei
  Publish.

Nicht Teil des PR: Review-Kommentare, Freigabe-Rollen. Review bleibt in
Git oder im Gespräch.

## Konsequenzen

- Der Community-Hub bleibt lesend; er zeigt 30024 **nicht** an.
- Der Git-Spiegel (Relay → `content/`) muss 30024 ignorieren oder als
  Branch ablegen — Entscheidung beim Sync-Tool, nicht hier.
- Falsch war die Entscheidung, wenn die Relays 30024 nicht annehmen und
  Steffen das nicht ändern will → dann Option 2 dauerhaft, und der
  Wunsch nach Entwürfen im Editor wird zu localStorage-Entwürfen
  (Muster `draftStore.js`) heruntergestuft.
