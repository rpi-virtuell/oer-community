# Betrieb

## Dev-Umgebung: `community-hub.rpi-virtuell.net`

Jeder Push auf `main` löst die Woodpecker-Pipeline aus (`.woodpecker.yml`):
`pnpm install`, `pnpm check`, `pnpm test`, `pnpm build`, dann per SSH als
`svc-cha` das Skript `~/ServerSetup/scripts/deploy-app.sh community-hub`
auf `community-hub.rpi-virtuell.net`. Das Skript zieht
`~/SourceCode/community-hub` per `git pull`, synchronisiert eine git-freie
Kopie und baut das Image aus dem `Dockerfile` mit Podman. **Der Container
ist also der Docker-Weg**, nicht die systemd-Unit weiter unten — deshalb
liegt `daten/themen.json` im Image (Dockerfile). Ob der Container ein
Volume für `daten/` bekommt, entscheidet das Skript auf dem Server; ohne
Volume startet der Spiegel nach jedem Neustart leer und lädt neu (ADR-0028),
die Datei schreibt er dann nur ins Container-Dateisystem.

Status und Logs: Forgejo zeigt den Commit-Status, die Pipeline liegt unter
`https://woody.git.rpi-virtuell.de/repos/13/`. Eingerichtet von Ludger
(PR #3, 08.09.2026).

**Stolperstein vom 14.09.2026:** Das Server-Repo steht auf dem Branch
`succesful-deployment`, der nach dem Merge von PR #3 auf dem Remote gelöscht
war; `git pull` fand keinen Upstream, der Deploy-Schritt brach nach einer
Sekunde ab (Pipelines 2 bis 5). Aus der Pipeline heraus lässt sich das nicht
beheben: Der Deploy-Schlüssel darf auf dem Server nur das Skript ausführen,
vorgeschaltete Befehle kommen nicht an. **Übergangslösung:** Der Branch
`succesful-deployment` existiert wieder und wird bei jedem Push auf `main`
auf denselben Stand gesetzt:

```
git push origin main:succesful-deployment
git push origin main
```

**Dauerhafte Lösung (Ludger, Serverzugang als `svc-cha`):** in
`~/SourceCode/community-hub` einmal `git checkout main` — danach kann der
Hilfsbranch weg und die zwei Zeilen werden zu einer.

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
an ihr scheitert.

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

1. **Ein DNS-Name** auf `46.225.82.96`, etwa `hub.relilab.org`. Ein
   Zertifikat gibt es bei Let's Encrypt nicht auf eine nackte IP.
2. **Port 80 und 443 freigeben** in der Hetzner-Konsole. Port 80 braucht
   Let's Encrypt für die Prüfung.
3. **Caddy installieren** (braucht `sudo`, also ein Passwort):

       sudo apt-get install -y caddy

Die Konfiguration in `/etc/caddy/Caddyfile` ist dann drei Zeilen:

       hub.relilab.org {
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

## Kein Cache (überholt)

Bis zur ersten Listenansicht fragte dieser Durchstich die Relays bei
**jeder** Anfrage direkt ab (Spec vom 03.09.2026, „Abweichung von
CLAUDE.md"). Seit dem Spiegel (ADR-0028, siehe oben) gilt das nicht mehr:
jede Anfrage liest aus `daten/spiegel.json`.
