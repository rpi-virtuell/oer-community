# ADR-0027: Die Seitenstruktur kommt aus Nostr — Seiten mit Selbst-Label, Menü und Fußzeile als Kuratierungslisten, Kopf und Fuß aus dem Profil

**Status:** angenommen (2026-09-14)
**Beteiligte:** Jörg · offen für mdparser: Steffen, Gina (Publikation der Events)

## Kontext

Ohne Hugo fehlen oer.community sieben statische Seiten, das Hauptmenü, die
Fußzeile und die Startseite — nichts davon liegt auf einem Relay. Drei Wege,
sie dem Hub zu geben: Konfiguration im Hub (`.env`, JSON im Repo), ein
NIP-78-Konfigurationsevent (`kind:30078`) mit JSON, oder Events, die auch
andere Clients verstehen.

Konfiguration im Hub macht die Redaktion vom Entwickler abhängig. Ein
JSON-Event unter dem FOERBICO-Key kann nur der Hub lesen; es ist
Konfiguration mit anderem Transport. NIP-51-Kuratierungslisten (`30004`)
und das Profil (`kind:0`) zeigen edufeed-app und andere Clients bereits an.

## Entscheidung

Wir lesen die Struktur aus vier Event-Arten des FOERBICO-Keys:

1. **Seiten** sind `kind:30023` mit den Selbst-Labels
   `["L","foerbico/typ"]` und `["l","seite","foerbico/typ"]` (NIP-32,
   Self-Reporting). Sie erscheinen nicht im Blog, nicht in Themen, nicht im
   Feed. Der Namensraum ist der aus ADR-0021.
2. **Hauptmenü** ist `kind:30004` mit `d = navigation`, **Fußzeilenlinks**
   `kind:30004` mit `d = fusszeile`: `a`-Tags in Reihenfolge, Beschriftung
   ist der `title` der referenzierten Seite. Der Hub hängt seine eigenen
   Ansichten „Blog" und „Themen" hinter das Menü.
3. **Wortmarke, Logo, Fußtext, Domain** kommen aus `kind:0`: `name`,
   `picture`, `about`, `website`.
4. **Die Startseite** ist die Seite mit `d = startseite` — Konvention wie
   `d = redaktion` (ADR-0021). Sie steht nicht im Menü; das Logo verlinkt
   dorthin.

Die Namen `navigation`, `fusszeile`, `startseite` sind Konventionen mit
Standardwert in der Konfiguration, damit ein zweiter Mandant andere wählen
kann.

## Konsequenzen

- Der Hub bleibt lesend. Menü und Seiten ändert die Redaktion, wo sie
  Beiträge ändert: in Git, publiziert durch mdparser.
- mdparser braucht drei Ergänzungen (Spec 14.09., „Voraussetzungen"):
  Selbst-Label für Seiten, `sync navigation`, `inLanguage` als String. Bis
  dahin zeigt der Hub die Rückfälle: Menü nur mit Blog und Themen, Fußzeile
  ohne Links, `/` als Übersicht mit Hinweis.
- Menüpunkte heißen wie ihre Seiten. Drei Hugo-Beschriftungen weichen heute
  ab; wer sie will, ändert den Seitentitel.
- Der Fußtext im Profil-`about` ist ein Kompromiss: Das Feld ist für
  „über den Autor" gedacht, und FOERBICO ist der Herausgeber der Seite —
  Lizenzzeile und Förderhinweis *sind* die Auskunft über den Herausgeber.
  Sollte das Feld anderweitig gebraucht werden, ist der Ersatz eine Seite
  `d = fusszeile-text`, nicht Konfiguration.
- Falsch war die Entscheidung, wenn die Redaktion Menüpunkte unabhängig von
  Seitentiteln beschriften muss. Dann trägt die Liste je Eintrag ein
  eigenes Label — das gibt NIP-51 nicht her, also wäre es eine Erweiterung
  oder ein Wechsel auf ein Event mit `content`.
