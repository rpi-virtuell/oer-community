# ADR-0012: FOERBICO ist die erste Datenquelle, nicht der relilab-Bot

**Status:** angenommen (2026-09-03)
**Beteiligte:** Jörg

## Kontext

Bisher stand als Datengrundlage der relilab-Bot fest: 111 Events,
`kind:30023/31922/31923`, gefiltert über Autor **und** `h`-Tag
(CLAUDE.md, Spec). ADR-0010 hat diesen Bestand als Startbestand
verworfen — die Medien liegen auf relilab.org, Urheberrechtsangaben
fehlen.

Parallel existiert auf den Edufeed-Relays ein zweiter, redaktionell
gepflegter Bestand: die Beiträge des FOERBICO-Projekts, eingestellt über
das Web-Frontend der edufeed-app. Ein Beitrag
(`die-kraft-der-gemeinschaft`, 03.09.2026) ist dort exemplarisch nach der
Zielkonvention überarbeitet worden: Bild auf Blossom, `x`-Tag, Lizenz-
nachweis als `kind:1063`.

Damit gibt es eine Quelle, die den Zielzustand aus ADR-0010 tatsächlich
zeigt — statt einer, die ihn verfehlt.

## Bestandsaufnahme (geprüft am 03.09.2026)

Autor `5a12b41ec15b466321e88c371be2dc47d9193f9c8bba4ab09fc50045bd35aedf`
(`display_name: "Foerbico"`), auf `relay.edufeed.org` und
`relay-rpi.edufeed.org`:

| Größe | Wert |
|---|---|
| Artikel `kind:30023` | **86** |
| Termine `kind:31923` / `31922` | **0** |
| Bildverweise gesamt | **269** |
| Aufmacher auf Blossom **mit** `x`-Tag | **1** |
| Lizenznachweise `kind:1063` | **1** |
| verschiedene `t`-Tags | 43 (auf 25 Artikeln) |

Zustände der Aufmacherbilder: 78 Fremd-URL ohne `x`-Tag · 6 ohne
Aufmacher · 1 Blossom mit `x` · 1 Blossom ohne `x`.

## Entscheidung

Wir machen **FOERBICO zur ersten Datenquelle** des community-hub. Die
relilab-Regeln bleiben in CLAUDE.md stehen — sie werden nicht bedient,
aber auch nicht gelöscht.

**Der Filter ändert sich: Autor allein, ohne `h`-Tag.**

```json
{ "kinds": [30023, 31922, 31923],
  "authors": ["5a12b41ec15b466321e88c371be2dc47d9193f9c8bba4ab09fc50045bd35aedf"] }
```

Das ist eine **bewusste Abweichung** von der Regel „beide Kriterien
zusammen, nie eines allein" (CLAUDE.md, Spec): **85 der 86 Artikel haben
gar kein `h`-Tag**. Mit dem Doppelfilter käme genau ein Artikel durch.

Die Regel bleibt für Bot-Quellen richtig — dort schützt sie vor fremden
Mandanteninhalten. Bei FOERBICO ist der Autorenschlüssel ein
redaktioneller Account, kein Bot, der für mehrere Mandanten publiziert;
das Risiko, gegen das der `h`-Filter schützt, besteht hier nicht.

**Woran wir merken, dass das kippt:** Sobald unter diesem Schlüssel
Inhalte erscheinen, die nicht in den Hub gehören, brauchen wir ein
zweites Kriterium — dann ist `h` nachzurüsten, redaktionell an den
Events, nicht durch Rateheuristik im Client.

## Konsequenzen

- **Termine gibt es zunächst nicht.** Null `31922`/`31923` unter diesem
  Schlüssel. Die Termin-Ansicht wird gebaut, bleibt aber leer — und muss
  deshalb ihren Leerzustand erklären („noch keine Termine
  veröffentlicht"), nicht stumm leer bleiben (CLAUDE.md).
- **Die Themen-Normalisierung wird kleiner, aber nicht überflüssig.**
  43 statt 195 `t`-Tags, und nur 25 von 86 Artikeln tragen überhaupt
  welche. Dubletten sind da (`OER` neben `Open Educational Resources
  (OER)`, `OER-Community` neben `OER-Communities`). `src/lib/themen.js`
  bleibt Redaktionsarbeit.
- **Zwei Relays sind Pflicht, nicht Redundanz.** Der Artikel liegt auf
  `relay.edufeed.org`, sein Lizenznachweis **nur** auf
  `relay-rpi.edufeed.org` — siehe ADR-0013.
- **Der Content ist sauberer als beim Bot.** Keine Kadence-CSS-Reste,
  kein `wp-block`. Vorhanden sind: 19 Artikel mit Blockquote (nicht
  automatisch eine Autorenzeile — im Stichprobenfall echte Zitate),
  5 mit absoluten Site-Pfaden `](/…`, 3 mit Roh-HTML (`<br>`).
  Die Bot-Säuberungsregeln aus CLAUDE.md greifen hier **nicht
  unverändert** und dürfen nicht blind übernommen werden.
- **Neue Falle: relative Bildpfade im Markdown.** 166 der 269
  Bildverweise sind relativ (`![](nosTr-schrein.jpg)`) und lösen nur im
  WordPress-Kontext auf — siehe ADR-0013.
- **`about`- und `inLanguage`-Tags kommen dazu** (Fächersystematik über
  `w3id.org/kim/…`, Sprachcode). Der Bot hatte sie nicht. Sie werden
  zunächst nicht ausgewertet; `inLanguage` ist durchweg `de`, was die
  Einsprachigkeit aus CLAUDE.md bestätigt.
- **Ein `a`-Tag verweist auf `kind:30142`** (AMB-Metadaten) desselben
  Autors. Nicht Teil dieses Vorhabens, aber notiert: dort liegen
  strukturierte Metadaten, falls Themen später von dort kommen sollen.

## Was das für relilab heißt

relilab bleibt Mandant und Zielgruppe (ADR-0011). Diese ADR sagt nur,
**womit entwickelt wird** — FOERBICO ist die Quelle, die den Zielzustand
aus ADR-0010 vorführt. Wann und wie relilab-Inhalte nachkommen, ist eine
eigene Entscheidung; der Autorenschlüssel ist Konfiguration, kein Code,
und eine zweite Quelle ist damit kein Umbau.
