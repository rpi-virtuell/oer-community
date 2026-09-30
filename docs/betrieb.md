# Betrieb

## Dev-Umgebung

**Dev-Adresse seit dem 30.09.2026: `oer-community.rpi-virtuell.net`.**
Repository seit 15.09.2026 `Comenius-Institut/oer-community` (umbenannt aus
`community-hub`; Forgejo leitet die alte Adresse weiter, Woodpecker hängt am
Repository, nicht am Namen). Ludger hat Server und DNS mit dem Commit
„Deploy nach oer-community" (PR #4) umgestellt; die alte Adresse
`community-hub.rpi-virtuell.net` zeigt nur noch einen Umzugshinweis.

Jeder Push auf `main` löst die Woodpecker-Pipeline aus (`.woodpecker.yml`):
`pnpm install`, `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build`, dann
per SSH als `svc-cha` das Skript
`~/ServerSetup/scripts/deploy-app.sh oer-community` auf
`oer-community.rpi-virtuell.net`. Das Skript zieht das Server-Repository
per `git pull`, synchronisiert eine git-freie Kopie und baut das Image aus
dem `Dockerfile` mit Podman. **Der Container ist also der Docker-Weg**,
nicht die systemd-Unit weiter unten — deshalb liegt `daten/themen.json` im
Image (Dockerfile). Ob der Container ein Volume für `daten/` bekommt,
entscheidet das Skript auf dem Server; ohne Volume startet der Spiegel nach
jedem Neustart leer und lädt neu (ADR-0028), die Datei schreibt er dann nur
ins Container-Dateisystem — und die Profilbilder (ADR-0039) holt er ebenfalls
neu.

Status und Logs: Forgejo zeigt den Commit-Status, die Pipeline liegt unter
`https://woody.git.rpi-virtuell.de/repos/13/`. Eingerichtet von Ludger
(PR #3, 08.09.2026).

**Erledigter Stolperstein (14.09.–30.09.2026):** Das alte Server-Repo stand
auf dem Branch `succesful-deployment`, der nach dem Merge von PR #3 auf dem
Remote gelöscht war; `git pull` fand keinen Upstream, der Deploy-Schritt
brach nach einer Sekunde ab. Übergangsweise wurde der Branch bei jedem Push
mitgeführt. Seit dem Umzug auf `oer-community` (30.09.) läuft der Deploy
ohne Hilfsbranch; `succesful-deployment` ist gelöscht und `main` allein
genügt:

```
git push origin main
```

## GitHub-Spiegel und Übertragung nach Forgejo

Haupt-Repository ist Forgejo; `github.com/rpi-virtuell/oer-community` ist
sein Spiegel. Claude arbeitet dort auf `feat/**`-Branches (ADR-0035). Der
Workflow `.github/workflows/nach-forgejo.yml` pusht jeden solchen Branch bei
jedem Push nach Forgejo; gemergt wird auf Forgejo, der Spiegel bringt `dev`
und `main` zurück.

Eingerichtet im GitHub-Repository unter Settings → Secrets and variables →
Actions (seit 30.09.2026):

| Name | Art | Inhalt |
|---|---|---|
| `FORGEJO_TOKEN` | Repository-Secret | Forgejo-Token mit `write:repository` |
| `FORGEJO_USER` | Repository-Variable | Forgejo-Benutzername zum Token |

**Der Spiegel hinkt.** Forgejo schiebt `main` und `dev` nicht sofort nach
GitHub; am 30.09.2026 lag der Spiegel zeitweise einen Nachmittag zurück, und
gemergte Branches, die auf Forgejo schon gelöscht waren, standen dort noch.
Umgekehrt legt der Übertragungs-Workflow einen auf Forgejo gelöschten
`feat/**`-Branch wieder an, sobald auf GitHub noch einmal darauf gepusht
wird. Deshalb vor dem Abzweigen eines `feat/**`-Branches auf GitHub den
`dev`-Stand mit Forgejo vergleichen (`git ls-remote --heads` beider Remotes)
und im Zweifel `dev` von Forgejo pushen; die Sitzung auf GitHub setzt sonst
auf einem alten Stand auf und löst Konflikte, die es auf Forgejo nicht mehr
gibt. Gemergte Branches auf Forgejo löschen und danach prüfen, ob sie auf
GitHub ebenfalls weg sind.

Scheitert ein Lauf (GitHub → Actions → „Nach Forgejo übertragen"), liegt der
Branch nicht auf Forgejo. Meist ist der Token abgelaufen; neuen anlegen,
Secret ersetzen, Lauf neu starten.

Daneben prüft `.github/workflows/pruefen.yml` jeden `feat/**`-Branch:
`pnpm check`, `pnpm lint`, `pnpm test` und `pnpm test:e2e` (Playwright,
Chromium). Die beiden Workflows hängen nicht voneinander ab — ein roter
„Prüfen"-Lauf hält die Übertragung nicht auf. **Vor dem Merge auf Forgejo
auf grünes „Prüfen" achten.** Bei einem Fehlschlag der E2E-Tests liegen
Spuren (Trace, Screenshot) als Artefakt `playwright-spuren` am Lauf.
Woodpecker führt auf `main` zusätzlich `pnpm lint` aus; die E2E-Tests
laufen dort nicht, weil das Alpine-Image keinen Browser mitbringt.

## Zweiter Server (Hetzner, systemd)

**Server:** `46.225.82.96` (Hetzner, Ubuntu 24.04.4, 7,6 GB RAM, 65 GB frei)
**Zugang:** `ssh -i ~/.ssh/id_cihacker joerg@46.225.82.96`
**Verzeichnis:** `~/community-hub` · **Port:** 8080, **nur auf `127.0.0.1`**
**Werkzeuge:** Node 24.20.0 und pnpm 11.25.0 in `~/.local/node`
**Läuft seit:** 03.09.2026 · `systemctl --user status community-hub`

Der Dienst lauscht bewusst **nur lokal**. Der Node-Prozess soll nicht
selbst im Netz stehen; von aussen erreichbar wird die Seite über einen
Reverse-Proxy — siehe unten.

## Ausliefern

```
./betrieb/ausliefern.sh
```

Überträgt den **committeten** Stand (`git archive HEAD`), baut auf dem
Server und startet den Dienst neu. Nicht committete Änderungen bleiben
zurück — das Skript warnt und bricht ab; `ERZWINGEN=1` übergeht das.

## Warum ohne Docker und ohne root

CLAUDE.md nennt „Docker + Traefik". Auf diesem Server geht das nicht,
geprüft am 03.09.2026:

| Befund | Folge |
|---|---|
| Docker ist **nicht** installiert | `docker compose` nicht verfügbar |
| `joerg` ist in der Gruppe `sudo`, aber `sudo` **verlangt ein Passwort** | keine unbeaufsichtigte Installation |
| `net.ipv4.ip_unprivileged_port_start = 1024` | Port 80 bräuchte root, 8080 nicht |
| `systemd --user` läuft, `linger` aktivierbar | Dienst ohne root möglich |

Darum: **Node 22.20.0 in `~/.local/node`**, Dienst als
`systemd --user`-Unit (`betrieb/community-hub.service`), Port 8080.
Kein root, kein Passwort, kein Docker.

`Dockerfile` und `docker-compose.yml` liegen trotzdem im Repo. Sobald
Docker installiert ist, ist der Weg dorthin kurz:

```
sudo apt-get install -y docker.io docker-compose-v2
sudo usermod -aG docker joerg      # danach einmal neu anmelden
cd ~/community-hub && docker compose up -d --build
```

**Docker braucht `daten/` als Volume.** Der Spiegel schreibt seinen Stand
dorthin (ADR-0028), und `daten/themen.json` wird zur Laufzeit gelesen —
`docker-compose.yml` hängt deshalb `./daten` in den Container. Die Datei
`themen.json` liegt zusätzlich im Image, damit ein Lauf ohne Volume nicht
an ihr scheitert. Im selben Volume liegen die Profilbilder der
verwiesenen Personen (`daten/profilbilder/`, ADR-0039); ohne Volume holt
der Spiegel sie nach jedem Neustart neu.

## Die Seite ist nicht öffentlich erreichbar

**Eine Firewall vor dem Server lässt nur Port 22 durch.** Belegt am
03.09.2026: Ein Testlauscher auf 8080 antwortet dem Server auf seiner
eigenen öffentlichen IP mit `200`, von außen kommt `000` (Timeout).
Lokale Regeln sind ohne `sudo` nicht einsehbar — die Sperre sitzt also
in der **Hetzner Cloud Firewall**.

Bis dort ein Port freigegeben ist, geht es per Tunnel:

```
ssh -L 8080:localhost:8080 -i ~/.ssh/id_cihacker joerg@46.225.82.96
```

Dann `http://localhost:8080/` im Browser — echt auf dem Server
gerendert, nur nicht öffentlich.

## Der Weg zu einer öffentlichen Adresse

Drei Dinge fehlen, und alle drei brauchen einen Handgriff von aussen:

1. **Ein DNS-Name** auf `46.225.82.96`, etwa `hub.oer.community`. Ein
   Zertifikat gibt es bei Let's Encrypt nicht auf eine nackte IP.
2. **Port 80 und 443 freigeben** in der Hetzner-Konsole. Port 80 braucht
   Let's Encrypt für die Prüfung.
3. **Caddy installieren** (braucht `sudo`, also ein Passwort):

       sudo apt-get install -y caddy

Die Konfiguration in `/etc/caddy/Caddyfile` ist dann drei Zeilen:

       hub.oer.community {
           reverse_proxy localhost:8080
       }

Caddy besorgt das Zertifikat selbst und erneuert es.

### Was der Reverse-Proxy leistet

Fünf Dinge, die die Anwendung nicht kann:

- **Verschlüsselung.** Ohne TLS ist mitlesbar, wer wann was aufruft —
  und die Antwort ist **veränderbar**. Für ein Projekt, dessen Kern
  Lizenzangaben sind, wäre eingefügter Fremdinhalt besonders misslich.
- **Ein Name statt einer IP** — und damit Umzugsfähigkeit, ohne dass
  Links brechen.
- **Node steht nicht im Netz.** Der Proxy hält unvollständige Anfragen,
  langsame Verbindungen und Überlastungsmuster ab.
- **Ratenbegrenzung.** Der Spiegel fragt die Relays nur alle
  `SPIEGEL_INTERVALL_S` Sekunden ab, nicht je Seitenaufruf (ADR-0028) —
  trotzdem ist Node selbst nicht dafür gebaut, hohe Anfragelast
  abzufangen. Die Anwendung begrenzt das nicht.
- **Sicherheitsheader zentral** — HSTS, CSP, `X-Content-Type-Options`.

**Caddy statt Traefik:** CLAUDE.md nennt Traefik, das lohnt bei mehreren
zu routenden Containern. Hier ist es eine Anwendung ohne Docker; Caddy
holt Zertifikate von allein und braucht keinen Unterbau.

### Was die Anwendung schon selbst absichert (ADR-0016)

- Relay-Hinweise aus dem `naddr` werden **ignoriert** — sonst könnte ein
  Fremder den Server zu beliebigen Zielen verbinden lassen.
- Nur `QUELLE_AUTOR` wird angezeigt; fremde Autoren ergeben 404.
- Gerendertes HTML wird entschärft (`sanitize-html`), bevor es in die
  Seite geht.
- Fehlerseiten nennen in Produktion **keine** Pfade oder Stacktraces
  (im Dev-Modus tun sie das — der läuft hier nicht).

## Nachsehen

```
ssh -i ~/.ssh/id_cihacker joerg@46.225.82.96 \
  'systemctl --user status community-hub --no-pager -l'

ssh -i ~/.ssh/id_cihacker joerg@46.225.82.96 \
  'journalctl --user -u community-hub -n 50 --no-pager'
```

Ein **fehlendes Bild** steht nicht im Log: Die Lizenz-Kette schreibt
ihren Grund als Hinweis auf die Seite (ADR-0013).

## Spiegel

Der Dienst hält seinen Datenstand in `~/community-hub/daten/spiegel.json`
(ADR-0028). Das Verzeichnis `daten/` muss für den Dienstbenutzer
beschreibbar sein; die Datei wird vom Dienst selbst geschrieben (erst
`spiegel.json.tmp`, dann umbenannt), nicht von `ausliefern.sh`.

`daten/spiegel.json` und `daten/spiegel.json.tmp` stehen in `.gitignore`
und sind damit **nicht** Teil von `git archive HEAD` — `ausliefern.sh`
überträgt sie nicht und überschreibt einen vorhandenen Stand auf dem
Server folglich nicht. Ein Neustart nach dem Ausliefern lädt die
bestehende Datei zuerst und holt sich danach einen neuen Stand
(`SPIEGEL_STARTWARTEZEIT_S`, Standard 20 Sekunden).

Neue Werte in `.env` (siehe `.env.example`):

- `SPIEGEL_PFAD` — Pfad der Standdatei, Standard `daten/spiegel.json`.
- `SPIEGEL_INTERVALL_S` — Abstand zwischen zwei Läufen, Standard 600.
- `SPIEGEL_STARTWARTEZEIT_S` — wie lange der Start auf den ersten Lauf
  wartet, bevor der Dienst mit dem bestehenden Stand (oder leer) ans Netz
  geht, Standard 20.
- `ABGELOESTE_HOSTS` — Hosts, deren Bilder wie relative Pfade behandelt
  werden (ADR-0030), Standard `oer.community`.
- `COMMUNITY_PUBKEY` — Community, deren Termine der Hub zeigt (ADR-0034).
  Standard ist `ae6199bb…`, die Communikey-Community **rpi-virtuell** — der
  Wert muss für den Betrieb also **nicht** in die `.env`. **Gesetzt und leer** schaltet
  den Kalender dagegen ab (kein Menüpunkt, kein Startseitenblock,
  `/termine` mit Hinweis); leer ist nicht dasselbe wie nicht gesetzt.
- `EDUFEED_URL` — wohin „Im edufeed-Kalender öffnen" führt, Standard
  `https://dev.edufeed.org`. Eintragen und zusagen geschieht dort, nicht im
  Hub (ADR-0034).
- `REDAKTION_D` — Kennung (`d`) der Personenliste `kind:30000`, deren
  `p`-Tags Termine einreichen dürfen (ADR-0021, ADR-0034), Standard
  `redaktion`.

Eine Änderung an `daten/themen.json` wirkt **erst nach einem Neustart**: die
Normalisierungstabelle wird je Prozess einmal gelesen (`src/lib/themen.js`).
Also `systemctl --user restart community-hub` nach dem Ausliefern.

## Konfiguration

`.env` liegt auf dem Server unter `~/community-hub/.env`, Rechte `600`,
und ist **nicht** im Repository. Nach einer Änderung:

```
scp .env joerg@46.225.82.96:~/community-hub/.env
ssh … 'systemctl --user restart community-hub'
```

Fehlt ein Pflichtwert, startet der Dienst nicht und sagt im Journal,
welcher — statt später leere Seiten zu liefern (CLAUDE.md).

**Kanonische URLs und der Origin-Rückfall.** Basis für `<link
rel="canonical">`, `feed.xml` und `sitemap.xml` ist der Origin aus dem
`kind:0 website` der Quelle (ADR-0029). Steht dort nichts, zählt der Origin
der Anfrage — und den bestimmt hinter einem Reverse-Proxy nicht die
Anwendung, sondern der adapter-node: `ORIGIN` setzt ihn fest,
`PROTOCOL_HEADER`/`HOST_HEADER` lassen ihn aus den Proxy-Kopfzeilen
ableiten. Fehlt beides, steht in den kanonischen URLs die interne Adresse
(`http://localhost:3000`). Solange kein `website` im Profil der Quelle
steht, gehört `ORIGIN` deshalb in die `.env`.

## Kein Cache (überholt)

Bis zur ersten Listenansicht fragte dieser Durchstich die Relays bei
**jeder** Anfrage direkt ab (Spec vom 03.09.2026, „Abweichung von
CLAUDE.md"). Seit dem Spiegel (ADR-0028, siehe oben) gilt das nicht mehr:
jede Anfrage liest aus `daten/spiegel.json`.
