# Entscheidungen (ADR)

Eine Entscheidung, eine Datei, mit Status (Vorlage: `TEMPLATE.md`).
Angenommene ADRs werden nicht umgeschrieben; überholt eine spätere ADR eine
frühere, bekommt die frühere einen Nachtrag in der Statuszeile und die
spätere nennt, was sie ersetzt. Diese Tabelle ist der Einstieg — die
Statuszeile in der Datei ist maßgeblich.

**Was heute gilt, in einem Satz je Thema:** Vorhaben oer.community aus
Nostr (0026), Seitenstruktur aus Nostr (0027), Spiegel statt Relay-Zugriff
(0028), Adressen sind `d` (0029), FOERBICO-Designsystem (0031), Bildlizenz
wie edufeed mit eigener Attribution (0022, 0023, 0025, 0030, 0032),
Redaktion nur in Nostr (0021, offen). Zweisprachig (0033, offen), Termine
aus der Community (0034).

| Nr. | Titel | Status |
|---|---|---|
| [0001](0001-eigenes-projekt-statt-fork.md) | Eigenes Projekt, nicht Fork und nicht Deployment-Variante der edufeed-app | angenommen |
| [0002](0002-kompatibilitaet-im-protokoll.md) | Kompatibilität liegt im Protokoll, nicht im Code | ersetzt · ADR-0009 |
| [0003](0003-server-rendert-inhalt.md) | Server rendert Inhalt mit, Client übernimmt danach | angenommen |
| [0004](0004-eigenes-theme-designsystem.md) | Eigenes Theme nach dem Designsystem FOERBICO × rpi-virtuell | angenommen, teils ersetzt |
| [0005](0005-relay-eigenes-oder-edufeed.md) | Eigenes Relay unter relay.relilab.org oder Edufeed-Relay weiternutzen | ersetzt · ADR-0008 |
| [0006](0006-schwerpunkt-pilgern-oder-klon.md) | Schwerpunkt Pilgern-MVP (Edufeed-Light) oder Relilab-Klon | überholt · ADR-0026 |
| [0007](0007-svelte-bleibt.md) | SvelteKit bleibt — das Schaufenster ist der Keim des Community Hubs | angenommen |
| [0008](0008-relay-edufeed-mit-spiegel.md) | Edufeed-Relays nutzen und spiegeln, statt eigenes Relay aufzusetzen | angenommen |
| [0009](0009-applesauce-und-mcp.md) | Applesauce für alle Nostr-Operationen, MCP-Server als Entwicklungsquelle | angenommen |
| [0010](0010-redaktionelle-inhalte-blossom-lizenzen.md) | Exemplarische Inhalte redaktionell neu einstellen, Bilder auf Blossom mit Lizenznachweis | angenommen |
| [0011](0011-projektname-community-hub.md) | Das Projekt heißt community-hub, nicht relilab-client | angenommen |
| [0012](0012-foerbico-als-erste-datenquelle.md) | FOERBICO ist die erste Datenquelle, nicht der relilab-Bot | angenommen |
| [0013](0013-bildlizenz-aufloesung.md) | Bildlizenz über mehrere Relays auflösen; ohne Nachweis kein Bild | angenommen, teils ersetzt |
| [0014](0014-architekturregeln-werden-geprueft.md) | Architekturregeln werden automatisch geprüft, nicht nur aufgeschrieben | angenommen |
| [0015](0015-bilder-im-fliesstext.md) | Bilder im Fließtext werden ausnahmslos entfernt | angenommen, teils ersetzt |
| [0016](0016-naddr-kommt-von-aussen.md) | Der `naddr` ist Eingabe von aussen, nicht Konfiguration | angenommen |
| [0017](0017-entwickleransicht-fuer-beitrag-und-nachweis.md) | Die Entwickleransicht zeigt Beitrag und Lizenznachweis nebeneinander | angenommen |
| [0018](0018-kontrastpunkte-entschieden.md) | Die drei Kontrastpunkte des Designsystems sind entschieden | ersetzt · ADR-0031 |
| [0019](0019-wortmarke-vorlaeufig-community-hub.md) | Die Wortmarke ist vorläufig „Community-Hub" | ersetzt · ADR-0027 |
| [0020](0020-entwuerfe-kind-30024-in-edufeed.md) | Entwürfe für Longform-Beiträge als kind:30024 in der edufeed-app, nicht als eigener Editor | zurückgezogen |
| [0021](0021-redaktion-nur-in-nostr-uebernahme-durch-foerbico-key.md) | Redaktion arbeitet nur in Nostr — Entwürfe unter Redaktions-Keys, der FOERBICO-Key übernimmt nach Freigabe | offen |
| [0022](0022-bildlizenz-wie-edufeed.md) | Bildlizenz wie in der edufeed-app, Bildattribution nach eigener Konvention | angenommen |
| [0023](0023-fliesstextbilder-mit-hash-url.md) | Fließtextbilder mit Hash-URL werden aufgelöst wie das Cover | angenommen |
| [0024](0024-konkurrierende-nachweise-eigener-key-zuerst.md) | Bei konkurrierenden Nachweisen gilt der eigene Key zuerst, dann der neueste | angenommen, Umsetzung offen |
| [0025](0025-ki-kennzeichnung-aus-dem-ai-tag.md) | KI-Beteiligung aus dem `ai`-Tag des Nachweises als Marke hinter der Lizenz kennzeichnen | angenommen |
| [0026](0026-oer-community-wird-das-vorhaben.md) | oer.community wird das Vorhaben — FOERBICO statt relilab, Termine entfallen | angenommen |
| [0027](0027-seitenstruktur-aus-nostr.md) | Die Seitenstruktur kommt aus Nostr — Seiten mit Selbst-Label, Menü und Fußzeile als Kuratierungslisten, Kopf und Fuß aus dem Profil | angenommen |
| [0028](0028-spiegel-im-prozess-statt-live-abfrage.md) | Ein Spiegel im Prozess mit Datei auf der Platte — nie direkt aus dem Relay | angenommen |
| [0029](0029-urls-sind-d-naddr-leitet-weiter.md) | Die Adresse eines Beitrags ist sein `d`; ein `naddr` leitet dorthin weiter | angenommen |
| [0030](0030-abgeloeste-bild-hosts-gelten-als-unaufgeloest.md) | Bilder von Hosts, die der Hub ablöst, gelten als unaufgelöst | angenommen |
| [0031](0031-foerbico-designsystem.md) | Das FOERBICO-Designsystem ersetzt die relilab-Werte | angenommen |
| [0032](0032-lizenzpille-lizenzstand-als-overlay.md) | Lizenzpille — der Lizenzstand liegt auf jedem Bild, auch in der Übersicht | angenommen |
| [0033](0033-zweisprachig-de-en-mit-umschalter.md) | Zweisprachig — Englisch als zweite Sprache mit Umschalter | offen |
| [0034](0034-kalender-aus-der-community.md) | Termine kommen aus der Community — Quelle je Inhaltsart | angenommen |
