# ADR-0029: Die Adresse eines Beitrags ist sein `d`; ein `naddr` leitet dorthin weiter

**Status:** angenommen (2026-09-14)
**Beteiligte:** Jörg

Ergänzt ADR-0016 (`naddr` kommt von außen). Ändert die Route der Spec vom
03.09.

## Kontext

oer.community hat gültige Adressen: `https://oer.community/canva`. Der
`d`-Tag jedes Events ist genau dieser Pfad, weil mdparser ihn aus
`commonMetadata.id` ableitet. Der Hub adressiert heute über `naddr` — eine
Kodierung aus Kind, Autor, `d` und Relay-Hinweisen, die kein Mensch liest
und die keine bestehende Adresse trifft.

Zwei Wege: `naddr` bleibt die Adresse und `d` wird Alias, oder `d` wird die
Adresse und `naddr` leitet weiter.

## Entscheidung

Wir adressieren über `d`: `/[d]` für deutsche, `/en/[d]` für englische
Inhalte. `/[naddr]` **leitet dauerhaft (301)** auf die `d`-Adresse weiter —
für Adressen der eigenen Quelle; fremde `naddr` bleiben 404 (ADR-0016). Die
Entwickleransicht liegt unter `/[d]/json`.

Ein Pfad ist ein `naddr`, wenn er mit `naddr1` beginnt und fehlerfrei
dekodiert; alles andere ist ein `d`. `trailingSlash: 'ignore'`; kanonisch
ist die Form ohne Schrägstrich.

## Konsequenzen

- Alle oer.community-Adressen bleiben gültig; Suchmaschinen, Newsletter und
  Verweise anderer Seiten brechen nicht.
- edufeed-Links mit `naddr` funktionieren weiter und landen auf der lesbaren
  Adresse (ADR-0002: Kompatibilität im Protokoll).
- Ein `d` kommt genauso von außen wie ein `naddr`. Der Wächter ist derselbe:
  Es wird nur im Spiegel der eigenen Quelle gesucht, nie ein Relay nach
  fremden Adressen gefragt. Ein unbekanntes `d` ist 404.
- Ein `d`, das einer festen Route gleicht (`blog`, `themen`, `en`, `feed.xml`,
  `sitemap.xml`), ist nicht erreichbar. Die festen Routen gewinnen; die
  Redaktion vergibt solche `d` nicht. Ein Test hält die Liste fest.
- Falsch war die Entscheidung, wenn zwei Mandanten mit gleichen `d` auf
  einer Instanz laufen sollen. Dann braucht die Route einen Mandantenpräfix
  — heute gibt es eine Quelle je Instanz.
