# ADR-0033: Zweisprachig — Englisch als zweite Sprache mit Umschalter

**Status:** offen — umgesetzt am 2026-09-15 auf Wunsch von Jörg („Mehrsprachigkeits-Toggle inkl. Umsetzung"); Bestätigung der Gestaltung durch das Team steht aus
**Beteiligte:** Jörg

Ergänzt ADR-0027 (Struktur aus Nostr) und ADR-0029 (Adressen sind `d`).
Löst den Satz „Keine Mehrsprachigkeit, kein Paraglide/inlang" in CLAUDE.md
und die Aussage der Spec vom 14.09. ab, `/en` leite auf `/` weiter und eine
englische Startseite gebe es nicht.

## Kontext

oer.community hat drei englische Seiten (`/en/conference`,
`/en/oer-and-oep`, `/en/our-team`) und eine englische Startseite (`/en`),
alle als Übersetzungen deutscher Seiten. Hugo verlinkt sie im PaperMod-Theme
über einen Sprachumschalter. Im Hub waren sie bisher weder publiziert (dem
Frontmatter fehlten `name`, `description`, `datePublished`) noch
verbunden: Kein Event sagt, welche Seite die Übersetzung welcher anderen
ist, und der Hub kannte nur die Regel „`inLanguage = en` → `/en/<d>`".

Zwei Fragen waren offen: Wie heißt das `d` einer englischen Seite, und woher
weiß der Hub, welche deutsche Seite dazugehört?

## Entscheidung

1. **Das `d` ist der Hugo-Pfad, auch für Englisch.** `id:
   https://oer.community/en/conference` ergibt `d = en/conference`, wie der
   mdparser es aus der `id` ableitet. So kollidieren `impressum` und
   `en/impressum` nicht (ersetzbare Events sind je Autor und `d` eindeutig).
   Die Adresse im Hub ist `/` + `d`, also `/en/conference`. Ein englischer
   Beitrag ohne Präfix (Altbestand) bleibt unter `/en/<d>` erreichbar; die
   Route `/en/[d]` sucht erst `en/<d>`, dann `<d>` in Sprache `en`.
2. **Übersetzungen stehen im Frontmatter als schema.org-Relation** —
   `workTranslation` an der deutschen Seite (URL der englischen),
   `translationOfWork` an der englischen (URL der deutschen). Der mdparser
   schreibt daraus `["a", "30023:<pubkey>:<d>", "", "translation"]`. Der Hub
   liest beide Richtungen und baut die Zuordnung symmetrisch: eine Richtung
   genügt, damit der Umschalter funktioniert.
3. **Ein Umschalter DE | EN in der Kopfzeile**, nur wenn der Spiegel
   englische Inhalte hat. Ziel ist das Gegenstück der aktuellen Seite, sonst
   die Startseite der Sprache: `/` oder `/en`. `/en` zeigt die Seite
   `en/<STARTSEITE_D>`; fehlt sie, leitet `/en` weiter auf `/`.
   Die Seite trägt `<link rel="alternate" hreflang>` auf ihr Gegenstück.
4. **Menü und Fußzeile folgen der Sprache der Adresse:** Unter `/en/…`
   zeigt jeder Eintrag sein Gegenstück, wenn es eines gibt, sonst den
   deutschen Eintrag (ein deutsches Impressum ist besser als keines). Die
   Ansichten des Hubs heißen „Blog" und „Topics".
5. **Blog und Themen bleiben eine Liste.** Beiträge erscheinen in ihrer
   Sprache; `/en/blog` gibt es nicht, bis es englische Beiträge gibt.
6. **Oberflächentexte des Hubs stehen in einer Tabelle** (`src/lib/sprache.js`,
   Deutsch und Englisch) — ein Dutzend Strings. Paraglide/inlang bleibt
   draußen: Der Hub hat kaum Chrome, und eine Bibliothek brächte einen
   Build-Schritt für zwölf Wörter. `<html lang>` wird je Antwort gesetzt.

## Konsequenzen

- **Produzentenseite:** Die englischen Seiten brauchen `name`,
  `description`, `datePublished`, `creator` und `translationOfWork`; die
  deutschen `workTranslation`. Eine englische Startseite entsteht als
  `content/en/startseite/index.md` (für Hugo nicht gerendert), Gegenstück von
  `startseite`. Der mdparser emittiert das `a`-Tag (Contract
  `event-tag-mapping.md`).
- **Der Umschalter ist ehrlich:** Auf einer Seite ohne Gegenstück führt er
  auf die Startseite der anderen Sprache — kein „in Vorbereitung".
- **Blog-Beiträge in Englisch** würden heute im deutschen Blog erscheinen.
  Wenn es sie gibt, ist `/en/blog` als Filter auf `inLanguage = en` die
  naheliegende Ergänzung — nicht Teil dieser ADR.
- **Woran wir merken, dass es falsch war:** Wenn Redaktion Übersetzungen
  nicht als Relation im Frontmatter pflegt, sondern nach Slug-Ähnlichkeit
  erwartet; oder wenn das Chrome mehr Texte bekommt, als eine Tabelle
  trägt — dann ist Paraglide neu zu bewerten.
