# Betrieb

**Server:** `46.225.82.96` (Hetzner, Ubuntu 24.04.4, 7,6 GB RAM, 65 GB frei)
**Zugang:** `ssh -i ~/.ssh/id_cihacker joerg@46.225.82.96`
**Verzeichnis:** `~/community-hub` · **Port:** 8080

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

**Für eine öffentliche Adresse fehlen drei Dinge:** ein freigegebener
Port, ein Name (DNS) und ein Zertifikat. Ohne die letzten zwei liefe es
über HTTP — dann sind Reverse-Proxy und TLS fällig, und damit auch die
Traefik-Frage aus CLAUDE.md wieder offen.

## Nachsehen

```
ssh -i ~/.ssh/id_cihacker joerg@46.225.82.96 \
  'systemctl --user status community-hub --no-pager -l'

ssh -i ~/.ssh/id_cihacker joerg@46.225.82.96 \
  'journalctl --user -u community-hub -n 50 --no-pager'
```

Ein **fehlendes Bild** steht nicht im Log: Die Lizenz-Kette schreibt
ihren Grund als Hinweis auf die Seite (ADR-0013).

## Konfiguration

`.env` liegt auf dem Server unter `~/community-hub/.env`, Rechte `600`,
und ist **nicht** im Repository. Nach einer Änderung:

```
scp .env joerg@46.225.82.96:~/community-hub/.env
ssh … 'systemctl --user restart community-hub'
```

Fehlt ein Pflichtwert, startet der Dienst nicht und sagt im Journal,
welcher — statt später leere Seiten zu liefern (CLAUDE.md).

## Kein Cache

Dieser Durchstich fragt die Relays bei **jeder** Anfrage direkt ab
(Spec vom 03.09.2026, „Abweichung von CLAUDE.md"). Die Seite ist damit
so schnell wie die Relays und hat **keinen** letzten gültigen Stand,
wenn keines antwortet. Befristet bis zur ersten Listenansicht.
