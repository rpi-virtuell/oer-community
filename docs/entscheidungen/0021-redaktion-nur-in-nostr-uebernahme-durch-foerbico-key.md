# ADR-0021: Redaktion arbeitet nur in Nostr — Entwürfe unter Redaktions-Keys, der FOERBICO-Key übernimmt nach Freigabe

**Status:** offen (Zielbild festgelegt am 2026-09-04; Umsetzung ausstehend)
**Beteiligte:** Jörg · Gina (Redaktion) · Steffen Rörtgen (Bunker, Blossom-Mirror, Relay-Policy)

## Kontext

Bisher lief Redaktion in Git: Entwurf als Branch, Review im PR, Reviewer
korrigieren direkt, Merge publiziert. Mit dem edufeed-Editor als
Arbeitswerkzeug wird Git-Review funktional umgangen — ein Gate, das man
per anderem Knopf umgeht, ist keins.

Geprüft wurden drei Stellen für das Gate: Git (Editor nur für 30024,
Publish über Git — langer Weg für jede Korrektur), Autor-Key auf dem Relay,
kein Gate. Dazu die Anforderung, dass Teammitglieder Entwürfe gemeinsam
korrigieren und Zustimmungen gesammelt werden.

Nostr hat keine Versionierung replaceabler Events und kein Mehrautoren-
Schreiben auf ein Event. Was es hat: Autor-Filter (der Hub zieht ihn schon,
ADR-0012), Labels (NIP-32), inhaltsadressierte Blobs (Blossom), und Bunker,
die einen Key mehreren Clients öffnen.

## Entscheidung

Wir arbeiten **nur noch in Nostr**. Das Gate ist der **Autor-Key**:

1. **Entwürfe** sind gewöhnliche `kind:30023` unter **Redaktions-Keys**
   (je Person oder ein gemeinsamer Redaktions-Key im Bunker). Sie sind
   technisch öffentlich, aber im Community-Hub unsichtbar, weil der Hub
   nur den FOERBICO-Autor zeigt. `kind:30024` wird **nicht** gebraucht;
   ADR-0020 ist damit zurückgezogen.
2. **Gemeinsame Korrektur**: mehrere Personen schreiben mit demselben
   Redaktions-Key über den Bunker, oder jede mit eigenem Key auf eigener
   Kopie (gleicher `d`), und die Autorin übernimmt. Kommentare als NIP-22
   (`kind:1111`) auf das `naddr`.
3. **Freigabe** = NIP-32-Label `kind:1985` auf die **Event-ID** des
   Entwurfs: `["L","foerbico/review"]`, `["l","freigegeben","foerbico/review"]`,
   `["e",<id>]`, `["a","30023:<pk>:<d>"]`. Neue Version → neue ID →
   Freigaben verfallen. Wer freigeben darf: NIP-51-Liste `kind:30000`
   (`d = redaktion`) unter dem FOERBICO-Key.
4. **Übernahme** (`adopt`) ist der **einzige** Schreibweg auf den
   FOERBICO-Key: Entwurf holen, Freigaben ≥ N prüfen, mit gleichem `d`,
   identischem `content` und identischen Tags neu signieren, dazu
   `["p", <redaktionskey>, "", "author"]`; 30142 mit Creator-p-Tag nach
   NIP-AMB. Blobs per BUD-04 `PUT /mirror` unter FOERBICO-Auth (Hash und
   URL bleiben gleich). `kind:1063` wird nicht neu attestiert — der
   Lookup geht über den Hash, nicht über den Autor.
5. **Änderungen nach Veröffentlichung** gehen denselben Weg. Der
   FOERBICO-Stand ist immer eine freigegebene Kopie von etwas anderem
   und wird nie von Hand bearbeitet.
6. **Git** ist Backup-Spiegel (`pull`), kein Review. Die Migration des
   Altbestands läuft einmalig über `publish` (Spec 2026-09-04), danach
   wird `publish` stillgelegt.

## Konsequenzen

- Der Community-Hub braucht **keine Änderung**: ADR-0012 filtert bereits
  auf den Autor. Entwürfe sind für ihn nicht existent.
- edufeed braucht: Freigabe-Label setzen/anzeigen und einen
  „Übernehmen"-Weg. Beides kann zuerst als CLI im `mdparser/sync`
  (`sync adopt <naddr>`) laufen, mit dem Bunker der Action; Editor-Buttons
  später.
- Nachvollziehbarkeit: die Freigabe pinnt eine Event-ID, also weiß man,
  **was** freigegeben wurde. Eine Änderungshistorie liefert nur der
  Git-Spiegel, wenn er jede Version sieht (Listener statt Cron) — sonst
  gibt es Historie nur auf Ebene der Übernahmen. Das ist ein bewusster
  Verlust gegenüber Git-Review.
- Redaktions-Keys sind Wegwerf- oder Personenkeys; wer geht, nimmt
  seinen mit, der Bestand liegt beim FOERBICO-Key. Kein Key-Sharing
  außer über den Bunker.
- Falsch war die Entscheidung, wenn die Übernahme im Alltag übersprungen
  wird (jemand schreibt doch direkt mit dem FOERBICO-Key). Dann ist das
  Gate wieder keins — Abhilfe: FOERBICO-Key nur noch im Action-Bunker,
  nicht in Personen-Clients.

## Offen

- Bunker für Redaktions-Keys: Amber je Person oder Server-Bunker mit
  Login (`nostr-keycloak-onboarding`)? → Steffen
- Erlaubt `blossom.edufeed.org` `PUT /mirror` (BUD-04)? Sonst Download +
  Re-Upload unter FOERBICO-Auth, Ergebnis identisch. → Steffen
- N für Freigaben: Vorschlag 1 (zweites Augenpaar), nicht Autorin selbst.
