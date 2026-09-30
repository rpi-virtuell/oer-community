# ADR-0039: Die Teamseite baut ihre Personen aus deren eigenem `kind:0`

**Status:** offen
**Beteiligte:** Jörg (Vorgabe im Slack-Thread vom 30.09.2026) — Gina und Ludger noch fragen

## Kontext

Die alte Hugo-Seite zeigt unter „Unser Team" je Person ein Porträt im
Hochformat mit orangem Rahmen, den Namen fett, eine kurze Beschreibung und
den Kontakt, gruppiert nach Institution. Im Hub fehlen die Porträts: Es sind
relative Bildpfade, und die blendet der Hub aus (ADR-0015). Die Porträts
einzeln nach Blossom zu laden und mit Nachweis in den Seitentext zu setzen,
hieße, Profildaten zu kopieren, die jede Person in ihrem `kind:0` ohnehin
selbst pflegt.

## Entscheidung

Wir bauen die Personen der Teamseite aus deren eigenem `kind:0`: Eine Zeile,
die im Markdown einer Seite nur `nostr:npub1…` oder `nostr:nprofile1…`
enthält (NIP-27), wird zur Personenkarte — Bild (`picture`, nur https),
Name (`display_name`, Rückfall `name`), `about` als gesäubertes Markdown und
Kontakt (`email`, wenn vorhanden, und `website`). Überschriften, Logos und
Institutionstexte bleiben redaktioneller Text der Seite.

Offen ist nur, ob die Redaktion die Verweise so in die Seite setzt oder ob
das Team stattdessen eine eigene Personenliste `kind:30000` bekommen soll;
die Karte selbst hinge an beidem gleich.

## Konsequenzen

- Der Spiegel holt zusätzlich das `kind:0` jeder verwiesenen Person, über
  alle Relays; je Person gilt das neueste. Verweise zählen nur aus dem
  eigenen Bestand — ein fremder Key zieht keine Profile in den Spiegel.
- Das Porträt ist das Profilbild der Person und trägt keine Lizenzpille, so
  wenig wie das Logo in der Kopfzeile (ADR-0027). Ändert eine Person ihr
  Profilbild, ändert sich die Teamseite beim nächsten Spiegellauf mit.
- **Das Porträt kommt vom Hub, nie vom Fremdhost** (Nachtrag 30.09., aus
  dem Listen-Entwurf auf `feat/team-liste` übernommen): Der Spiegel holt
  `picture` einmal je Lauf auf die Platte (`PROFILBILDER_PFAD`, Standard
  `daten/profilbilder/`; nur `https`, nur `image/*` ohne SVG, höchstens
  3 MB) und liefert es unter `/profilbild/<pubkey>` mit ETag und langem
  Cache. Kein Leser spricht mit imgur oder nostr.build — Schulnetze,
  Datenschutz, eine Hand. Was der Spiegel nicht hält, ist 404, und die
  Karte steht ohne Bild; ein gescheiterter Abruf lässt das bisherige Bild
  stehen. Verkleinert wird nicht; drückt das, ist `sharp` die Antwort.
  `profilbild` ist ein festes Segment (ADR-0029).
- **Profile werden zusätzlich über `PROFIL_RELAYS` gesucht** (optional,
  ebenfalls aus dem Listen-Entwurf): Ein `kind:0` liegt oft nur auf einem
  reinen Profil-Relay wie `purplepag.es`, nicht dort, wo die Seite liegt.
- `email` steht in keinem NIP; ohne es zeigt die Karte nur die `website`.
  Fehlt ein Profil ganz, gibt es keine leere Karte, sondern einen Hinweis mit
  dem npub — das ist die Aufgabenliste für die Redaktion.
- Falsch wäre die Entscheidung, wenn Profile zu dünn gepflegt sind oder
  Personen ihr Profilbild nicht auf der Teamseite sehen wollen; dann kämen
  die Angaben wieder als Text und Blossom-Bild in die Seite.
