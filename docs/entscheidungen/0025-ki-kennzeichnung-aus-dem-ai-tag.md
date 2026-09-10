# ADR-0025: KI-Beteiligung aus dem `ai`-Tag des Nachweises als Marke hinter der Lizenz kennzeichnen

**Status:** angenommen (2026-09-10)
**Beteiligte:** Jörg; Vorlage ist das edufeed-Wiki `license-events-nope`
(kind 30818, Autor `bdc21f93…`, Fassung vom 2026-09-10, Event `40772140…`)

Ergänzt ADR-0022 (Bildunterschrift nach `bildattribution.md`) um ein Glied.
Ersetzt nichts.

## Kontext

edufeed hat das Wiki zu den Lizenz-Events am 10.09.2026 um ein `ai`-Tag
erweitert. Zwei Werte, die den Icons des EU AI Office folgen: `generated`
(vollständig KI-generiert, menschlich nur der Prompt) und `modified`
(bestehendes menschliches Werk teilweise mit KI verändert). Regeln des Wikis:
höchstens ein `ai`-Tag; kein Tag heißt „nicht deklariert", **nicht** „ohne
KI"; jeder andere Wert ist zu ignorieren; das Label ersetzt die Lizenz nicht,
`license` und `credit` bleiben, `credit` nennt, wer geprompt oder bearbeitet
hat. Die Anzeige soll „das Lizenz-Badge mit einer AI-Marke daneben" rendern —
das ist die Transparenzkennzeichnung, die der EU AI Act verlangt.

Der Hub zeigt dieselben Events wie die edufeed-app (ADR-0022). Zwei Fragen
waren offen: **wo** die Marke in der normativen Bildunterschrift steht, und
wie die Redaktionsseite das Merkmal setzt — die Redaktion schreibt keine
Tags, sondern den `# bilder`-Block (`bildattribution.md`).

## Entscheidung

**1. Der Hub liest `ai` als `ki` am Nachweis.** Gültig sind `generated` und
`modified`; alles andere wird `null` — nicht deklariert. Das Feld ist keine
Pflicht und ändert die Auflösungskette (ADR-0013/0022) nicht.

**2. Die Marke steht direkt hinter dem Lizenz-Link, vor `modification`.**

```
[title](sourceUrl), [author](authorUrl), [licence](licenceUrl), KI-Kennzeichnung, modification
```

Text „KI-generiert" bzw. „KI-verändert", als abgesetzte Marke (`<span
class="ki">`), kein Link. Das ist edufeeds „neben dem Lizenz-Badge",
übersetzt in die Konvention: Die Reihenfolge bleibt normativ, der Trenner
bleibt `, `. `bildattribution.md` wird entsprechend erweitert.

**3. Die Redaktionsseite ist das Feld `ai` im `# bilder`-Block.** `ai:
generated` oder `ai: modified`, ein Schlüssel, dieselben Werte wie das Tag.
`mdparser/sync` (CI) und `md2blossom` prägen daraus das Tag, der
`foerbico-editor` bietet es als Auswahl an und liest es aus vorhandenen
Nachweisen zurück. Alle drei schreiben dieselben Wörter in die Caption wie
der Hub sie zeigt (`KI_TEXT` in `attribution.js`, kopiert, nicht verlinkt).

**4. Wortlaut und Icon wie die edufeed-app.** Geprüft am 10.09.2026 am
Quelltext der App (`helpers/ai-label.js`, `ImageLicenseOverlay.svelte`,
`icons/ui/AiLabelIcon.svelte`, `messages/de.json`): Sie liest das Tag genauso
(erster `ai`-Tag mit bekanntem Wert, alles andere ignoriert), schreibt auf
Deutsch „KI-generiert" und „KI-verändert" und zeigt das runde „AI"-Label des
EU AI Office, das zur freien Nutzung ohne Namensnennung veröffentlicht ist.
Wir übernehmen beides — den Wortlaut in `KI_TEXT`, das Icon als Inline-SVG in
`Lizenzzeile.svelte` — **kopiert, nicht verlinkt** (CLAUDE.md). Nicht
übernommen: die Position. edufeed stellt die Marke im Badge **vor** das
Lizenzkürzel; bei uns steht sie hinter dem Lizenz-Link, weil die Caption der
Konvention folgt, nicht edufeeds Badge (wie in ADR-0022, Punkt 4).

## Konsequenzen

- **Ein Glied mehr in der Konvention.** `bildattribution.md` bekommt `ai`
  als optionales Feld und die Caption-Konstruktion die Position hinter der
  Lizenz. Das ist eine Änderung der normativen Reihenfolge — deshalb eine
  ADR, keine stille Code-Änderung.
- **Die Entwickleransicht (ADR-0017) zeigt `ai=…` in Schritt 4**, damit die
  Redaktion sieht, was der Nachweis deklariert.
- **Der Hub behauptet nie „ohne KI".** Fehlt das Tag, fehlt die Marke —
  sonst nichts. Die Unterscheidung „nicht deklariert" vs. „ohne KI" ist
  Sache der Redaktion, nicht der Anzeige.
- **Bestehende Nachweise ändern sich nicht von selbst.** Erst wenn der Block
  eines Beitrags `ai` bekommt, prägt die CI ein neues 1063 (der jüngste
  gewinnt, ADR-0010/0024).
- **Woran wir merken, dass es falsch war:** Wenn edufeed den Wortlaut
  ändert und die Redaktion beim Kontrollieren zwei Bezeichnungen sieht — dann
  ist `KI_TEXT` nachzuziehen (und mit ihm Editor und md2blossom); die
  Position bleibt die der Konvention, wie bei der Caption in ADR-0022.
