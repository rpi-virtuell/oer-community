# ADR-0019: Die Wortmarke ist vorläufig „Community-Hub"

**Status:** angenommen (2026-09-04), ausdrücklich vorläufig
**Beteiligte:** Jörg

## Kontext

Die erste Fassung der Kopf- und Fußzeile trug „relilab" als Wortmarke,
im Verlauf des Designsystems. Das war naheliegend — relilab ist die
Herkunft der Inhalte, die Domain und der Name der Farbtokens — aber es
beschreibt die Vergangenheit, nicht das Vorhaben:

- **relilab** ist die ursprüngliche Herkunft der Inhalte.
- **rpi-virtuell** ist die alte Plattform.
- **FOERBICO** will diese Plattform zu einem Community-Hub
  transformieren. Der community-hub ist dessen erstes Stück.

Für den Community-Hub gibt es **noch kein Branding** — keine Wortmarke,
kein Logo, keine Festlegung zur Schreibweise. Eine Marke zu zeigen, die
es nicht gibt, oder eine, die das Alte meint, wäre beides falsch.

## Entscheidung

Kopf- und Fußzeile tragen die Wortmarke **„Community-Hub"** — als
Platzhalter, in derselben Typografie und demselben Verlauf, die später
das echte Branding tragen. Der Verlauf liegt auf „Hub".

Die Farbtokens heißen weiter `--relilab`, `--relilab-tief`: Sie
bezeichnen Farben aus der Farbkarte, nicht die Marke, und die Farbkarte
gilt (ADR-0004).

## Konsequenzen

- CLAUDE.md sagte „relilab bleibt als Mandant, Marke, Domain und
  Farbtoken". **Marke** ist dort zu streichen — die Datei ist
  entsprechend korrigiert. Mandant, Domain und Farbtoken bleiben.
- Sobald ein Branding existiert, wird diese ADR durch eine neue
  ersetzt, die es festlegt. Die Komponenten `Kopfzeile.svelte` und
  `Fusszeile.svelte` sind die einzigen Stellen, an denen die Wortmarke
  steht; `test/oberflaeche.test.js` prüft sie.
- Der `<title>` der Seiten sagt weiter „community-hub" (Projektname,
  klein) — auch das ist Platzhalter und wandert mit dem Branding.
