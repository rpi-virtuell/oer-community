# ADR-0028: Ein Spiegel im Prozess mit Datei auf der Platte — nie direkt aus dem Relay

**Status:** angenommen (2026-09-14)
**Beteiligte:** Jörg

Setzt die Regel aus CLAUDE.md („Jede Anfrage rendert aus dem Cache") um und
beendet die Abweichung der Spec vom 03.09. („kein Cache").

## Kontext

Die Detailansicht fragt heute bei jeder Anfrage das Relay. Für eine Seite
mit Übersicht, Themen, Menü und Dutzenden Lizenz-Lookups je Aufruf trägt das
nicht: langsam, und jeder Relay-Ausfall ist ein Seitenausfall. Drei Wege:
ein Spiegel im Speicher des Node-Prozesses mit Datei, eine SQLite-Datenbank,
oder ein statischer Export (der Weg des `oer-site-builder` vom April).

Der Bestand ist klein — rund ein Megabyte für 87 Artikel, 40 Nachweise,
Profil und Listen. Eine Datenbank wäre eine zweite Abhängigkeit ohne
Gegenwert. Ein statischer Export ersetzt Hugo durch einen anderen
Build-Schritt und widerspricht ADR-0003.

## Entscheidung

Wir halten alle benötigten Events in `services/spiegel.js` im Speicher.
Beim Start und alle `SPIEGEL_INTERVALL_S` Sekunden baut ein Lauf einen
vollständigen neuen Stand über **alle** konfigurierten Relays und tauscht
ihn atomar ein. Ein Lauf ist gültig, wenn mindestens ein Relay die
Artikelabfrage beantwortet hat; nur gültige Läufe ersetzen den Stand und
werden als JSON nach `SPIEGEL_PFAD` geschrieben. Beim Start wird die Datei
zuerst geladen. Jeder Stand trägt seinen Zeitpunkt und die Erreichbarkeit
je Relay.

**Kein Loader und keine Route spricht selbst mit einem Relay.** Das prüft
der Architekturtest (ADR-0014): `services/relay.js` wird nur von
`services/spiegel.js` importiert.

## Konsequenzen

- Inhalte erscheinen mit bis zu zehn Minuten Verzögerung. Für eine Seite,
  deren Inhalte sich täglich ändern, ist das kein Verlust.
- Die Fehlerregeln aus CLAUDE.md werden erfüllbar: Alter des Stands in der
  Fußzeile, Meldung mit Relay-Namen bei leerem Spiegel, Start bricht bei
  fehlender Konfiguration ab.
- Die Entwickleransicht zeigt nicht mehr „gerade gefragt", sondern „Stand
  von 14:32, relay-rpi hat nicht geantwortet" — dieselbe Auskunft, ehrlich
  datiert.
- Ein Neustart ohne Relay liefert den letzten Stand. Ein Neustart ohne
  Relay und ohne Datei liefert Meldungen, keine Seiten.
- Falsch war die Entscheidung, wenn der Bestand so wächst, dass ein
  vollständiger Lauf Minuten dauert oder der Speicher knapp wird. Dann:
  Läufe inkrementell (`since`) und die Datei durch SQLite ersetzen; die
  Schnittstelle des Spiegels bleibt.
