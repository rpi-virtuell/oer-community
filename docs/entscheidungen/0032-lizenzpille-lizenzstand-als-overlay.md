# ADR-0032: Lizenzpille — der Lizenzstand liegt auf jedem Bild, auch in der Übersicht

**Status:** angenommen (2026-09-15)
**Beteiligte:** Jörg

Ergänzt ADR-0022 (Punkt 2 gilt auch für die Übersicht) und ADR-0025 (die
KI-Marke steht auch in der Pille). Ersetzt nichts.

## Kontext

ADR-0022 hat entschieden: Das Bild wird immer ausgeliefert, der Lizenzstand
steht daran. Umgesetzt war das nur in der Detailansicht. Die Übersichtskarte
(`Karte.svelte`) zeigte ein Cover nur bei vollständig aufgelöster Kette und
ließ es sonst ganz weg — am 15.09.2026 hatten deshalb 2 von 20 Karten im
Blog ein Bild, obwohl weitere Artikel ein absolut adressiertes Blossom-Bild
tragen. Die Attribution stand als Textzeile unter der Karte, nicht am Bild.

Die edufeed-app löst dieselbe Frage mit einer Komponente für alle Stellen,
an denen ein Bild erscheint (`ImageLicenseOverlay.svelte`, Stand
15.09.2026): eine Pille unten rechts auf dem Bild — EU-„AI"-Marke, wenn
das `ai`-Tag gesetzt ist, dann Lizenzkürzel, dann Credit; bei fehlendem
Nachweis eine neutrale Pille mit „i"-Symbol und Erklärung statt eines
versteckten Bildes. Zwei Oberflächen auf denselben Events sollen denselben
Stand auf dieselbe Art zeigen (Begründung in ADR-0022).

## Entscheidung

1. **Eine Pille auf jedem ausgelieferten Bild.** `Lizenzpille.svelte`
   rendert aus dem `Ergebnis` von `lizenzPruefen` zwei Zustände:
   - *bekannt* (`ok: true`): KI-Marke (nur mit `ai`-Tag, ADR-0025) ·
     Lizenzkürzel (`lizenzLabel`, ADR-0022 Punkt 3) · Credit, wenn
     vorhanden. Kein Link — die Pille liegt auf einem verlinkten Bild. Die
     vollständige Attribution steht im `title`.
   - *ungeklärt* (`ok: false`): „Lizenz ungeklärt" mit dem Grund
     (`GRUND_TEXT`) im `title`.
   Die Pille sitzt unten rechts, Grund ist `--fb-weiss` zu 90 % über dem
   Bild, Text `--fb-text`, Rahmen `--fb-rahmen`, voll gerundet.
2. **Die Übersicht liefert das Cover auch ohne Nachweis.** Der Loader
   gibt `{ url, alt, lizenz }` zurück, sobald das Bild zeigbar ist; nur
   `kein-bild`, `relativ` und `abgeloester-host` ergeben kein Cover —
   dieselben drei Gründe wie im `Bildbereich`, deshalb als `NICHT_ZEIGBAR`
   im Modell. Ohne `x`-Tag gibt es wie in der Detailansicht keinen Lookup
   (`kein-x-tag`).
3. **Die Karte trägt nur die Pille.** Die Textzeile unter der Karte
   entfällt; die verlinkte Attribution nach `bildattribution.md` steht auf
   der Artikelseite, einen Klick entfernt. Dort bleiben Pille **und**
   Unterschrift — die Pille ist Marke, die Unterschrift ist die Attribution.
4. **Kein Popover, kein Fokus.** edufeeds Pille öffnet bei Hover und
   Fokus eine Erklärung. Der Hub ist ohne JavaScript lesbar und die Pille
   ist kein Bedienelement: sichtbarer Text plus `title` genügen; der
   ausführliche Grund steht auf der Artikelseite in der Bildunterschrift.
   Die Pille steht neben dem Link, nicht darin — der Cover-Link der Karte
   ist `aria-hidden`.

## Konsequenzen

- **Der Blog wird bildreicher, und ehrlicher.** Jedes zeigbare Cover
  erscheint; was ihm fehlt, steht darauf. Die Zahl der Pillen „Lizenz
  ungeklärt" in der Übersicht ist die Redaktionsliste.
- **Die Attributionsform bleibt die des Projekts.** Die Pille ist eine
  Kurzform (Kürzel · Credit), keine zweite Attributionskonvention; die
  normative Zeile (Titel, Urheber, Lizenz, KI, Bearbeitung) bleibt allein in
  `Lizenzzeile.svelte`.
- **Ein gemeinsames SVG.** Die EU-Marke liegt in `KiMarke.svelte` und wird
  von Zeile und Pille genutzt; Pfade weiterhin kopiert aus edufeeds
  `AiLabelIcon.svelte` (ADR-0025).
- **Woran wir merken, dass es falsch war:** Wenn die Redaktion die
  Kurzform der Pille als Attribution missversteht und die Zeile darunter
  für überflüssig hält, oder wenn Betrachter den Grund für „ungeklärt" in
  der Übersicht vermissen. Dann ist der Grund als sichtbarer Text auf die
  Karte zu holen — nicht die Pille zu streichen.
