# ADR-0010: Exemplarische Inhalte redaktionell neu einstellen, Bilder auf Blossom mit Lizenznachweis

**Status:** angenommen (2026-09-02)
**Beteiligte:** Jörg

## Kontext

Die 111 Bot-Events auf `relay.edufeed.org` sind als Datengrundlage
vorhanden, taugen aber nicht als Startbestand für eine öffentliche
Instanz:

- **Die Medien liegen weiterhin auf relilab.org.** Alle 56 Bilder sind
  150×150-Thumbnails, die von dort geladen werden — das Schaufenster
  wäre also nicht unabhängig von WordPress, sondern hätte es nur
  hinter einer neuen Oberfläche versteckt.
- **Urheberrechtsangaben fehlen oder sind unvollständig.** Für einen
  Teil der Bilder liegen keine Lizenz- und Urheberangaben vor. Sie
  ungeprüft weiterzuveröffentlichen ist rechtlich nicht vertretbar und
  widerspricht dem OER-Anspruch des Projekts.

Die edufeed-app hat für genau dieses Problem bereits einen Mechanismus,
inklusive Web-Frontend.

## Entscheidung

Wir stellen für v0.0.1 **exemplarische Beiträge und Termine redaktionell
neu ein** — statt den Bot-Bestand zu übernehmen. Dabei gilt:

1. **Vorschaubilder landen auf Blossom**, nicht auf relilab.org.
2. **Jedes Bild bekommt einen Lizenznachweis** als NIP-94-Event
   (`kind:1063`), nach der edufeed-Konvention.
3. **Der bestehende edufeed-Mechanismus wird bedient**, nicht neu
   erfunden — einschließlich seines Web-Frontends.

## Der edufeed-Mechanismus (geprüft am 02.09.2026)

Lizenzattestierung über `kind:1063`, adressiert über den SHA-256-Hash
des Bildes. Pflichtfelder bei edufeed über NIP-94 hinaus: **`license`**
(Lizenz-URL) und **`credit`** (Urhebernennung).

| Tag | Bedeutung |
|---|---|
| `url` | Ort des Bildes (Blossom) |
| `x` | SHA-256 hex — der Schlüssel, über den nachgeschlagen wird |
| `m` | MIME-Typ |
| `license` | Lizenz-URL (CC …) — **bei edufeed Pflicht** |
| `credit` | Urhebernennung im Klartext — **bei edufeed Pflicht** |
| `source` | Ursprungsseite (optional) |
| `size`, `dim`, `p` | optional |

**Nachschlagen:** `{ kinds: [1063], '#x': [hash] }`; bei mehreren
Treffern gewinnt das neueste `created_at`, Gleichstand nach `id`.

**Bausteine in der edufeed-app** (Vorlage, nicht zu kopieren ohne
Prüfung): `helpers/image-license.js` (`buildLicenseTemplate`),
`stores/image-license.svelte.js` (`useLicenseForHash`),
`components/shared/LicensedImageInput.svelte` (Upload + Lizenzdialog),
`components/shared/LicenseBadge.svelte` (Anzeige).

## Konsequenzen

- **ADR-0003 bekommt seine erste Ablaufbedingung eingelöst:** Für das
  redaktionelle Einstellen braucht es einen **Schreibpfad mit Anmeldung**.
  Das Schaufenster bleibt lesend; das Einstellen geschieht zunächst über
  das **Web-Frontend der edufeed-app** — kein eigener Editor im
  relilab-client. Ob und wann ein eigener Schreibpfad entsteht, ist eine
  spätere ADR.
- **Der Zuschnitt in CLAUDE.md bleibt gültig** (kein Login, keine
  Autorenwerkzeuge im relilab-client) — das Einstellen findet außerhalb
  statt.
- **Der relilab-client muss `kind:1063` lesen können:** Zu jedem
  angezeigten Bild ist der Lizenznachweis aufzulösen und **sichtbar
  auszuweisen**. Ein Bild ohne auflösbaren Nachweis wird als solches
  kenntlich gemacht, nicht stillschweigend angezeigt.
- **Die Bilder werden dadurch groß statt 150×150.** Die in CLAUDE.md
  notierte Falle („Bilder sind 150×150-Thumbnails, zentriert darstellen,
  Lösung liegt beim Bot") gilt nur noch für Altbestand aus dem Bot.
- **Der Bot-Bestand bleibt als Testdatensatz** für Mock-Relay und
  Fixtures nützlich — er ist nur nicht der Startbestand der Instanz.
- **Blossom-Server: `https://blossom.edufeed.org/`** (geprüft am
  02.09.2026: erreichbar, `access-control-allow-origin: *`, HSTS —
  der Client kann die Bilder direkt laden). In der edufeed-app steckt
  die Adresse in `blossom.serverUrl`; hier bleibt sie ebenfalls
  Konfiguration, kein Code.
- **Umfang: eine Handvoll** Beiträge und Termine. Nicht mehr, bis das
  grundlegende Schema steht — siehe Abbruchbedingung.

## Abbruchbedingung

Der redaktionelle Bestand wird erst erweitert, wenn das Schema
**belastbar** ist: Frontmatter/Tags, Lizenznachweis, Themen und die
Darstellung greifen sauber ineinander, und ein Beitrag lässt sich ohne
Nacharbeit einstellen. Vorher ist jeder zusätzliche Beitrag Aufwand, der
beim nächsten Schemawechsel doppelt anfällt.
