# Redaktion Longform (kind:30023)

Wie Beiträge für den Community-Hub entstehen, bearbeitet und veröffentlicht
werden — mit Beitragsbild, Fließtextbildern und Lizenznachweisen. Gilt für
den FOERBICO-Blog und künftige Mandanten.

Technische Grundlage: ADR-0010 (Redaktion in der edufeed-app), ADR-0013
(Bild nur mit Nachweis), ADR-0021 (Redaktion nur in Nostr, Übernahme durch
den FOERBICO-Key). Was hier steht, ist Redaktionsregel, nicht
Codeverhalten — der Code des community-hub bleibt lesend.

---

## 1. Wie Lizenzen an Bildern hängen

Drei Schichten, die man auseinanderhalten muss:

| Schicht | Was | Wo |
|---|---|---|
| Blob | das Bild, adressiert über SHA-256 | `blossom.edufeed.org/<sha256>.<ext>` |
| Nachweis | `kind:1063` mit `x` = SHA-256, `license`, `credit`, `title`, `source`, `alt`, optional `p` und `ai` (`generated` \| `modified`, ADR-0025) | `relay-rpi.edufeed.org` |
| Beitrag | `kind:30023`; Beitragsbild als `image` **und** `x`-Tag; Fließtextbilder nur als URL im Markdown | `relay.edufeed.org`, `relay-rpi.edufeed.org` |

Der Lookup ist ein Relay-Filter: `{ kinds:[1063], "#x":[hash] }` über alle
konfigurierten Relays. Für Fließtextbilder wird der Hash **aus der
Blossom-URL** gelesen — eine Bild-URL ohne Hash im Pfad ist deshalb für den
Nachweis unsichtbar. Der Nachweis hängt am Hash, nicht am Autor: ein 1063
vom Redaktions-Key gilt auch für den übernommenen Beitrag.

## 2. Wie Beiträge auf die Relays kommen (Ist-Stand)

**Es gibt bereits einen Publikationsweg:** die GitHub Action
`FOERBICO_und_rpi-virtuell/.github/workflows/nostr-sync.yml` ruft bei jedem
Push auf `main` (Pfad `Website/content/**`) den Publisher
`edufeed-org/mdparser/sync` auf. Der Bunker (Amber, dauerhaft offen)
signiert per NIP-46.

Was `sync` heute macht:

- `commonMetadata`-Block des Frontmatters lesen (der `# staticSiteGenerator`-Teil wird ignoriert)
- `d`-Tag = Pfadteil von `commonMetadata.id` (`https://oer.community/foo` → `foo`)
- `kind:30023` → `relay.edufeed.org`, `relay-rpi.edufeed.org`
- `kind:30142` (nur bei `type: LearningResource`) → `amb-relay.edufeed.org`
- Beide verweisen aufeinander: `["a","30142:<pk>:<d>",relay,"amb-metadata"]`
  bzw. `["a","30023:<pk>:<d>",relay,"content"]`
- Diff-Modus (nur geänderte Posts) oder `--force-all`

Was `sync` heute **nicht** macht — und genau das ist die Lücke, aus der
85 von 86 Artikeln ohne `x`-Tag stammen:

- kein Blossom-Upload, kein `x`-Tag, kein `kind:1063`
- `image` wird als oer.community-URL durchgereicht, nicht als Blossom-URL
- Fließtextbilder bleiben relativ (`![](foo.jpeg)`) und lösen nur gegen
  Hugo auf

Dieser Weg ist **Migrationswerkzeug** (Abschnitt 8), nicht Betriebsmodell.
Spec: `mdparser/docs/superpowers/specs/2026-09-04-bilder-und-pull.md`.
`Website/scripts/md2blossom.mjs` ist die lokale Vorstufe (hasht, schreibt
um, erzeugt Vorlagen — publiziert nicht).

---

## 3. Regeln für das Beitragsbild

1. **Bild liegt auf Blossom, adressiert per Hash.** Nie eine externe URL
   eintragen. Im Editor erledigt das der Upload-Dialog, in der Migration
   `sync`.
2. **Beim ersten Upload eines Bildes werden Lizenz, Urhebernennung, Titel
   und Quelle vollständig erfasst.** Der erste Upload erzeugt den
   `kind:1063`-Nachweis; alle späteren Verwendungen desselben Bildes erben
   ihn. Der erste Upload ist der Moment, in dem Sorgfalt zählt.
3. **Nur freie Lizenzen**: CC0, CC BY, CC BY-SA, oder eigene Bilder mit
   ausdrücklicher Freigabe. Kein NC, kein ND — der Hub soll remixbar sein.
4. **Alt-Text ist Pflicht.** Beschreibend, kein Marketing, kein Dateiname.
5. **Meldet der Upload „Bild schon vorhanden" mit Nachweis**: vorhandenen
   Nachweis prüfen, nicht überschreiben. Weicht er ab → klären, nicht raten.
   Bei mehreren Nachweisen gewinnt ohnehin der neueste.
6. **Ohne Nachweis kein Bild.** edufeed blockiert das Publish; der
   community-hub liefert es sonst nicht aus.

## 4. Regeln für Bilder im Fließtext

1. Gleiche Regel: Blossom-URL mit Hash, kein Hotlinking, keine relativen
   Pfade.
2. **Die TULLU-Zeile steht im Markdown.** Der edufeed-Editor schreibt sie
   beim Einfügen:
   `*"Titel" von Urheber, [CC BY 4.0](…), Quelle: …*`
   Sie wird nicht gelöscht und nicht umformuliert. Der sichtbare Hinweis ist
   rechtlich erforderlich; der `kind:1063`-Nachweis ersetzt ihn nicht.
3. **Bildunterschrift ≠ Attribution.** Eine erklärende Bildunterschrift
   steht als eigener Absatz *über* der TULLU-Zeile.
4. **Screenshots** fremder Websites oder Software nur mit Quellenangabe und
   erkennbarem Zitatzweck; nie als Beitragsbild.
5. **Personenfotos** nur mit dokumentierter Einwilligung (Ablage: siehe
   Datenschutz-Ordner des Instituts, nicht im Repo).

## 5. Regeln für den Fließtext

1. **Lizenz des Beitrags** steht im Beitrag selbst, nicht nur im
   Impressum. Standard: CC BY 4.0, Abweichung begründen.
2. **Zitate** mit Quelle im Text; Blockquotes nur für echte Zitate.
3. **Links** vollständig, keine site-relativen Pfade (`](/…`).
4. **Kein Roh-HTML** im Markdown (`<br>`, `<div>`), der Hub sanitisiert.
5. **Themen** (`t`-Tags) aus der Normalisierungstabelle
   `src/lib/themen.js` wählen; neue Themen dort zuerst eintragen.

---

## 6. Redaktionsworkflow (ADR-0021)

**Alles passiert in Nostr.** Das Gate ist der Autor-Key: Entwürfe leben
unter Redaktions-Keys, der FOERBICO-Key wird nur durch die Übernahme
beschrieben. Git ist Backup, kein Review.

### 6.1 Entwurf

1. Im edufeed-Editor mit dem **eigenen Redaktions-Key** (oder dem
   gemeinsamen Redaktions-Key über den Bunker) anlegen. Normaler 30023.
2. Beitragsbild über den Upload-Dialog, Fließtextbilder über die Toolbar.
   edufeed erzwingt den Nachweis fürs Cover und schreibt TULLU. Die
   Bilder liegen damit schon auf Blossom, die 1063 sind da.
3. Der Entwurf ist technisch öffentlich, im Hub aber unsichtbar
   (Autor-Filter ADR-0012). `naddr` ans Team geben.

### 6.2 Korrektur und Freigabe

- **Direkt einarbeiten:** wer den Redaktions-Key im Bunker hat, öffnet den
  Entwurf über das `naddr` und speichert. Sonst: eigene Kopie mit gleichem
  `d`, Autorin übernimmt.
- **Kommentieren:** NIP-22-Kommentar auf das `naddr` in edufeed.
- **Freigeben:** Label `freigegeben` (NIP-32, `kind:1985`) auf die
  aktuelle **Event-ID**. Jede Speicherung erzeugt eine neue ID und macht
  Freigaben ungültig — wie ein neuer Commit den Approve. Freigeben darf,
  wer auf der Redaktionsliste (`kind:30000`, `d=redaktion`) des
  FOERBICO-Keys steht; nicht die Autorin selbst.
- Bis edufeed dafür Buttons hat: `sync label <naddr>` per CLI mit dem
  eigenen Key.

### 6.3 Übernahme

`sync adopt <naddr>` mit dem FOERBICO-Bunker:

1. Entwurf holen, Freigaben ≥ 1 auf der aktuellen ID prüfen, sonst Abbruch.
2. 30023 unter FOERBICO-Key mit gleichem `d`, identischem Inhalt und Tags,
   dazu `["p", <redaktionskey>, "", "author"]`.
3. 30142 nachziehen (Creator als p-Tag), `a`-Cross-Refs wie bisher.
4. Blobs per `PUT /mirror` unter FOERBICO-Auth — Hash und URL bleiben.
5. 1063 bleibt, wie es ist (Lookup per Hash, nicht per Autor).

Danach erscheint der Beitrag im Hub. `pull` spiegelt ihn nach Git.

### 6.4 Änderung nach Veröffentlichung

Derselbe Weg: Redaktions-Kopie ändern → Freigabe → `adopt` überschreibt.
**Der FOERBICO-Stand wird nie von Hand bearbeitet.** Wer den
FOERBICO-Key in einem Personen-Client hat, entfernt ihn dort.

### 6.5 Signieren

Redaktions-Keys: Amber je Person oder Server-Bunker (offen, ADR-0021).
FOERBICO-Key: nur im Action-Bunker. Kein Key im Repo, kein Key in Skripten.

### 6.6 Git

`sync pull` spiegelt den FOERBICO-Bestand nach `content/` als Backup und
als Quelle für Hugo. Kein PR-Review mehr. Wer Historie je Version will,
braucht den Listener statt Cron (Spec Teil B) — sonst gibt es Historie nur
auf Ebene der Übernahmen.

---

## 7. Migration Altbestand

- **Bilder rehashen und hochladen**, nie über die alte URL einbinden.
  166 von 269 Bildverweisen im FOERBICO-Bestand sind relativ — das ist
  die Arbeitsliste.
- **Bildattribution wird zu `kind:1063`.** Wo sie in Frontmatter oder
  Bildunterschrift steckt, in `bilder.yaml` überführen; wo sie fehlt,
  `TODO:LICENSE` und das Bild vorerst weglassen.
- **AMB-Metadaten** gehen bereits über `sync` nach `kind:30142`.

---

## 8. Migration vs. Betrieb

### Migration (einmalig, `sync publish`)

- **Ziel:** die 86 vorhandenen Artikel bekommen Blossom-Bilder, `x`-Tag
  und `1063`-Nachweise; Fließtextbilder werden umgeschrieben.
- **Werkzeug:** `sync publish --force-all` nach Umsetzung des
  Bilderschritts (Spec Teil A), vorher `bilder.yaml` × 86. Idempotent.
- **Redaktionsarbeit dominiert.** Reihenfolge: erst die Posts mit
  Aufmacherbild, dann der Rest. Ohne Nachweis geht der Post ohne Bild.
- **Einmal-Entscheidungen** in `sync` als Migrationsregel: Themen-
  Normalisierung der 43 `t`-Tags, 19 Blockquotes, Roh-HTML, site-relative
  Links.
- **Hugo läuft weiter** aus `content/`, bis der Hub alles zeigt.

### Betrieb (`sync adopt` + `sync pull`)

- Neue Beiträge nur noch nach Abschnitt 6.
- `publish` wird nach der Migration **stillgelegt** (Action deaktivieren).
  `content/` wird nicht mehr von Hand geändert; `pull` schreibt es.
- Hugo baut aus dem Spiegel oder wird abgeschaltet.

### Cut-over

Ein Datum, in STATUS.md notiert. Bedingungen:

1. Bilderschritt in `publish` gemerged und `--force-all` gelaufen
2. `adopt` für den Referenzfall durchgespielt: Entwurf unter
   Redaktions-Key → Label → `adopt` → Hub zeigt ihn mit Bild
3. `pull` erzeugt aus dem übernommenen Event ein `index.md`, aus dem
   Hugo baut

Vor dem Datum: Editor für FOERBICO-Posts tabu, `content/` ist Quelle.
Nach dem Datum: `publish` tabu, Relay ist Quelle.

---

## 9. Offene Punkte

| # | Punkt | Blockiert | Verantwortlich |
|---|---|---|---|
| 1 | Bilderschritt in `sync publish` (Spec Teil A) | 8 Migration | Jörg · Steffen R. (Review) |
| 2 | `sync adopt` + `sync label` (Spec Teil C) | 6.2, 6.3, 8 Betrieb | Jörg |
| 3 | `sync pull` (Spec Teil B, Backup) | 6.6 | Jörg |
| 4 | Redaktionsliste `kind:30000 d=redaktion` unter FOERBICO-Key anlegen | 6.2 | Jörg |
| 5 | Bunker für Redaktions-Keys: Amber je Person oder Server | 6.5 | Steffen R. / Jörg |
| 6 | `PUT /mirror` auf blossom.edufeed.org? | 6.3 | Steffen R. |
| 7 | `bilder.yaml`-Schema ins `foerbico-yaml-skill` | 7 | Jörg |
| 8 | `bilder.yaml` für 86 Posts | 8 Migration | Redaktion (Gina, Jörg) |
| 9 | Freigabe-/Übernahme-Buttons in edufeed (nach CLI) | Komfort | später, Steffen R. |
| 10 | Cut-over-Datum | 8 | Jörg |
