# ADR-0018: Die drei Kontrastpunkte des Designsystems sind entschieden

**Status:** angenommen (2026-09-04)
**Beteiligte:** Jörg

## Kontext

`docs/designsystem.md` nennt drei Stellen, an denen das Mockup die
WCAG-Anforderung (4,5:1 für normalen Text) nicht erfüllt, und verlangt,
sie **vor dem Bau der Komponenten** zu entscheiden. Mit der Gestaltung der
Detailansicht beginnt dieser Bau. Zur Wahl standen jeweils: Palette
ändern, Schrift dunkler setzen, oder den Punkt offen lassen und das
Mockup übernehmen.

## Entscheidung

Wir übernehmen die Empfehlungen des Designsystems und legen sie als
Tokens in `src/app.css` fest:

1. **Fließtext-Links** in `--rpi` (`#0072aa`, 5,27:1 auf Weiß).
   `--relilab-tief` bleibt für große und dekorative Elemente.
2. **Amber-Marker** bekommen ein eigenes Textfarb-Token
   `--marker-amber-text: #96550a` (5,12:1 auf 16 % Amber). `--amber` als
   Fläche bleibt unverändert.
3. **Aufmacher-Verlauf** wird dunkler angelegt:
   `--aufmacher-start: #1a5699` (= `--fusion`) nach
   `--aufmacher-ende: #8d0fa8`. Weiß erreicht an beiden Enden über 7:1;
   damit trägt auch die Augenbraue in voller Deckkraft.

Zwei Festlegungen, die dabei anfielen:

- **Augenbraue auf Weiß** steht in `--rl-text-leise`, nicht in
  `--relilab-tief`: bei `.82rem` ist das kleiner Text, und 3,57:1 reicht
  nicht.
- **Fußzeilentext** auf `--fau` ist `--fuss-text: #a8bccf` (6,51:1) — der
  Wert aus dem Mockup, nachgerechnet.

Die Zahlen sind nicht Behauptung, sondern Prüfung: `test/kontrast.test.js`
rechnet sie aus den Tokens in `app.css` nach. Wer ein Token ändert, sieht
den Test kippen.

## Konsequenzen

- Palette und Farbkarte bleiben unangetastet; es kommen nur Tokens für
  Text auf Farbflächen hinzu. Das Designsystem bleibt mit FOERBICO und
  rpi-virtuell kompatibel.
- `--marker-amber-text` und `--verlauf-aufmacher` haben in der
  Detailansicht noch keinen Einsatz — sie warten auf die Startseite.
  Die Entscheidung steht trotzdem jetzt im Code, damit sie nicht beim
  Bau der Startseite unter Zeitdruck neu getroffen wird.
- Falsch wäre die Entscheidung, wenn die Marke durch den dunkleren
  Aufmacher spürbar an Wiedererkennung verlöre. Dann wäre der Weg eine
  abdunkelnde Auflage unter dem Text statt eines anderen Verlaufs — der
  Test bliebe derselbe.
